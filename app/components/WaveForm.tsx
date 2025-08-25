// app/components/WaveForm.tsx
import { useEffect, useRef } from "react";

export default function Waveform({
    analyser,
    active = true,
    bars = 24,                 // cantidad total de barras (debe ser par)
    gap = 4,                   // espacio entre barras
    className,
    style,
}: {
    analyser: AnalyserNode | null;
    active?: boolean;
    bars?: number;
    gap?: number;
    className?: string;
    style?: React.CSSProperties;
}) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);

    // Mantén bars en ref (evita cambiar tamaño del array de deps)
    const barsRef = useRef<number>(bars);
    useEffect(() => {
        barsRef.current = Math.max(2, bars - (bars % 2)); // forzar par
    }, [bars]);

    // Buffer de datos con ArrayBuffer explícito (evita TS2345)
    const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
    const ensureArray = () => {
        if (!analyser) return;
        const needed = analyser.fftSize; // time-domain
        const cur = dataRef.current;
        if (!cur || cur.length !== needed) {
            dataRef.current = new Uint8Array(new ArrayBuffer(needed));
        }
    };

    // Resize + DPR
    const lastSize = useRef({ w: 0, h: 0, dpr: 1 });
    const fitCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;

        const rect = parent.getBoundingClientRect();
        const cssW = Math.max(1, Math.round(rect.width));
        const cssH = Math.max(1, Math.round(rect.height));
        const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

        if (cssW === lastSize.current.w && cssH === lastSize.current.h && dpr === lastSize.current.dpr) return;

        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
        canvas.width = cssW * dpr;
        canvas.height = cssH * dpr;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        if ("resetTransform" in ctx) (ctx as any).resetTransform();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        lastSize.current = { w: cssW, h: cssH, dpr };
    };

    useEffect(() => {
        fitCanvas();
        const parent = canvasRef.current?.parentElement;
        const ro = new ResizeObserver(fitCanvas);
        if (parent) ro.observe(parent);
        const id = requestAnimationFrame(fitCanvas);
        const onResize = () => fitCanvas();
        window.addEventListener("resize", onResize);
        window.addEventListener("orientationchange", onResize);
        return () => {
            ro.disconnect();
            cancelAnimationFrame(id);
            window.removeEventListener("resize", onResize);
            window.removeEventListener("orientationchange", onResize);
        };
    }, []);

    // Helper: rectángulo con esquinas redondeadas (cápsula)
    const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.lineTo(x + w - rr, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
        ctx.lineTo(x + w, y + h - rr);
        ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
        ctx.lineTo(x + rr, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
        ctx.lineTo(x, y + rr);
        ctx.quadraticCurveTo(x, y, x + rr, y);
        ctx.closePath();
    };

    // Dibujo (deps tamaño fijo)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let t0 = performance.now();

        const draw = () => {
            fitCanvas();

            const cssW = lastSize.current.w || canvas.clientWidth;
            const cssH = lastSize.current.h || canvas.clientHeight;
            if (!cssW || !cssH) {
                rafRef.current = requestAnimationFrame(draw);
                return;
            }

            ctx.clearRect(0, 0, cssW, cssH);

            // Gradiente horizontal: morado → blanco → morado
            const grad = ctx.createLinearGradient(0, 0, cssW, 0);
            grad.addColorStop(0, "#8b5cf6");   // morado
            grad.addColorStop(0.5, "#ffffff"); // blanco centro
            grad.addColorStop(1, "#8b5cf6");   // morado
            ctx.fillStyle = grad;

            // Glow suave
            ctx.shadowColor = "rgba(255,255,255,0.65)";
            ctx.shadowBlur = 12;

            const midY = cssH / 2;
            const totalBars = Math.max(2, barsRef.current - (barsRef.current % 2)); // par
            const half = totalBars / 2;

            // Cálculo de amplitudes
            let values: number[] = [];
            if (analyser && active) {
                ensureArray();
                const data = dataRef.current!;
                analyser.getByteTimeDomainData(data);

                // Promediamos bloques para suavizar un poco
                const samplesPerBar = Math.max(1, Math.floor(data.length / half));
                for (let i = 0; i < half; i++) {
                    let sum = 0;
                    const start = i * samplesPerBar;
                    const end = Math.min(data.length, start + samplesPerBar);
                    for (let k = start; k < end; k++) sum += Math.abs((data[k] - 128) / 128);
                    const mean = sum / (end - start);
                    values.push(mean);
                }
            } else {
                // Idle animado para que siempre se vea algo
                const t = (performance.now() - t0) / 600;
                for (let i = 0; i < half; i++) {
                    const phase = (i / half) * Math.PI * 2;
                    const v = (Math.sin(t + phase) + 1) / 2; // 0..1
                    values.push(v * 0.9);
                }
            }

            // Espejo: centro hacia afuera
            const mirrored: number[] = [...values.slice().reverse(), ...values];

            // Geometría
            const totalGap = gap * (totalBars - 1);
            const barW = Math.max(2, (cssW - totalGap) / totalBars);
            const radius = Math.min(barW / 2, cssH * 0.45); // puntas redondeadas

            // Dibujar barras desde la izquierda (0) a la derecha (totalBars-1)
            let x = 0;
            for (let i = 0; i < totalBars; i++) {
                const amp = Math.max(2, mirrored[i] * (cssH * 0.45));
                const y = midY - amp;
                const h = amp * 2;

                roundRect(ctx, x, y, barW, h, radius);
                ctx.fill();
                x += barW + gap;
            }

            // Sombra off → no contaminar otros elementos
            ctx.shadowBlur = 0;

            rafRef.current = requestAnimationFrame(draw);
        };

        rafRef.current = requestAnimationFrame(draw);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [analyser, active]);

    return <canvas ref={canvasRef} className={className} style={style} />;
}

// app/components/WaveForm.tsx
"use client";

import {
    useCallback,
    useEffect,
    useRef,
    type CSSProperties,
} from "react";

type Props = {
    analyser: AnalyserNode | null;
    active?: boolean;
    /** cantidad total de barras (se fuerza a par) */
    bars?: number;
    /** espacio entre barras en px */
    gap?: number;
    className?: string;
    style?: CSSProperties;
};

export default function Waveform({
    analyser,
    active = true,
    bars = 24,
    gap = 4,
    className,
    style,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);

    // Mantener "bars" en un ref para no cambiar deps del efecto de dibujo
    const barsRef = useRef<number>(bars);
    useEffect(() => {
        // forzar número par
        barsRef.current = Math.max(2, bars - (bars % 2));
    }, [bars]);

    /**
     * Buffer de datos:
     * ✅ Tipado como Uint8Array<ArrayBuffer>
     * ✅ Creado con new ArrayBuffer(...) para asegurar ArrayBuffer (no SharedArrayBuffer)
     */
    const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
    const ensureArray = useCallback(() => {
        if (!analyser) return;
        const needed = analyser.fftSize; // para time-domain
        const cur = dataRef.current;
        if (!cur || cur.length !== needed) {
            // crear backing store explícitamente con ArrayBuffer
            const buf: ArrayBuffer = new ArrayBuffer(needed);
            dataRef.current = new Uint8Array(buf) as Uint8Array<ArrayBuffer>;
        }
    }, [analyser]);

    // Gestión de tamaño y DPR
    const lastSize = useRef({ w: 0, h: 0, dpr: 1 });
    const fitCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;

        const rect = parent.getBoundingClientRect();
        const cssW = Math.max(1, Math.round(rect.width));
        const cssH = Math.max(1, Math.round(rect.height));
        const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

        if (
            cssW === lastSize.current.w &&
            cssH === lastSize.current.h &&
            dpr === lastSize.current.dpr
        ) {
            return;
        }

        // Tamaño CSS
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
        // Backing store en px físicos
        canvas.width = cssW * dpr;
        canvas.height = cssH * dpr;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.resetTransform?.();
        // Dibujar en "px CSS"
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        lastSize.current = { w: cssW, h: cssH, dpr };
    }, []);

    // Observar cambios de tamaño del contenedor y de la ventana
    useEffect(() => {
        fitCanvas();
        const parent = canvasRef.current?.parentElement;
        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fitCanvas) : null;
        if (parent && ro) ro.observe(parent);
        const id = requestAnimationFrame(fitCanvas);
        const onResize = () => fitCanvas();
        window.addEventListener("resize", onResize);
        window.addEventListener("orientationchange", onResize);
        return () => {
            ro?.disconnect();
            cancelAnimationFrame(id);
            window.removeEventListener("resize", onResize);
            window.removeEventListener("orientationchange", onResize);
        };
    }, [fitCanvas]);

    // Helper: rectángulo con esquinas redondeadas (cápsula)
    const roundRect = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        r: number
    ) => {
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

    // Bucle de dibujo
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const t0 = performance.now();

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
            grad.addColorStop(0, "#8b5cf6");
            grad.addColorStop(0.5, "#ffffff");
            grad.addColorStop(1, "#8b5cf6");
            ctx.fillStyle = grad;

            // Glow suave
            ctx.shadowColor = "rgba(255,255,255,0.65)";
            ctx.shadowBlur = 12;

            const midY = cssH / 2;
            const totalBars = Math.max(2, barsRef.current - (barsRef.current % 2)); // par
            const half = totalBars / 2;

            // Cálculo de amplitudes
            const values: number[] = [];
            if (analyser && active) {
                ensureArray();
                const data = dataRef.current!; // Uint8Array<ArrayBuffer>
                // ✅ La firma de lib.dom puede exigir ArrayBuffer (no ArrayBufferLike)
                analyser.getByteTimeDomainData(data);

                // Promediado por bloques para suavizar
                const samplesPerBar = Math.max(1, Math.floor(data.length / half));
                for (let i = 0; i < half; i++) {
                    let sum = 0;
                    const start = i * samplesPerBar;
                    const end = Math.min(data.length, start + samplesPerBar);
                    for (let k = start; k < end; k++) {
                        sum += Math.abs((data[k] - 128) / 128);
                    }
                    const mean = sum / (end - start);
                    values.push(mean);
                }
            } else {
                // Idle animado
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
            const radius = Math.min(barW / 2, cssH * 0.45);

            // Dibujar barras
            let x = 0;
            for (let i = 0; i < totalBars; i++) {
                const amp = Math.max(2, mirrored[i] * (cssH * 0.45));
                const y = midY - amp;
                const h = amp * 2;

                roundRect(ctx, x, y, barW, h, radius);
                ctx.fill();
                x += barW + gap;
            }

            // Sombra off para no contaminar otros draws
            ctx.shadowBlur = 0;

            rafRef.current = requestAnimationFrame(draw);
        };

        rafRef.current = requestAnimationFrame(draw);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [analyser, active, gap, ensureArray, fitCanvas]);

    return <canvas ref={canvasRef} className={className} style={style} />;
}

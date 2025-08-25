/* --------------------------- SlideToStart --------------------------- */
import { useCallback, useEffect, useRef, useState } from "react";

type SlideToStartProps = {
    onComplete: () => void;
    disabled?: boolean;
    texture?: string;
    className?: string;
    selectedLabel?: string;
    selectedBg?: string | null;
};

export default function SlideToStart({
    onComplete,
    disabled,
    texture,
    className,
    selectedLabel,
    selectedBg,
}: SlideToStartProps) {
    const trackRef = useRef<HTMLDivElement | null>(null);
    const knobRef = useRef<HTMLButtonElement | null>(null);

    const [x, setX] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [knobW, setKnobW] = useState(240);

    // Apariencia
    const TRACK_H = 64;  // alto del carril
    const KNOB_H = 56;  // alto del knob (se usa abajo)
    const LANE_PADDING = 4;

    // Medir ancho real del knob cuando cambia el contenido / ancho del track
    useEffect(() => {
        const measure = () => {
            if (!trackRef.current || !knobRef.current) return;
            const usable = trackRef.current.getBoundingClientRect().width - LANE_PADDING * 2;
            // nunca dejar que el knob sea más ancho que el carril
            knobRef.current.style.maxWidth = `calc(100% - ${LANE_PADDING * 2}px)`;
            setKnobW(Math.min(Math.max(120, usable), knobRef.current.offsetWidth));
        };
        measure();
        const raf = requestAnimationFrame(measure);
        return () => cancelAnimationFrame(raf);
    }, [selectedLabel]);

    // Volver al inicio si se deshabilita
    useEffect(() => {
        if (disabled) setX(0);
    }, [disabled]);

    // Re-clamp al redimensionar (web y mobile)
    useEffect(() => {
        const onResize = () => {
            if (!trackRef.current) return;
            const usable = trackRef.current.getBoundingClientRect().width - LANE_PADDING * 2;
            const realKnob = knobRef.current?.offsetWidth ?? knobW;
            const maxX = Math.max(0, usable - realKnob);
            setX(prev => Math.max(0, Math.min(maxX, prev)));
        };
        onResize();
        window.addEventListener("resize", onResize, { passive: true });
        return () => window.removeEventListener("resize", onResize);
    }, [knobW]);

    // Helpers para clamp
    const clampFromClientX = useCallback((clientX: number) => {
        if (!trackRef.current) return 0;
        const rect = trackRef.current.getBoundingClientRect();
        const usable = rect.width - LANE_PADDING * 2;
        const realKnob = knobRef.current?.offsetWidth ?? knobW;
        const maxX = Math.max(0, usable - realKnob);
        const nx = clientX - (rect.left + LANE_PADDING) - realKnob / 2;
        // prefer-const satisfecho (no re-asignamos)
        const clamped = Math.max(0, Math.min(maxX, nx));
        return clamped;
    }, [knobW]);

    // Handlers tipados (evita any)
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragging) return;
        setX(clampFromClientX(e.clientX));
    }, [dragging, clampFromClientX]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!dragging) return;
        if (e.cancelable) e.preventDefault(); // bloquea scroll de página
        if (e.touches.length === 0) return;
        setX(clampFromClientX(e.touches[0].clientX));
    }, [dragging, clampFromClientX]);

    const handleStop = useCallback(() => {
        if (!trackRef.current) return;
        setDragging(false);
        const usable = trackRef.current.getBoundingClientRect().width - LANE_PADDING * 2;
        const realKnob = knobRef.current?.offsetWidth ?? knobW;
        const maxX = Math.max(0, usable - realKnob);
        const passed = x >= maxX * 0.9; // umbral 90%
        setX(passed ? maxX : 0);
        if (passed) setTimeout(onComplete, 120);
    }, [knobW, onComplete, x]);

    // Registrar listeners (con deps correctas)
    useEffect(() => {
        if (!dragging) return;
        window.addEventListener("mousemove", handleMouseMove, { passive: false });
        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        window.addEventListener("mouseup", handleStop, { passive: true });
        window.addEventListener("touchend", handleStop, { passive: true });
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("mouseup", handleStop);
            window.removeEventListener("touchend", handleStop);
        };
    }, [dragging, handleMouseMove, handleTouchMove, handleStop]);

    return (
        <div className="relative select-none">
            {/* TRACK */}
            <div
                ref={trackRef}
                className={[
                    "relative w-full rounded-full overflow-hidden",
                    "bg-[#0B0F17]/90 border border-white/15",
                    "shadow-[0_6px_18px_rgba(0,0,0,0.35)]",
                    "touch-none overscroll-contain z-[30]",
                    disabled ? "opacity-60 grayscale" : "",
                    className ?? "",
                    !className ? "max-w-[340px] sm:max-w-[380px] md:max-w-[520px]" : "",
                ].join(" ")}
                style={{
                    height: TRACK_H,
                    paddingLeft: LANE_PADDING,
                    paddingRight: LANE_PADDING,
                    backgroundImage: texture ? `url('${texture}')` : undefined,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundSize: "contain",
                }}
                onTouchMoveCapture={(e) => { if (dragging && e.cancelable) e.preventDefault(); }}
            >
                {/* Progreso detrás del knob (sin parpadeos) */}
                {!texture && selectedLabel && (
                    <div
                        className={[
                            "absolute left-0 top-0 bottom-0 bg-white/20",
                            dragging ? "transition-none" : "transition-[width] duration-150",
                            "z-[31] pointer-events-none",
                        ].join(" ")}
                        style={{
                            width: Math.min(
                                (trackRef.current?.getBoundingClientRect().width ?? 0),
                                LANE_PADDING + x + (knobRef.current?.offsetWidth ?? knobW)
                            ),
                            borderRadius: TRACK_H / 2,
                        }}
                    />
                )}

                {/* Placeholder cuando no hay selección */}
                {!selectedLabel && (
                    <div className="absolute inset-0 grid place-items-center pointer-events-none z-[32]">
                        <span className="text-white/85 font-semibold text-sm sm:text-base">
                            Selecciona una categoría
                        </span>
                    </div>
                )}

                {/* KNOB / CARD */}
                <button
                    ref={knobRef}
                    type="button"
                    onMouseDown={() => !disabled && setDragging(true)}
                    onTouchStart={(e) => {
                        if (disabled) return;
                        if (e.cancelable) e.preventDefault();
                        setDragging(true);
                    }}
                    className={[
                        "absolute top-1/2 -translate-y-1/2",
                        "w-[220px] md:w-auto md:min-w-[220px]",
                        `h-[${KNOB_H}px]`,                     // usa la constante (evita warning)
                        "pl-3 pr-4 flex items-center gap-3",
                        "bg-white/12 backdrop-blur-sm text-white",
                        "border border-white/40 rounded-full",
                        "shadow-[0_10px_20px_rgba(0,0,0,0.35)]",
                        "cursor-grab active:cursor-grabbing touch-none",
                        "z-[33] min-w-0",
                        !selectedLabel ? "opacity-0 pointer-events-none" : "",
                        disabled ? "pointer-events-none" : "",
                    ].join(" ")}
                    style={{
                        left: LANE_PADDING + x,
                        height: KNOB_H,                         // y aquí también
                        maxWidth: `calc(100% - ${LANE_PADDING * 2}px)`,
                    }}
                    aria-label="Desliza para confirmar"
                >
                    {/* miniatura */}
                    <div className="shrink-0 w-[32px] h-[24px] rounded-lg overflow-hidden bg-white/10 ring-1 ring-white/25">
                        {selectedBg && (
                            <img
                                src={selectedBg}
                                alt=""
                                className="w-full h-full object-cover"
                                style={{ objectPosition: "15% center" }}
                            />
                        )}
                    </div>

                    {/* texto */}
                    <span className="font-semibold text-[13px] sm:text-sm leading-none truncate">
                        {selectedLabel ?? "Desliza para empezar"}
                    </span>
                </button>
            </div>
        </div>
    );
}

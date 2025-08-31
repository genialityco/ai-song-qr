/* --------------------------- SlideToStart --------------------------- */
import { useCallback, useEffect, useRef, useState } from "react";

type SlideToStartProps = {
  onComplete: () => void;
  disabled?: boolean;
  texture?: string;
  className?: string;      // opcional: solo para estilos visuales (no de tamaño)
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
  const knobRef  = useRef<HTMLButtonElement | null>(null);

  const [x, setX]       = useState(0);
  const [dragging, setDragging] = useState(false);
  const [knobW, setKnobW] = useState(240);

  // Apariencia
  const TRACK_H = 64; // alto del carril
  const KNOB_H  = 56; // alto del knob
  const LANE_PADDING = 4;

  // Medir ancho real del knob
  useEffect(() => {
    const measure = () => {
      if (!trackRef.current || !knobRef.current) return;
      const usable = trackRef.current.getBoundingClientRect().width - LANE_PADDING * 2;
      knobRef.current.style.maxWidth = `calc(100% - ${LANE_PADDING * 2}px)`; // nunca más ancho que el carril
      setKnobW(Math.min(Math.max(120, usable), knobRef.current.offsetWidth));
    };
    measure();
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [selectedLabel]);

  // Reset si se deshabilita
  useEffect(() => {
    if (disabled) setX(0);
  }, [disabled]);

  // Re-clamp al redimensionar
  useEffect(() => {
    const onResize = () => {
      if (!trackRef.current) return;
      const usable   = trackRef.current.getBoundingClientRect().width - LANE_PADDING * 2;
      const realKnob = knobRef.current?.offsetWidth ?? knobW;
      const maxX     = Math.max(0, usable - realKnob);
      setX(prev => Math.max(0, Math.min(maxX, prev)));
    };
    onResize();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [knobW]);

  // Helpers
  const clampFromClientX = useCallback((clientX: number) => {
    if (!trackRef.current) return 0;
    const rect     = trackRef.current.getBoundingClientRect();
    const usable   = rect.width - LANE_PADDING * 2;
    const realKnob = knobRef.current?.offsetWidth ?? knobW;
    const maxX     = Math.max(0, usable - realKnob);
    const nx       = clientX - (rect.left + LANE_PADDING) - realKnob / 2;
    return Math.max(0, Math.min(maxX, nx));
  }, [knobW]);

  // Eventos
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    setX(clampFromClientX(e.clientX));
  }, [dragging, clampFromClientX]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragging) return;
    if (e.cancelable) e.preventDefault();
    if (e.touches.length === 0) return;
    setX(clampFromClientX(e.touches[0].clientX));
  }, [dragging, clampFromClientX]);

  const handleStop = useCallback(() => {
    if (!trackRef.current) return;
    setDragging(false);
    const usable   = trackRef.current.getBoundingClientRect().width - LANE_PADDING * 2;
    const realKnob = knobRef.current?.offsetWidth ?? knobW;
    const maxX     = Math.max(0, usable - realKnob);
    const passed   = x >= maxX * 0.9; // 90%
    setX(passed ? maxX : 0);
    if (passed) setTimeout(onComplete, 120);
  }, [knobW, onComplete, x]);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("mousemove",  handleMouseMove, { passive: false });
    window.addEventListener("touchmove",  handleTouchMove, { passive: false });
    window.addEventListener("mouseup",    handleStop,      { passive: true });
    window.addEventListener("touchend",   handleStop,      { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mouseup",   handleStop);
      window.removeEventListener("touchend",  handleStop);
    };
  }, [dragging, handleMouseMove, handleTouchMove, handleStop]);

  return (
    <div
      className={["relative select-none", className ?? ""].join(" ").trim()}
      style={{ width: "100%" }}                 // ← SIEMPRE 100%
    >
      <div
        ref={trackRef}
        className={[
          "relative rounded-full overflow-hidden",
          "bg-[#0B0F17]/90 border border-white/15",
          "shadow-[0_6px_18px_rgba(0,0,0,0.35)]",
          "touch-none overscroll-contain z-[30]",
          disabled ? "opacity-60 grayscale" : "",
        ].join(" ")}
        style={{
          width: "100%",                         // ← SIEMPRE 100%
          boxSizing: "border-box",
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
        {/* Progreso */}
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

        {/* Placeholder */}
        {!selectedLabel && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none z-[32]">
            <span className="text-white/85 font-semibold text-sm sm:text-base">
              Selecciona una categoría
            </span>
          </div>
        )}

        {/* Knob */}
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
            "flex items-center justify-center",
            "bg-white/12 backdrop-blur-sm text-white",
            "border border-white/40 rounded-full overflow-hidden",
            "shadow-[0_10px_20px_rgba(0,0,0,0.35)]",
            "cursor-grab active:cursor-grabbing touch-none",
            "z-[33] min-w-0",
            !selectedLabel ? "opacity-0 pointer-events-none" : "",
            disabled ? "pointer-events-none" : "",
          ].join(" ")}
          style={{
            left: LANE_PADDING + x,
            height: KNOB_H,
            width: "min(400px, 100%)",
            maxWidth: `calc(100% - ${LANE_PADDING * 2}px)`,
          }}
          aria-label="Desliza para confirmar"
        >
          {selectedBg && (
            <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
              <img
                src={selectedBg}
                alt="preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}

          {/* etiqueta opcional */}
          <span
            className="absolute bottom-1 font-semibold"
            style={{ transform: "translate(15%, -20%)", fontSize: "25px" }}
          >
            {selectedLabel}
          </span>
        </button>
      </div>
    </div>
  );
}

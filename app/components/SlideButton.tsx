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
  const TRACK_H = 64; // alto del carril
  const KNOB_H = 56; // alto del knob
  const LANE_PADDING = 4;

  // Medir ancho real del knob cuando cambia el contenido / ancho del track
  useEffect(() => {
    const measure = () => {
      if (!trackRef.current || !knobRef.current) return;
      const usable =
        trackRef.current.getBoundingClientRect().width - LANE_PADDING * 2;
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
      const usable =
        trackRef.current.getBoundingClientRect().width - LANE_PADDING * 2;
      const realKnob = knobRef.current?.offsetWidth ?? knobW;
      const maxX = Math.max(0, usable - realKnob);
      setX((prev) => Math.max(0, Math.min(maxX, prev)));
    };
    onResize();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [knobW]);

  // Helpers para clamp
  const clampFromClientX = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const usable = rect.width - LANE_PADDING * 2;
      const realKnob = knobRef.current?.offsetWidth ?? knobW;
      const maxX = Math.max(0, usable - realKnob);
      const nx = clientX - (rect.left + LANE_PADDING) - realKnob / 2;
      return Math.max(0, Math.min(maxX, nx));
    },
    [knobW]
  );

  // Handlers tipados
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging) return;
      setX(clampFromClientX(e.clientX));
    },
    [dragging, clampFromClientX]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!dragging) return;
      if (e.cancelable) e.preventDefault(); // bloquea scroll de página
      if (e.touches.length === 0) return;
      setX(clampFromClientX(e.touches[0].clientX));
    },
    [dragging, clampFromClientX]
  );

  const handleStop = useCallback(() => {
    if (!trackRef.current) return;
    setDragging(false);
    const usable =
      trackRef.current.getBoundingClientRect().width - LANE_PADDING * 2;
    const realKnob = knobRef.current?.offsetWidth ?? knobW;
    const maxX = Math.max(0, usable - realKnob);
    const passed = x >= maxX * 0.9; // umbral 90%
    setX(passed ? maxX : 0);
    if (passed) setTimeout(onComplete, 120);
  }, [knobW, onComplete, x]);

  // Registrar listeners
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

  const showSlideTip = !!selectedLabel && !disabled;

  // --- helpers visuales para que el "no seleccionado" sea EXACTAMENTE igual ---
  const progressStyle = {
    className:
      "absolute left-0 top-0 bottom-0 bg-white/30 z-[31] pointer-events-none rounded-full",
  };
  const fullTrackWidth = () =>
    trackRef.current?.getBoundingClientRect().width ?? 0;
  const knobWidth = () => knobRef.current?.offsetWidth ?? knobW;

  return (
    <div className="relative select-none">
      <div
        ref={trackRef}
        className={[
          // Carril con efecto vidrio difuminado
          "relative w-full rounded-full overflow-hidden",
          "bg-gradient-to-r from-white/10 via-white/5 to-white/10",
          "border border-white/20",
          "supports-[backdrop-filter]:backdrop-blur-lg supports-[backdrop-filter]:backdrop-saturate-150",
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
        onTouchMoveCapture={(e) => {
          if (dragging && e.cancelable) e.preventDefault();
        }}
      >
        {/* Progreso detrás del knob (cuando hay selección) */}
        {!texture && selectedLabel && (
          <div
            className={[
              progressStyle.className,
              dragging ? "transition-none" : "transition-[width] duration-150",
            ].join(" ")}
            style={{
              width: Math.min(
                fullTrackWidth(),
                LANE_PADDING + x + knobWidth()
              ),
            }}
          />
        )}

        {/* 🔹 Progreso "idéntico" cuando NO hay selección:
            usamos la MISMA capa y el MISMO cálculo que al inicio (x = 0) */}
        {!texture && !selectedLabel && (
          <div
            className={progressStyle.className}
            style={{
              width: Math.min(fullTrackWidth(), LANE_PADDING + knobWidth()),
            }}
          />
        )}

        {/* Placeholder cuando NO hay selección */}
        {!selectedLabel && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none z-[32]">
            <span className="text-white/90 font-semibold text-sm sm:text-base">
              Seleccione género
            </span>
          </div>
        )}

        {/* Indicador cuando SÍ hay selección (tip para continuar) */}
        {showSlideTip && (
          <div
            className="absolute inset-0 grid place-items-center pointer-events-none z-[32] transition-opacity duration-150"
            style={{ opacity: dragging ? 0 : 1 }}
          >
            <span className="text-white/90 font-semibold text-sm sm:text-base">
              Desliza para continuar
            </span>
          </div>
        )}

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
            "flex items-center justify-center",
            "bg-white/12 supports-[backdrop-filter]:backdrop-blur-sm text-white",
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
            maxWidth: `calc(100% - ${LANE_PADDING * 2}px)`,
          }}
          aria-label="Desliza para confirmar"
        >
          {selectedBg && (
            <div className="w-full h-full overflow-hidden">
              <img
                src={selectedBg}
                alt="preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* texto opcional dentro del knob */}
          <span
            className="absolute bottom-1 font-semibold"
            style={{ transform: "translate(25%, -50%)" }}
          >
            {selectedLabel}
          </span>
        </button>
      </div>
    </div>
  );
}

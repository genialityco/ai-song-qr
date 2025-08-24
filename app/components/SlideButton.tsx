import { useEffect, useRef, useState } from "react";
/* --------------------------- SlideToStart --------------------------- */
type SlideToStartProps = {
  onComplete: () => void;
  disabled?: boolean;
  texture?: string;
  className?: string;
  selectedLabel?: string;
  selectedBg?: string | null;
};

export function SlideToStart({
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
  const [dragging, setDrag] = useState(false);
  const [knobW, setKnobW] = useState(240);

  // Apariencia
  const TRACK_H = 64;
  const KNOB_H = 56;
  const LANE_PADDING = 4;  // padding interno de track

  // medir ancho real del knob cuando cambia el contenido
  useEffect(() => {
    if (knobRef.current) setKnobW(knobRef.current.offsetWidth);
  }, [selectedLabel]);

  // reset si se deshabilita
  useEffect(() => { if (disabled) setX(0); }, [disabled]);

  // clamp + recalcular ancho al redimensionar (evita desbordes en web)
  useEffect(() => {
    const handle = () => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const usable = rect.width - LANE_PADDING * 2;

      // limitar el ancho visible del knob a lo que cabe en el track
      if (knobRef.current) {
        const maxKnobPx = Math.max(120, usable); // nunca menor a 120
        knobRef.current.style.maxWidth = `calc(100% - ${LANE_PADDING * 2}px)`;
        setKnobW(Math.min(knobRef.current.offsetWidth, maxKnobPx));
      }

      const maxX = Math.max(0, usable - (knobRef.current?.offsetWidth ?? knobW));
      setX(prev => Math.max(0, Math.min(maxX, prev)));
    };
    handle(); // llamar una vez
    window.addEventListener("resize", handle, { passive: true });
    return () => window.removeEventListener("resize", handle);
  }, [knobW]);

  // util: convertir clientX a x clamp-eado dentro del track
  const clampFromClientX = (clientX: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const usable = rect.width - LANE_PADDING * 2;
    const realKnobW = knobRef.current?.offsetWidth ?? knobW;
    const maxX = Math.max(0, usable - realKnobW);
    let nx = clientX - (rect.left + LANE_PADDING) - realKnobW / 2;
    return Math.max(0, Math.min(maxX, nx));
  };

  const onMove = (e: MouseEvent | TouchEvent) => {
    if (!dragging) return;
    let clientX: number;
    if ("touches" in e) {
      if (e.cancelable) e.preventDefault(); // bloquear scroll
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
    } else {
      clientX = (e as MouseEvent).clientX;
    }
    setX(clampFromClientX(clientX));
  };

  const stop = () => {
    setDrag(false);
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const usable = rect.width - LANE_PADDING * 2;
    const realKnobW = knobRef.current?.offsetWidth ?? knobW;
    const maxX = Math.max(0, usable - realKnobW);
    const passed = x >= maxX * 0.9;
    setX(passed ? maxX : 0);
    if (passed) setTimeout(onComplete, 120);
  };

  // listeners: touchmove NO pasivo para poder preventDefault
  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("mousemove", onMove, { passive: false });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", stop, { passive: true });
    window.addEventListener("touchend", stop, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove as any);
      window.removeEventListener("touchmove", onMove as any);
      window.removeEventListener("mouseup", stop as any);
      window.removeEventListener("touchend", stop as any);
    };
  }, [dragging, x]);

  return (
    <div className="relative select-none">
      {/* TRACK */}
      <div
        ref={trackRef}
        className={[
          "relative w-full rounded-full overflow-hidden",
          "bg-[#0B0F17]/90 border border-white/15",
          "shadow-[0_6px_18px_rgba(0,0,0,0.35)]",
          "touch-none overscroll-contain",
          "z-[30]",
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
        {/* Progreso */}
        {!texture && selectedLabel && (
          <div
            className={[
              "absolute left-0 top-0 bottom-0 bg-white/20",
              dragging ? "transition-none" : "transition-[width] duration-150",
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
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <span className="text-white/85 font-semibold text-sm sm:text-base">
              Selecciona una categoría
            </span>
          </div>
        )}

        {/* KNOB / CARD */}
        <button
          ref={knobRef}
          type="button"
          onMouseDown={() => !disabled && setDrag(true)}
          onTouchStart={(e) => {
            if (disabled) return;
            if (e.cancelable) e.preventDefault();
            setDrag(true);
          }}
          className={[
            "absolute top-1/2 -translate-y-1/2",
            "w-[220px] md:w-auto md:min-w-[220px]", // fijo en móvil, auto en desktop
            "h-[52px] md:h-[56px]",
            "pl-3 pr-4 flex items-center gap-3",
            "bg-white/12 backdrop-blur-sm text-white",
            "border border-white/40 rounded-full",
            "shadow-[0_10px_20px_rgba(0,0,0,0.35)]",
            "cursor-grab active:cursor-grabbing touch-none",
            "will-change-transform z-[31]",
            !selectedLabel ? "opacity-0 pointer-events-none" : "",
            disabled ? "pointer-events-none" : "",
          ].join(" ")}
          style={{
            left: LANE_PADDING + x,
            // límite duro: el knob nunca será más ancho que el track – padding
            maxWidth: `calc(100% - ${LANE_PADDING * 2}px)`,
          }}
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

          {/* texto: truncado para no crecer infinito */}
          <span className="font-semibold text-[13px] sm:text-sm leading-none truncate min-w-0">
            {selectedLabel ?? "Desliza para empezar"}
          </span>
        </button>
      </div>
    </div>
  );
}


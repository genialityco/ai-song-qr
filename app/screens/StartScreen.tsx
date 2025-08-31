/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";

/* =========================================================
   Hook: Escala + desplazamiento por WIDTH (solo clases Tailwind)
   - w < 375 => scale-[0.5] + translate-y-[200px] (como pediste)
   - Puedes editar fácilmente los tramos
   - Incluye safelist de escalas y translate-y arbitrarios (Tailwind)
   ========================================================= */
function useScaleAndShiftByWidth() {
  const [cls, setCls] = useState<{ scale: string; ty: string }>({
    scale: "scale-[1]",
    ty: "translate-y-[0px]",
  });
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    const pick = () => {
      const w = window.visualViewport?.width ?? window.innerWidth;

      let scale = "scale-[1]";
      let ty = "translate-y-[0px]";

      if (w < 375) {
        scale = "scale-[1]";
        ty = "translate-y-[200px]";
      } else if (w < 460) {
        scale = "scale-[1]";
        ty = "translate-y-[40px]";
      } else if (w < 520) {
        scale = "scale-[0.7]";
        ty = "translate-y-[120px]";
      } else if (w < 680) {
        scale = "scale-[0.85]";
        ty = "translate-y-[40px]";
      } else if (w < 900) {
        scale = "scale-[0.85]";
        ty = "translate-y-[80px]";
      } else {
        scale = "scale-[1.1]";
        ty = "translate-y-[0px]";
      }

      const key = `${scale}|${ty}`;
      if (key !== lastKeyRef.current) {
        lastKeyRef.current = key;
        setCls({ scale, ty });
        console.log(`[useScaleAndShiftByWidth] w=${w}px → ${scale}, ${ty}`);
      }
    };

    pick();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", pick);
    window.addEventListener("resize", pick);
    window.addEventListener("orientationchange", pick);
    return () => {
      vv?.removeEventListener("resize", pick);
      window.removeEventListener("resize", pick);
      window.removeEventListener("orientationchange", pick);
    };
  }, []);

  // Safelist para evitar purga de Tailwind (no se ejecuta nada, solo referencia)
  const __TW_SAFELIST__ = [
    // escalas comunes + algunas extra (incluye scale-[0.1] como pediste)
    "scale-[0.1]",
    "scale-[0.2]",
    "scale-[0.3]",
    "scale-[0.4]",
    "scale-[0.5]",
    "scale-[0.55]",
    "scale-[0.6]",
    "scale-[0.7]",
    "scale-[0.8]",
    "scale-[0.9]",
    "scale-[1]",
    "scale-[1.05]",
    "scale-[1.1]",
    "scale-[1.2]",
    "scale-[1.3]",
    // offsets Y que usamos en los tramos (puedes añadir más)
    "translate-y-[0px]",
    "translate-y-[24px]",
    "translate-y-[40px]",
    "translate-y-[80px]",
    "translate-y-[120px]",
    "translate-y-[160px]",
    "translate-y-[180px]",
    "translate-y-[200px]",
  ];
  if (__TW_SAFELIST__.length === -1) console.log("");

  return cls; // { scale, ty }
}

/* =========================================================
   Componente principal
   ========================================================= */
export default function StartScreen({
  onNext,
}: {
  onNext: (promptFromDesktop?: string) => void;
}) {
  const [desktopPrompt, setDesktopPrompt] = useState("");

  // ===== Desktop: tamaño del marco proporcional al lado corto =====
  const FRAME_W = "w-[clamp(360px,26vmin,640px)]";
  const FRAME_TX = "translate-x-[0px]";
  const FRAME_TY = "translate-y-[0px]";

  // Bloquear scroll del body
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = document.body.style.getPropertyValue(
      "overscroll-behavior"
    );
    document.body.style.overflow = "hidden";
    document.body.style.setProperty("overscroll-behavior", "none");
    return () => {
      document.body.style.overflow = prevOverflow;
      if (prevOverscroll) {
        document.body.style.setProperty("overscroll-behavior", prevOverscroll);
      } else {
        document.body.style.removeProperty("overscroll-behavior");
      }
    };
  }, []);

  const handlePlay = () => onNext(desktopPrompt);

  // Mobile/Tablet: obtenemos clases Tailwind de scale + translate-y según WIDTH
  const { scale, ty } = useScaleAndShiftByWidth();

  return (
    <>
      {/* ======== DESKTOP (≥ 1024px) ======== */}
      <section className="hidden lg:grid min-h-screen w-full grid-cols-2 items-center translate-x-[-40px]">
        <div className="h-full flex items-center justify-end pr-[min(6vw,60px)]">
          <img
            src="/assets/GOATMUSIC/StartScreen/DESKTOP/MARCO_INICIO.png"
            alt="Marco inicio"
            draggable={false}
            className={[
              "select-none pointer-events-none object-contain",
              "transform-gpu",
              FRAME_W,
              FRAME_TX,
              FRAME_TY,
            ].join(" ")}
          />
        </div>

        {/* Columna derecha */}
        <div className="h-full flex items-center justify-center">
          <div className="w-full max-w-[700px] pl-[min(2vw,24px)] pr-[min(6vw,60px)]">
            {/* Logos */}
            <div className="mb-8 items-center translate-y-[40px]">
              <img
                src="/assets/GOATMUSIC/StartScreen/DESKTOP/LOGOS_WIN_INTEL.png"
                alt="Windows 11 + Intel"
                draggable={false}
                className="h-[clamp(34px,4vw,56px)] translate-x-[60px] scale-[1.2] w-auto select-none pointer-events-none drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
              />
              <img
                src="/assets/GOATMUSIC/StartScreen/DESKTOP/TU_GOAT.svg"
                alt="¿A qué suena tu GOAT?"
                draggable={false}
                className="w-full max-w-[640px] scale-[0.9] h-auto select-none pointer-events-none"
              />
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePlay();
              }}
              className="mb-6"
            >
              <input
                type="text"
                value={desktopPrompt}
                onChange={(e) => setDesktopPrompt(e.target.value)}
                placeholder="Escríbelo ahora y ponte los audífonos…"
                className={[
                  "w-full h-[96px] rounded-full",
                  "px-6 text-[16px]",
                  "bg-white/95 text-slate-900",
                  "shadow-[0_10px_20px_rgba(0,0,0,0.25)]",
                  "ring-1 ring-white/40 focus:outline-none focus:ring-2 focus:ring-white",
                ].join(" ")}
              />
            </form>

            {/* Botón Play */}
            <button
              type="button"
              onClick={handlePlay}
              className={[
                "relative isolate w-[min(260px,48%)] h-[60px] rounded-full",
                "flex items-center justify-center",
                "text-white font-semibold tracking-wide",
                "transition-transform active:scale-[0.98] select-none",
                "shadow-[0_14px_24px_rgba(0,0,0,0.35)]",
                "bg-no-repeat bg-center bg-contain",
                "bg-[url('/assets/GOATMUSIC/StartScreen/DESKTOP/BOTON.png')]",
                "block mx-auto ",
              ].join(" ")}
            >
              Play
            </button>
          </div>
        </div>
      </section>

      {/* ======== MOBILE / TABLET (< 1024px) ======== */}
      <section className="block lg:hidden min-h-[100svh] w-full flex items-center justify-center px-5 py-6">
        {/* Wrapper: ancho proporcional + transform solo con Tailwind */}
        <div
          className={[
            "mx-auto flex flex-col items-center gap-5",
            "transform-gpu origin-top",
            // Escala base por vmin para que el layout sea proporcional al lado corto,
            // y además aplicamos scale-* del hook para afinar.
            "w-[clamp(320px,92vmin,520px)]",
            scale, // ← scale-[...] según WIDTH
            ty,    // ← translate-y-[...] según WIDTH
          ].join(" ")}
        >
          {/* Fila 1: Imagen */}
          <div className="relative w-full flex items-center justify-center">
            <img
              src="/assets/GOATMUSIC/StartScreen/MOBILE/MARCO_HOME_PANTALLA.png"
              alt="Marco home móvil"
              draggable={false}
              className="block w-full h-auto select-none pointer-events-none"
            />
          </div>

          {/* Fila 2: Input + Botón */}
          <div className="w-full mx-auto flex flex-col items-center gap-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onNext(desktopPrompt);
              }}
              className="w-full"
            >
              <input
                type="text"
                value={desktopPrompt}
                onChange={(e) => setDesktopPrompt(e.target.value)}
                placeholder="Escríbelo ahora y ponte los audífonos…"
                className="w-full h-[56px] rounded-full px-5 text-[16px] bg-white/95 text-slate-900 shadow-[0_10px_20px_rgba(0,0,0,0.25)] ring-1 ring-white/40 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </form>

            <button
              type="button"
              onClick={() => onNext(desktopPrompt)}
              className={[
                "relative isolate h-[56px] w-[min(240px,100%)]",
                "flex items-center justify-center",
                "text-white font-semibold tracking-wide",
                "transition-transform active:scale-[0.98] select-none",
                "shadow-[0_14px_24px_rgba(0,0,0,0.35)]",
                "bg-no-repeat bg-center bg-contain",
                "bg-[url('/assets/GOATMUSIC/StartScreen/MOBILE/BOTON.png')]",
                "block mx-auto",
              ].join(" ")}
            >
              Play
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

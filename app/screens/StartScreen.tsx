/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";

/* =========================================================
   Hook: Escala + desplazamiento por WIDTH (solo clases Tailwind)
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

  // Safelist para evitar purga de Tailwind
  const __TW_SAFELIST__ = [
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
   Componente SOLO VERTICAL (portrait)
   ========================================================= */
export default function StartScreen({
  onNext,
}: {
  onNext: (promptFromDesktop?: string) => void;
}) {
  const [prompt, setPrompt] = useState("");

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

  const { scale, ty } = useScaleAndShiftByWidth();

  return (
    // Visible solo en vertical (portrait); oculto en landscape
    <section className="block landscape:hidden min-h-[100svh] w-full flex items-center justify-center px-5 py-6">
      {/* Wrapper: ancho proporcional + transform solo con Tailwind */}
      <div
        className={[
          "mx-auto flex flex-col items-center gap-5",
          "transform-gpu origin-top",
          "w-[clamp(320px,92vmin,520px)]",
          scale, // scale-[...] según WIDTH
          ty, // translate-y-[...] según WIDTH
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
        <div
          className="w-full mx-auto flex flex-col items-center gap-4"
          style={{ marginTop: "-30px" }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onNext(prompt);
            }}
            className="w-full relative flex items-center justify-center"
          >
            {/* Imagen detrás con mayor tamaño */}
            <img
              src="/assets/GOATMUSIC/StartScreen/MOBILE/IMPUT.png"
              alt="Fondo input"
              draggable={false}
              className="w-full h-auto pointer-events-none select-none"
            />

            {/* Input transparente encima ocupando lo mismo que la imagen */}
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Escríbelo ahora y ponte los audífonos…"
              className="w-full h-full rounded-full px-5 text-[16px]
               bg-transparent text-slate-900 placeholder:text-slate-700
               focus:outline-none z-10"
              style={{ position: "absolute", top: "-30px" }}
            />
          </form>

          <button
            type="button"
            onClick={() => onNext(prompt)}
            className={[
              "relative h-[56px] w-[min(240px,100%)]",
              "flex items-center justify-center",
              "shadow-[0_14px_24px_rgba(0,0,0,0.35)]",
              "block mx-auto",
            ].join(" ")}
            style={{
              borderRadius: "28px",
              boxShadow: "0 14px 24px rgba(0,0,0,0.35)",
              color: "#0c4684",
              fontWeight: "bolder",
              fontSize: "28px",
              background: "rgba(255, 255, 255, 0.72)",
            }}
          >
            Play
          </button>
        </div>
      </div>
    </section>
  );
}

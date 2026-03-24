/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

export default function StartScreen({
  onNext,
}: {
  onNext: (promptFromDesktop?: string) => void;
}) {
  const [prompt, setPrompt] = useState("");

  // Bloquear scroll del body
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = document.body.style.getPropertyValue("overscroll-behavior");
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

  return (
    <section className="min-h-[100svh] w-full flex items-center justify-center px-4 py-6 overflow-hidden">
      {/* Contenedor fluid: se ajusta a la dimensión menor de la pantalla */}
      <div
        className="mx-auto flex flex-col items-center gap-5"
        style={{ width: "min(520px, 90vmin, 92vw)" }}
      >
        {/* Fila 1: Imagen marco */}
        <div className="relative w-full">
          <img
            src="/assets/GOATMUSIC/StartScreen/MOBILE/MARCO_HOME_PANTALLA.png"
            alt="Marco home móvil"
            draggable={false}
            className="block w-full h-auto select-none pointer-events-none"
          />
        </div>

        {/* Fila 2: Input + Botón */}
        <div
          className="w-full flex flex-col items-center gap-4"
          style={{ marginTop: "-5%" }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onNext(prompt);
            }}
            className="w-full relative"
          >
            {/* Imagen decorativa del input */}
            <img
              src="/assets/GOATMUSIC/StartScreen/MOBILE/IMPUT.png"
              alt="Fondo input"
              draggable={false}
              className="block w-full h-auto pointer-events-none select-none"
            />
            {/* Input flotante encima de la imagen */}
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Escríbelo ahora y ponte los audífonos…"
              className="absolute inset-0 w-full h-full rounded-full px-[8%]
               bg-transparent text-slate-900 placeholder:text-slate-700
               focus:outline-none"
              style={{ fontSize: "clamp(12px, 3vmin, 16px)" }}
            />
          </form>

          <button
            type="button"
            onClick={() => onNext(prompt)}
            className="relative flex items-center justify-center mx-auto"
            style={{
              height: "clamp(44px, 7vmin, 60px)",
              width: "clamp(160px, 40vmin, 240px)",
              borderRadius: "30px",
              boxShadow: "0 14px 24px rgba(0,0,0,0.35)",
              color: "#0c4684",
              fontWeight: "bolder",
              fontSize: "clamp(18px, 4vmin, 28px)",
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

/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState } from "react";

export default function StartScreen({
  onNext,
}: {
  onNext: (promptFromDesktop?: string) => void;
}) {
  const [desktopPrompt, setDesktopPrompt] = useState("");

  // ===== Ajustes rápidos =====
  // Póster desktop (izquierda)
  const DESKTOP_POSTER_NUDGE_Y = -20; // px (negativo sube, positivo baja)
  const DESKTOP_POSTER_WIDTH = 320;   // px

  // Texto como imagen (derecha, desktop)
  const TEXT_IMG_WIDTH = 520; // px
  const TEXT_IMG_NUDGE_Y = 0; // px

  // --- LOGO WINDOWS + INTEL (MOBILE) ---
  // Arriba de la pantalla (no sobre el póster)
  const MOBILE_LOGO_TOP_OFFSET = 70; // px desde el top (se suma al safe-area)
  const MOBILE_LOGO_HEIGHT = 56;     // px (define SOLO height -> mantiene proporción)
  const MOBILE_LOGO_WIDTH: number | undefined = undefined; // o usa width y deja height undefined

  // --- LOGO WINDOWS + INTEL (DESKTOP) ---
  const LOGOS_HEIGHT_DESKTOP = 96;   // px
  const LOGOS_OFFSET_Y_DESKTOP = 12; // px

  // Bloquear scroll del body (sin usar "any")
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
    <div className="w-full h-[100svh] relative overflow-hidden">
      {/* ===== MOBILE ===== */}
      <div className="md:hidden relative h-full flex flex-col z-10">
        {/* Logo ARRIBA DE LA PANTALLA (ajustable, sin deformar) */}
        <div
          className="absolute left-1/2 z-30"
          style={{
            top: `calc(env(safe-area-inset-top) + ${MOBILE_LOGO_TOP_OFFSET}px)`,
            transform: "translateX(-50%)",
          }}
        >
          <LogoIW height={MOBILE_LOGO_HEIGHT} width={MOBILE_LOGO_WIDTH} />
        </div>

        {/* Póster al centro */}
        <div className="flex-1 relative flex items-center justify-center px-4 pt-14">
          <img
            src="/assets/TABLET/IMG/MARCO_HOME_PANTALLA.png"
            alt="Marco GOAT Mobile"
            className="max-w-[85vw] max-h-[85vh] object-contain drop-shadow-[0_10px_40px_rgba(0,0,0,0.45)]"
          />
        </div>
      </div>

      {/* ===== DESKTOP/TABLET ===== */}
      <div className="hidden md:block h-full relative z-10">
        <div className="grid grid-cols-2 items-stretch h-full gap-10 p-10 lg:p-20">
          {/* Izquierda: póster */}
          <div className="flex items-center justify-center">
            <img
              src="/assets/PANTALLA/IMG/MARCO_INICIO.png"
              alt="Marco GOAT Desktop"
              className="drop-shadow-[0_12px_48px_rgba(0,0,0,0.45)]"
              style={{
                width: DESKTOP_POSTER_WIDTH,
                maxWidth: "42vw",
                transform: `translateY(${DESKTOP_POSTER_NUDGE_Y}px)`,
              }}
            />
          </div>

          {/* Derecha: logos + textos + input */}
          <div className="text-white grid grid-rows-[auto_1fr_auto]">
            {/* Logos desktop (en flujo) */}
            <div className="flex items-start" style={{ marginTop: LOGOS_OFFSET_Y_DESKTOP }}>
              <LogoIW height={LOGOS_HEIGHT_DESKTOP} />
            </div>

            <div
              className="flex flex-col justify-center items-center text-center gap-4"
              style={{ lineHeight: "40px" }}
            >
              <img
                src="/assets/PANTALLA/TEXT/TEXTOS-01.svg"
                alt="¿A qué suena tu GOAT? - Descripción"
                className="select-none"
                style={{ width: TEXT_IMG_WIDTH, transform: `translateY(${TEXT_IMG_NUDGE_Y}px)` }}
              />

              {/* Input */}
              <div
                className="mt-2 rounded-2xl px-5 py-4 w-full max-w-[620px]
                  bg-gradient-to-b from-[#f5f6f7] to-[#e6e7ea]
                  text-[#222] shadow-[0_14px_36px_rgba(0,0,0,0.25)]
                  border border-white/60"
              >
                <input
                  type="text"
                  value={desktopPrompt}
                  onChange={(e) => setDesktopPrompt(e.target.value)}
                  placeholder="Escribe sobre qué quieres tu canción"
                  className="w-full bg-transparent outline-none text-[18px] placeholder:text-[#808080]"
                  maxLength={90}
                  style={{ fontFamily: "'Segoe UI', sans-serif" }}
                />
                <div className="mt-3 h-[1px] w-full bg-white/50" />
              </div>

              {/* Botón */}
              <button
                onClick={() => onNext(desktopPrompt.trim() || undefined)}
                className="bg-[url('/assets/TABLET/IMG/BOTON.png')] bg-no-repeat bg-center bg-contain transition w-full max-w-[620px] h-[64px] text-[#002060]"
                style={{ fontSize: "28px", cursor: "pointer" }}
              >
                Play
              </button>
            </div>

            <div />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Logo Windows + Intel (con fallbacks por el “+” en el nombre)
 *  Para NO deformar: pasa SOLO height o SOLO width (la otra queda undefined).
 */
function LogoIW({ height, width }: { height?: number; width?: number }) {
  const LOGO_SOURCES = [
    "/assets/TABLET/SVG/LOGOS_INTEL%2BWINDOWS.svg",
    "/assets/TABLET/SVG/LOGOS_INTEL+WINDOWS.svg",
    "/assets/TABLET/SVG/LOGOS-WIN%2BINTEL.png",
    "/assets/TABLET/SVG/LOGOS-WIN+INTEL.png",
    "/assets/TABLET/SVG/LOGOS_INTEL_WINDOWS.svg",
  ];
  const [idx, setIdx] = useState(0);

  return (
    <img
      key={LOGO_SOURCES[idx]}
      src={LOGO_SOURCES[idx]}
      alt="Windows 11 + Intel"
      className="block"
      style={{
        height: height ?? "auto",
        width: width ?? "auto",
        maxWidth: "90vw",
        objectFit: "contain",
      }}
      onError={() => setIdx((i) => Math.min(i + 1, LOGO_SOURCES.length - 1))}
    />
  );
}

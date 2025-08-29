/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import SlideToStart from "../components/SlideButton";

/* --------------------------- Datos --------------------------- */
type GenreCard = { key: string; label: string };

const CARDS: GenreCard[] = [
  { key: "pop", label: "Pop" },
  { key: "hip_hop_rap", label: "Hip-Hop / Rap" },
  { key: "rock_alt", label: "Rock / Alternativo" },
  { key: "kpop", label: "K-pop" },
  { key: "reggaeton", label: "Reggaetón" },
  { key: "salsa", label: "Salsa" },
];

const bgForIndex = (i: number) => {
  const idx = ((i % 6) + 1).toString().padStart(2, "0");
  return `/assets/TABLET/IMG/BANDERINES_GENEROS-${idx}.png`;
};

const overlayFrame = `/assets/TABLET/IMG/MARCO_TEXTOS_TRANPARENTES.png`;
const footerBgDesktop = `/assets/PANTALLA/TEXT/FOOTER_BARRA_NEGRA.png`;
const footerBgMobile = `/assets/PANTALLA/TEXT/CAJA-DE-TEXTO_FOOTER_PANTALLA.png`;
const textos01 = `/assets/PANTALLA/IMG/TEXTOS-01.svg`;
const logosWinIntel = `/assets/TABLET/SVG/LOGOS-WIN+INTEL.png`;

/* ---------- Card ---------- */
function ButtonGenreCard({
  label,
  index,
  selected,
  onClick,
  posClass = "-translate-x-[20px] -translate-y-[18px]",
  sizeClass = "w-full aspect-[16/9] md:aspect-auto md:h-[120px] lg:h-[140px]",
}: {
  label: string;
  index: number;
  selected: boolean;
  onClick: () => void;
  posClass?: string;
  sizeClass?: string;
}) {
  const BG = [
    "bg-[url('/assets/TABLET/IMG/BANDERINES_GENEROS-01.png')]",
    "bg-[url('/assets/TABLET/IMG/BANDERINES_GENEROS-02.png')]",
    "bg-[url('/assets/TABLET/IMG/BANDERINES_GENEROS-03.png')]",
    "bg-[url('/assets/TABLET/IMG/BANDERINES_GENEROS-04.png')]",
    "bg-[url('/assets/TABLET/IMG/BANDERINES_GENEROS-05.png')]",
    "bg-[url('/assets/TABLET/IMG/BANDERINES_GENEROS-06.png')]",
  ][index % 6];

  return (
    <button
      onClick={onClick}
      className={[
        "relative overflow-hidden md:rounded-r-[22px] md:rounded-l-none",
        "shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition text-center",
        "bg-cover bg-center min-w-0 touch-manipulation select-none",
        "justify-self-stretch self-stretch",
        sizeClass,
        BG,
        selected ? "ring-2 ring-white/70 md:scale-[1.01]" : "hover:md:scale-[1.01]",
      ].join(" ")}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div
        className={[
          "absolute z-10 flex flex-col items-center justify-center gap-1 px-2 text-white text-center",
          "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          posClass,
        ].join(" ")}
      >
        <div className="font-semibold text-[13px] drop-shadow whitespace-nowrap">
          {label}
        </div>
        <span
          className={[
            "inline-block leading-none",
            "text-[12px] px-2 py-1 rounded-md border",
            selected
              ? "bg-white text-black border-white"
              : "bg-transparent text-white border-white/70 hover:bg-white/10",
          ].join(" ")}
        >
          {selected ? "Seleccionado" : "Seleccionar"}
        </span>
      </div>
    </button>
  );
}

/* ---------------------- Pantalla completa 100vh ---------------------- */
export default function GenreSelectionScreen({
  style,
  setStyle,
  onBack,
  onNext,
  error,
}: {
  style: string;
  setStyle: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
  error?: string | null;
}) {
  const canNext = !!style?.trim();
  const selectedIndex = CARDS.findIndex((c) => c.label === style);
  const selectedBg = selectedIndex >= 0 ? bgForIndex(selectedIndex) : null;

  return (
    <div className="h-screen w-full flex flex-col text-white overflow-hidden">
      {/* HEADER */}
      <header className="shrink-0 flex flex-col items-center justify-start h-[120px] md:h-[180px] lg:h-[220px] pt-3 md:pt-4 lg:pt-6">
        <img
          src={logosWinIntel}
          alt="Windows + Intel"
          className="hidden lg:block h-[64px] xl:h-[80px] w-auto mb-2"
          draggable={false}
        />
      </header>

      {/* GRID */}
      <main
        className="
          grow
          h-[calc(100vh-120px-200px)]
          md:h-[calc(100vh-180px-260px)]
          lg:h-[calc(100vh-220px-320px)]
          xl:h-[calc(100vh-220px-380px)]
          overflow-visible
        "
      >
        {/* Texto responsive: <1024px muestra TEXTO.svg, >=1024px muestra TEXTOS-03.svg */}
        {/* Texto responsive centrado y más grande */}
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8
                flex items-center justify-center mb-3 md:mb-6 translate-y-[-50%]">
          <img
            src="/assets/PANTALLA/TEXT/TEXTO.svg"
            alt="Texto móvil"
            className="block lg:hidden mx-auto h-auto w-[clamp(260px,60vw,900px)] object-contain"
            draggable={false}
          />
          <img
            src="/assets/PANTALLA/TEXT/TEXTOS-03.svg"
            alt="Texto desktop"
            className="hidden lg:block mx-auto h-auto w-[clamp(520px,80vw,800px)] object-contain"
            draggable={false}
          />
        </div>
        {/* Wrapper que cambia posición por breakpoint */}
        <div
          className="
    /* 📱 Mobile: centrado y un poco más abajo */
    mx-auto mt-3

    /* 💻 Desktop: quita centrado, muévelo con margen y/o translate */
    lg:mx-0 lg:ml-[80px] lg:mt-[-16px]
    xl:ml-[120px] xl:mt-[-24px]

    /* (opcional) desplazamiento fino con transform en desktop */
    lg:translate-x-[300px] lg:translate-y-[-60px]
  "
        >
          <div className="h-full w-full max-w-6xl mx-auto lg:mx-0 px-3 sm:px-4 md:px-6 lg:px-8">
            <div
              className="
        grid grid-cols-2 lg:grid-cols-3
        gap-x-2 gap-y-2 sm:gap-x-3 sm:gap-y-3 md:gap-5
        items-stretch justify-items-stretch
      "
            >
              {CARDS.map((card, i) => (
                <ButtonGenreCard
                  key={card.key}
                  label={card.label}
                  index={i}
                  selected={style === card.label}
                  onClick={() => setStyle(card.label)}
                />
              ))}
            </div>

            {error && (
              <p className="mt-2 text-red-400 text-xs sm:text-sm md:text-base truncate">
                {error}
              </p>
            )}
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer
        className="
    relative w-full overflow-hidden shrink-0
    h-[260px] sm:h-[350px] md:h-[400px] lg:h-[500px] xl:h-[280px]"
      >
        <img
          src={footerBgMobile}
          className="absolute inset-0 w-full h-full object-contain object-center lg:hidden select-none pointer-events-none transform scale-150 translate-y-[5%]"
          draggable={false}
        />



        {/* Fondo DESKTOP: imagen completa, centrada */}
        <img
          src={footerBgDesktop}
          alt="Footer desktop"
          className="
    absolute inset-0 w-full h-full
    object-contain object-center
    hidden lg:block
    select-none pointer-events-none
    transform scale-127  
    translate-y-[10%]
  "
          draggable={false}
        />
        {/* Contenido */}
        <div className="relative z-10 h-full w-full px-3 sm:px-4 md:px-6 lg:px-10 py-3 md:py-4 lg:py-5">
          <div className="relative h-full w-full">
            <div
              className="
    /* 📱 Solo mobile: ancla al fondo sin salirse */
    absolute
    /* 📱 Mobile: punto fijo relativo al footer */
    left-[50%] top-[15%] -translate-x-1/2 -translate-y-1/2
    w-[75%] max-w-sm sm:w-[85%] sm:max-w-md md:w-[80%] md:max-w-lg

    /* 💻 Desktop: SIN CAMBIOS (tu posición original) */
    lg:bottom-[150px] lg:right-[230px] lg:left-auto lg:translate-x-0
    lg:w-full lg:max-w-2xl
  "
            >
              <SlideToStart
                onComplete={() => canNext && onNext()}
                disabled={!canNext}
                className="w-full"
                selectedLabel={style || ""}
                selectedBg={selectedBg || undefined}
              />
            </div>

          </div>

        </div>

      </footer>
    </div >
  );
}

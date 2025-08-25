/* eslint-disable @next/next/no-img-element */
"use client";
import SlideToStart  from "../components/SlideButton";

/* --------------------------- Datos --------------------------- */
type GenreCard = { key: string; label: string; };

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

/* --------------------------- Pantalla --------------------------- */
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
  const canNext = !!style.trim();

  const selectedIndex = CARDS.findIndex((c) => c.label === style);
  const selectedBg = selectedIndex >= 0 ? bgForIndex(selectedIndex) : null;

  const GRID_Y_OFFSET = -8;
  const FOOTER_ORIGINAL_W = 1000;
  const SLIDER_RIGHT_PX = 28;
  const SLIDER_Y_OFFSET_PX = 0;
  const SLIDER_X_OFFSET_PX = 0;

  return (
    <div className="w-full min-h-screen relative flex flex-col text-white overflow-hidden">
      {/* HEADER */}
      <div className="relative z-20 pt-3 md:pt-4">
        <div className="flex justify-center">
          <img
            src="/assets/TABLET/SVG/LOGOS-WIN+INTEL.png"
            alt="Intel + Windows 11"
            className="h-10 md:h-16"
          />
        </div>

        <div className="mt-2 text-center px-4">
          <img
            src="/assets/PANTALLA/TEXT/TEXTOS-03.svg"
            alt="¡Carga exitosa!"
            className="mx-auto h-16 md:h-24 w-auto"
          />
        </div>

        <div className="absolute left-4 top-4 md:left-6 md:top-6">
          <button
            onClick={onBack}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
          >
            ←
          </button>
        </div>
      </div>

      {/* GRID */}
      <div
        className="relative z-10 flex-none w-full mx-auto max-w-4xl px-3 md:px-6"
        style={{ transform: `translateY(${GRID_Y_OFFSET}px)` }}
      >
        <div className="mt-2 md:mt-3 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 md:gap-x-5 md:gap-y-4 justify-items-center">
          {CARDS.map((card, i) => {
            const selected = style === card.label;
            const bg = bgForIndex(i);
            const isRightColMobile = i % 2 === 1;
            const mobileRound = isRightColMobile
              ? "rounded-r-[22px] rounded-l-none"
              : "rounded-l-[22px] rounded-r-none";
            const desktopRound = "md:rounded-r-[22px] md:rounded-l-none";
            return (
              <button
                key={card.key}
                onClick={() => setStyle(card.label)}
                className={[
                  "relative overflow-hidden",
                  mobileRound,
                  desktopRound,
                  "shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition transform text-center",
                  "w-[84%] md:w-[82%] max-w-[240px] md:max-w-[260px]",
                  "h-[72px] md:h-[92px]",
                  selected ? "ring-2 ring-white/70 md:scale-[1.01]" : "hover:md:scale-[1.01]",
                ].join(" ")}
                style={{
                  backgroundImage: `url('${bg}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 px-2">
                  <div className="text-white font-semibold text-[11px] md:text-[13px] drop-shadow">
                    {card.label}
                  </div>
                  <span
                    className={[
                      "inline-block leading-none",
                      "text-[10px] md:text-[12px] px-2 py-1 rounded-md border",
                      selected
                        ? "bg-white text-black border-white"
                        : "bg-transparent text-white border-white/70 hover:bg-white/10",
                    ].join(" ")}
                  >
                    Seleccionar
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {error && <div className="mt-2 text-center text-red-300 text-sm">{error}</div>}
      </div>

      {/* --- MOBILE: slider arriba e imagen debajo (sin chip duplicado) --- */}
      <div className="relative z-20 mt-6 mb-8 px-4 md:hidden">
        <div className="relative mx-auto w-full max-w-[380px]">
          <SlideToStart
            onComplete={onNext}
            disabled={!canNext}
            selectedLabel={canNext ? style : undefined}
            selectedBg={selectedBg}
            className="w-full"
          />
          <img
            src="/assets/PANTALLA/TEXT/CAJA-DE-TEXTO_FOOTER_PANTALLA.png"
            alt="Beneficios Lenovo VoIP"
            className="block w-full h-auto rounded-xl mt-4"
          />
        </div>
      </div>

      {/* --- DESKTOP: imagen base + slider sobrepuesto a la derecha --- */}
      <div className="relative z-20 mt-6 mb-8 px-4 hidden md:block">
        <div className="relative mx-auto" style={{ width: `min(100%, ${FOOTER_ORIGINAL_W}px)` }}>
          <img
            src="/assets/PANTALLA/TEXT/FOOTER_BARRA_NEGRA.png"
            alt="Beneficios Lenovo VoIP"
            className="block w-full h-auto select-none pointer-events-none rounded-xl"
          />
          <div
            className="absolute z-10 flex flex-col items-end gap-3"
            style={{
              top: "50%",
              right: SLIDER_RIGHT_PX,
              transform: `translate(${SLIDER_X_OFFSET_PX}px, calc(-50% + ${SLIDER_Y_OFFSET_PX}px))`,
            }}
          >
            <SlideToStart
              onComplete={onNext}
              disabled={!canNext}
              selectedLabel={canNext ? style : undefined}
              selectedBg={selectedBg}
              className="w-[340px] md:w-[420px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

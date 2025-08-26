/* eslint-disable @next/next/no-img-element */
"use client";
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

  /* Constantes específicas de desktop */
  const FOOTER_ORIGINAL_W = 1000;
  const SLIDER_RIGHT_PX = 28;
  const SLIDER_Y_OFFSET_PX = 0;
  const SLIDER_X_OFFSET_PX = 0;

  return (
    <div className="w-full min-h-screen relative flex flex-col text-white overflow-hidden">

      {/* =============== VISTA MOBILE =============== */}
      <div className="md:hidden">
        {/* HEADER (solo mobile) */}
        <div
          className="relative z-20 pt-3 px-4"
          style={{
            transform: "translate(0px, 40px) scale(1.1)", // mueve/escala header mobile
            transformOrigin: "top center",
          }}
        >
          <div className="flex justify-center" style={{ transform: " translate(-10px, 0px)" }}>
            <img
              src="/assets/TABLET/SVG/LOGOS-WIN+INTEL.png"
              alt="Intel + Windows 11"
              className="h-16"
            />
          </div>

          <div className="mt-2 text-center">
            <img
              src="/assets/PANTALLA/TEXT/TEXTOS-03.svg"
              alt="¡Carga exitosa!"
              className="mx-auto h-20 w-auto"
            />
          </div>
        </div>

        {/* GRID (solo mobile) */}
        <div className="relative z-10 w-full px-3" style={{ transform: "translateY(40px)" }}>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 justify-items-center">
            {CARDS.map((card, i) => {
              const selected = style === card.label;
              const bg = bgForIndex(i);
              const isRightColMobile = i % 2 === 1;
              const mobileRound = isRightColMobile
                ? "rounded-r-[22px] rounded-l-none"
                : "rounded-l-[22px] rounded-r-none";
              return (
                <button
                  key={card.key}
                  onClick={() => setStyle(card.label)}
                  className={[
                    "relative overflow-hidden",
                    mobileRound,
                    "shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition transform text-center",
                    "w-[84%] max-w-[240px] h-[72px]",
                    selected ? "ring-2 ring-white/70" : "",
                  ].join(" ")}
                  style={{
                    backgroundImage: `url('${bg}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-black/20" />
                  {/* Texto movible por card (mobile) */}
                  <div
                    className="absolute z-10 flex flex-col items-center gap-1 text-white"
                    style={{
                      top: "50%",
                      left: "50%",
                      transform: "translate(-10%, -50%)",
                      textAlign: "center",
                    }}
                  >
                    <div className="font-semibold text-[11px] drop-shadow">
                      {card.label}
                    </div>
                    <span
                      className={[
                        "inline-block leading-none",
                        "text-[10px] px-2 py-1 rounded-md border",
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

        {/* FOOTER + SLIDER (solo mobile, full-width) */}
        <div className="relative z-20 mt-6 mb-8" style={{ transform: "translate(0px, 30px)" }}>
          <div className="relative w-full">
            {/* Imagen full width */}
            <img
              src="/assets/PANTALLA/TEXT/CAJA-DE-TEXTO_FOOTER_PANTALLA.png"
              alt="Beneficios Lenovo VoIP"
              className="block w-full h-auto"
            />
            {/* Slider sobre la imagen */}
            <div
              className="absolute"
              style={{
                top: "40%",
                left: "50%",
                transform: "translate(-50%, -200%) scale(1)",
                width: "92%",
              }}
            >
              <SlideToStart
                onComplete={onNext}
                disabled={!canNext}
                selectedLabel={canNext ? style : undefined}
                selectedBg={selectedBg}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* =============== VISTA DESKTOP =============== */}
      <div className="hidden md:block">
        {/* HEADER (solo desktop) */}
        <div className="relative z-20 pt-4">
          <div className="flex justify-center">
            <img
              src="/assets/TABLET/SVG/LOGOS-WIN+INTEL.png"
              alt="Intel + Windows 11"
              className="h-16"
            />
          </div>

          <div className="mt-2 text-center px-4">
            <img
              src="/assets/PANTALLA/TEXT/TEXTOS-03.svg"
              alt="¡Carga exitosa!"
              className="mx-auto h-24 w-auto"
            />
          </div>
        </div>

        {/* GRID (solo desktop) */}
        <div className="relative z-10 w-full mx-auto max-w-4xl px-6"><div className="relative z-10 w-full mx-auto max-w-4xl px-6">
          <div className="relative z-10 w-full mx-auto max-w-4xl px-6">
            <div className="mt-3 grid grid-cols-3 gap-x-5 gap-y-4 justify-items-center">
              {CARDS.map((card, i) => {
                const selected = style === card.label;
                const bg = bgForIndex(i);
                return (
                  <button
                    key={card.key}
                    onClick={() => setStyle(card.label)}
                    className={[
                      "relative overflow-hidden md:rounded-r-[22px] md:rounded-l-none",
                      "shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition transform text-center",
                      "w-[82%] max-w-[260px] h-[92px]",
                      selected ? "ring-2 ring-white/70 md:scale-[1.01]" : "hover:md:scale-[1.01]",
                    ].join(" ")}
                    style={{
                      backgroundImage: `url('${bg}')`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <div className="absolute inset-0 bg-black/20" />
                    {/* Contenedor para el label y el botón "Seleccionar" */}
                    <div
                      className="absolute z-10 flex flex-col items-center justify-center gap-1 px-2 text-white text-center"
                      style={{
                        transform: "translate(70px, -20px)", // Mueve tanto el label como el botón
                      }}
                    >
                      {/* Label */}
                      <div className="font-semibold text-[13px] drop-shadow">
                        {card.label}
                      </div>
                      {/* Botón "Seleccionar" */}
                      <span
                        className={[
                          "inline-block leading-none",
                          "text-[12px] px-2 py-1 rounded-md border",
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
          {error && <div className="mt-2 text-center text-red-300 text-sm">{error}</div>}
        </div>

          {error && <div className="mt-2 text-center text-red-300 text-sm">{error}</div>}
        </div>

        {/* FOOTER + SLIDER (solo desktop) */}
        <div className="relative z-20 mt-6 mb-8 px-4">
          {/* PADRE RELATIVO Y SIN RECORTES */}
          <div
            className="relative mx-auto overflow-visible"     // 👈 importante: no recortar overlays
            style={{ width: "min(100%, 1000px)" }}            // 👈 ancho con unidades válidas
          >
            <img
              src="/assets/PANTALLA/TEXT/FOOTER_BARRA_NEGRA.png"
              alt="Beneficios Lenovo VoIP"
              className="block w-full h-auto rounded-xl select-none pointer-events-none"
            />

            {/* SLIDER ANCLADO A LA DERECHA, CENTRADO VERTICAL, SIN FLEX */}
            <div
              style={{
                top: "50%",
                right: "28px",
                transform: "translate(54%, -300%)"                // solo Y, evita translateX grandes
              }}
            >
              <div className="shrink-0">
                <SlideToStart
                  onComplete={onNext}
                  disabled={!canNext}
                  selectedLabel={canNext ? style : undefined}
                  selectedBg={selectedBg}
                  className="w-[420px] max-w-[min(420px,calc(100vw-6rem))]" // evita encogerse o salirse
                />
              </div>
            </div>
          </div>
        </div>



      </div>
    </div >
  );
}

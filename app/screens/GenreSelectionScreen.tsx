/* eslint-disable @next/next/no-img-element */
"use client";

type GenreCard = {
  key: string;
  label: string;
  // imgIndex ya no es obligatorio: rotamos 01..06 automáticamente
};

const CARDS: GenreCard[] = [
  // Global
  { key: "pop", label: "Pop" },
  { key: "hip_hop_rap", label: "Hip-Hop / Rap" },
  { key: "rock_alt", label: "Rock / Alternativo" },
  { key: "kpop", label: "K-pop" },
  { key: "reggaeton", label: "Reggaetón" },
  { key: "salsa", label: "Salsa" },
];

// helper para asignar fondo 01..06 en ciclo
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

  return (
    <div className="w-full min-h-screen relative flex flex-col text-white overflow-hidden">
      {/* Video de fondo */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
        src="/assets/fondo_animado.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/assets/FONDO_PANTALLA.png"
      />
      {/* Capa para contraste */}
      <div className="absolute inset-0 bg-black/25 z-0 pointer-events-none" />

      {/* Lenovo >= md */}
      <img
        src="/assets/TABLET/SVG/LOGOS_LENOVO.svg"
        alt="Lenovo"
        className="hidden md:block absolute right-0 top-10 h-28 z-30"
      />

      {/* Header */}
      <div className="relative z-20 pt-6 md:pt-8">
        <div className="flex justify-center">
          <img
            src="/assets/TABLET/SVG/LOGOS_INTEL+WINDOWS.svg"
            alt="Intel + Windows 11"
            className="h-12 md:h-20"
          />
        </div>
        <div className="mt-4 text-center px-4">
          <h1 className="text-2xl md:text-3xl font-extrabold">¡Carga exitosa!</h1>
          <p className="mt-2 text-base md:text-lg text-white/90">
            Elige el ritmo que te haga vibrar y edítalo como quieras.
          </p>
        </div>

        {/* Back */}
        <div className="absolute left-4 top-6 md:left-6 md:top-8">
          <button
            onClick={onBack}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
          >
            ←
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className="relative z-10 flex-1 px-4 md:px-8 lg:px-12 w-full mx-auto max-w-6xl">
        <div className="mt-6 md:mt-10 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {CARDS.map((card, i) => {
            const selected = style === card.label;
            const bg = bgForIndex(i);

            // Mobile: curvas hacia afuera (col 0: curva izq, col 1: curva der)
            const isRightColMobile = i % 2 === 1;
            const mobileRound = isRightColMobile
              ? "rounded-r-[28px] rounded-l-none"
              : "rounded-l-[28px] rounded-r-none";

            // Desktop: todas curvas a la izquierda (derecha recta)
            const desktopRound = "md:rounded-r-[28px] md:rounded-l-none";

            return (
              <button
                key={card.key}
                onClick={() => setStyle(card.label)}
                className={[
                  "relative overflow-hidden",
                  mobileRound,
                  desktopRound,
                  "shadow-[0_10px_28px_rgba(0,0,0,0.35)] transition transform text-center",
                  "h-[118px] md:h-[144px]",
                  selected
                    ? "ring-2 ring-white/70 md:scale-[1.01]"
                    : "hover:md:scale-[1.01]",
                ].join(" ")}
                style={{
                  backgroundImage: `url('${bg}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Overlay para legibilidad */}
                <div className="absolute inset-0 bg-black/20" />

                {/* Contenido centrado */}
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-3">
                  <div className="text-white font-semibold text-sm md:text-base drop-shadow">
                    {card.label}
                  </div>
                  <span
                    className={[
                      "inline-block text-xs md:text-[13px] leading-none",
                      "px-3 py-2 rounded-md border",
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

        {error && <div className="mt-4 text-center text-red-300">{error}</div>}
      </div>

      {/* Botón Crear */}
      <div className="relative z-20 mt-6 mb-8 flex justify-center px-4">
        <button
          onClick={onNext}
          disabled={!canNext}
          className={[
            "bg-[url('/assets/TABLET/IMG/BOTON.png')] bg-no-repeat bg-center bg-contain",
            "w-full max-w-[360px] h-[64px] text-[#002060] text-[26px] md:text-[28px]",
            !canNext ? "opacity-60 grayscale pointer-events-none" : "transition",
          ].join(" ")}
          style={{ cursor: canNext ? "pointer" : "default" }}
        >
          Crear
        </button>
      </div>
    </div>
  );
}

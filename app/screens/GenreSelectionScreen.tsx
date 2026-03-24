/* eslint-disable @next/next/no-img-element */
"use client";
import SlideToStart from "../components/SlideButton";

/* --------------------------- Datos --------------------------- */
type GenreCard = { key: string; label: string };

const CARDS: GenreCard[] = [
  { key: "pop", label: "Pop" },
  { key: "hip_hop_rap", label: "Hip-Hop / Rap" },
  { key: "rock_alt", label: "Rock" },
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

  return (
    <div className="w-full min-h-[100svh] flex flex-col text-white overflow-hidden">

      {/* HEADER */}
      <div className="flex-none flex justify-center pt-[clamp(12px,5svh,120px)] pb-2 px-4">
        <img
          src="/assets/PANTALLA/TEXT/TEXTOS-03.svg"
          alt="Elige tu género musical"
          className="h-auto"
          style={{ width: "clamp(160px, 65vw, 550px)" }}
        />
      </div>

      {/* GRID DE GÉNEROS */}
      <div className="flex-1 flex items-center py-2">
        <div
          className="w-full mx-auto"
          style={{
            maxWidth: "min(900px, 95vw)",
            paddingInline: "clamp(8px, 3vw, 24px)",
          }}
        >
          <div
            className="grid grid-cols-2"
            style={{
              gap: "clamp(6px, 1.5vh, 16px) clamp(8px, 2vw, 20px)",
            }}
          >
            {CARDS.map((card, i) => {
              const selected = style === card.label;
              const bg = bgForIndex(i);
              const isRightCol = i % 2 === 1;

              const cornerStyle: React.CSSProperties = isRightCol
                ? {
                    width: "100%",
                    height: "clamp(72px, 10vh, 130px)",
                    borderTopRightRadius: "clamp(20px, 3vw, 40px)",
                    borderBottomRightRadius: "clamp(20px, 3vw, 40px)",
                  }
                : {
                    width: "100%",
                    height: "clamp(72px, 10vh, 130px)",
                    borderTopLeftRadius: "clamp(20px, 3vw, 40px)",
                    borderBottomLeftRadius: "clamp(20px, 3vw, 40px)",
                  };

              return (
                <button
                  key={card.key}
                  onClick={() => setStyle(card.label)}
                  className={[
                    "relative overflow-hidden",
                    "shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition transform text-center",
                    selected
                      ? "ring-2 ring-white/70 scale-[1.01]"
                      : "hover:scale-[1.01]",
                  ].join(" ")}
                  style={cornerStyle}
                >
                  {/* Fondo como capa separada */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url('${bg}')`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      transform: isRightCol ? "none" : "scaleX(-1)",
                    }}
                  />
                  {/* Overlay oscuro */}
                  <div className="absolute inset-0 bg-black/20" />

                  {/* Texto — no se invierte */}
                  <div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 text-white text-center"
                    style={{
                      marginLeft: isRightCol ? "35%" : "-35%",
                      marginRight: isRightCol ? "20px" : "-20px",
                    }}
                  >
                    <div
                      className="font-semibold drop-shadow"
                      style={{ fontSize: "clamp(13px, 2.2vw, 30px)" }}
                    >
                      {card.label}
                    </div>
                    <span
                      className={[
                        "inline-block leading-none px-2 py-1 mt-1 rounded-md border",
                        selected
                          ? "bg-white text-black border-white"
                          : "bg-transparent text-white border-white/70 hover:bg-white/10",
                      ].join(" ")}
                      style={{ fontSize: "clamp(10px, 1.6vw, 22px)" }}
                    >
                      Seleccionar
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mt-2 text-center text-red-300 text-sm">{error}</div>
          )}
        </div>
      </div>

      {/* FOOTER + SLIDER */}
      <div
        className="flex-none"
        style={{
          paddingInline: "clamp(4px, 2%, 16px)",
          paddingBottom: "clamp(4px, 2vh, 16px)",
        }}
      >
        <div
          className="relative mx-auto"
          style={{ maxWidth: "min(900px, 95vw)" }}
        >
          {/* Imagen de fondo del footer */}
          <img
            src="/assets/PANTALLA/TEXT/CAJA-DE-TEXTO_FOOTER_PANTALLA.png"
            alt="Beneficios Lenovo VoIP"
            className="block w-full object-cover rounded-xl pointer-events-none select-none"
            style={{
              height: "auto",
              maxHeight: "clamp(130px, 32vh, 480px)",
              objectPosition: "top",
            }}
          />

          {/* Slider superpuesto en la parte superior de la imagen */}
          <div
            style={{
              position: "absolute",
              top: "10%",
              width: "90%",
              left: "5%",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div style={{ width: "100%" }}>
              <SlideToStart
                onComplete={onNext}
                disabled={!canNext}
                selectedLabel={canNext ? style : undefined}
                selectedBg={selectedBg}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

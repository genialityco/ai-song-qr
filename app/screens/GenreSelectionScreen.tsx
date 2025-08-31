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
    <div className="w-full min-h-screen relative flex flex-col text-white overflow-hidden">
      {/* =============== VISTA DESKTOP =============== */}
      <div className="hidden md:block">
        {/* HEADER (solo desktop) */}
        <div className="relative z-20 pt-4" style={{ marginTop: "20%" }}>
          <div
            className="mt-2 text-center px-4"
            style={{ justifyContent: "center", display: "flex" }}
          >
            <img
              src="/assets/PANTALLA/TEXT/TEXTOS-03.svg"
              alt="¡Carga exitosa!"
              style={{ width: "70%", marginBottom: "20px" }}
            />
          </div>
        </div>

        {/* GRID (solo desktop) */}
        <div className="relative z-10 w-full mx-auto max-w-4xl px-6">
          <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-4 justify-items-center">
            {CARDS.map((card, i) => {
              const selected = style === card.label;
              const bg = bgForIndex(i);

              const isRightCol = i % 2 === 1;
              const cornerStyle = isRightCol
                ? {
                    width: "400px",
                    height: "140px",
                    borderTopRightRadius: 40,
                    borderBottomRightRadius: 40,
                  }
                : {
                    width: "400px",
                    height: "140px",
                    borderTopLeftRadius: 40,
                    borderBottomLeftRadius: 40,
                  };

              return (
                <button
                  key={card.key}
                  onClick={() => setStyle(card.label)}
                  className={[
                    "relative overflow-hidden",
                    "shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition transform text-center",
                    selected
                      ? "ring-2 ring-white/70 md:scale-[1.01]"
                      : "hover:md:scale-[1.01]",
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

                  {/* Texto normal, no se invierte */}
                  <div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 text-white text-center"
                    style={{
                      marginLeft: isRightCol ? "35%" : "-35%",
                      marginRight: isRightCol ? "20px" : "-20px",
                    }}
                  >
                    <div className="font-semibold text-[30px] drop-shadow">
                      {card.label}
                    </div>
                    <span
                      className={[
                        "inline-block leading-none",
                        "text-[24px] px-2 py-1 mt-1 rounded-md border",
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

          {error && (
            <div className="mt-2 text-center text-red-300 text-sm">{error}</div>
          )}
        </div>

        {/* FOOTER + SLIDER (solo desktop) */}
        <div
          style={{
            position: "relative",
            zIndex: 20,
            marginTop: "24px",
            marginBottom: "32px",
          }}
        >
          {/* Contenedor centrado y con ancho controlado */}
          <div
            style={{
              position: "relative",
              margin: "0 auto",
              width: "100%",
              maxWidth: "1000px",
              paddingLeft: "16px",
              paddingRight: "16px",
            }}
          >
            {/* Imagen contenedor de textos */}
            <img
              src="/assets/PANTALLA/TEXT/CAJA-DE-TEXTO_FOOTER_PANTALLA.png"
              alt="Beneficios Lenovo VoIP"
              style={{
                display: "block",
                width: "100%",
                height: "500px",
                objectFit: "cover",
                borderRadius: "12px",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />

            {/* Barra deslizante superpuesta en la parte superior de la imagen */}
            <div
              style={{
                position: "absolute",
                top: "10%",
                width: "90%",
                display: "flex",
                justifyContent: "center",
                left: "5%",
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
    </div>
  );
}

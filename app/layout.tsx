// app/layout.tsx (Server Component)
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GOAT MUSIC",
  description: "Genera música con tu GOAT y comparte con QR",
};

const LENOVO_OFFSET_TOP = "50px";               // distancia desde arriba (ej: "0px", "8px", "24px")
const LENOVO_HEIGHT = "clamp(96px, 18vh, 100px)";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-black">
        {/* Capa de video global */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="assets/FONDO_TABLET_MUSIC.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/assets/fondo_poster.jpg" // opcional
          />
          {/* Scrim para legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        </div>

        {/* Logo Lenovo fijo (visible en todas las páginas) */}
        <img
          src="/assets/TABLET/SVG/LOGOS_LENOVO.svg"
          alt="Lenovo"
          className="fixed z-30 drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)] pointer-events-none select-none"
          style={{
            // Pegado TOTAL al borde derecho respetando notch/safe-area
            right: "max(env(safe-area-inset-right), 0px)",
            // Ajusta la altura vertical aquí (sumada al safe-area top)
            top: `calc(max(env(safe-area-inset-top), 0px) + ${LENOVO_OFFSET_TOP})`,
            // Controla el tamaño aquí
            height: LENOVO_HEIGHT,
            // Si tu SVG tiene padding interno y ves 1–2px de “aire”,
            // descomenta la línea de abajo para empujarlo un pelín a la derecha:
            // marginRight: "-2px",
          }}
        />

        {/* Contenido de cada página encima del video */}
        <main className="relative z-10 min-h-screen">{children}</main>
      </body>
    </html>
  );
}

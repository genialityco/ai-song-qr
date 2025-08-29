// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GOAT MUSIC",
  description: "Genera música con tu GOAT y comparte con QR",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-black">
        {/* Fondo de video */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/assets/FONDO_TABLET_MUSIC.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        </div>

        {/* Windows + Intel → SOLO mobile (<1024px) */}
        <img
          src="/assets/TABLET/SVG/LOGOS-WIN+INTEL.png"
          alt="Windows 11 e Intel"
          className="
    fixed z-30 pointer-events-none select-none
    left-1/2 -translate-x-1/2
    top-[max(env(safe-area-inset-top),55px)]
    block lg:hidden
    h-[clamp(10px,11.11vw,50px)] w-auto
    drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)]
  "
        />


        {/* Lenovo → pegado abajo-derecha, SOLO mobile (<1024px) */}
        <img
          src="/assets/TABLET/SVG/LOGOS_LENOVO.svg"
          alt="Lenovo"
          className="
            fixed z-30 pointer-events-none select-none
            right-0 bottom-0
            h-[clamp(56px,10vh,100px)] w-auto
            drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]
            mb-[800px]
          "
        />

        {/* Contenido */}
        <main className="relative z-10 min-h-screen">{children}</main>
      </body>
    </html>
  );
}

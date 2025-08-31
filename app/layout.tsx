// app/layout.tsx (Server Component)
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GOAT MUSIC",
  description: "Genera música con tu GOAT y comparte con QR",
};

// WINDOWS + INTEL (solo mobile/tablet; ocúltalo con lg:hidden en el <img>)
export const WI_POS =
  "fixed z-50 pointer-events-none select-none left-1/2 -translate-x-1/2 top-[max(env(safe-area-inset-top),clamp(16px,7svh,56px))]  "; // centrado horizontalmente, y con safe-area en el top
export const WI_SIZE =
  "h-auto w-[clamp(266px,100vmin,400px)]"; // escala con el lado corto del viewport

export const LENOVO_POS =
  "fixed z-50 pointer-events-none select-none " +
  "right-[max(env(safe-area-inset-right))] " +
  "top-[max(env(safe-area-inset-top),clamp(12px,5vh,28px)+30px)] ";


export const LENOVO_SIZE =
  "w-auto h-[clamp(150px,45vmin,100px)] lg:h-[clamp(30px,20vmin,150px)]";







export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-black">
        <>
          {/* VIDEO MOBILE/TABLET */}
          <video
            className="fixed inset-0 z-0 h-full w-full object-cover pointer-events-none select-none block lg:hidden"
            src="/assets/GOATMUSIC/Layout/FONDO_TABLET.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />

          {/* VIDEO SOLO PC */}
          <video
            className="fixed inset-0 z-0 h-full w-full object-cover pointer-events-none select-none hidden lg:block transform scale-100"
            src="/assets/GOATMUSIC/Layout/FONDO_PANTALLA.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />


          {/* (Opcional) velo para legibilidad */}
          {/* <div className="fixed inset-0 z-[1] pointer-events-none bg-black/20" /> */}

          {/* LOGO LENOVO — visible en todas las pantallas */}
          <img
            src="/assets/GOATMUSIC/Layout/LOGOS_LENOVO.svg"
            alt="Lenovo"
            className={`${LENOVO_POS} ${LENOVO_SIZE}`}
            draggable={false}
          />

          {/* LOGO WINDOWS + INTEL — SOLO mobile/tablet */}
          <img
            src="/assets/GOATMUSIC/Layout/LOGOS_WIN_INTEL.png"
            alt="Windows + Intel"
            className={`${WI_POS} ${WI_SIZE} block lg:hidden`}
            draggable={false}
          />


        </>
        <main className="relative z-10 min-h-screen">{children}</main>
      </body>
    </html>
  );
}

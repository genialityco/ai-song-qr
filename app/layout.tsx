/* eslint-disable @next/next/no-img-element */
// app/layout.tsx (Server Component)
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GOAT MUSIC",
  description: "Genera música con tu GOAT y comparte con QR",
};

// WINDOWS + INTEL (solo mobile/tablet; ocúltalo con lg:hidden en el <img>)
export const WI_POS =
  "fixed z-50 pointer-events-none select-none left-1/2 -translate-x-1/2 top-[max(env(safe-area-inset-top),clamp(16px,7svh,56px))] translate-y-[40px]";

export const LENOVO_POS =
  "fixed z-50 pointer-events-none select-none " +
  "right-[max(env(safe-area-inset-right))] " +
  "top-[max(env(safe-area-inset-top),clamp(12px,5vh,28px)+30px)] ";

export const LENOVO_SIZE =
  "w-auto h-[clamp(150px,45vmin,100px)] lg:h-[clamp(30px,20vmin,150px)]";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

          {/* LOGO WINDOWS + INTEL — SOLO mobile/tablet */}
          <img
            src="/assets/GOATMUSIC/Layout/LOGOS_SUPERIORES.png"
            alt="Windows + Intel"
            className={`${WI_POS} block lg:hidden`}
            style={{ width: "min(700px,65vw)" }}
            draggable={false}
          />
        </>
        <main className="relative z-10 min-h-screen">{children}</main>
      </body>
    </html>
  );
}

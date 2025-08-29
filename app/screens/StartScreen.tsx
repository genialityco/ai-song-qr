/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState } from "react";

type Props = { onNext: (promptFromDesktop?: string) => void };

export default function StartScreen({ onNext }: Props) {
  const [text, setText] = useState("");

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = document.body.style.getPropertyValue("overscroll-behavior");
    document.body.style.overflow = "hidden";
    document.body.style.setProperty("overscroll-behavior", "none");
    return () => {
      document.body.style.overflow = prevOverflow;
      if (prevOverscroll) {
        document.body.style.setProperty("overscroll-behavior", prevOverscroll);
      } else {
        document.body.style.removeProperty("overscroll-behavior");
      }
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = (text ?? "").trim();
    console.log("[StartScreen] submit — input:", value);
    const finalValue = value ? `${value} con lenovo` : "con lenovo";
    console.log("[StartScreen] submit — enviado a onNext:", finalValue);
    onNext(finalValue);
  }

  return (
    <>
      {/* ======== MOBILE / TABLET ======== */}
      <section className="relative block lg:hidden min-h-[100dvh] w-full flex items-center justify-center px-4 py-6">
        {/* Contenedor = tamaño de la imagen */}
        <div className="relative inline-block">
          <img
            src="/assets/TABLET/IMG/MARCO_HOME_PANTALLA.png"
            alt="Marco Home"
            className="block w-[min(92vw,420px)] max-w-[420px] h-auto"
            draggable={false}
          />

          {/* El input flotante NO afecta el flujo del botón */}
          <form
            onSubmit={handleSubmit}
            className="absolute left-1/2 -translate-x-1/2 top-[77%] w-full max-w-[310px]"
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe tu música… con Lenovo"
              className="w-full rounded-xl px-6 py-4 h-12 text-lg text-black bg-white placeholder-gray-600 outline-none ring-2 ring-transparent focus:ring-blue-600 shadow-lg"
            />
          </form>
        </div>

        {/* Botón independiente: ya no se mueve al ajustar top del input */}
        <button
          onClick={() => onNext(text.trim() || undefined)}
          type="submit"
          className="absolute left-1/2 -translate-x-1/2 bottom-[9%]
               w-44 h-14 rounded-full
               bg-[url('/assets/TABLET/IMG/BOTON.png')] bg-cover bg-center bg-no-repeat
               text-[#0b2a6f] text-lg font-semibold tracking-wide uppercase
               drop-shadow-xl transition-transform active:scale-95"
        >
          Play
        </button>

      </section>

      {/* ======== DESKTOP ======== */}
      <section className="hidden lg:grid grid-cols-1 lg:grid-cols-2 min-h-[100dvh]">
        {/* IZQUIERDA: alineado a la derecha */}
        <div className="relative flex items-center justify-end pr-8 lg:pr-16">
          <img
            src="/assets/PANTALLA/IMG/MARCO_INICIO.png"
            alt="Marco de inicio"
            className="w-full h-full max-h-[100dvh] object-contain ml-80"
          />
        </div>

        {/* DERECHA: todo centrado */}
        <div className="relative flex flex-col items-center justify-center gap-6 px-8 lg:px-12 py-10 text-center">
          {/* Logo: subir sin empujar nada */}
          <img
            src="/assets/TABLET/SVG/LOGOS-WIN+INTEL.png"
            alt="Logos Windows + Intel"
            className="hidden md:block relative -top-20 h-[clamp(64px,18vw,80px)] w-auto "
            draggable={false}
          />

          {/* Texto 01: también puedes ajustarlo sin afectar a otros */}
          <img
            src="/assets/PANTALLA/IMG/TEXTO_INICIO.svg"
            alt="Textos 01"
            className="hidden md:block relative w-full max-w-2xl object-contain "
            draggable={false}
          />

          <form onSubmit={handleSubmit} className="w-full max-w-2xl flex flex-col items-center gap-5">
            <label htmlFor="promptDesktop" className="sr-only">Escribe tu música con Lenovo</label>
            <input
              id="promptDesktop"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe tu próxima canción… con Lenovo"
              className="w-full rounded-3xl px-8 py-10 text-2xl lg:text-[28px] text-black bg-white placeholder-gray-600 outline-none ring-2 ring-transparent focus:ring-blue-600 shadow-2xl"
            />
            <button
              onClick={() => onNext(text.trim() || undefined)}
              className="bg-[url('/assets/TABLET/IMG/BOTON.png')] bg-no-repeat bg-center bg-contain transition w-full max-w-[620px] h-[64px] text-[#002060] text-[28px] cursor-pointer flex items-center justify-center font-semibold uppercase rounded-full"
            >
              Play
            </button>
          </form>
        </div>

      </section>
    </>
  );
}
/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";

export default function StartScreen({
  onNext,
}: {
  onNext: (promptFromDesktop?: string) => void;
}) {
  const [desktopPrompt, setDesktopPrompt] = useState("");

  return (
    <div className="w-full min-h-screen relative overflow-hidden">
      {/* Video de fondo */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        src="/assets/fondo_animado.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Lenovo solo en >= md */}
      <img
        src="/assets/TABLET/SVG/LOGOS_LENOVO.svg"
        alt="Lenovo"
        className="hidden md:block absolute right-0 top-10 h-28 z-30"
      />

      {/* MOBILE */}
      <div className="md:hidden relative min-h-screen flex flex-col z-10">
        <div className="absolute top-3 left-0 right-0 z-20 flex justify-center">
          <img
            src="/assets/TABLET/SVG/LOGOS_INTEL+WINDOWS.svg"
            alt="Intel + Windows 11"
            className="h-18"
          />
        </div>

        <div className="flex-1 relative flex items-center justify-center px-4 pt-14 ">
          <img
            src="/assets/TABLET/IMG/MARCO_INICIAL.png"
            alt="Marco GOAT"
            className="max-w-[85vw] max-h-[85vh] object-contain drop-shadow-[0_10px_40px_rgba(0,0,0,0.45)]"
          />

          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
            <p
              className="text-white/95 font-extrabold"
              style={{
                textShadow: "0 2px 8px rgba(0,0,0,.45)",
                marginTop: "250px",
                fontSize: "20px",
                lineHeight: "25px",
              }}
            >
              ¿A qué suena tu GOAT?
            </p>
            <p
              className="text-white/95"
              style={{
                textShadow: "0 2px 8px rgba(0,0,0,.45)",
                marginTop: "20px",
                fontSize: "20px",
                lineHeight: "25px",
              }}
            >
              Descríbelo en una <br /> palabra y luego, ponte
              <br /> los audífonos.
            </p>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-2">
          <div className="flex justify-center">
            <button
              onClick={() => onNext(undefined)}
              className="bg-[#6b95ff] hover:bg-[#5a84ee] transition text-white px-10 py-3 rounded-full shadow-lg"
            >
              Comenzar
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP/TABLET */}
      <div className="hidden md:block min-h-screen relative z-10">
        <div className="grid grid-cols-2 items-stretch min-h-screen gap-10 p-10 lg:p-20">
          <div className="flex items-center justify-center">
            <img
              src="/assets/TABLET/IMG/MARCO_INICIAL.png"
              alt="Marco GOAT"
              className="w-[320px] max-w-[42vw] drop-shadow-[0_12px_48px_rgba(0,0,0,0.45)]"
            />
          </div>

          <div className="text-white grid grid-rows-[auto_1fr_auto]">
            <div className="flex items-start">
              <img
                src="/assets/TABLET/SVG/LOGOS_INTEL+WINDOWS.svg"
                alt="Intel + Windows 11"
                className="h-20 lg:h-24"
              />
            </div>

            <div
              className="flex flex-col justify-center items-center text-center gap-4"
              style={{ lineHeight: "40px" }}
            >
              <h2 className="text-3xl lg:text-[40px] font-extrabold">
                ¿A qué suena tu GOAT?
              </h2>
              <p className="text-xl lg:text-[30px] text-white/95">
                Descríbelo en una palabra y luego, ponte los audífonos.
              </p>

              <div
                className="mt-2 rounded-2xl px-5 py-4 w-full max-w-[620px]
                  bg-gradient-to-b from-[#f5f6f7] to-[#e6e7ea]
                  text-[#222] shadow-[0_14px_36px_rgba(0,0,0,0.25)]
                  border border-white/60"
              >
                <input
                  type="text"
                  value={desktopPrompt}
                  onChange={(e) => setDesktopPrompt(e.target.value)}
                  placeholder="Escribe sobre qué quieres tu canción"
                  className="w-full bg-transparent outline-none text-[18px] placeholder:text-[#808080]"
                  maxLength={90}
                  style={{ fontFamily: "'Segoe UI', sans-serif" }}
                />
                <div className="mt-3 h-[1px] w-full bg-white/50" />
              </div>

              <button
                onClick={() => onNext(desktopPrompt.trim() || undefined)}
                className="bg-[url('/assets/TABLET/IMG/BOTON.png')] bg-no-repeat bg-center bg-contain transition w-full max-w-[620px] h-[64px] text-[#002060]"
                style={{ fontSize: "28px", cursor: "pointer" }}
              >
                Comenzar
              </button>
            </div>

            <div />
          </div>
        </div>
      </div>
    </div>
  );
}

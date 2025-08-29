/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import LogoIW from "../components/LogoIW";
import Waveform from "../components/WaveForm";

function slugify(s: string) {
  return (s || "cancion")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// URL base para el QR (configurable por entorno)
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  (typeof window !== "undefined" ? window.location.origin : "");

/** Waveform dibuja usando un AnalyserNode externo */
export default function PlayerScreen({
  audioUrl,
  title,
  isFinal,
  taskId,
  onRestart,
}: {
  audioUrl: string | null;
  title: string;
  isFinal: boolean;
  taskId?: string | null;
  onRestart: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [, setAnalyserReady] = useState(false);

  // ✅ Nuevos refs para evitar doble conexión del mismo <audio>
  const lastElRef = useRef<HTMLAudioElement | null>(null);
  const graphAttachedRef = useRef(false);

  // ✅ Estado listo si hay audio real
  const ready = !!audioUrl;

  // URL encuesta para el QR
  const urlSurvey = ready
    ? `${BASE_URL}/survey?src=${encodeURIComponent(
      audioUrl!
    )}&filename=${encodeURIComponent(`${slugify(title)}.mp3`)}&final=${isFinal ? "1" : "0"
    }${taskId ? `&taskId=${encodeURIComponent(taskId)}` : ""}`
    : "";

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, []);

  // Cambios de URL (stream -> final): NO recrear el grafo; sólo cambiar src
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const wasPlaying = !el.paused;
    const prevTime = el.currentTime;

    try {
      el.pause();
      el.src = audioUrl ?? "";
      if (audioUrl) el.load();
      if (wasPlaying && audioUrl) {
        try {
          el.currentTime = prevTime;
        } catch { }
        el.play().catch(() => { });
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    } catch { }
    // 👇 Importante: NO desconectar ni nullificar source/analyser aquí
    // porque el mismo <audio> mantiene su MediaElementSourceNode.
  }, [audioUrl]);

  const ensureAudioGraph = async () => {
    const el = audioRef.current;
    if (!el) return;

    try {
      if (!audioCtxRef.current) {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AC();
      }
      if (audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume().catch(() => { });
      }

      // Si cambió el elemento <audio>, reinicia el flag de conexión
      if (lastElRef.current !== el) {
        lastElRef.current = el;
        graphAttachedRef.current = false;
      }

      // Conectar SOLO una vez por cada elemento <audio>
      if (!graphAttachedRef.current) {
        const ctx = audioCtxRef.current!;
        const src = ctx.createMediaElementSource(el);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;

        src.connect(analyser);
        analyser.connect(ctx.destination);

        sourceRef.current = src;
        analyserRef.current = analyser;
        graphAttachedRef.current = true;
        setAnalyserReady(true);
      }
    } catch (e) {
      console.error("ensureAudioGraph error:", e);
    }
  };

  const toggle = async () => {
    const el = audioRef.current;
    if (!el) return;
    try {
      if (el.paused) {
        await ensureAudioGraph();
        await el.play();
        setIsPlaying(true);
      } else {
        el.pause();
        setIsPlaying(false);
      }
    } catch (err) {
      console.error("Error al reproducir:", err);
    }
  };

  useEffect(() => {
    return () => {
      try {
        sourceRef.current?.disconnect();
        analyserRef.current?.disconnect();
        audioCtxRef.current?.close();
      } catch { }
      sourceRef.current = null;
      analyserRef.current = null;
      audioCtxRef.current = null;
      graphAttachedRef.current = false;
      lastElRef.current = null;
    };
  }, []);

  // --- QR config MOBILE ---
  const QR_M_LEFT = "52%";
  const QR_M_TOP = "32%";
  const QR_M_SIZE = 200;

  // --- QR config DESKTOP ---
  const QR_D_LEFT = "50%";
  const QR_D_TOP = "30%";
  const QR_D_SIZE = 200;

  return (
    <div className="w-full min-h-screen relative flex flex-col items-center justify-start text-white overflow-hidden">
      {!ready && (
        <>
          {/* ======== MOBILE (PRE-READY) ======== */}
          <div
            className="relative mx-auto w-[min(84vw,340px)] lg:hidden"
            style={{ transform: "translate(0px, 120px)" }}
          >
            <div className="relative">
              <div className="relative">
                {/* Video con alfa (el navegador elige la mejor fuente) */}
                <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-xl">
                  <video
                    className="block w-full h-auto select-none pointer-events-none"
                    src="/assets/FONDO_PANTALLA_MUSIC_REPRODUCTOR_full.mov"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                  />
                  {/* tus overlays aquí */}
                </div>
              </div>
              <div className="absolute inset-0">
                <div
                  className="
                    absolute z-20 pointer-events-none
                    left-1/2 -translate-x-1/2 top-[65%]
                    w-[min(90%,300px)] h-[clamp(22px,6vh,36px)]
                    overflow-hidden
                  "
                >
                  <Waveform analyser={analyserRef.current} active={ready} />
                </div>
                <button
                  onClick={toggle}
                  className="
                    absolute z-10 rounded-full shadow-lg transition
                    active:scale-95 disabled:opacity-50
                    left-1/2 -translate-x-1/2 top-[78%]
                    w-[56px] h-[56px]
                  "
                  style={{ background: "#6b95ff" }}
                  disabled={!ready}
                  aria-label={isPlaying ? "Pausar" : "Reproducir"}
                >
                  {isPlaying ? (
                    <div className="mx-auto w-4 h-4 flex gap-1">
                      <span className="inline-block w-[6px] h-4 bg-white" />
                      <span className="inline-block w-[6px] h-4 bg-white" />
                    </div>
                  ) : (
                    <div
                      style={{
                        margin: "0 auto",
                        width: 0,
                        height: 0,
                        borderTop: "10px solid transparent",
                        borderBottom: "10px solid transparent",
                        borderLeft: "16px solid white",
                      }}
                    />
                  )}
                </button>
              </div>
            </div>
            <img
              src="/assets/PANTALLA/IMG/CAJA_TEXTO_01.png"
              className="block w-[460px] max-w-none h-auto mt-2 select-none translate-x-[-13%]"
              alt="Caja de texto"
              draggable={false}
            />
          </div>

          {/* ===== DESKTOP (PRE-READY) ===== */}
          <div
            className="hidden lg:flex min-h-screen items-center justify-center relative"
            style={{ transform: "translate(0px, 5px)" }}
          >
            <div className="relative mx-auto w-full max-w-[1500px]">
              <div className="flex items-center justify-center gap-0">
                {/* Izquierda (TELÉFONO) */}
                <div
                  className="relative shrink-0 -mr-6 transform-gpu scale-[1.20] translate-x-[0px] translate-y-[0px]"
                  style={{ transformOrigin: "center" }}
                >
                  <div
                    className="relative"
                    style={{
                      width: "600px",
                      height: "600px",
                      backgroundImage:
                        "url('/assets/TABLET/IMG/MARCO_REPRODUCTOR.png')",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "contain",
                      backgroundPosition: "center",
                    }}
                  >
                    <div
                      className="absolute z-20 pointer-events-none"
                      style={{
                        left: "27%",
                        right: "12%",
                        top: "65%",
                        width: "275px",
                        height: "42px",
                        overflow: "hidden",
                      }}
                    >
                      <Waveform
                        analyser={analyserRef.current}
                        active={ready}
                      />
                    </div>

                    <button
                      onClick={toggle}
                      className="absolute z-10 rounded-full shadow-lg transition active:scale-95 disabled:opacity-50"
                      style={{
                        top: "80%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "62px",
                        height: "62px",
                        background: "#6b95ff",
                      }}
                      disabled={!ready}
                      aria-label={isPlaying ? "Pausar" : "Reproducir"}
                    >
                      {isPlaying ? (
                        <div className="mx-auto w-4 h-4 flex gap-1">
                          <span className="inline-block w-[6px] h-4 bg-white" />
                          <span className="inline-block w-[6px] h-4 bg-white" />
                        </div>
                      ) : (
                        <div
                          style={{
                            margin: "0 auto",
                            width: 0,
                            height: 0,
                            borderTop: "10px solid transparent",
                            borderBottom: "10px solid transparent",
                            borderLeft: "16px solid white",
                          }}
                        />
                      )}
                    </button>
                  </div>
                </div>

                {/* Derecha (TEXTO) */}
                <div
                  className="
                    relative -ml-10 lg:-ml-12 xl:-ml-14 2xl:-ml-16
                    flex flex-col items-start
                    transform-gpu scale-[1.15] translate-x-[20px] -translate-y-[10px]
                  "
                  style={{ transformOrigin: "left center" }}
                >
                  <img
                    src="/assets/PANTALLA/IMG/CAJA_TEXTO_01.png"
                    alt="Caja de texto"
                    className="block w-[min(46vw,620px)] h-auto"
                    draggable={false}
                  />
                  <div className="mt-3 w-[min(46vw,620px)] flex justify-center">
                    <LogoIW height={56} width={260} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ======== READY ======== */}
      {ready && (
        <>
          {/* MOBILE (READY) */}
          <div className="lg:hidden w-full flex justify-center relative translate-y-[155px]">
            <div className="mt-2 w-[min(84vw,340px)] md:w-[min(60vw,560px)] ">
              <div className="relative">
                <img
                  src="/assets/FONDO_REPRODUCTOR_QR.png"
                  alt="Marco reproductor"
                  className="block w-full h-auto select-none pointer-events-none"
                  draggable={false}
                />

                <div className="absolute inset-0">
                  {/* QR */}
                  <div
                    className="absolute z-30 rounded-md bg-white p-1 md:scale-110 origin-center"
                    style={{
                      left: QR_M_LEFT,
                      top: QR_M_TOP,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <QRCodeCanvas
                      value={urlSurvey || BASE_URL}
                      size={QR_M_SIZE}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="L"
                      includeMargin={false}
                    />
                  </div>

                  {/* Waveform */}
                  <div
                    className="
                      absolute z-20 pointer-events-none
                      left-1/2 -translate-x-1/2 -translate-y-1
                      top-[68%]
                      w-[min(78%,300px)] md:w-[min(78%,460px)]
                      h-[clamp(22px,6vh,40px)] md:h-[clamp(26px,7vh,48px)]
                      overflow-hidden
                      [&>canvas]:w-full [&>canvas]:h-full
                    "
                  >
                    <Waveform
                      analyser={analyserRef.current}
                      active={ready}
                    />
                  </div>

                  {/* Controles (02 - 01 - 03) */}
                  <div
                    className="
                      absolute z-30 left-1/2 -translate-x-1/2
                      top-[73%]
                      flex items-center gap-4 md:gap-5
                    "
                  >
                    {/* 02 — Siguiente */}
                    <button
                      type="button"
                      aria-label="Siguiente canción"
                      className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-transparent p-0 cursor-pointer"
                    >
                      <img
                        src="/assets/TABLET/SVG/ICONOS_REPRODUCTOR-03.svg"
                        alt="Siguiente canción"
                        className="w-7 h-7 md:w-8 md:h-8"
                        draggable={false}
                      />
                    </button>

                    {/* 01 — Play/Pause */}
                    <button
                      type="button"
                      onClick={toggle}
                      aria-label={isPlaying ? "Pausar" : "Reproducir"}
                      aria-pressed={isPlaying}
                      className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center bg-transparent p-0 cursor-pointer"
                    >
                      <img
                        src="/assets/TABLET/SVG/ICONOS_REPRODUCTOR-01.svg"
                        alt="Pausar"
                        className="w-10 h-10 md:w-12 md:h-12"
                        draggable={false}
                      />
                    </button>

                    {/* 03 — Reiniciar */}
                    <button
                      type="button"
                      aria-label="Reiniciar canción"
                      className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-transparent p-0 cursor-pointer"
                    >
                      <img
                        src="/assets/TABLET/SVG/ICONOS_REPRODUCTOR-02.svg"
                        alt="Reiniciar canción"
                        className="w-7 h-7 md:w-8 md:h-8"
                        draggable={false}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DESKTOP (READY) */}
          <section className="hidden lg:block w-full">
            <div className="relative mx-auto w-full max-w-[2000px] h-[min(88vh,950px)] grid place-items-center overflow-visible">
              <div className="[--scale:1] xl:[--scale:1.15] 2xl:[--scale:1.1] [--dx:0px] [--dy:40px]">
                <div className="flex items-center justify-center gap-10 transform-gpu origin-center scale-[var(--scale)] translate-x-[var(--dx)] translate-y-[var(--dy)]">
                  {/* Izquierda: Teléfono */}
                  <div
                    className="relative shrink-0 w-[min(40vw,760px)] h-[min(40vw,760px)] translate-x-[30%] "
                    style={{
                      backgroundImage:
                        "url('/assets/FONDO_REPRODUCTOR_QR.png')",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "contain",
                      backgroundPosition: "center",
                    }}
                  >
                    {/* QR */}
                    <div
                      className="absolute z-30 rounded-md bg-white p-1"
                      style={{
                        left: QR_D_LEFT,
                        top: QR_D_TOP,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <QRCodeCanvas
                        value={urlSurvey || BASE_URL}
                        size={QR_D_SIZE}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="L"
                        includeMargin={false}
                      />
                    </div>

                    {/* Waveform */}
                    <div
                      className="absolute z-20 pointer-events-none overflow-hidden"
                      style={{
                        left: "27%",
                        right: "12%",
                        top: "66%",
                        width: "350px",
                        height: "42px",
                      }}
                    >
                      <Waveform
                        analyser={analyserRef.current}
                        active={ready}
                      />
                    </div>

                    {/* Botones */}
                    <div
                      className="absolute z-30 left-1/2 -translate-x-1/2 flex items-center gap-4"
                      style={{ top: "74%" }}
                    >
                      <button
                        type="button"
                        aria-label="Siguiente canción"
                        className="w-16 h-16 flex items-center justify-center bg-transparent p-0 cursor-pointer"
                      >
                        <img
                          src="/assets/TABLET/SVG/ICONOS_REPRODUCTOR-03.svg"
                          alt="Siguiente canción"
                          className="w-8 h-8"
                          draggable={false}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={toggle}
                        aria-label={isPlaying ? "Pausar" : "Reproducir"}
                        aria-pressed={isPlaying}
                        className="w-20 h-20 flex items-center justify-center bg-transparent p-0 cursor-pointer"
                      >
                        <img
                          src="/assets/TABLET/SVG/ICONOS_REPRODUCTOR-01.svg"
                          alt="Pausar"
                          className="w-10 h-10"
                          draggable={false}
                        />
                      </button>

                      <button
                        type="button"
                        aria-label="Reiniciar canción"
                        className="w-16 h-16 flex items-center justify-center bg-transparent p-0 cursor-pointer"
                      >
                        <img
                          src="/assets/TABLET/SVG/ICONOS_REPRODUCTOR-02.svg"
                          alt="Reiniciar canción"
                          className="w-8 h-8"
                          draggable={false}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Derecha: Texto + Logo */}
                  <div className="relative w-[min(48vw,900px)] -translate-x-6">
                    <img
                      src="/assets/PANTALLA/TEXT/TEXTOS-02.svg"
                      alt="Texto"
                      className="block w-full h-auto"
                      draggable={false}
                    />
                    <div className="mt-3 w-full flex justify-center">
                      <LogoIW height={50} width={500} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ✅ Audio oculto para funcionalidad (no afecta diseño) */}
      <audio
        key={taskId || audioUrl || "static"} // opcional: fuerza nuevo <audio> si cambia taskId/audioUrl
        ref={audioRef}
        src={audioUrl ?? undefined}
        className="hidden"
        playsInline
        preload="auto"
        crossOrigin="anonymous"
      />

      {/* Botón volver */}
      <button
        onClick={onRestart}
        title="Volver al inicio"
        aria-label="Volver al inicio"
        className="fixed bottom-5 right-5 z-50 bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm rounded-full p-3 md:p-4 shadow-lg transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="currentColor"
          className="text-white"
        >
          <path
            d="M12 3.172 3 10v10a1 1 0 0 0 1 1h6v-6h4v6h6a1 1 0 0 0 1-1V10l-9-6.828zM21 10l-9-7-9 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M10 21v-6h4v6" />
        </svg>
      </button>
    </div>
  );
}

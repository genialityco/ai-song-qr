/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import Waveform from "../components/WaveForm";

function slugify(s: string) {
  return (s || "cancion")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  (typeof window !== "undefined" ? window.location.origin : "");

export default function PlayerScreen({
  audioUrl,
  title,
  isFinal,
  taskId,
  onRestart,
  phone,
}: {
  audioUrl: string | null;
  title: string;
  isFinal: boolean;
  taskId?: string | null;
  onRestart: () => void;
  phone: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [, setAnalyserReady] = useState(false);

  // ✅ Estado listo si hay audio real
  const ready = !!audioUrl;

  // ⏱️ Intro (solo en !ready)
  const [, setShowIntro] = useState(true);

  // ⏱️ Control de fases cuando ready = true
  //   ready && !showQr  => Fase 1 (texto final + reproductor)
  //   ready && showQr   => Fase 2 (pantalla QR)
  const [showQr, setShowQr] = useState(false);

  const hasSavedRef = useRef(false);

  // URL encuesta para el QR
  const urlSurvey = (() => {
    if (!ready) return "";

    const qs = new URLSearchParams();
    qs.set("src", audioUrl!);
    qs.set("filename", `${slugify(title)}.mp3`);
    qs.set("final", isFinal ? "1" : "0");
    if (taskId) qs.set("taskId", taskId);
    if (phone) qs.set("phone", phone);

    return `${BASE_URL}/survey?${qs.toString()}`;
  })();

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

  // Cambios de URL (stream -> final): mantener reproducción si estaba sonando
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    setAnalyserReady(false);

    const wasPlaying = !el.paused;
    const prevTime = el.currentTime;

    try {
      el.pause();
      el.src = audioUrl ?? "";
      if (audioUrl) el.load();
      if (wasPlaying && audioUrl) {
        try {
          el.currentTime = prevTime;
        } catch {}
        el.play().catch(() => {});
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    } catch {}

    try {
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
    } catch {}
    sourceRef.current = null;
    analyserRef.current = null;
    setAnalyserReady(false);
  }, [audioUrl]);

  // ⏱️ Intro en !ready: muestra ambos textos por 5s
  useEffect(() => {
    if (ready) return;
    setShowIntro(true);
    const t = setTimeout(() => setShowIntro(false), 5000);
    return () => clearTimeout(t);
  }, [ready, audioUrl]);

  useEffect(() => {
    if (!isFinal || !audioUrl || hasSavedRef.current) return;
    if (!phone) return; // solo guardamos si hay teléfono

    (async () => {
      try {
        await fetch("/api/save-media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            project: "goatMusic",
            originalUrl: audioUrl,
          }),
        });
        hasSavedRef.current = true;
      } catch {
        // no bloquear UX
      }
    })();
  }, [isFinal, audioUrl, phone]);

  const ensureAudioGraph = async () => {
    if (!audioRef.current) return;
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AC();
    }
    if (audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume().catch(() => {});
    }
    if (!sourceRef.current || !analyserRef.current) {
      const ctx = audioCtxRef.current;
      const src = ctx!.createMediaElementSource(audioRef.current);
      const analyser = ctx!.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      analyser.connect(ctx!.destination);
      sourceRef.current = src;
      analyserRef.current = analyser;
      setAnalyserReady(true);
    }
  };

  // 🔔 Al entrar en ready: reproducir audio, mostrar Fase 1 y pasar a QR a los 5s
  useEffect(() => {
    if (!ready) {
      setShowQr(false);
      return;
    }

    setShowQr(false); // Fase 1 visible
    let timer: number | undefined;

    (async () => {
      await ensureAudioGraph();
      try {
        await audioRef.current?.play();
        setIsPlaying(true);
      } catch {
        // Autoplay podría fallar por políticas del navegador; ignoramos el error.
      }
      // Pasar a QR a los 5s
      timer = window.setTimeout(() => setShowQr(true), 5000);
    })();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [ready, audioUrl]);

  const toggle = async () => {
    if (!audioRef.current) return;
    try {
      if (audioRef.current.paused) {
        await ensureAudioGraph();
        await audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
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
      } catch {}
      sourceRef.current = null;
      analyserRef.current = null;
      audioCtxRef.current = null;
    };
  }, []);

  return (
    <div className="w-full min-h-screen relative flex flex-col items-center justify-start text-white overflow-hidden">
      {/* ======== PRE-READY (!ready) ======== */}
      {!ready && (
        <>
          <div
            className="hidden md:block min-h-screen relative"
            style={{ transform: "translate(0px, 5px)" }}
          >
            <div className="w-full h-screen grid place-items-center">
              <div className="relative flex flex-col items-center justify-center gap-6 px-4">
                {/* Texto de intro (arriba) */}
                <img
                  src="/assets/TEXTO_REPRODUCTOR.svg"
                  alt="Texto"
                  className="h-auto z-10 transition-opacity duration-700"
                  style={{
                    width: "min(250px,60vw)",
                    position: "absolute",
                    top: "8%",
                  }}
                  draggable={false}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
                {/* Reproductor */}
                <div
                  className="relative"
                  style={{
                    width: "375px",
                    height: "710px",
                    borderRadius: "45px",
                    overflow: "hidden",
                    marginBlock: "20px",
                  }}
                >
                  <video
                    src="/assets/MARCO_REPRODUCTOR_ANIMADO.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    disableRemotePlayback
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      zIndex: 0,
                    }}
                  />

                  {/* Waveform */}
                  <div
                    className="absolute z-20 pointer-events-none"
                    style={{
                      left: "5%",
                      right: "12%",
                      top: "65%",
                      width: "330px",
                      height: "50px",
                      overflow: "hidden",
                    }}
                  >
                    <Waveform analyser={analyserRef.current} active={ready} />
                  </div>

                  {/* Botón play/pause */}
                  <button
                    onClick={toggle}
                    className="absolute z-10 rounded-full shadow-lg transition active:scale-95 disabled:opacity-50"
                    style={{
                      top: "85%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "92px",
                      height: "92px",
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

                {/* Caja de texto de intro (abajo) */}
                <img
                  src="/assets/PANTALLA/TEXT/TEXTOS-02.svg"
                  alt="Caja de texto"
                  className="block transition-opacity duration-700"
                  style={{ width: "min(480px,80vw)", height: "auto" }}
                  draggable={false}
                  loading="eager" // 👈 hint
                  decoding="async" // 👈 hint
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ======== READY — FASE 1 (texto final + reproductor, sin QR) ======== */}
      {ready && !showQr && (
        <>
          <div
            className="hidden md:block min-h-screen relative"
            style={{ transform: "translate(0px, 5px)" }}
          >
            <div className="w-full h-screen grid place-items-center">
              <div className="flex flex-col items-center justify-center gap-6 px-4">
                {/* Reproductor */}
                <div
                  className="relative"
                  style={{
                    width: "375px",
                    height: "710px",
                    borderRadius: "45px",
                    overflow: "hidden",
                    marginBlock: "20px",
                  }}
                >
                  <video
                    src="/assets/MARCO_REPRODUCTOR_ANIMADO.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    disableRemotePlayback
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      zIndex: 0,
                    }}
                  />

                  <div
                    className="absolute z-20 pointer-events-none"
                    style={{
                      left: "5%",
                      right: "12%",
                      top: "65%",
                      width: "330px",
                      height: "50px",
                      overflow: "hidden",
                    }}
                  >
                    <Waveform analyser={analyserRef.current} active={ready} />
                  </div>

                  <button
                    onClick={toggle}
                    className="absolute z-10 rounded-full shadow-lg transition active:scale-95 disabled:opacity-50"
                    style={{
                      top: "85%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "92px",
                      height: "92px",
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

                {/* ✅ Texto final visible en Fase 1 */}
                <img
                  src="/assets/PANTALLA/IMG/CAJA_TEXTO_01.png"
                  alt="Texto"
                  className="block"
                  style={{ width: "min(46vw,620px)", height: "auto" }}
                  draggable={false}
                  loading="eager" // 👈 hint
                  decoding="async" // 👈 hint
                  fetchPriority="high" // 👈 hint
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ======== READY — FASE 2 (pantalla QR) ======== */}
      {ready && showQr && (
        <>
          <div
            className="hidden md:flex min-h-screen items-center justify-center relative"
            style={{ transform: "translate(0px, 5px)" }}
          >
            <div className="relative mx-auto w-full h-screen flex flex-col justify-center items-center gap-8">
              <div
                className="relative"
                style={{
                  width: "380px",
                  height: "710px",
                  borderRadius: "45px",
                  overflow: "hidden",
                  marginBlock: "50px",
                  backgroundImage: 'url("/assets/FONDO_REPRODUCTOR_QR.png")',
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* QR */}
                <div
                  className="absolute z-30 rounded-md bg-white p-1"
                  style={{
                    left: "50%",
                    top: "28%",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <QRCodeCanvas
                    value={urlSurvey || BASE_URL}
                    size={220}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                  />
                </div>

                {/* Waveform */}
                <div
                  className="absolute z-20 pointer-events-none"
                  style={{
                    left: "4%",
                    right: "12%",
                    top: "72%",
                    width: "350px",
                    height: "50px",
                    overflow: "hidden",
                  }}
                >
                  <Waveform analyser={analyserRef.current} active={ready} />
                </div>

                {/* Botones (02 - 01 - 03) */}
                <div
                  className="absolute z-30 left-1/2 -translate-x-1/2 flex items-center gap-4"
                  style={{ top: "84%" }}
                >
                  <button
                    type="button"
                    aria-label="Siguiente canción"
                    className="w-12 h-12 flex items-center justify-center bg-transparent p-0 cursor-pointer"
                  >
                    <img
                      src="/assets/TABLET/SVG/ICONOS_REPRODUCTOR-03.svg"
                      alt="Siguiente canción"
                      className="w-full h-full"
                      draggable={false}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={toggle}
                    aria-label={isPlaying ? "Pausar" : "Reproducir"}
                    aria-pressed={isPlaying}
                    className="w-16 h-16 flex items-center justify-center bg-transparent p-0 cursor-pointer"
                    style={{
                      borderRadius: "50%",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                      background: "#6b95ff",
                    }}
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

                  <button
                    type="button"
                    aria-label="Reiniciar canción"
                    className="w-12 h-12 flex items-center justify-center bg-transparent p-0 cursor-pointer"
                  >
                    <img
                      src="/assets/TABLET/SVG/ICONOS_REPRODUCTOR-02.svg"
                      alt="Reiniciar canción"
                      className="w-full h-full"
                      draggable={false}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ✅ Audio oculto para funcionalidad */}
      <audio
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

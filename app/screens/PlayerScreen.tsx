/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
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

/**
 * Dimensiones del phone mockup — fluid en cualquier pantalla.
 * width = min(375px, 85vw, calc(80svh × 375/710))
 * Esto garantiza que el marco nunca exceda el 80% de la altura visible.
 */
const PHONE_STYLE: React.CSSProperties = {
  width: "min(375px, 85vw, calc(80svh * 0.528))",
  aspectRatio: "375 / 710",
  height: "auto",
  borderRadius: "min(45px, 12vw)",
  overflow: "hidden",
  position: "relative",
  flexShrink: 0,
};

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
  const graphBuiltRef = useRef(false);
  const [, setAnalyserReady] = useState(false);

  const ready = !!audioUrl;
  const [, setShowIntro] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const hasSavedRef = useRef(false);

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

  // Cambios de URL (stream → final): cambia src sin destruir el grafo
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
        try { el.currentTime = prevTime; } catch { }
        el.play().catch(() => { });
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    } catch { }
  }, [audioUrl]);

  // Intro en !ready: muestra el estado por 5s
  useEffect(() => {
    if (ready) return;
    setShowIntro(true);
    const t = setTimeout(() => setShowIntro(false), 5000);
    return () => clearTimeout(t);
  }, [ready, audioUrl]);

  useEffect(() => {
    if (!isFinal || !audioUrl || hasSavedRef.current) return;
    if (!phone) return;

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
    const el = audioRef.current;
    if (!el) return;

    if (!audioCtxRef.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AC();
    }
    const ctx = audioCtxRef.current;

    if (ctx.state === "suspended") {
      try { await ctx.resume(); } catch { }
    }

    if (!sourceRef.current) {
      sourceRef.current = ctx.createMediaElementSource(el);
    }
    if (!analyserRef.current) {
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;
    }

    if (!graphBuiltRef.current) {
      sourceRef.current.connect(analyserRef.current!);
      analyserRef.current!.connect(ctx.destination);
      graphBuiltRef.current = true;
      setAnalyserReady(true);
    }
  };

  // Al entrar en ready: reproducir audio, mostrar reproductor, pasar a QR a los 5s
  useEffect(() => {
    if (!ready) {
      setShowQr(false);
      return;
    }

    setShowQr(false);
    let timer: number | undefined;

    (async () => {
      await ensureAudioGraph();
      try {
        await audioRef.current?.play();
        setIsPlaying(true);
      } catch {
        // Autoplay puede fallar por políticas del navegador
      }
      timer = window.setTimeout(() => setShowQr(true), 5000);
    })();

    return () => { if (timer) clearTimeout(timer); };
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

  // Limpieza al desmontar
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
      graphBuiltRef.current = false;
    };
  }, []);

  /* ---------- Play / Pause icon ---------- */
  const PlayPauseIcon = ({ size = 92 }: { size?: number }) => (
    <button
      onClick={toggle}
      className="absolute z-10 rounded-full shadow-lg transition active:scale-95 disabled:opacity-50"
      style={{
        top: "85%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: size,
        height: size,
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
        <div style={{ margin: "0 auto", width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderLeft: "16px solid white" }} />
      )}
    </button>
  );

  /* ---------- Waveform overlay ---------- */
  const WaveformOverlay = () => (
    <div
      className="absolute z-20 pointer-events-none"
      style={{ left: "5%", top: "65%", width: "88%", height: "50px", overflow: "hidden" }}
    >
      <Waveform analyser={analyserRef.current} active={ready} />
    </div>
  );

  /* ---------- Video de fondo del marco ---------- */
  const FrameVideo = () => (
    <video
      src="/assets/MARCO_REPRODUCTOR_ANIMADO.mp4"
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      disableRemotePlayback
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
    />
  );

  return (
    <div className="w-full min-h-[100svh] relative flex flex-col items-center justify-center text-white overflow-hidden">

      {/* ======== PRE-READY (!ready) ======== */}
      {!ready && (
        <div className="flex flex-col items-center justify-center gap-4 px-4 py-6">
          <img
            src="/assets/TEXTO_REPRODUCTOR.svg"
            alt="Texto"
            className="h-auto z-10"
            style={{ width: "clamp(160px, 40vw, 250px)", marginBottom: "8px" }}
            draggable={false}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />

          <div style={PHONE_STYLE}>
            <FrameVideo />
            <WaveformOverlay />
            <PlayPauseIcon />
          </div>

          <img
            src="/assets/PANTALLA/TEXT/TEXTOS-02.svg"
            alt="Caja de texto"
            className="block"
            style={{ width: "clamp(260px, 80vw, 480px)", height: "auto" }}
            draggable={false}
            loading="eager"
            decoding="async"
          />
        </div>
      )}

      {/* ======== READY — FASE 1 (reproductor, sin QR) ======== */}
      {ready && !showQr && (
        <div className="flex flex-col items-center justify-center gap-4 px-4 py-6">
          <div style={PHONE_STYLE}>
            <FrameVideo />
            <WaveformOverlay />
            <PlayPauseIcon />
          </div>

          <img
            src="/assets/PANTALLA/IMG/CAJA_TEXTO_01.png"
            alt="Texto"
            className="block"
            style={{ width: "clamp(260px, 80vw, 620px)", height: "auto" }}
            draggable={false}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>
      )}

      {/* ======== READY — FASE 2 (pantalla QR) ======== */}
      {ready && showQr && (
        <div className="flex items-center justify-center px-4 py-6">
          <div
            style={{
              ...PHONE_STYLE,
              backgroundImage: 'url("/assets/FONDO_REPRODUCTOR_QR.png")',
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* QR centrado en la parte superior del frame */}
            <div
              className="absolute z-30 rounded-md bg-white"
              style={{
                left: "50%",
                top: "28%",
                transform: "translate(-50%, -50%)",
                width: "64%",
                padding: "clamp(2px, 1%, 6px)",
              }}
            >
              <QRCodeSVG
                value={urlSurvey || BASE_URL}
                size={250}
                bgColor="#ffffff"
                fgColor="#000000"
                level="L"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>

            {/* Waveform */}
            <div
              className="absolute z-20 pointer-events-none"
              style={{ left: "4%", top: "72%", width: "88%", height: "50px", overflow: "hidden" }}
            >
              <Waveform analyser={analyserRef.current} active={ready} />
            </div>

            {/* Controles de reproducción */}
            <div
              className="absolute z-30 left-1/2 -translate-x-1/2 flex items-center gap-4"
              style={{ top: "84%" }}
            >
              <button
                type="button"
                aria-label="Siguiente canción"
                className="flex items-center justify-center bg-transparent p-0 cursor-pointer"
                style={{ width: "clamp(32px, 8vw, 48px)", height: "clamp(32px, 8vw, 48px)" }}
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
                className="flex items-center justify-center bg-transparent p-0 cursor-pointer"
                style={{
                  width: "clamp(48px, 12vw, 64px)",
                  height: "clamp(48px, 12vw, 64px)",
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
                  <div style={{ margin: "0 auto", width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderLeft: "16px solid white" }} />
                )}
              </button>

              <button
                type="button"
                aria-label="Reiniciar canción"
                className="flex items-center justify-center bg-transparent p-0 cursor-pointer"
                style={{ width: "clamp(32px, 8vw, 48px)", height: "clamp(32px, 8vw, 48px)" }}
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
      )}

      {/* Audio oculto */}
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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor" className="text-white">
          <path d="M12 3.172 3 10v10a1 1 0 0 0 1 1h6v-6h4v6h6a1 1 0 0 0 1-1V10l-9-6.828zM21 10l-9-7-9 7" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10 21v-6h4v6" />
        </svg>
      </button>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

function slugify(s: string) {
  return (s || "cancion")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/** Waveform dibuja usando un AnalyserNode externo */
function Waveform({
  analyser,
  active,
}: {
  analyser: AnalyserNode | null;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cctx = canvas.getContext("2d");
    if (!cctx) return;

    let cleanup: (() => void) | null = null;

    if (active && analyser) {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const draw = () => {
        const w = canvas.width,
          h = canvas.height;
        cctx.clearRect(0, 0, w, h);
        analyser.getByteFrequencyData(dataArray);
        const bars = 48,
          step = Math.max(1, Math.floor(bufferLength / bars)),
          barWidth = w / bars;
        for (let i = 0; i < bars; i++) {
          const v = dataArray[i * step] / 255;
          const barHeight = Math.max(2, v * (h - 4));
          const x = i * barWidth,
            y = (h - barHeight) / 2;
          cctx.globalAlpha = 0.9;
          cctx.fillStyle = "#ffffff";
          cctx.fillRect(x + 1, y, barWidth - 2, barHeight);
        }
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();
      cleanup = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    } else {
      let t = 0;
      const drawPlaceholder = () => {
        const w = canvas.width,
          h = canvas.height;
        cctx.clearRect(0, 0, w, h);
        const bars = 32,
          barWidth = w / bars;
        for (let i = 0; i < bars; i++) {
          const v = (Math.sin(t + i * 0.4) + 1) / 2;
          const barHeight = 4 + v * (h - 8);
          const x = i * barWidth,
            y = (h - barHeight) / 2;
          cctx.globalAlpha = 0.6;
          cctx.fillStyle = "#ffffff";
          cctx.fillRect(x + 1, y, barWidth - 2, barHeight);
        }
        t += 0.08;
        rafRef.current = requestAnimationFrame(drawPlaceholder);
      };
      drawPlaceholder();
      cleanup = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }
    return () => cleanup?.();
  }, [active, analyser]);

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const cctx = canvas.getContext("2d");
      cctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

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

  const ready = !!audioUrl;

  // URL encuesta con taskId y flag final
  const urlSurvey = ready
    ? `${window.location.origin}/survey?src=${encodeURIComponent(
        audioUrl!
      )}&filename=${encodeURIComponent(`${slugify(title)}.mp3`)}&final=${
        isFinal ? "1" : "0"
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

  // Cambios de URL (stream -> final): intentar mantener reproducción
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
    <div className="w-full min-h-screen relative flex flex-col items-center justify-center text-white overflow-hidden">
      <video
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
        src="/assets/fondo_animado.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/assets/FONDO_PANTALLA.png"
      />
      <div className="absolute inset-0 bg-black/20 z-0 pointer-events-none" />
      <img
        src="/assets/TABLET/SVG/LOGOS_LENOVO.svg"
        alt="Lenovo"
        className="hidden md:block absolute right-0 top-10 h-28 z-30"
      />

      <div className="absolute top-6 w-full flex justify-center z-20">
        <img
          src="/assets/TABLET/SVG/LOGOS_INTEL+WINDOWS.svg"
          alt="Intel + Windows 11"
          className="h-12 md:h-18"
        />
      </div>

      <div className="relative w-[90%] max-w-sm aspect-[9/16] mt-6 z-10">
        <img
          src="/assets/TABLET/IMG/REPRODUCTOR.png"
          alt="Reproductor"
          className="absolute inset-0 w-full h-full object-contain"
        />

        {!ready && (
          <div
            className="absolute text-center font-semibold leading-snug px-4"
            style={{ top: "17%", left: "8%", right: "8%", fontSize: "18px" }}
          >
            <p>
              ¡Tu GOAT está listo <br /> para hacer historia!
            </p>
          </div>
        )}

        {ready && (
          <div
            className="absolute flex items-center gap-2 text-center"
            style={{ top: "13%", left: "50%", transform: "translateX(-50%)" }}
          >
            <QRCodeCanvas value={urlSurvey} size={80} marginSize={1} />
            <div className="text-[11px] opacity-85">
              Escanea el código y llévate un recuerdo de tu experiencia
            </div>
          </div>
        )}

        <div
          className="absolute"
          style={{
            left: "12%",
            right: "12%",
            top: "56%",
            height: "42px",
            width: "263px",
            marginLeft: "15px",
          }}
        >
          <Waveform analyser={analyserRef.current} active={ready} />
        </div>

        <button
          onClick={toggle}
          className="absolute rounded-full shadow-lg transition active:scale-95 disabled:opacity-50"
          style={{
            top: "68%",
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

        <div
          className="absolute text-center md:text-sm leading-snug px-4"
          style={{
            left: "6%",
            right: "6%",
            bottom: "15%",
            fontSize: "16px",
            lineHeight: "20px",
          }}
        >
          <p>
            Creado con el poder de <br />{" "}
            <span className="font-bold">Lenovo y Copilot+PC,</span> <br />
            junto a la sincronización
            <br />
            <span className="font-bold">Smart Connect</span>.
          </p>
        </div>

        <audio
          ref={audioRef}
          src={audioUrl ?? undefined}
          className="hidden"
          playsInline
          preload="auto"
          crossOrigin="anonymous"
        />
      </div>

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

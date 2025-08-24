/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";

/** Waveform con placeholder cuando no hay analyser */
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
        const w = canvas.width;
        const h = canvas.height;
        cctx.clearRect(0, 0, w, h);
        analyser.getByteFrequencyData(dataArray);

        const bars = 48;
        const step = Math.max(1, Math.floor(bufferLength / bars));
        const barWidth = w / bars;

        for (let i = 0; i < bars; i++) {
          const v = dataArray[i * step] / 255;
          const barHeight = Math.max(2, v * (h - 4));
          const x = i * barWidth;
          const y = (h - barHeight) / 2;
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
      // Placeholder animado
      let t = 0;
      const drawPlaceholder = () => {
        const w = canvas.width;
        const h = canvas.height;
        cctx.clearRect(0, 0, w, h);
        const bars = 32;
        const barWidth = w / bars;
        for (let i = 0; i < bars; i++) {
          const v = (Math.sin(t + i * 0.4) + 1) / 2;
          const barHeight = 4 + v * (h - 8);
          const x = i * barWidth;
          const y = (h - barHeight) / 2;
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

  // HiDPI
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

type PlayState =
  | "idle"
  | "loading"
  | "playing"
  | "blocked"
  | "waiting"
  | "ended"
  | "error";

export default function LoadingScreen({
  status,
  streamUrl,
  onCancel,
  onAutoProceed,
  autoProceedMs = 20000,
}: {
  status: string;
  streamUrl: string | null;
  onCancel: () => void;
  onAutoProceed?: () => void;
  autoProceedMs?: number;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [playState, setPlayState] = useState<PlayState>("idle");
  const [audioReady, setAudioReady] = useState(false);
  const hasStream =
    typeof streamUrl === "string" && streamUrl.trim().length > 0;

  // Autopasar a player tras ~20s
  useEffect(() => {
    if (!onAutoProceed) return;
    const t = setTimeout(() => onAutoProceed(), autoProceedMs);
    return () => clearTimeout(t);
  }, [onAutoProceed, autoProceedMs]);

  useEffect(() => {
    if (!hasStream || !audioRef.current) return;
    const el = audioRef.current;

    const onCanPlay = () =>
      setPlayState((s) => (s === "blocked" ? "blocked" : "loading"));
    const onPlaying = () => {
      setPlayState("playing");
      setAudioReady(true);
    };
    const onWaiting = () => setPlayState("waiting");
    const onStalled = () => setPlayState("waiting");
    const onEnded = () => setPlayState("ended");
    const onError = () => setPlayState("error");

    el.addEventListener("canplay", onCanPlay);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("stalled", onStalled);
    el.addEventListener("ended", onEnded);
    el.addEventListener("error", onError);

    el.load();
    el.play()
      .then(() => {
        setPlayState("playing");
        setAudioReady(true);
        ensureAudioGraph();
      })
      .catch(() => setPlayState("blocked"));

    return () => {
      el.removeEventListener("canplay", onCanPlay);
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("stalled", onStalled);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("error", onError);
    };
  }, [hasStream]);

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
      if (!sourceRef.current || !analyserRef.current) {
        const ctx = audioCtxRef.current!;
        const src = ctx.createMediaElementSource(el);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        src.connect(analyser);
        analyser.connect(ctx.destination);
        sourceRef.current = src;
        analyserRef.current = analyser;
      }
    } catch {
      analyserRef.current = null;
    }
  };

  const handleActivate = async () => {
    try {
      await ensureAudioGraph();
      await audioRef.current?.play();
      setPlayState("playing");
      setAudioReady(true);
    } catch {
      setPlayState("error");
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
    };
  }, []);

  const pill = (() => {
    switch (playState) {
      case "playing":
        return "Reproduciendo…";
      case "loading":
        return "Cargando audio…";
      case "waiting":
        return "Generando y reproduciendo...";
      case "blocked":
        return "Autoplay bloqueado";
      case "ended":
        return "Finalizado";
      case "error":
        return "Error de reproducción";
      default:
        return "Listo";
    }
  })();

  return (
    <div className="w-full h-[100svh] relative text-white flex flex-col overflow-hidden">
      {/* Header (ligeramente más compacto) */}
      <header className="pt-3 md:pt-8 relative z-10">
        <div className="flex justify-center">
          <img
            src="/assets/TABLET/SVG/LOGOS-WIN+INTEL.png"
            alt="Intel + Windows 11"
            className="h-10 md:h-16 select-none pointer-events-none"
          />
        </div>
      </header>

      {/* Desplazamos TODO el contenido principal hacia arriba en mobile */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 relative z-10 overflow-hidden -mt-8 md:mt-0">
        {/* BLOQUE LOADER + TEXTO */}
        <div className="mt-2 md:mt-4 mb-2 md:mb-4 flex flex-col items-center w-full">
          {/* Spinner más grande en mobile */}
          <svg
            className="w-28 h-28 md:w-32 md:h-32"
            viewBox="0 0 100 100"
            fill="none"
            aria-label="Cargando"
            role="img"
          >
            <circle
              cx="50"
              cy="50"
              r="38"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="10"
            />
            <path
              d="M88 50a38 38 0 0 1-38 38"
              stroke="white"
              strokeLinecap="round"
              strokeWidth="10"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 50 50"
                to="360 50 50"
                dur="1.2s"
                repeatCount="indefinite"
              />
            </path>
          </svg>

          {/* Píldora "Cargando música…" */}
          <div className="mt-3 w-full max-w-[22rem] md:max-w-md rounded-2xl bg-black/90 border border-white/20 px-5 py-3 text-center shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
            <span className="text-sm md:text-base font-semibold tracking-wide">
              Cargando música…
            </span>
          </div>

          {/* Imagen inferior con límites para evitar scroll en mobile */}
          <div className="mt-3 w-full flex items-center justify-center">
            {/* Móvil / tablets pequeñas */}
            <img
              src="/assets/PANTALLA/IMG/CAJA_TEXTO_PANTALLA.png"
              alt="Caja de texto"
              className="block md:hidden w-full max-w-[22rem] max-h-44 object-contain"
            />
            {/* Web / desktop */}
            <img
              src="/assets/PANTALLA/IMG/CUADRO-TEXTOS.png"
              alt="Cuadro de textos"
              className="hidden md:block w-full max-w-2xl"
            />
          </div>
        </div>

        {/* TARJETA INFORMATIVA (streaming) */}
        {hasStream && (
          <div className="w-full max-w-[22rem] md:max-w-3xl mt-4 md:mt-6">
            <div className="relative h-14 md:h-16 w-full rounded-xl bg-white/10 border border-white/20 overflow-hidden">
              <div className="absolute inset-0 px-3 md:px-4 flex items-center gap-3 md:gap-4">
                {playState === "blocked" ? (
                  <button
                    onClick={handleActivate}
                    className="px-3 py-1 rounded bg-white/15 hover:bg-white/25 text-xs md:text-sm"
                    title="Activar audio"
                  >
                    Activar audio ▶
                  </button>
                ) : (
                  <span className="text-[11px] md:text-xs opacity-80 truncate">{pill}</span>
                )}
                <div className="flex-1 h-7 md:h-8">
                  <Waveform
                    analyser={analyserRef.current}
                    active={audioReady && !!analyserRef.current}
                  />
                </div>
              </div>
            </div>

            <audio
              ref={audioRef}
              className="hidden"
              src={streamUrl ?? undefined}
              playsInline
              preload="auto"
              crossOrigin="anonymous"
            />

            <div className="text-[11px] md:text-xs opacity-70 mt-2 text-center md:text-left">
              Escuchando en streaming mientras se genera…
            </div>
          </div>
        )}

        {/* Botón Cancelar comentado */}
        {/*
      <div className="mt-8 pb-8">
        <button
          onClick={onCancel}
          className="px-6 py-2 rounded bg-white/10 hover:bg-white/20 transition"
        >
          Cancelar
        </button>
      </div>
      */}
      </main>
    </div>
  );


};
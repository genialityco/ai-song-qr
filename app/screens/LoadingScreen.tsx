/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";

/** ======================= MobileAutoCarousel ======================= */
/** Carrusel con crossfade + zoom + slide, pensado para portrait */
function MobileAutoCarousel({
  intervalMs = 6000,
  images = [
    "/assets/GOATMUSIC/LoadingScreen/CAJA_TEXTO_CARGA_02.png",
    "/assets/GOATMUSIC/LoadingScreen/CAJA_TEXTO_CARGA_01.png",
  ],
}: {
  intervalMs?: number;
  images?: string[];
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIdx((i) => (i + 1) % images.length),
      intervalMs
    );
    return () => clearInterval(id);
  }, [intervalMs, images.length]);

  return (
    <div
      className={[
        "block lg:hidden relative overflow-hidden rounded-xl",
        "w-[min(92vw,34rem)]",
        "h-[clamp(220px,28vh,360px)]",
      ].join(" ")}
      style={{ marginTop: "50px"}}
    >
      {images.map((src, i) => {
        const active = idx === i;
        return (
          <img
            key={i}
            src={src}
            alt={`Carga ${i + 1}`}
            draggable={false}
            loading="eager"
            className={[
              "absolute inset-0 w-full h-full object-contain",
              "transition-[opacity,transform] duration-800 ease-out will-change-transform",
              active
                ? "opacity-100 scale-[1.0] translate-y-0"
                : "opacity-0 scale-[1.03] translate-y-[6px]",
            ].join(" ")}
            style={{ boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
          />
        );
      })}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
    </div>
  );
}

/** =========================== LoadingScreen =========================== */
type PlayState =
  | "idle"
  | "loading"
  | "playing"
  | "blocked"
  | "waiting"
  | "ended"
  | "error";

export default function LoadingScreen({
  streamUrl,
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

  const [, setPlayState] = useState<PlayState>("idle");
  const [, setAudioReady] = useState(false);
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
        await audioCtxRef.current.resume().catch(() => {});
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
    <div className="w-full h-[100svh] relative text-white flex flex-col overflow-hidden">
      {/* Header desktop opcional */}
      <header className="hidden lg:block lg:pt-6 relative z-10">
        <div className="flex justify-center">
          <img
            src="/assets/TABLET/SVG/LOGOS-WIN+INTEL.png"
            alt="Intel + Windows 11"
            className="h-16 xl:h-20 select-none pointer-events-none"
            draggable={false}
          />
        </div>
      </header>

      {/* Contenido principal centrado y compacto para portrait */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 relative z-10 overflow-hidden -mt-4 md:mt-0">
        {/* Loader + texto */}
        <div className="mt-2 md:mt-4 mb-2 md:mb-4 flex flex-col items-center w-full">
          {/* Spinner */}
          <svg
            viewBox="0 0 100 100"
            fill="none"
            aria-label="Cargando"
            role="img"
            style={{ width: "clamp(80px, 15vmin, 140px)", height: "clamp(80px, 15vmin, 140px)" }}
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

          {/* Píldora de estado */}
          <div className="mt-3 w-full max-w-[min(22rem,90vw)] rounded-2xl bg-black/90 border border-white/20 px-5 py-3 text-center shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
            <span className="font-semibold tracking-wide" style={{ fontSize: "clamp(16px, 4vmin, 30px)" }}>
              Generando música…
            </span>
          </div>

          {/* Imagen/carrusel */}
          <div className="mt-3 w-full flex items-center justify-center">
            <MobileAutoCarousel />
            <img
              src="/assets/PANTALLA/IMG/CUADRO-TEXTOS.png"
              alt="Cuadro de textos"
              className="hidden lg:block w-full max-w-[44rem]"
              draggable={false}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

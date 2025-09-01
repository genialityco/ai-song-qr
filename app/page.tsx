/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import Head from "next/head";                   // 👈 para <link rel="preload">
import StartScreen from "./screens/StartScreen";
import GenreSelectionScreen from "./screens/GenreSelectionScreen";
import LoadingScreen from "./screens/LoadingScreen";
import PlayerScreen from "./screens/PlayerScreen";

type Step = "start" | "genre" | "loading" | "player" | "survey";

/* ================== PRELOAD HELPERS (sin audio) ================== */
function preloadImage(src: string) {
  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

function preloadVideo(src: string) {
  return new Promise<void>((resolve) => {
    const v = document.createElement("video");
    v.preload = "auto";
    v.muted = true;
    v.playsInline = true;
    v.src = src;

    const done = () => {
      cleanup();
      resolve();
    };
    const onReady = () => done();
    const onError = () => done();

    const cleanup = () => {
      v.removeEventListener("canplaythrough", onReady);
      v.removeEventListener("error", onError);
    };

    v.addEventListener("canplaythrough", onReady, { once: true });
    v.addEventListener("error", onError, { once: true });
    v.load();
  });
}

// Ajusta aquí la lista de assets visuales que usa PlayerScreen
const PLAYER_IMAGES = [
  "/assets/TEXTO_REPRODUCTOR.svg",
  "/assets/PANTALLA/TEXT/TEXTOS-02.svg",
  "/assets/PANTALLA/IMG/CAJA_TEXTO_01.png",
  "/assets/FONDO_REPRODUCTOR_QR.png",
  // Si quieres también los íconos:
  "/assets/TABLET/SVG/ICONOS_REPRODUCTOR-01.svg",
  "/assets/TABLET/SVG/ICONOS_REPRODUCTOR-02.svg",
  "/assets/TABLET/SVG/ICONOS_REPRODUCTOR-03.svg",
];

const PLAYER_VIDEO = "/assets/MARCO_REPRODUCTOR_ANIMADO.mp4";

async function preloadPlayerVisualsOnly() {
  await Promise.allSettled([
    preloadVideo(PLAYER_VIDEO),
    ...PLAYER_IMAGES.map(preloadImage),
  ]);
}
/* ================================================================ */

export default function Page() {
  const [step, setStep] = useState<Step>("start");

  // Datos del flujo
  const [themePrompt, setThemePrompt] = useState<string>("");
  const [style, setStyle] = useState<string>("");

  // Generación
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("—");
  const [finalAudioUrl, setFinalAudioUrl] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("Bajo la Luna");
  const [error, setError] = useState<string | null>(null);
  const pollTimer = useRef<NodeJS.Timeout | null>(null);

  const handleStartNext = (promptFromDesktop?: string) => {
    if (promptFromDesktop && promptFromDesktop.trim()) {
      setThemePrompt(promptFromDesktop.trim());
    }
    setStep("genre");
  };

  const startPolling = (id: string) => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    setTaskId(id);
    setStatus("PENDING");
    setStreamUrl(null);
    setFinalAudioUrl(null);

    // 🔥 apenas empieza el polling, vamos calentando visuals en background
    void preloadPlayerVisualsOnly();

    pollTimer.current = setInterval(async () => {
      try {
        const r = await fetch(
          `/api/get-task?taskId=${encodeURIComponent(id)}`,
          { cache: "no-store" }
        );
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "Error en polling");

        setStatus(data.status || "—");

        const s = data?.track?.streamAudioUrl || null;
        if (s && !finalAudioUrl) {
          setStreamUrl((prev) => prev || s);
          // 👇 NO precargamos audio (solo visuals), ya se disparó arriba
        }

        if (data.status === "SUCCESS" && data.track?.audioUrl) {
          setFinalAudioUrl(data.track.audioUrl);
          clearInterval(pollTimer.current!);
          if (step !== "player") {
            await goToPlayer(); // 👈 espera precarga de visuals antes de montar
          }
        }
      } catch {
        // ignorar fallos transitorios
      }
    }, 2000);
  };

  const handleSubmitGeneration = async () => {
    setError(null);
    setTitle("Mi Canción");
    setFinalAudioUrl(null);
    setStreamUrl(null);

    try {
      setStep("loading");
      // Mientras tanto, precarga visuals en segundo plano:
      void preloadPlayerVisualsOnly();

      const resp = await fetch("/api/generate-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "autoLyrics",
          style,
          title: "",
          themePrompt: themePrompt || undefined,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Falló la generación");

      setTaskId(data.taskId);
      startPolling(data.taskId);
    } catch (e: any) {
      setError(e?.message ?? "Error");
      setStep("genre");
    }
  };

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  const effectiveAudioUrl = finalAudioUrl ?? streamUrl;
  const isFinal = !!finalAudioUrl;

  console.log("final audio", { finalAudioUrl });

  // 👇 Espera explícita antes de entrar al Player
  const goToPlayer = async () => {
    try {
      await preloadPlayerVisualsOnly();
    } finally {
      setStep("player");
    }
  };

  return (
    <>
      {/* Opcional: Preload por <link> para empujar al navegador */}
      <Head>
        <link rel="preload" as="video" href={PLAYER_VIDEO} />
        {PLAYER_IMAGES.map((src) => (
          <link key={src} rel="preload" as="image" href={src} />
        ))}
      </Head>

      {step === "start" && <StartScreen onNext={handleStartNext} />}

      {step === "genre" && (
        <GenreSelectionScreen
          style={style}
          setStyle={setStyle}
          error={error}
          onBack={() => setStep("start")}
          onNext={handleSubmitGeneration}
        />
      )}

      {step === "loading" && (
        <LoadingScreen
          status={status}
          streamUrl={streamUrl}
          onCancel={() => setStep("genre")}
          onAutoProceed={() => { void goToPlayer(); }} // ⬅️ espera visuals
          autoProceedMs={20000}
        />
      )}

      {step === "player" && (
        <PlayerScreen
          audioUrl={effectiveAudioUrl}
          title={title}
          isFinal={isFinal}
          taskId={taskId}
          onRestart={() => {
            setThemePrompt("");
            setStyle("Reggaeton");
            setTaskId(null);
            setStatus("—");
            setStreamUrl(null);
            setFinalAudioUrl(null);
            setError(null);
            setStep("start");
          }}
        />
      )}
    </>
  );
}

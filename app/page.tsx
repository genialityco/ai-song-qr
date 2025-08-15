/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import StartScreen from "./screens/StartScreen";
import GenreSelectionScreen from "./screens/GenreSelectionScreen";
import LoadingScreen from "./screens/LoadingScreen";
import PlayerScreen from "./screens/PlayerScreen";

type Step = "start" | "genre" | "loading" | "player" | "survey";

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
        if (s && !finalAudioUrl) setStreamUrl((prev) => prev || s);

        if (data.status === "SUCCESS" && data.track?.audioUrl) {
          setFinalAudioUrl(data.track.audioUrl);
          clearInterval(pollTimer.current!);
          if (step !== "player") setStep("player");
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

  return (
    <>
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
          onAutoProceed={() => setStep("player")} // pasa a player tras ~20s
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

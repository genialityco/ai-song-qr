/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import StartScreen from "./screens/StartScreen";
import GenreSelectionScreen from "./screens/GenreSelectionScreen";
import LoadingScreen from "./screens/LoadingScreen";
import PlayerScreen from "./screens/PlayerScreen";


type Step = "start" | "genre" | "loading" | "player" | "survey";

/*
const audioUrl = "https://apiboxfiles.erweima.ai/ZWRkOTQ3YjItMGFhZi00NDhmLTg2NjgtMDAzYTg3Y2Q4Mzlj.mp3";
const title = "Bajo la Luna";

  const [step, setStep] = useState<Step>("player");
  const [finalAudioUrl] = useState<string>(
    "https://apiboxfiles.erweima.ai/ZWRkOTQ3YjItMGFhZi00NDhmLTg2NjgtMDAzYTg3Y2Q4Mzlj.mp3"
  );
  const [title] = useState<string>("Bajo la Luna");
*/
export default function Page() {
  const [step, setStep] = useState<Step>("start");

  // Datos del flujo
  const [themePrompt, setThemePrompt] = useState<string>(""); // solo lo piden en desktop/tablet
  const [style, setStyle] = useState<string>("");

  // Generación
  const [, setTaskId] = useState<string | null>(null);
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
    setStatus("PENDING");
    setStreamUrl(null);
    setFinalAudioUrl(null);

    pollTimer.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/get-task?taskId=${encodeURIComponent(id)}`);
        const data = await r.json();

        if (!r.ok) throw new Error(data?.error || "Error en polling");

        setStatus(data.status || "—");

        // Si trae streamAudioUrl antes de SUCCESS, lo usamos en la pantalla de "Cargando"
        const s = data?.track?.streamAudioUrl || null;
        if (s && !finalAudioUrl) setStreamUrl(s);

        // Cuando finaliza: usamos audioUrl (final)
        if (data.status === "SUCCESS" && data.track?.audioUrl) {
          setFinalAudioUrl(data.track.audioUrl);
          clearInterval(pollTimer.current!);
          setStep("player");
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
        // nuevo flujo: siempre autoLyrics; solo mandamos style y (si existe) themePrompt
        body: JSON.stringify({
          mode: "autoLyrics",
          style,
          // título lo propone la API de lyrics; si no, backend pone fallback.
          title: "",
          themePrompt: themePrompt || undefined, // puede ir vacío en mobile; el backend genera fallback
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Falló la generación");

      // guardamos taskId y empezamos a hacer polling
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
        />
      )}

      {step === "player" && (
        <PlayerScreen
          audioUrl={finalAudioUrl}
          title={title}
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

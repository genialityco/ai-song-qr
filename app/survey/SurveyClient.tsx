"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import SurveyForm from "./SurveyForm";
import SurveyTable from "./SurveyTable";

function MiniPlayer({ src }: { src: string | null }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dur, setDur] = useState(0);
  const [pos, setPos] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const wasPlaying = !el.paused;
    const prevTime = el.currentTime;

    try {
      el.pause();
      el.src = src || "";
      if (src) el.load();
      if (wasPlaying && src) {
        try { el.currentTime = prevTime; } catch { }
        el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      } else {
        setIsPlaying(false);
      }
    } catch { }
  }, [src]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const handlers = {
      play: () => setIsPlaying(true),
      pause: () => setIsPlaying(false),
      ended: () => setIsPlaying(false),
      timeupdate: () => setPos(el.currentTime),
      loadedmetadata: () => setDur(el.duration || 0)
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      el.addEventListener(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        el.removeEventListener(event, handler);
      });
    };
  }, []);

  const toggle = async () => {
    const el = audioRef.current;
    if (!el || !src) return;
    try {
      if (el.paused) {
        await el.play();
      } else {
        el.pause();
      }
    } catch { }
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (!el) return;
    try {
      el.currentTime = Number(e.target.value);
    } catch { }
  };

  const mmss = (t: number) => {
    if (!isFinite(t) || t < 0) t = 0;
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full bg-white/10 border border-white/20 rounded-xl p-3">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          disabled={!src}
          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50 flex items-center justify-center"
        >
          {isPlaying ? (
            <div className="w-3 h-3 flex gap-1">
              <span className="inline-block w-[4px] h-3 bg-white" />
              <span className="inline-block w-[4px] h-3 bg-white" />
            </div>
          ) : (
            <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[12px] border-transparent border-l-white ml-1" />
          )}
        </button>

        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={Number.isFinite(dur) && dur > 0 ? dur : 0}
            step={0.1}
            value={Math.min(pos, dur || 0)}
            onChange={onSeek}
            disabled={!src || !Number.isFinite(dur) || dur <= 0}
            className="w-full accent-white"
          />
          <div className="text-[11px] opacity-80 flex justify-between">
            <span>{mmss(pos)}</span>
            <span>{Number.isFinite(dur) && dur > 0 ? mmss(dur) : "--:--"}</span>
          </div>
        </div>
      </div>
      <audio ref={audioRef} className="hidden" src={src ?? undefined} preload="auto" playsInline />
    </div>
  );
}

export default function SurveyClient() {
  const searchParams = useSearchParams();
  const [audioUrl, setAudioUrl] = useState<string>(searchParams.get("src") || "");
  const [isFinal, setIsFinal] = useState<boolean>((searchParams.get("final") || "0") === "1");
  const [taskStatus, setTaskStatus] = useState<string>(isFinal ? "SUCCESS" : "PENDING");
  const [enviado, setEnviado] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [tableRefreshTrigger, setTableRefreshTrigger] = useState(0);

  const taskId = searchParams.get("taskId");
  const title = searchParams.get("filename");
  const publicBase = typeof window !== "undefined" ? window.location.origin : "";

  const getDownloadUrl = useMemo(() => {
    if (!audioUrl || !isFinal) return "";
    const filename = (title || "cancion").toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    return `${publicBase}/api/download?src=${encodeURIComponent(audioUrl)}&filename=${encodeURIComponent(`${filename}.mp3`)}`;
  }, [audioUrl, title, publicBase, isFinal]);

  // Polling para el taskId
  useEffect(() => {
    if (isFinal || !taskId) return;

    const interval = setInterval(async () => {
      try {
        const r = await fetch(`/api/get-task?taskId=${encodeURIComponent(taskId)}`, { cache: "no-store" });
        const data = await r.json();

        if (!r.ok) return;

        const status = data?.status || "—";
        setTaskStatus(status);

        if (status === "SUCCESS" && data?.track?.audioUrl) {
          setAudioUrl(data.track.audioUrl);
          setIsFinal(true);
        } else if (data?.track?.streamAudioUrl && !audioUrl) {
          setAudioUrl(data.track.streamAudioUrl);
        }
      } catch { }
    }, 6000);

    const timeout = setTimeout(() => clearInterval(interval), 10 * 60 * 1000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [taskId, isFinal, audioUrl]);

  const downloadAudio = () => {
    if (!isFinal) return alert("Tu canción aún se está generando.");
    if (!audioUrl) return alert("No hay audio disponible para descargar");

    const link = document.createElement("a");
    link.href = getDownloadUrl;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusText = () => {
    if (isFinal) return "¡Lista para descargar!";
    const statusMap: Record<string, string> = {
      "PENDING": "Generando letra…",
      "TEXT_SUCCESS": "Generando canción…",
      "PROCESSING": "Procesando…",
      "WAITING": "Procesando…"
    };
    return statusMap[taskStatus] || "Generando…";
  };

  return (
    <div className="w-full min-h-screen relative flex flex-col items-center justify-start text-white overflow-hidden py-6">
      <div className="absolute inset-0 bg-black/40 z-0" />
      <div className="relative z-10 w-full max-w-4xl px-4 space-y-6">
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-lg">
          <MiniPlayer src={audioUrl || null} />
          {!isFinal && (
            <div className="mt-2 text-xs text-white/80 text-center">
              Estado: <b>{getStatusText()}</b>
            </div>
          )}
        </div>

        {!enviado ? (
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-lg">
            <SurveyForm onSuccess={() => { setEnviado(true); setTableRefreshTrigger(prev => prev + 1); }} />
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-lg">
            <div className="flex justify-center items-center flex-col text-center space-y-4">
              {isFinal && (
                <QRCodeCanvas value={window.location.href} size={80} marginSize={1} />
              )}

              <h2 className="text-2xl font-bold">¡Gracias por llenar la encuesta!</h2>

              {isFinal ? (
                <>
                  <p>Tu canción está lista:</p>
                  <button
                    onClick={downloadAudio}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold"
                  >
                    Descargar {title ? `"${title}"` : "Canción"}
                  </button>
                </>
              ) : (
                <>
                  <p>Tu canción sigue generándose…</p>
                  <div className="text-xs opacity-80">Estado: <b>{getStatusText()}</b></div>
                </>
              )}
            </div>
          </div>
        )}

        {/* {enviado && showParticipants && (
          <SurveyTable refreshTrigger={tableRefreshTrigger} />
        )} */}
      </div>
    </div>
  );
}
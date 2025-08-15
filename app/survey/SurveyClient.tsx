"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import type { FormData, FormErrors } from "./interfaces";
import {
  validateNombre,
  validateTelefono,
  validateCorreo,
  validateEmpresa,
  validateCargo,
} from "./validators";

export default function SurveyClient() {
  const searchParams = useSearchParams();

  const initialSrc = searchParams.get("src") || "";
  const initialFinal = (searchParams.get("final") || "0") === "1";
  const taskId = searchParams.get("taskId") || null;
  const title = searchParams.get("filename");

  const [audioUrl, setAudioUrl] = useState<string>(initialSrc);
  const [isFinal, setIsFinal] = useState<boolean>(initialFinal);
  const [taskStatus, setTaskStatus] = useState<string>(initialFinal ? "SUCCESS" : "PENDING");
  const [enviado, setEnviado] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const publicBase = typeof window !== "undefined" ? window.location.origin : "";

  const slugify = (s: string) =>
    (s || "cancion")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const getDownloadUrl = useMemo(() => {
    if (!audioUrl || !isFinal) return "";
    return `${publicBase}/api/download?src=${encodeURIComponent(
      audioUrl
    )}&filename=${encodeURIComponent(`${slugify(title || "cancion")}.mp3`)}`;
  }, [audioUrl, title, publicBase, isFinal]);

  // === Polling hasta SUCCESS usando taskId ===
  useEffect(() => {
    if (isFinal) return;
    if (!taskId) return;

    let cancelled = false;
    const start = Date.now();
    const maxMs = 10 * 60 * 1000; // 10 min máximo
    const intervalMs = 6000;      // cada 6s

    const h = setInterval(async () => {
      if (Date.now() - start > maxMs) {
        clearInterval(h);
        return;
      }
      try {
        const r = await fetch(`/api/get-task?taskId=${encodeURIComponent(taskId)}`, { cache: "no-store" });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "Error en polling survey");
        if (cancelled) return;

        const status = data?.status || "—";
        setTaskStatus(status);

        if (status === "SUCCESS" && data?.track?.audioUrl) {
          setAudioUrl(data.track.audioUrl);
          setIsFinal(true);
          clearInterval(h);
        } else {
          const s = data?.track?.streamAudioUrl || "";
          if (s && !audioUrl) setAudioUrl(s);
        }
      } catch {
        // fallos transitorios ignorados
      }
    }, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(h);
    };
  }, [taskId, isFinal, audioUrl]);

  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    telefono: "",
    correo: "",
    empresa: "",
    cargo: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validators: Record<keyof FormData, (v: string) => string | undefined> = {
    nombre: validateNombre,
    telefono: validateTelefono,
    correo: validateCorreo,
    empresa: validateEmpresa,
    cargo: validateCargo,
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    (Object.keys(formData) as (keyof FormData)[]).forEach((key) => {
      const error = validators[key](formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const key = name as keyof FormData;
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: validators[key](value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const [{ collection, addDoc, serverTimestamp }, { db }] = await Promise.all([
        import("firebase/firestore"),
        import("../../firebaseConfig"),
      ]);

      await addDoc(collection(db, "encuestas"), { ...formData, createdAt: serverTimestamp() });
      setEnviado(true);
    } catch (error) {
      console.error("Error al guardar en Firebase:", error);
      alert("Ocurrió un error al enviar los datos. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadAudio = () => {
    if (!isFinal) {
      alert("Tu canción aún se está generando. Se habilitará automáticamente cuando esté lista.");
      return;
    }
    if (!audioUrl) return alert("No hay audio disponible para descargar");
    const link = document.createElement("a");
    link.href = getDownloadUrl;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const inputClass =
    "w-full px-4 py-2 rounded-lg bg-white/20 border focus:outline-none focus:ring-2";

  const fields = [
    { name: "nombre", type: "text", placeholder: "Nombre *" },
    { name: "telefono", type: "tel", placeholder: "Teléfono (7-10 dígitos) *" },
    { name: "correo", type: "email", placeholder: "Correo *" },
    { name: "empresa", type: "text", placeholder: "Empresa (opcional)" },
    { name: "cargo", type: "text", placeholder: "Cargo (opcional)" },
  ] as const;

  const prettyStatus = (() => {
    if (isFinal) return "¡Lista para descargar!";
    switch (taskStatus) {
      case "PENDING":
      case "-":
        return "Generando letra…";
      case "TEXT_SUCCESS":
        return "Generando canción…";
      case "PROCESSING":
      case "WAITING":
        return "Procesando…";
      default:
        return "Generando…";
    }
  })();

  return (
    <div className="w-full min-h-screen relative flex flex-col items-center justify-center text-white overflow-hidden">
      <video className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
        src="/assets/fondo_animado.mp4" autoPlay loop muted playsInline preload="auto"
        poster="/assets/FONDO_PANTALLA.png" />
      <div className="absolute inset-0 bg-black/40 z-0" />

      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-lg">
        {!enviado ? (
          <>
            {!isFinal && (
              <div className="mb-3 text-sm text-white/80 text-center">
                Estado: <b>{prettyStatus}</b>
              </div>
            )}
            <h2 className="text-2xl font-bold mb-6 text-center">Formulario</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map(({ name, type, placeholder }) => (
                <div key={name}>
                  <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={formData[name]}
                    onChange={handleChange}
                    className={`${inputClass} ${errors[name] ? "border-red-400 focus:ring-red-400" : "border-white/30 focus:ring-blue-400"}`}
                  />
                  {errors[name] && <p className="text-red-300 text-sm mt-1">{errors[name]}</p>}
                </div>
              ))}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full ${isSubmitting ? "bg-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"} text-white py-2 rounded-lg font-semibold transition`}
              >
                {isSubmitting ? "Enviando..." : "Enviar"}
              </button>
            </form>
            <p className="text-xs text-white/70 mt-4 text-center">* Campos obligatorios</p>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="flex flex-col items-center space-y-2">
              <QRCodeCanvas
                value={typeof window !== "undefined" ? window.location.href : ""}
                size={80}
                marginSize={1}
              />
              <div className="text-[11px] opacity-85">
                Escanea para abrir esta página en tu dispositivo
              </div>
            </div>

            <h2 className="text-2xl font-bold">¡Gracias por llenar la encuesta!</h2>

            {isFinal ? (
              <>
                <p className="text-lg">Tu canción está lista:</p>
                <button
                  onClick={downloadAudio}
                  className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                >
                  Descargar {title ? `"${title}"` : "Canción"}
                </button>
              </>
            ) : (
              <>
                <p className="text-lg">Tu canción sigue generándose…</p>
                <p className="text-sm text-white/80">Esta página se actualizará automáticamente cuando esté lista.</p>
                <div className="text-xs opacity-80">Estado: <b>{prettyStatus}</b></div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

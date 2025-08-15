/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/generate-song/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const API_KEY = process.env.MUSIC_API_KEY!;
const API_BASE = process.env.MUSIC_API_BASE ?? "https://api.api.box/api/v1";
const DEFAULT_MODEL =
  (process.env.MUSIC_DEFAULT_MODEL as "V3_5" | "V4" | "V4_5" | "V4_5PLUS") ||
  "V4";

// ====== CONTROLES DE DURACIÓN / RENDIMIENTO ======
const LYRICS_MAX_LINES = 12;   // aprox 60–90s
const LYRICS_MAX_CHARS = 900;  // tope duro de seguridad
const DEFAULT_SHORT_TITLE = "Mi Canción";

const POLL_MAX_ATTEMPTS = 15;  // menos intentos = respuesta más ágil
const POLL_INTERVAL_MS = 2000; // 2s entre intentos

// ====== SCHEMA de entrada ======
const Body = z.object({
  mode: z.enum(["autoLyrics", "lyrics"]),
  model: z
    .enum(["V3_5", "V4", "V4_5", "V4_5PLUS"])
    .optional()
    .default(DEFAULT_MODEL),

  // autoLyrics
  themePrompt: z.string().max(4000).optional(), // aceptamos largo, recortamos antes de llamar a la API

  // lyrics
  lyrics: z.string().optional(), // letra exacta

  // comunes a ambos modos
  style: z.string(), // género
  title: z.string(), // título
  negativeTags: z.string().optional().default(""),
});

// ====== Helpers HTTP ======
async function apiGET(path: string) {
  const r = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.msg || data?.error || JSON.stringify(data));
  return data;
}
async function apiPOST(path: string, body: any) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.msg || data?.error || JSON.stringify(data));
  return data;
}

/** Polling genérico con intentos/intervalo */
async function poll<T>(
  fn: () => Promise<T>,
  isDone: (d: T) => boolean,
  maxAttempts = POLL_MAX_ATTEMPTS,
  intervalMs = POLL_INTERVAL_MS
): Promise<T> {
  let last: T | null = null;
  for (let i = 0; i < maxAttempts; i++) {
    const d = await fn();
    last = d;
    if (isDone(d)) return d;
    await new Promise((res) => setTimeout(res, intervalMs));
  }
  if (last) return last;
  throw new Error("Timeout esperando resultado");
}

// ====== Utilidades de recorte de letra ======
function clipLines(text: string, maxLines: number): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out = lines.slice(0, maxLines).join("\n").trim();
  return out;
}
function hardTrim(text: string, maxChars: number): string {
  return text.length <= maxChars ? text : text.slice(0, maxChars).trim();
}
/** Aplica ambos recortes y limpia espacios extra */
function makeShortLyrics(text: string): string {
  const step1 = clipLines(text, LYRICS_MAX_LINES);
  const step2 = hardTrim(step1, LYRICS_MAX_CHARS);
  return step2.replace(/\n{3,}/g, "\n\n").trim();
}

// ====== Utilidades para prompt ≤ 200 caracteres ======
function compactTo(s: string, max: number): string {
  const oneLine = s.replace(/\s+/g, " ").trim();
  return oneLine.length <= max ? oneLine : oneLine.slice(0, max).trim();
}
function to200Chars(s: string): string {
  return compactTo(s, 200);
}

/** Construye un prompt que fuerce letra breve y siempre ≤ 200 chars */
function buildShortLyricsPrompt(themePrompt: string, style: string): string {
  // Todo en una sola línea para ahorrar caracteres
  const fixed = `Letra breve en español, máx 12 líneas. Estructura: [Verse] 2-4, [Chorus] 2-4. Estilo: ${style}. Tema: `;
  const room = Math.max(0, 200 - fixed.length);
  const compactTheme = compactTo(themePrompt, room);
  return to200Chars(fixed + compactTheme);
}

/** 1) Generar letra con /lyrics y obtener texto final (y posible título sugerido) */
async function generateLyricsAndGetText(
  themePrompt: string,
  style: string
): Promise<{ text: string; title?: string }> {
  // Prompt **siempre ≤ 200 chars**
  const shortPrompt = buildShortLyricsPrompt(themePrompt, style);

  // Crear tarea de letras
  const start = await apiPOST("/lyrics", {
    prompt: shortPrompt,
    callBackUrl: "https://example.com/callback",
  });

  // Buscar taskId en varias variantes comunes
  const lyricsTaskId =
    start?.data?.taskId ||
    start?.data?.id ||
    start?.taskId ||
    start?.id ||
    start?.data?.task_id;

  if (!lyricsTaskId) {
    console.error("[POST /lyrics] respuesta sin taskId:", JSON.stringify(start));
    throw new Error("Lyrics: no se recibió taskId en POST /lyrics (ver logs).");
  }

  // Polling hasta estado terminal
  const done = await poll(
    () =>
      apiGET(`/lyrics/record-info?taskId=${encodeURIComponent(lyricsTaskId)}`),
    (d: any) => {
      const st = d?.data?.status;
      return (
        st === "SUCCESS" ||
        st === "CREATE_TASK_FAILED" ||
        st === "CALLBACK_EXCEPTION" ||
        st === "SENSITIVE_WORD_ERROR"
      );
    }
  );

  const status = done?.data?.status;
  if (status !== "SUCCESS") {
    const errMsg = done?.data?.errorMessage || `Estado: ${status}`;
    console.error("[lyrics record-info]", JSON.stringify(done, null, 2));
    throw new Error(`Lyrics: tarea no finalizó en SUCCESS. ${errMsg}`);
  }

  // Extraer texto/título (dos variantes de respuesta posibles)
  const resp = done?.data?.response;
  const list =
    (Array.isArray(resp?.lyricsData) && resp.lyricsData) ||
    (Array.isArray(resp?.data) && resp.data) ||
    [];

  const pick = (arr: any[]) => {
    if (!arr.length)
      return { text: "", title: undefined as string | undefined };
    const byStatus =
      arr.find(
        (it) =>
          (it?.status ?? "").toLowerCase() === "complete" &&
          typeof (it?.text ?? it?.content) === "string" &&
          (it.text ?? it.content).trim().length > 0
      ) || arr[0];

    const rawText = byStatus?.text ?? byStatus?.content ?? "";
    const text =
      typeof rawText === "string" ? rawText.replace(/\r\n/g, "\n").trim() : "";
    const title =
      typeof byStatus?.title === "string" && byStatus.title.trim().length
        ? byStatus.title.trim()
        : undefined;

    return { text, title };
  };

  const { text, title } = pick(list);
  if (!text) {
    console.error(
      "[lyrics record-info] SUCCESS pero sin 'text'. Raw:",
      JSON.stringify(done, null, 2)
    );
    throw new Error("Lyrics: SUCCESS pero no llegó texto en la respuesta");
  }

  // Recorte final para asegurar letra corta
  const short = makeShortLyrics(text);
  return { text: short, title };
}

/** 2) Enviar a /generate (devuelve taskId para polling desde frontend) */
async function startMusicGeneration(payload: any): Promise<string> {
  const gen = await apiPOST("/generate", payload);
  const taskId = gen?.data?.taskId || gen?.taskId || gen?.id;
  if (!taskId) throw new Error("No se recibió taskId de generate");
  return taskId;
}

export async function POST(req: NextRequest) {
  try {
    if (!API_KEY)
      return NextResponse.json(
        { error: "Configura MUSIC_API_KEY" },
        { status: 500 }
      );

    const input = Body.parse(await req.json());

    let lyricsToUse: string;
    let finalTitle = input.title?.trim();

    if (input.mode === "autoLyrics") {
      // Fallback ultra-corto si no mandan themePrompt
      const promptBase =
        input.themePrompt?.trim() || "Identidad GOAT, tono emocionante.";

      const { text, title: apiTitle } = await generateLyricsAndGetText(
        promptBase,
        input.style
      );
      lyricsToUse = text;
      if (!finalTitle || finalTitle.length === 0)
        finalTitle = apiTitle || DEFAULT_SHORT_TITLE;
    } else {
      // Modo lyrics: recortamos si viene largo
      if (!input.lyrics?.trim())
        return NextResponse.json(
          { error: "lyrics es requerido en modo lyrics" },
          { status: 400 }
        );
      lyricsToUse = makeShortLyrics(input.lyrics.trim());
      if (!finalTitle || finalTitle.length === 0) finalTitle = DEFAULT_SHORT_TITLE;
    }

    // Reforzar negativamente elementos largos/repetitivos
    const negative = [
      input.negativeTags || "",
      "long intro",
      "extended outro",
      "long bridge",
      "long instrumental",
      "repetitive chorus",
    ]
      .filter(Boolean)
      .join(", ");

    const generatePayload = {
      customMode: true,
      instrumental: false,
      model: input.model,
      negativeTags: negative,
      style: input.style.trim(),
      title: finalTitle,
      prompt: lyricsToUse, // ya viene corto
      callBackUrl: "https://example.com/callback",
    };

    const taskId = await startMusicGeneration(generatePayload);
    return NextResponse.json({ taskId }, { status: 202 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Error inesperado" },
      { status: 500 }
    );
  }
}

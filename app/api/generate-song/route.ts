/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/generate-song/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const API_KEY = process.env.MUSIC_API_KEY!;
const API_BASE = process.env.MUSIC_API_BASE ?? "https://api.api.box/api/v1";
const DEFAULT_MODEL =
  (process.env.MUSIC_DEFAULT_MODEL as "V3_5" | "V4" | "V4_5" | "V4_5PLUS") ||
  "V4";

// ----- SCHEMA de entrada
const Body = z.object({
  mode: z.enum(["autoLyrics", "lyrics"]),
  model: z
    .enum(["V3_5", "V4", "V4_5", "V4_5PLUS"])
    .optional()
    .default(DEFAULT_MODEL),

  // autoLyrics
  themePrompt: z.string().optional(), // idea/tema para generar letra (≤ 200 palabras según doc)
  // lyrics
  lyrics: z.string().optional(), // letra exacta

  // comunes a ambos modos
  style: z.string(), // género
  title: z.string(), // título (si viene vacío y la API sugiere uno, lo tomamos)
  negativeTags: z.string().optional().default(""),
});

// ----- Helpers
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
  maxAttempts = 20,
  intervalMs = 3000
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

/** 1) Generar letra con /lyrics y obtener texto final (y posible título sugerido) */
async function generateLyricsAndGetText(
  themePrompt: string
): Promise<{ text: string; title?: string }> {
  // 1) Crear tarea de letras
  const start = await apiPOST("/lyrics", {
    prompt: themePrompt,
    // usamos polling igualmente, el callback puede ser dummy
    callBackUrl: "https://example.com/callback",
  });

  const lyricsTaskId = start?.data?.taskId || start?.taskId || start?.id;
  if (!lyricsTaskId)
    throw new Error("Lyrics: no se recibió taskId en POST /lyrics");

  // 2) Poll hasta estado terminal
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
    },
    30,
    3000
  );

  const status = done?.data?.status;
  if (status !== "SUCCESS") {
    const errMsg = done?.data?.errorMessage || `Estado: ${status}`;
    console.error("[lyrics record-info]", JSON.stringify(done, null, 2));
    throw new Error(`Lyrics: tarea no finalizó en SUCCESS. ${errMsg}`);
  }

  // 3) Extraer texto/título (soporta dos variantes de la API):
  //    a) data.response.lyricsData[]
  //    b) data.response.data[]
  const resp = done?.data?.response;
  const list =
    (Array.isArray(resp?.lyricsData) && resp.lyricsData) ||
    (Array.isArray(resp?.data) && resp.data) ||
    [];

  const pick = (arr: any[]) => {
    if (!arr.length)
      return { text: "", title: undefined as string | undefined };
    // preferimos items con status complete y texto no vacío
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

  return { text, title };
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
      // 👇 Fallback si no hay themePrompt (mobile)
      const promptBase =
        input.themePrompt?.trim() ||
        `Genera una letra en español, con estructura [Verse]/[Chorus], tema: identidad GOAT, tono emocionante, estilo ${input.style}.`;

      const { text, title: apiTitle } = await generateLyricsAndGetText(
        promptBase
      );
      lyricsToUse = text;
      if (!finalTitle || finalTitle.length === 0)
        finalTitle = apiTitle || "Mi Canción";
    } else {
      // (no lo usamos en este flujo, pero queda para compatibilidad)
      if (!input.lyrics?.trim())
        return NextResponse.json(
          { error: "lyrics es requerido en modo lyrics" },
          { status: 400 }
        );
      lyricsToUse = input.lyrics.trim();
      if (!finalTitle || finalTitle.length === 0) finalTitle = "Mi Canción";
    }

    const generatePayload = {
      customMode: true,
      instrumental: false,
      model: input.model,
      negativeTags: input.negativeTags,
      style: input.style.trim(),
      title: finalTitle,
      prompt: lyricsToUse,
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

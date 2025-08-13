/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/get-task/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.MUSIC_API_KEY!;
const API_BASE = process.env.MUSIC_API_BASE ?? "https://api.api.box/api/v1";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");
  if (!taskId)
    return NextResponse.json({ error: "taskId requerido" }, { status: 400 });

  try {
    const url = `${API_BASE}/generate/record-info?taskId=${encodeURIComponent(
      taskId
    )}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data = await resp.json();

    if (!resp.ok) {
      return NextResponse.json(
        { error: data?.msg || JSON.stringify(data) },
        { status: resp.status }
      );
    }

    const status = data?.data?.status; // "PENDING" | "TEXT_SUCCESS" | "FIRST_SUCCESS" | "SUCCESS" | ...
    const sunoData = data?.data?.response?.sunoData || [];
    const first = sunoData[0] || null;

    return NextResponse.json({
      status,
      track: first
        ? {
            audioUrl: first.audioUrl,
            streamAudioUrl: first.streamAudioUrl,
            imageUrl: first.imageUrl,
            title: first.title,
            duration: first.duration,
          }
        : null,
      raw: data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Error inesperado" },
      { status: 500 }
    );
  }
}

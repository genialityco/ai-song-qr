/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/save-media/route.ts
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Config: puedes dejar fija la base de tu CF o usar env
const CF_BASE =
  process.env.INGEST_BASE_URL ??
  "https://us-central1-lenovo-experiences.cloudfunctions.net/api";

export async function POST(req: NextRequest) {
  try {
    const { phone, project, originalUrl } = await req.json();

    if (!phone || !project || !originalUrl) {
      return new Response(
        JSON.stringify({
          error: "phone, project y originalUrl son obligatorios",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const resp = await fetch(`${CF_BASE}/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 🔐 NO expongas este token en el cliente. Cárgalo desde .env.local
        "x-ingest-token": process.env.INGEST_TOKEN || "",
      },
      body: JSON.stringify({ phone, project, originalUrl }),
      cache: "no-store",
    });

    const data = await resp.json().catch(() => ({}));
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message || "Error interno" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

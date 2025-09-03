import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CF_BASE =
  process.env.INGEST_BASE_URL ??
  "https://us-central1-lenovo-experiences.cloudfunctions.net/api";

const ALLOWED_PROJECTS = new Set(["goatHeart", "goatMusic", "goatBody"]);
const normalizePhone = (s: string) => String(s || "").replace(/[^\d]/g, "");

// --- Tipos y type-guards ---
type AllowedProject = "goatHeart" | "goatMusic" | "goatBody";

interface SaveMediaBody {
  phone: string;
  project: AllowedProject | string; // validamos abajo contra el Set
  originalUrl: string;
}

function isSaveMediaBody(x: unknown): x is SaveMediaBody {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.phone === "string" &&
    typeof o.project === "string" &&
    typeof o.originalUrl === "string"
  );
}

async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    const t = await req.text();
    try {
      return JSON.parse(t) as unknown;
    } catch {
      return {};
    }
  }
}

export async function POST(req: NextRequest) {
  const TOKEN = process.env.INGEST_TOKEN;
  if (!TOKEN) {
    return NextResponse.json(
      { error: "Server misconfig: missing INGEST_TOKEN" },
      { status: 500 }
    );
  }

  try {
    const bodyUnknown = await readJson(req);

    if (!isSaveMediaBody(bodyUnknown)) {
      return NextResponse.json(
        { error: "phone, project y originalUrl son obligatorios" },
        { status: 400 }
      );
    }

    const { phone, project, originalUrl } = bodyUnknown;

    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone) {
      return NextResponse.json({ error: "phone inválido" }, { status: 400 });
    }
    if (!ALLOWED_PROJECTS.has(project)) {
      return NextResponse.json({ error: "project inválido" }, { status: 400 });
    }

    // valida URL pública http(s)
    try {
      const u = new URL(originalUrl);
      if (!/^https?:$/i.test(u.protocol)) {
        return NextResponse.json(
          { error: "originalUrl debe ser http(s)" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "originalUrl inválida" },
        { status: 400 }
      );
    }

    console.log("[save-media] → ingest", {
      ts: new Date().toISOString(),
      project,
      phone: cleanPhone,
      url: originalUrl,
    });

    const upstream = await fetch(`${CF_BASE}/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ingest-token": TOKEN,
      },
      body: JSON.stringify({ phone: cleanPhone, project, originalUrl }),
      cache: "no-store",
    });

    const raw = await upstream.text();

    // Parse seguro sin `any`
    let data: unknown;
    try {
      data = JSON.parse(raw) as unknown;
    } catch {
      data = { raw };
    }

    if (!upstream.ok) {
      console.error(
        "[save-media] upstream error:",
        upstream.status,
        raw.slice(0, 500)
      );
      return NextResponse.json(
        { error: "ingest failed", status: upstream.status, data },
        { status: upstream.status }
      );
    }

    // `data` es `unknown`; NextResponse.json acepta valores serializables
    return NextResponse.json(data, { status: upstream.status || 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[save-media] exception:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
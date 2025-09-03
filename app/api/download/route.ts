// app/api/download/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ Permite solo hosts conocidos (evita open proxy)
const ALLOWED_HOSTS = new Set<string>([
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
  "apiboxfiles.erweima.ai",
  // agrega tus dominios/buckets si aplica
]);

function sanitizeFilename(name: string) {
  const clean = (name || "track.mp3").replace(/[^\w.-]/g, "_");
  return clean || "track.mp3";
}

function buildUpstreamHeaders(req: NextRequest) {
  const headers: Record<string, string> = {};
  const range = req.headers.get("range");
  if (range) headers["Range"] = range; // soporta reanudación (206)
  return headers;
}

function copyHeaderIf(set: Headers, from: Headers, key: string) {
  const v = from.get(key);
  if (v) set.set(key, v);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const src = url.searchParams.get("src");
  const filename = sanitizeFilename(url.searchParams.get("filename") || "track.mp3");

  if (!src) {
    return new NextResponse("Missing 'src' query param", { status: 400 });
  }

  // 🔒 Valida URL y fuerza HTTPS para evitar mixed content y downgrades
  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return new NextResponse("Invalid 'src' URL", { status: 400 });
  }
  if (target.protocol !== "https:") {
    return new NextResponse("Only HTTPS sources are allowed", { status: 400 });
  }
  if (ALLOWED_HOSTS.size && !ALLOWED_HOSTS.has(target.host)) {
    return new NextResponse("Host not allowed", { status: 400 });
  }

  // ⬇️ Proxy en streaming (propaga Range si viene)
  const upstream = await fetch(target.toString(), {
    cache: "no-store",
    headers: buildUpstreamHeaders(req),
  });

  // Acepta 200 OK o 206 Partial Content; cualquier otro status => error
  if (!(upstream.ok || upstream.status === 206) || !upstream.body) {
    const body = await upstream.text().catch(() => "");
    return new NextResponse(
      `Upstream error (${upstream.status})${body ? `: ${body}` : ""}`,
      { status: 502 }
    );
  }

  const contentType = upstream.headers.get("content-type") || "audio/mpeg";

  // ✨ Respuesta con headers para forzar descarga
  const resHeaders = new Headers({
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
    "Access-Control-Expose-Headers": "Content-Disposition",
    "X-Content-Type-Options": "nosniff",
  });

  // Propaga headers útiles (tamaño, reanudación, validadores)
  for (const h of [
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified",
    "cache-control",
  ]) {
    copyHeaderIf(resHeaders, upstream.headers, h);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status, // 200 o 206 según el origen
    headers: resHeaders,
  });
}

// (Opcional) HEAD para clientes que checan metadatos sin descargar
export async function HEAD(req: NextRequest) {
  const get = await GET(req);
  return new NextResponse(null, {
    status: get.status,
    headers: get.headers,
  });
}

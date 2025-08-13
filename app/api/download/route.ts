import { NextRequest } from "next/server";

// Asegura runtime Node (no Edge) para streaming binario grande
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const src = url.searchParams.get("src");
  const filename = (url.searchParams.get("filename") || "track.mp3")
    .replace(/[^\w.-]/g, "_"); // sanea

  if (!src) {
    return new Response("Missing 'src' query param", { status: 400 });
  }

  // Descarga del origen (streaming)
  const upstream = await fetch(src, {
    // Si tu origen requiere headers (auth tokens, referer, etc.), agrégalos aquí
    // headers: { Authorization: `Bearer ...` }
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    return new Response(`Upstream error (${upstream.status})`, { status: 502 });
  }

  const contentType =
    upstream.headers.get("content-type") || "audio/mpeg";

  // Re-servimos el stream con Content-Disposition: attachment
  return new Response(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      // Opcional:
      "Cache-Control": "no-store",
      // Para que el navegador pueda leer headers si hace fetch/XHR:
      "Access-Control-Expose-Headers": "Content-Disposition",
    },
  });
}

import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

// The root unfurl is a static file (public/og-root.png) — see app/layout.tsx.
//
// This route keeps the historical /opengraph-image URL serving that same image.
// Link previews already crawled by X, Slack or Telegram hold the old URL, and
// when the file-convention route was replaced they were left pointing at a
// 404 — which those platforms render as a blank (white) card. Serving the real
// bytes here means a cached reference resolves to the current art.
const HEADERS = {
  "Content-Type": "image/png",
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

export async function GET() {
  // Workers has no filesystem: the asset binding serves public/ directly.
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext() as {
      env?: { ASSETS?: { fetch(url: string): Promise<Response> } };
    };
    const res = await env?.ASSETS?.fetch("https://assets.local/og-root.png");
    if (res?.ok) return new Response(res.body, { headers: HEADERS });
  } catch {
    // Not inside the OpenNext Worker (local dev) — read the file instead.
  }
  const buf = await readFile(join(process.cwd(), "public", "og-root.png"));
  return new Response(new Uint8Array(buf), { headers: HEADERS });
}

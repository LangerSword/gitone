import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { headers } from "next/headers";

// Loads Barlow Condensed + JetBrains Mono for next/og (Satori) text — the same
// faces the live card uses. The display family is registered under the legacy
// alias "Titillium" so the existing Satori tree references keep resolving; the
// glyphs are Barlow Condensed, matching the DOM card's --font-display.
//
// Runtime split: Cloudflare Workers has no filesystem, so Node reads app/fonts
// directly while Workers fetches the same faces from public/fonts (a mirror of
// app/fonts) through the ASSETS binding — no network hop — with an own-origin
// fetch as the fallback. OG_FORCE_FETCH_ASSETS=1 forces the fetch path on Node
// so the exact Workers behaviour can be exercised under `next start`.

export interface OgFont {
  name: string;
  data: Buffer;
  weight: 400 | 500 | 600 | 700 | 800 | 900;
  style: "normal" | "italic";
}

// Workers expose WebSocketPair; Node never does.
export function isWorkersRuntime(): boolean {
  return "WebSocketPair" in globalThis;
}

function fetchAssets(): boolean {
  return isWorkersRuntime() || process.env.OG_FORCE_FETCH_ASSETS === "1";
}

// Bytes of a public/ asset, without fs on Workers.
export async function fetchPublicBytes(path: string): Promise<Buffer> {
  // 1) Workers: the ASSETS binding serves public/ straight from the edge.
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    const assets = (env as { ASSETS?: { fetch(input: string): Promise<Response> } }).ASSETS;
    if (assets) {
      const res = await assets.fetch(`https://assets.local/${path}`);
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    }
  } catch {
    // Not inside the OpenNext Worker (plain `next start`) — fall through.
  }
  // 2) Anywhere else: fetch from this server's own origin.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) throw new Error(`cannot resolve origin for asset ${path}`);
  const proto = h.get("x-forwarded-proto") ?? "http";
  const res = await fetch(`${proto}://${host}/${path}`);
  if (!res.ok) throw new Error(`asset fetch failed: ${path} (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

async function fontBytes(name: string): Promise<Buffer> {
  if (fetchAssets()) return fetchPublicBytes(`fonts/${name}`);
  return readFile(join(process.cwd(), "app", "fonts", name));
}

// A public/ asset (e.g. a struck-metal plate PNG) as a data URI for Satori
// <img> layers. Null when the asset can't be loaded — callers degrade to a
// plain ground rather than 500ing the unfurl.
export async function publicAssetDataUri(path: string): Promise<string | null> {
  try {
    const buf = fetchAssets()
      ? await fetchPublicBytes(path)
      : await readFile(join(process.cwd(), "public", path));
    const mime = path.endsWith(".webp") ? "image/webp" : "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

let fontsPromise: Promise<OgFont[]> | null = null;

// Lean face set for the poster / unfurl compositions that never render a full
// card (battle poster, root og): one display weight + two mono weights. The
// full card set parses ~1MB of face data per cold isolate — the poster's
// render only ever paints these three, and font parsing is the dominant CPU
// cost on a 10ms free-plan budget.
let posterFontsPromise: Promise<OgFont[]> | null = null;

export function loadPosterFonts(): Promise<OgFont[]> {
  if (!posterFontsPromise) {
    posterFontsPromise = (async () => {
      const [bc800, mono700, mono800] = await Promise.all([
        fontBytes("BarlowCondensed-ExtraBold.ttf"),
        fontBytes("JetBrainsMono-Bold.ttf"),
        fontBytes("JetBrainsMono-ExtraBold.ttf"),
      ]);
      const faces: OgFont[] = [
        { name: "Titillium", data: bc800, weight: 800, style: "normal" },
        { name: "Titillium", data: bc800, weight: 900, style: "normal" },
        { name: "JBMono", data: mono700, weight: 700, style: "normal" },
        { name: "JBMono", data: mono800, weight: 800, style: "normal" },
      ];
      return faces;
    })().catch((e) => {
      posterFontsPromise = null;
      throw e;
    });
  }
  return posterFontsPromise;
}

// Cached per server instance: the faces never change at runtime, and a Worker
// isolate handles many requests. A failed load resets the cache so the next
// request retries instead of replaying the rejection forever.
export function loadCardFonts(): Promise<OgFont[]> {
  if (!fontsPromise) {
    fontsPromise = buildFonts().catch((e) => {
      fontsPromise = null;
      throw e;
    });
  }
  return fontsPromise;
}

async function buildFonts(): Promise<OgFont[]> {
  const [bc600, bc700, bc800, bc600i, mono400, mono700, mono800, dinBold, dinMedium] = await Promise.all([
    fontBytes("BarlowCondensed-SemiBold.ttf"),
    fontBytes("BarlowCondensed-Bold.ttf"),
    fontBytes("BarlowCondensed-ExtraBold.ttf"),
    fontBytes("BarlowCondensed-SemiBoldItalic.ttf"),
    fontBytes("JetBrainsMono-Regular.ttf"),
    fontBytes("JetBrainsMono-Bold.ttf"),
    fontBytes("JetBrainsMono-ExtraBold.ttf"),
    fontBytes("DINPro-CondBold.otf"),
    fontBytes("DINPro-CondMedium.otf"),
  ]);
  return [
    { name: "DINPro", data: dinBold, weight: 700, style: "normal" },
    { name: "DINPro", data: dinMedium, weight: 500, style: "normal" },
    { name: "Titillium", data: bc600, weight: 400, style: "normal" },
    { name: "Titillium", data: bc600, weight: 600, style: "normal" },
    { name: "Titillium", data: bc700, weight: 700, style: "normal" },
    { name: "Titillium", data: bc800, weight: 800, style: "normal" },
    { name: "Titillium", data: bc800, weight: 900, style: "normal" },
    { name: "Titillium", data: bc600i, weight: 400, style: "italic" },
    { name: "Titillium", data: bc600i, weight: 600, style: "italic" },
    { name: "JBMono", data: mono400, weight: 400, style: "normal" },
    { name: "JBMono", data: mono700, weight: 700, style: "normal" },
    { name: "JBMono", data: mono800, weight: 800, style: "normal" },
  ];
}

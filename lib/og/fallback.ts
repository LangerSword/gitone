import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Cold Satori renders exceed the Workers free 10 ms CPU budget (1102). Every
// PNG route must answer a cache miss with pre-rendered bytes instead of
// rendering on the request path. The off-path warmer fills the real image.
export async function fallbackPng(): Promise<Response> {
  let bytes: Buffer | null = null;
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext() as {
      env?: { ASSETS?: { fetch(input: string): Promise<Response> } };
    };
    const res = await env?.ASSETS?.fetch("https://assets.local/fallback.png");
    if (res?.ok) bytes = Buffer.from(await res.arrayBuffer());
  } catch {
    // plain Node (next start) — read from disk below
  }
  if (!bytes) bytes = await readFile(join(process.cwd(), "public", "fallback.png"));
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=60" },
  });
}

// On a cold OG cache miss, serve the driver's already-rendered card PNG from
// R2 instead of a generic plate. Every scouted profile has one, so a first
// share shows a real card rather than an unrelated fallback.
export async function cardImageFallback(login: string): Promise<Response> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext() as {
      env?: { GITONE_PNGS?: { get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null> } };
    };
    const obj = await env?.GITONE_PNGS?.get(`cardpng:v10:${login.toLowerCase()}::`);
    if (obj) {
      const bytes = Buffer.from(await obj.arrayBuffer());
      if (bytes.length > 20_000) {
        return new Response(new Uint8Array(bytes), {
          status: 200,
          headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=60" },
        });
      }
    }
  } catch {
    // local dev — no R2 binding, use the brand fallback
  }
  return fallbackPng();
}

// Pair-specific Satori fallbacks cost ~1s CPU and trip the free 10ms cap, so
// versus cold misses use this pre-rendered landing-field poster instead. It is
// brand-correct, not "loading" text, and costs zero CPU to serve.
export async function versusFallbackPng(): Promise<Response> {
  let bytes: Buffer | null = null;
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext() as {
      env?: { ASSETS?: { fetch(input: string): Promise<Response> } };
    };
    const res = await env?.ASSETS?.fetch("https://assets.local/fallback-versus.png");
    if (res?.ok) bytes = Buffer.from(await res.arrayBuffer());
  } catch {
    // plain Node — read from disk below
  }
  if (!bytes) bytes = await readFile(join(process.cwd(), "public", "fallback-versus.png"));
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=60" },
  });
}

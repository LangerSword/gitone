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

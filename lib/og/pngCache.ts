import "server-only";
import { redis } from "@/lib/redis";

// Edge + KV cached PNG responses for the OG/embed render routes.
//
// Every Satori composite on Workers is CPU-heavy enough that a cold render can
// exceed the CPU budget (Cloudflare 1102 -> a 503 the social crawlers dutifully
// cache as "no preview"). So a rendered PNG is served twice over before it is
// ever rendered again:
//
//   1. the edge cache (caches.default) — a hit costs ~1ms of CPU and ZERO KV
//      operations, because the request never reaches this function's KV read.
//   2. the KV copy — survives an edge eviction, and is what a warm render
//      writes back to.
//
// The edge cache has to be written explicitly. Worker responses on this custom
// domain were not being cached from Cache-Control alone (repeat requests
// carried no cf-cache-status and always re-invoked the Worker), so every view
// spent a KV read. `cache.put` stores it regardless; a KV hit backfills the
// edge so the next view is free.
//
// The KV write is AWAITED — Workers cuts un-awaited promises when the response
// returns, so a fire-and-forget put never lands and every hit pays the render
// again. The x-og-cache header reports the path each request actually took
// (edge-hit | kv-hit | stored | off).

const TTL = 60 * 60 * 24;

export const PNG_HEADERS = {
  "Content-Type": "image/png",
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

// `caches` exists only inside the Workers runtime; Node (dev, `next start`)
// has no default cache and streams straight through.
function edgeCache(): Cache | null {
  return (globalThis as { caches?: { default?: Cache } }).caches?.default ?? null;
}

function cacheUrl(key: string): string {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || "https://gitone.langersword.in").replace(/\/$/, "");
  return `${origin}/_edge/${key}`;
}

export async function cachedPng(
  key: string,
  render: () => Promise<Response>,
  headers: Record<string, string> = PNG_HEADERS,
): Promise<Response> {
  const cache = edgeCache();
  const url = cacheUrl(key);

  if (cache) {
    const hit = await cache.match(url).catch(() => null);
    if (hit) {
      return new Response(hit.body, { headers: { ...headers, "x-og-cache": "edge-hit" } });
    }
  }

  if (redis) {
    const hit = await redis.get(key).catch(() => null);
    if (hit) {
      const bytes = Buffer.from(hit, "base64");
      // Backfill the edge from the KV copy so the next view is free.
      if (cache) {
        cache.put(url, new Response(new Uint8Array(bytes), { headers })).catch(() => {});
      }
      return new Response(bytes, { headers: { ...headers, "x-og-cache": "kv-hit" } });
    }
  } else if (!cache) {
    // No cache backend at all (local dev): stream straight through.
    return render();
  }

  let res: Response;
  try {
    res = await render();
  } catch {
    return new Response("render failed", { status: 500 });
  }
  if (!res.ok) {
    // Never cache a failure — hand it back untouched so the caller's own
    // fallback logic can take over.
    return new Response(res.body, { status: res.status, headers: res.headers });
  }

  const png = Buffer.from(await res.arrayBuffer());
  await redis?.set(key, png.toString("base64"), "EX", TTL).catch(() => {});
  if (cache) {
    cache.put(url, new Response(new Uint8Array(png), { headers })).catch(() => {});
  }
  return new Response(png, { headers: { ...headers, "x-og-cache": "stored" } });
}

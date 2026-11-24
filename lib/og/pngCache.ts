import "server-only";

// Edge + R2 cached PNG responses for the OG/embed render routes.
//
// The PNG cache is the read-heavy half of the app: every README embed, every
// social unfurl and every versus download reads one of these bytes. It used to
// live in KV alongside the small rows (scouted cards, token health, counter),
// and that is what pushed KV against its daily operation budget. Rendered
// PNGs now live in R2; KV keeps only the small rows. R2 also has stronger
// read-after-write consistency, so a freshly warmed card is visible at once.
//
// Serving order: edge Cache API (free, per-PoP, ~1ms) -> R2 object -> render.
// The x-og-cache header reports which path served each request:
// edge-hit | r2-hit | stored | miss-empty | off.

export const PNG_HEADERS = {
  "Content-Type": "image/png",
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

const PNG_BUCKET = "GITONE_PNGS";
// Bump when stale fallback bytes must be bypassed at the edge without
// invalidating the (good) objects already stored in R2.
const EDGE_VERSION = "v2";

interface StoredPng {
  arrayBuffer(): Promise<ArrayBuffer>;
}

interface PngStore {
  get(key: string): Promise<StoredPng | null>;
  put(
    key: string,
    value: Uint8Array,
    options?: { httpMetadata?: { contentType?: string; cacheControl?: string } },
  ): Promise<unknown>;
}

function edgeCache(): Cache | null {
  return (globalThis as { caches?: { default?: Cache } }).caches?.default ?? null;
}

function cacheUrl(key: string): string {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || "https://gitone.langersword.in").replace(/\/$/, "");
  return `${origin}/_edge/${EDGE_VERSION}/${key}`;
}

async function pngStore(): Promise<PngStore | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    return (env as unknown as Record<string, PngStore | undefined>)[PNG_BUCKET] ?? null;
  } catch {
    // No Cloudflare context (next build, plain Node, unbound preview): the
    // callers render straight through.
    return null;
  }
}

function edgePut(cache: Cache, url: string, bytes: Uint8Array) {
  cache.put(url, new Response(new Uint8Array(bytes), { headers: PNG_HEADERS })).catch(() => {});
}

export async function cachedPng(
  key: string,
  render: () => Promise<Response>,
  headers: Record<string, string> = PNG_HEADERS,
  onMiss?: () => Promise<Response>,
): Promise<Response> {
  const cache = edgeCache();
  const url = cacheUrl(key);

  if (cache) {
    const hit = await cache.match(url).catch(() => null);
    if (hit) {
      return new Response(hit.body, { headers: { ...headers, "x-og-cache": "edge-hit" } });
    }
  }

  const store = await pngStore();
  if (store) {
    const hit = await store.get(key).catch(() => null);
    if (hit) {
      const bytes = Buffer.from(await hit.arrayBuffer());
      if (cache) edgePut(cache, url, bytes);
      return new Response(bytes, { headers: { ...headers, "x-og-cache": "r2-hit" } });
    }
  } else if (!cache) {
    // No cache backend at all (local dev): stream straight through.
    return render();
  }

  // Cold miss. A full Satori composite costs ~2s of CPU, which the Workers
  // free plan's 10ms budget kills outright (Cloudflare 1102 -> 503). Never
  // render on the request path: a missing PNG is simply absent. No fake
  // fallback image is served, and no failure response is ever cached.
  if (!onMiss) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store", "x-og-cache": "miss-empty" } });
  }
  const allowed = await onMiss();
  if (!allowed.ok) return allowed;

  let res: Response;
  try {
    res = await render();
  } catch {
    return new Response("render failed", { status: 500 });
  }
  if (!res.ok) {
    return new Response(res.body, { status: res.status, headers: res.headers });
  }

  const png = Buffer.from(await res.arrayBuffer());
  await store
    ?.put(key, new Uint8Array(png), { httpMetadata: { contentType: "image/png", cacheControl: PNG_HEADERS["Cache-Control"] } })
    .catch(() => {});
  if (cache) edgePut(cache, url, png);
  return new Response(png, { headers: { ...headers, "x-og-cache": "stored" } });
}

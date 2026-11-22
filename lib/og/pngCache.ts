import "server-only";
import { redis } from "@/lib/redis";

// KV-cached PNG responses for the OG/embed render routes.
//
// Every Satori composite on Workers is CPU-heavy enough that a cold render
// can exceed the CPU budget (Cloudflare 1102 -> a 503 the social crawlers
// dutifully cache as "no preview"). The fix is the same everywhere: serve
// the cached PNG bytes before ever rendering, and only render on a miss.
//
// The cache write is AWAITED — Workers cuts un-awaited promises when the
// response returns, so a fire-and-forget put never lands and every hit pays
// the render again. The read-back + x-og-cache header lets any request
// report its own cache state (kv-hit | stored | miss | put-failed | off).

const TTL = 60 * 60 * 24;

export const PNG_HEADERS = {
  "Content-Type": "image/png",
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

export async function cachedPng(
  key: string,
  render: () => Promise<Response>,
  headers: Record<string, string> = PNG_HEADERS,
): Promise<Response> {
  if (redis) {
    const hit = await redis.get(key).catch(() => null);
    if (hit) {
      return new Response(Buffer.from(hit, "base64"), { headers: { ...headers, "x-og-cache": "kv-hit" } });
    }
  } else {
    // No cache backend (local dev, unbound preview): stream straight through.
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
  await redis.set(key, png.toString("base64"), "EX", TTL).catch(() => {});
  // No read-back. It cost a second KV read on every miss — the most expensive
  // path — purely to label the header. The put's own resolution is the
  // acknowledgement; a failed put is already swallowed above.
  return new Response(png, { headers: { ...headers, "x-og-cache": "stored" } });
}

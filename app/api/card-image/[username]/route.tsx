import { scoutCard } from "@/lib/scout";
import { redis } from "@/lib/redis";
import { pickFlag } from "@/lib/flagPriority";
import { pickTeam } from "@/lib/teams";
import { renderCardImage, renderFallbackImage } from "@/lib/og/renderCard26";

export const runtime = "nodejs";

// Embeddable card image: gitone/<user>.png (via the next.config rewrite).
// Rendered on demand to match the in-app DriverCard, cached hard at the CDN.
// Embeds can pin a flag: <user>.png?country=nl (the rewrite keeps the query).
// A failed scout (no such user) or a render error falls back to a branded hint.

// Bump when the card treatment changes so stale cached PNGs are ignored
// instead of served past their CDN copies.
const RENDER_V = "v2";
const PNG_TTL = 60 * 60 * 24;

// Matches renderCard26's own response headers so the KV-cached bytes and a
// fresh render hand the CDN the exact same caching contract.
const PNG_HEADERS = {
  "Content-Type": "image/png",
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  // Let embeds pin a flag — a valid override wins, else the GitHub-derived one.
  const override = new URL(req.url).searchParams.get("country");
  const teamCode = new URL(req.url).searchParams.get("team");
  const cacheKey = `cardpng:${RENDER_V}:${username.toLowerCase()}:${override ?? ""}:${teamCode ?? ""}`;

  // KV-cached render: a cold Satori composite on Workers can bust the CPU
  // budget (Cloudflare 1102) before the CDN ever caches a byte, so a cold
  // embed link 503s and may even get the error cached. Serving the cached
  // PNG first makes embeds a once-a-day render instead of every cold hit.
  let debug = "no-redis";
  if (redis) {
    const hit = await redis.get(cacheKey).catch(() => null);
    if (hit) {
      return new Response(Buffer.from(hit, "base64"), { headers: { ...PNG_HEADERS, "x-cardpng": "kv-hit" } });
    }
    debug = "miss";
  }

  try {
    const card = await scoutCard(username);
    const team = pickTeam(teamCode);
    const res = await renderCardImage({
      ...card,
      country: pickFlag(override, card.country),
      ...(team
        ? {
            constructor: {
              language: null,
              name: team.name,
              code: team.code,
              color: team.color,
              ink: team.ink,
            },
          }
        : {}),
    });
    const png = Buffer.from(await res.arrayBuffer());
    // Awaited, not fire-and-forget: on Workers an un-awaited promise is cut
    // when the response returns, so the KV write must complete before we hand
    // the bytes back — otherwise nothing is ever cached and every hit pays
    // the render again (and cold renders are what trip the CPU limit).
    if (redis) {
      await redis.set(cacheKey, png.toString("base64"), "EX", PNG_TTL).catch(() => {});
      // read-back: proves whether the put actually landed in this runtime
      const stored = await redis.get(cacheKey).catch(() => null);
      debug = stored ? "stored" : "put-failed";
    }
    return new Response(png, { headers: { ...PNG_HEADERS, "x-cardpng": debug } });
  } catch {
    return await renderFallbackImage(username);
  }
}

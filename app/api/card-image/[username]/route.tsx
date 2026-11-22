import { scoutCard } from "@/lib/scout";
import { pickFlag } from "@/lib/flagPriority";
import { pickTeam } from "@/lib/teams";
import { renderCardImage, renderFallbackImage } from "@/lib/og/renderCard26";
import { cachedPng, PNG_HEADERS } from "@/lib/og/pngCache";

export const runtime = "nodejs";

// Embeddable card image: gitone/<user>.png (via the next.config rewrite).
// Embeds can pin a flag: <user>.png?country=nl (the rewrite keeps the query).
//
// A full Satori composite costs ~2s of CPU. The Workers free plan allows 10ms
// per request, so a cold render is killed outright (Cloudflare 1102 -> a 503
// the visitor sees, and a broken image in their README). Measured live: cold
// renders failed 24/24 while cached ones served 20/20.
//
// So the cold path never renders. It serves the branded fallback immediately
// (~0.2s, survivable) and the real card is filled in by the off-path warmer
// (scripts/warm.mjs), which renders on a machine with no CPU cap and writes the
// PNG to KV. The edge cache then serves it for a day.
export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  // Let embeds pin a flag — a valid override wins, else the GitHub-derived one.
  const override = new URL(req.url).searchParams.get("country");
  const teamCode = new URL(req.url).searchParams.get("team");
  // Pinned variants (README flags / team liveries) cache under their own key
  // so they never evict the plain embed.
  const lower = username.toLowerCase();
  const cacheKey = `cardpng:v6:${lower}:${override ?? ""}:${teamCode ?? ""}`;

  return cachedPng(
    cacheKey,
    async () => {
      try {
        const card = await scoutCard(username);
        const team = pickTeam(teamCode);
        return await renderCardImage({
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
      } catch {
        return await renderFallbackImage(username);
      }
    },
    PNG_HEADERS,
    // Cold miss: never render on the request path, pinned variants included —
    // they cost the same ~2s and fail the same way. The fallback is a real
    // card-shaped PNG carrying the handle, so an embed still looks intentional.
    () => renderFallbackImage(username),
  );
}

import { scoutCard } from "@/lib/scout";
import { pickFlag } from "@/lib/flagPriority";
import { pickTeam } from "@/lib/teams";
import { renderCardImage } from "@/lib/og/renderCard26";
import { cachedPng, PNG_HEADERS } from "@/lib/og/pngCache";
import { cardCacheKey } from "@/lib/og/cardCacheKey";

export const runtime = "nodejs";

// Embeddable card image: gitone/<user>.png (via the next.config rewrite).
// Embeds can pin a flag: <user>.png?country=nl (the rewrite keeps the query).
//
// A full Satori composite costs ~2s of CPU. The Workers free plan allows 10ms
// per request, so a cold render is killed outright (Cloudflare 1102 -> a 503
// the visitor sees, and a broken image in their README). Measured live: cold
// renders failed 24/24 while cached ones served 20/20.
//
// So the cold path never renders and never pretends: a missing card simply
// returns no image. The off-path warmer (scripts/warm.mjs) renders on a
// machine with no CPU cap and writes the real PNG to R2; the edge then serves
// it for a day.
export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const query = new URL(req.url).searchParams;
  // Let embeds pin a flag — a valid override wins, else the GitHub-derived one.
  const override = query.get("country");
  const teamCode = query.get("team");
  // Pinned variants (README flags / team liveries) cache under their own key
  // so they never evict the plain embed. The writer uses the same helper.
  const cacheKey = cardCacheKey(username, override, teamCode);

  const render = async () => {
    const card = await scoutCard(username);
    const team = pickTeam(teamCode);
    return renderCardImage({
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
  };

  // The warmer always wants the real render, never a cache short-circuit.
  if (process.env.GITONE_FORCE_RENDER === "1" && query.has("force")) {
    try {
      return await render();
    } catch (e) {
      console.error("[card] render failed:", username, e instanceof Error ? e.message : JSON.stringify(e).slice(0, 300));
      return new Response("render failed", { status: 500 });
    }
  }

  return cachedPng(cacheKey, render, PNG_HEADERS);
}

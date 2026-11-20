import { scoutCard } from "@/lib/scout";
import { pickFlag } from "@/lib/flagPriority";
import { pickTeam } from "@/lib/teams";
import { renderCardImage, renderFallbackImage } from "@/lib/og/renderCard26";
import { cachedPng } from "@/lib/og/pngCache";

export const runtime = "nodejs";

// Embeddable card image: gitone/<user>.png (via the next.config rewrite).
// Rendered on demand to match the in-app DriverCard. Embeds can pin a flag:
// <user>.png?country=nl (the rewrite keeps the query).
// The render is CPU-heavy; without the KV cache a cold hit re-renders every
// time and intermittently trips the Workers CPU limit (CF 1102) — the cache
// makes it a once-a-day render instead. The not-found fallback is cached too
// (under the typo'd handle's own key), which is exactly what that link's
// page shows anyway.
export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  // Let embeds pin a flag — a valid override wins, else the GitHub-derived one.
  const override = new URL(req.url).searchParams.get("country");
  const teamCode = new URL(req.url).searchParams.get("team");
  // Pinned variants (README flags / team liveries) cache under their own key
  // so they never evict the plain embed.
  const cacheKey = `cardpng:v2:${username.toLowerCase()}:${override ?? ""}:${teamCode ?? ""}`;

  return cachedPng(cacheKey, async () => {
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
  });
}

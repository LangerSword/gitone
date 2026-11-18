import { scoutCard } from "@/lib/scout";
import { pickFlag } from "@/lib/flagPriority";
import { pickTeam } from "@/lib/teams";
import { renderCardImage, renderFallbackImage } from "@/lib/og/renderCard26";

export const runtime = "nodejs";

// Embeddable card image: gitone/<user>.png (via the next.config rewrite).
// Rendered on demand to match the in-app DriverCard, cached hard at the CDN.
// Embeds can pin a flag: <user>.png?country=nl (the rewrite keeps the query).
// A failed scout (no such user) or a render error falls back to a branded hint.
export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  // Let embeds pin a flag — a valid override wins, else the GitHub-derived one.
  const override = new URL(req.url).searchParams.get("country");
  const teamCode = new URL(req.url).searchParams.get("team");
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
}

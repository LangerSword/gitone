import { scoutCard } from "@/lib/scout";
import type { GithubError } from "@/lib/github/client";
import { pickTeam } from "@/lib/teams";
import { pickFlag } from "@/lib/flagPriority";
import { mergeAwards, overrideAwards } from "@/lib/awards";

export const runtime = "nodejs";

const statusFor: Record<GithubError["type"], number> = {
  invalid: 400,
  notfound: 404,
  ratelimit: 429,
  resource: 502,
  network: 502,
  config: 500,
};

// The JSON API behind the card, the embed and the starting grid.
export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const sp = new URL(req.url).searchParams;
  try {
    const card = await scoutCard(username);
    const team = pickTeam(sp.get("team"));
    const country = pickFlag(sp.get("country"), card.country);
    const out = {
      ...card,
      country,
      ...(team
        ? { constructor: { language: null, name: team.name, code: team.code, color: team.color, ink: team.ink } }
        : {}),
      awards: mergeAwards(card.awards ?? [], overrideAwards(team?.code ?? null, country)),
    };
    return Response.json(out, {
      headers: { "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (e) {
    const err = e as GithubError;
    return Response.json(
      { error: err.type, message: err.message },
      { status: statusFor[err.type] ?? 502 },
    );
  }
}

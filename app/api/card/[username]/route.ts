import { scoutCard } from "@/lib/scout";
import type { GithubError } from "@/lib/github/client";

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
export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  try {
    const card = await scoutCard(username);
    return Response.json(card, {
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

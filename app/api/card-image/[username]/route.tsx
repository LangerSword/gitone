import { scoutCard } from "@/lib/scout";
import { pickFlag } from "@/lib/flagPriority";
import { renderCardImage, renderFallbackImage } from "@/lib/og/renderCard";

export const runtime = "nodejs";

// Embeddable card image: gitone/<user>.png (via the next.config rewrite).
// Rendered on demand to match the in-app DriverCard, cached hard at the CDN.
// Embeds can pin a flag: <user>.png?country=nl (the rewrite keeps the query).
// A failed scout (no such user) or a render error falls back to a branded hint.
export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  // Let embeds pin a flag — a valid override wins, else the GitHub-derived one.
  const override = new URL(req.url).searchParams.get("country");
  try {
    const card = await scoutCard(username);
    return await renderCardImage({ ...card, country: pickFlag(override, card.country) });
  } catch {
    return await renderFallbackImage(username);
  }
}

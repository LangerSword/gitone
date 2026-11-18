import { scoutCard } from "@/lib/scout";
import { renderCardImage, renderFallbackImage } from "@/lib/og/renderCard";

export const runtime = "nodejs";

// Embeddable card image: gitone/<user>.png (via the next.config rewrite).
// Rendered on demand to match the in-app DriverCard, cached hard at the CDN.
// A failed scout (no such user) or a render error falls back to a branded hint.
export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  try {
    const card = await scoutCard(username);
    return await renderCardImage(card);
  } catch {
    return await renderFallbackImage(username);
  }
}

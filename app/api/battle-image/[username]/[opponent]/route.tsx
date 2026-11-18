import { scoutCard } from "@/lib/scout";
import { renderBattleImage, renderBattleFallback } from "@/lib/og/renderBattle";

export const runtime = "nodejs";

// Embeddable battle image: gitone/<a>/vs/<b>.png (via the next.config rewrite).
// A broadcast race-result graphic for sharing and downloading the duel.
export async function GET(_req: Request, { params }: { params: Promise<{ username: string; opponent: string }> }) {
  const { username, opponent } = await params;
  try {
    const [a, b] = await Promise.all([scoutCard(username), scoutCard(opponent)]);
    return await renderBattleImage(a, b);
  } catch {
    return await renderBattleFallback(username, opponent);
  }
}

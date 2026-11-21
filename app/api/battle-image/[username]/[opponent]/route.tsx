import { scoutCard } from "@/lib/scout";
import { renderBattleImage, renderBattleFallback } from "@/lib/og/renderBattle";
import { cachedPng } from "@/lib/og/pngCache";

export const runtime = "nodejs";

// Embeddable battle image: gitone/<a>/vs/<b>.png (via the next.config rewrite).
// A broadcast race-result graphic for sharing and downloading the duel.
// KV-cached — the download button and the crawlers both hit this, and a cold
// Satori render is what trips the Workers CPU limit (CF 1102).
export async function GET(_req: Request, { params }: { params: Promise<{ username: string; opponent: string }> }) {
  const { username, opponent } = await params;
  return cachedPng(`poster:v5:${username.toLowerCase()}/${opponent.toLowerCase()}`, async () => {
    try {
      const [a, b] = await Promise.all([scoutCard(username), scoutCard(opponent)]);
      return await renderBattleImage(a, b);
    } catch {
      return await renderBattleFallback(username, opponent);
    }
  });
}

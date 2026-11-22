import { scoutCard } from "@/lib/scout";
import { renderBattleImage, renderBattleFallback } from "@/lib/og/renderBattle";
import { cachedPng } from "@/lib/og/pngCache";

export const runtime = "nodejs";

// Embeddable battle image: gitone/<a>/vs/<b>.png (via the next.config rewrite).
// A broadcast race-result graphic for sharing and downloading the duel.
// R2-cached — the download button and the crawlers both hit this, and a cold
// Satori render is what trips the Workers CPU limit (CF 1102).
export async function GET(req: Request, { params }: { params: Promise<{ username: string; opponent: string }> }) {
  const { username, opponent } = await params;
  const render = async () => {
    try {
      const [a, b] = await Promise.all([scoutCard(username), scoutCard(opponent)]);
      return await renderBattleImage(a, b);
    } catch (e) {
      console.error('[poster] render failed:', e instanceof Error ? e.message : JSON.stringify(e).slice(0, 300));
      return await renderBattleFallback(username, opponent);
    }
  };
  // Warmers and design verification always want the real render.
  if (process.env.GITONE_FORCE_RENDER === "1" && new URL(req.url).searchParams.has("force")) return render();

  return cachedPng(`poster:v19:${username.toLowerCase()}/${opponent.toLowerCase()}`, render);
}

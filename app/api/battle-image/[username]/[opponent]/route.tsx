import { scoutCard } from "@/lib/scout";
import { renderBattleImage } from "@/lib/og/renderBattle";
import { cachedPng } from "@/lib/og/pngCache";

export const runtime = "nodejs";

// Embeddable battle image: gitone/<a>/vs/<b>.png (via the next.config rewrite).
// A broadcast race-result graphic for sharing and downloading the duel.
// R2-cached — the download button and the crawlers both hit this, and a cold
// Satori render is what trips the Workers CPU limit (CF 1102).
export async function GET(req: Request, { params }: { params: Promise<{ username: string; opponent: string }> }) {
  const { username, opponent } = await params;
  const render = async () => {
    const [a, b] = await Promise.all([scoutCard(username), scoutCard(opponent)]);
    return renderBattleImage(a, b);
  };
  // Warmers and design verification always want the real render.
  if (process.env.GITONE_FORCE_RENDER === "1" && new URL(req.url).searchParams.has("force")) {
    try {
      return await render();
    } catch (e) {
      console.error("[poster] render failed:", e instanceof Error ? e.message : JSON.stringify(e).slice(0, 300));
      return new Response("render failed", { status: 500 });
    }
  }

  return cachedPng(`poster:v36:${username.toLowerCase()}/${opponent.toLowerCase()}`, render);
}

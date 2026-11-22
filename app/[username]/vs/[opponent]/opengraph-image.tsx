import { scoutCard } from "@/lib/scout";
import { renderBattleImage, renderBattleFallback } from "@/lib/og/renderBattle";
import { cachedPng } from "@/lib/og/pngCache";

// The battle unfurl — Next wires this into og:image / twitter:image for the
// head-to-head route automatically. The Satori composite is CPU-heavy and a
// cold render can 503 (CF 1102) right when a crawler comes to fetch — so the
// PNG is KV-cached and repeats never render again.
export const runtime = "nodejs";
export const alt = "gitone race result — two GitHub drivers head to head, sector by sector";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ username: string; opponent: string }> }) {
  const { username, opponent } = await params;
  return cachedPng(`poster:v20:${username.toLowerCase()}/${opponent.toLowerCase()}`, async () => {
    try {
      const [a, b] = await Promise.all([scoutCard(username), scoutCard(opponent)]);
      return await renderBattleImage(a, b);
    } catch {
      return await renderBattleFallback(username, opponent);
    }
  });
}

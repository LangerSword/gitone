import "server-only";
import { redis } from "./redis";

// A live tally of cards built. The cache is optional and best-effort: with
// neither REDIS_URL (Node) nor the GITONE_KV binding (Workers) the home page
// simply omits the number. Counts cache misses (a profile actually scouted),
// not page views.
const KEY = "gitone:scouts";

export async function getScoutCount(): Promise<number | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get(KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function bumpScoutCount(): void {
  if (!redis) return;
  redis.incr(KEY).catch(() => {});
}

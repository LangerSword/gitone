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

// Batched counter. KV has no atomic increment, so `incr` is a read-modify-write
// — two operations per scouted profile, on a free tier that allows 1,000
// writes a day. Accumulate locally and flush one write per interval instead.
const FLUSH_INTERVAL_MS = 60_000;
let pending = 0;
let lastFlush = 0;

export function bumpScoutCount(): void {
  const client = redis;
  if (!client) return;
  pending += 1;
  const now = Date.now();
  if (now - lastFlush < FLUSH_INTERVAL_MS) return;
  lastFlush = now;
  const delta = pending;
  pending = 0;
  client
    .get(KEY)
    .then((raw) => client.set(KEY, String((Number(raw) || 0) + delta)))
    .catch(() => {});
}

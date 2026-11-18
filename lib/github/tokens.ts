import "server-only";
import { redis } from "../redis";

// GitHub token pool. The GraphQL rate limit (~5,000 points/hr) is per
// *account*, so GITHUB_TOKENS holds tokens from distinct accounts and
// multiplies the ceiling. Selection is a stateless hash-shard on the login —
// every serverless instance computes the same choice with zero coordination,
// spreads distinct users evenly, and pins a login to one token so it composes
// with the single-flight dedup in lib/scout.
//
// Redis only enters on the *unhappy* path: each GitHub response's rate-limit
// headers are recorded per token (fire-and-forget), and when a scout's
// assigned token gets rate-limited the caller asks pickFailover for the
// healthiest other token. Redis is advisory and best-effort, never blocking
// or failing the hot path. No health data just means "assume healthy".

export interface PoolToken {
  token: string;
  idx: number;
}

interface TokenHealth {
  remaining: number;
  reset: number;
}

const HEALTH_VERSION = "v1";
const keyFor = (idx: number) => `gitone:ghtoken:${HEALTH_VERSION}:${idx}`;
const HEALTH_TTL_SECONDS = 65 * 60;
const BENCH_REMAINING = 200;
const BENCH_FALLBACK_SECONDS = 120;

// GITHUB_TOKENS (comma-separated, distinct accounts) wins; GITHUB_TOKEN alone
// still works as a pool of one.
export function tokenPool(): PoolToken[] {
  const multi = process.env.GITHUB_TOKENS;
  if (multi) {
    const tokens = multi
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length) return tokens.map((token, idx) => ({ token, idx }));
  }
  const single = process.env.GITHUB_TOKEN;
  return single ? [{ token: single, idx: 0 }] : [];
}

// FNV-1a: tiny, stable, well-spread for short strings. Lowercased so the
// casing GitHub ignores can't shard the same user onto different tokens.
export function hashLogin(login: string): number {
  const s = login.toLowerCase();
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function pickToken(login: string, pool = tokenPool()): PoolToken | null {
  if (!pool.length) return null;
  return pool[hashLogin(login) % pool.length];
}

export function recordTokenHealth(idx: number, headers: Headers): void {
  if (!redis) return;
  const remaining = headers.get("x-ratelimit-remaining");
  const reset = headers.get("x-ratelimit-reset");
  if (remaining === null || reset === null) return;
  const health: TokenHealth = { remaining: Number(remaining), reset: Number(reset) };
  if (!Number.isFinite(health.remaining) || !Number.isFinite(health.reset)) return;
  redis
    .set(keyFor(idx), JSON.stringify(health), "EX", HEALTH_TTL_SECONDS)
    .catch((e) => console.error("[tokens] health write failed:", (e as Error).message));
}

export function benchToken(idx: number, headers: Headers): void {
  if (!redis) return;
  const nowSec = Math.floor(Date.now() / 1000);
  const retryAfter = Number(headers.get("retry-after") ?? NaN);
  const reset = Number(headers.get("x-ratelimit-reset") ?? NaN);
  const until = Math.max(
    Number.isFinite(retryAfter) ? nowSec + retryAfter : 0,
    Number.isFinite(reset) ? reset : 0,
    nowSec + BENCH_FALLBACK_SECONDS,
  );
  redis
    .set(keyFor(idx), JSON.stringify({ remaining: 0, reset: until } satisfies TokenHealth), "EX", HEALTH_TTL_SECONDS)
    .catch((e) => console.error("[tokens] bench write failed:", (e as Error).message));
}

export async function pickFailover(excludeIdx: number, pool = tokenPool()): Promise<PoolToken | null> {
  const candidates = pool.filter((t) => t.idx !== excludeIdx);
  if (!candidates.length) return null;
  const client = redis;
  if (!client) return candidates[0];
  try {
    const raws = await Promise.all(candidates.map((t) => client.get(keyFor(t.idx))));
    const nowSec = Math.floor(Date.now() / 1000);
    let best: PoolToken | null = null;
    let bestRemaining = -1;
    for (let i = 0; i < candidates.length; i++) {
      let remaining = Infinity; // no data → assume healthy
      if (raws[i]) {
        const h = JSON.parse(raws[i] as string) as TokenHealth;
        remaining = nowSec >= h.reset ? Infinity : h.remaining; // past reset → refilled
      }
      if (remaining < BENCH_REMAINING) continue; // benched
      if (remaining > bestRemaining) {
        best = candidates[i];
        bestRemaining = remaining;
      }
    }
    return best;
  } catch (e) {
    console.error("[tokens] failover read failed:", (e as Error).message);
    return candidates[0];
  }
}

import "server-only";
import { cache } from "react";
import { redis } from "./redis";
import { buildCard } from "./racing/engine";
import { computeAwards } from "./awards";
import { fetchProfile, type GithubError } from "./github/client";
import { signalsFromPayload } from "./github/signals";
import type { Card } from "./racing/types";

// Read-through Redis cache for built cards — the single path every surface
// (the /<user> page, the JSON API, the embed image) uses to turn a username
// into a Card. A profile is fetched from GitHub + scored at most once per
// TTL; repeat views and README-embed regenerations are then served from
// Redis instead of each spending a handful of GitHub GraphQL calls.
//
// Best-effort throughout: a missing REDIS_URL, a cache miss, an outage or a
// parse error all fall through to a live fetch — the cache only ever changes
// speed, never behaviour. Only successful builds are stored; scout errors
// (notfound / ratelimit / …) propagate unchanged and are never cached.

const CACHE_VERSION = "v2"; // v2: cards carry the trophy cabinet
const CARD_TTL_SECONDS = 120 * 60;

const normalizeLogin = (username: string) => username.trim().replace(/^@/, "").toLowerCase();
const keyFor = (login: string) => `gitone:card:${CACHE_VERSION}:${login}`;

async function readCache(login: string): Promise<Card | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get(keyFor(login));
    return raw ? (JSON.parse(raw) as Card) : null;
  } catch (e) {
    console.error("[scout] cache read failed:", (e as Error).message);
    return null;
  }
}

async function writeCache(login: string, card: Card): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(keyFor(login), JSON.stringify(card), "EX", CARD_TTL_SECONDS);
  } catch (e) {
    console.error("[scout] cache write failed:", (e as Error).message);
  }
}

// Single-flight: concurrent scouts of the same login collapse onto one
// in-flight build, so a trending profile is one GitHub fetch, not one per
// concurrent viewer. Keyed by normalized login; entries are deleted the
// moment the build settles (success or failure) so failures are never
// memoised — the next scout retries — and the map can't grow unbounded.
// Callers never mutate the returned Card (every surface spreads it), so
// sharing one object is safe.
const inflight = new Map<string, Promise<Card>>();

async function buildFresh(username: string, login: string): Promise<Card> {
  const signals = signalsFromPayload(await fetchProfile(username));
  const card = buildCard(signals);
  card.awards = computeAwards(card, signals.active_years);
  await writeCache(login, card);
  return card;
}

// Username -> Card, Redis-cached. Throws the same GithubError as fetchProfile
// when the scout fails, so callers keep mapping it to a 404 page / error
// status / null OG exactly as before.
export async function scoutCard(username: string): Promise<Card> {
  const login = normalizeLogin(username);

  const cached = await readCache(login);
  if (cached) return cached;

  const existing = inflight.get(login);
  if (existing) return existing;

  const pending = buildFresh(username, login).finally(() => inflight.delete(login));
  inflight.set(login, pending);
  return pending;
}

// Request-memoised card load that returns the scout error instead of
// throwing, so a route's generateMetadata + Page — and a head-to-head's two
// corners — share one scout per request and render the failure state
// themselves. The cross-request Redis cache lives in scoutCard above; this
// cache() only dedupes within a single request/render pass.
export const loadCard = cache(
  async (username: string): Promise<{ card: Card } | { error: GithubError }> => {
    try {
      return { card: await scoutCard(username) };
    } catch (e) {
      return { error: e as GithubError };
    }
  },
);

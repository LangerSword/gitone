import "server-only";
import type RedisType from "ioredis";

// ---------------------------------------------------------------------------
// Cache facade shared by the card cache (lib/scout), GitHub token health
// (lib/github/tokens) and the scout counter (lib/analytics).
//
// Two backends, one tiny async API:
//   * Cloudflare Workers -> the native KV namespace bound as GITONE_KV
//   * Node / VPS         -> ioredis over REDIS_URL (unchanged)
//
// The call shape is the subset of ioredis the app already used:
//   cache.get(key)                          -> Promise<string | null>
//   cache.set(key, value, "EX", ttlSeconds) -> Promise<"OK">
//   cache.incr(key)                         -> Promise<number>
//
// Everything is best-effort: callers skip the cache when it is null and wrap
// their own errors, so no cache failure can fail a request.
// ---------------------------------------------------------------------------

export interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: "EX", ttlSeconds?: number): Promise<unknown>;
  incr(key: string): Promise<number>;
}

// The slice of the Workers KV binding we rely on. Typed structurally so this
// module does not need @cloudflare/workers-types as a direct dependency.
export interface KvBinding {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

const KV_BINDING = "GITONE_KV";

// Workers exposes WebSocketPair (and the Cloudflare-Workers user agent) as
// globals; Node has neither. Checked at module init so the Workers path never
// touches ioredis and the Node path never touches the Cloudflare adapter.
export function isWorkersRuntime(): boolean {
  const g = globalThis as typeof globalThis & { WebSocketPair?: unknown };
  if (typeof g.WebSocketPair !== "undefined") return true;
  return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
}

// Resolve the binding lazily, per call, inside the request scope: the
// adapter's AsyncLocalStorage context only exists while a Worker request is
// being handled (and `next build` / plain Node have no context at all).
async function resolveKv(): Promise<KvBinding | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    return (env as unknown as Record<string, KvBinding | undefined>)[KV_BINDING] ?? null;
  } catch {
    // No Cloudflare context (Node, static generation, unbound preview):
    // treat the cache as absent rather than failing the caller.
    return null;
  }
}

class KvCache implements CacheClient {
  constructor(private readonly resolve: () => Promise<KvBinding | null>) {}

  async get(key: string): Promise<string | null> {
    const kv = await this.resolve();
    return kv ? kv.get(key) : null;
  }

  async set(key: string, value: string, mode?: "EX", ttlSeconds?: number): Promise<"OK"> {
    const kv = await this.resolve();
    if (kv) {
      const expirationTtl = mode === "EX" && typeof ttlSeconds === "number" ? ttlSeconds : undefined;
      await kv.put(key, value, expirationTtl === undefined ? undefined : { expirationTtl });
    }
    return "OK";
  }

  async incr(key: string): Promise<number> {
    const kv = await this.resolve();
    if (!kv) return 0;
    // KV has no atomic increment. This is a best-effort read-modify-write for
    // an analytics counter, so losing a concurrent update is acceptable;
    // Node/VPS deployments keep exact counts via Redis INCR.
    const current = Number(await kv.get(key)) || 0;
    const next = current + 1;
    await kv.put(key, String(next));
    return next;
  }
}

// Exported for tests: build a KV-backed facade over an injected binding.
export function createKvCache(resolve: () => Promise<KvBinding | null> = resolveKv): CacheClient {
  return new KvCache(resolve);
}

// One shared connection, stashed on globalThis so dev HMR doesn't leak sockets.
declare global {
  var __gitoneRedis: CacheClient | null | undefined;
}

// Thin adapter so the facade's narrow signature is decoupled from ioredis's
// large overload set (callbacks, NX/XX, …). Only the three calls we use pass
// through; everything else stays a plain ioredis client on Node/VPS.
class RedisCache implements CacheClient {
  constructor(private readonly client: RedisType) {}

  get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  set(key: string, value: string, mode?: "EX", ttlSeconds?: number): Promise<unknown> {
    return mode === "EX" && typeof ttlSeconds === "number"
      ? this.client.set(key, value, "EX", ttlSeconds)
      : this.client.set(key, value);
  }

  incr(key: string): Promise<number> {
    return this.client.incr(key);
  }
}

async function createRedis(): Promise<CacheClient | null> {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  // ioredis is Node-only (TCP sockets). Import it lazily so edge/Workers
  // bundles never pull in node:net — on Workers REDIS_URL is unused and the
  // KV path below is selected instead.
  const { default: Redis } = await import("ioredis");
  const client = new Redis(url, {
    // Self-signed dev/VPS certs: TLS encryption stays ON, only chain
    // verification is skipped (traffic remains encrypted end to end).
    // Redis is optional best-effort here — no REDIS_URL means no client at all.
    tls: url.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
    maxRetriesPerRequest: 2,
    commandTimeout: 2000,
  });
  client.on("error", (e) => console.error("[redis]", e.message));
  return new RedisCache(client);
}

async function createCache(): Promise<CacheClient | null> {
  // Workers first: REDIS_URL is meaningless there, and the KV binding is the
  // only cache that actually works on that runtime.
  if (isWorkersRuntime()) return createKvCache();
  return createRedis();
}

export const redis: CacheClient | null =
  globalThis.__gitoneRedis !== undefined ? globalThis.__gitoneRedis : (globalThis.__gitoneRedis = await createCache());

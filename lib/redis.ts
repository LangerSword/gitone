import "server-only";
import type RedisType from "ioredis";

// One shared connection, stashed on globalThis so dev HMR doesn't leak sockets.
declare global {
  var __gitoneRedis: RedisType | null | undefined;
}

async function create(): Promise<RedisType | null> {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  // ioredis is Node-only (TCP sockets). Import it lazily so edge/Workers
  // bundles never pull in node:net — on Workers REDIS_URL is unset, so this
  // branch never runs and Redis stays disabled (the app scouts GitHub direct).
  // No library swap: Node/VPS deployments with REDIS_URL still use ioredis.
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
  return client;
}

export const redis: RedisType | null =
  globalThis.__gitoneRedis !== undefined ? globalThis.__gitoneRedis : (globalThis.__gitoneRedis = await create());

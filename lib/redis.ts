import "server-only";
import Redis from "ioredis";

// One shared connection, stashed on globalThis so dev HMR doesn't leak sockets.
declare global {
  var __gitoneRedis: Redis | null | undefined;
}

function create(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
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

export const redis: Redis | null =
  globalThis.__gitoneRedis !== undefined ? globalThis.__gitoneRedis : (globalThis.__gitoneRedis = create());

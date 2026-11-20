import { afterEach, describe, expect, it, vi } from "vitest";

// lib/redis.ts is server-only; strip the guard so the facade can be exercised
// in the Node test environment.
vi.mock("server-only", () => ({}));

// Stand-in for the adapter's request-scoped context. Values declared via
// vi.hoisted so the mock factory (hoisted above imports) can see them.
const cf = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    store,
    getCloudflareContext: vi.fn(async () => ({
      env: {
        GITONE_KV: {
          async get(key: string) {
            return store.get(key) ?? null;
          },
          async put(key: string, value: string) {
            store.set(key, value);
          },
        },
      },
    })),
  };
});

vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: cf.getCloudflareContext }));

import { createKvCache, isWorkersRuntime, redis, type KvBinding } from "@/lib/redis";

interface PutRecord {
  key: string;
  value: string;
  expirationTtl?: number;
}

function fakeKv(seed: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(seed));
  const puts: PutRecord[] = [];
  const kv: KvBinding = {
    async get(key) {
      return store.get(key) ?? null;
    },
    async put(key, value, options) {
      store.set(key, value);
      puts.push({ key, value, expirationTtl: options?.expirationTtl });
    },
  };
  return { kv, puts, store };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("KV cache facade (Workers backend)", () => {
  it("reads and writes through the bound namespace with an EX TTL", async () => {
    const { kv, puts } = fakeKv();
    const cache = createKvCache(async () => kv);

    await expect(cache.set("gitone:card:v4:octocat", '{"login":"octocat"}', "EX", 7200)).resolves.toBe("OK");
    expect(puts).toEqual([{ key: "gitone:card:v4:octocat", value: '{"login":"octocat"}', expirationTtl: 7200 }]);
    await expect(cache.get("gitone:card:v4:octocat")).resolves.toBe('{"login":"octocat"}');
    await expect(cache.get("gitone:card:v4:missing")).resolves.toBeNull();
  });

  it("increments the analytics counter with a read-modify-write", async () => {
    const { kv, store } = fakeKv({ "gitone:scouts": "41" });
    const cache = createKvCache(async () => kv);

    await expect(cache.incr("gitone:scouts")).resolves.toBe(42);
    await expect(cache.incr("gitone:scouts")).resolves.toBe(43);
    expect(store.get("gitone:scouts")).toBe("43");
    await expect(cache.incr("gitone:fresh")).resolves.toBe(1);
  });

  it("resolves the GITONE_KV binding from the adapter request context", async () => {
    const cache = createKvCache();

    await cache.set("gitone:adapter", "yes", "EX", 600);
    expect(cf.store.get("gitone:adapter")).toBe("yes");
    expect(cf.getCloudflareContext).toHaveBeenCalled();
    await expect(cache.get("gitone:adapter")).resolves.toBe("yes");
  });

  it("degrades to a no-op when the binding is absent", async () => {
    const cache = createKvCache(async () => null);

    await expect(cache.get("any")).resolves.toBeNull();
    await expect(cache.set("any", "value", "EX", 60)).resolves.toBe("OK");
    await expect(cache.incr("any")).resolves.toBe(0);
  });

  it("detects the Workers runtime from the WebSocketPair global", () => {
    expect(isWorkersRuntime()).toBe(false);
    vi.stubGlobal("WebSocketPair", class {});
    expect(isWorkersRuntime()).toBe(true);
  });

  it("leaves the cache off on Node without REDIS_URL", () => {
    expect(redis).toBeNull();
  });
});

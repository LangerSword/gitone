import { beforeEach, describe, expect, it, vi } from "vitest";
import { canWarmQueryVariant } from "../lib/prefs";

const m = vi.hoisted(() => {
  const store = {
    head: vi.fn(async () => null),
    put: vi.fn(async (key: string) => { void key; }),
  };
  return {
    store,
    cachedPng: vi.fn(
      async (key: string) =>
        new Response(null, { status: 404, headers: { "x-test-read-key": key } }),
    ),
  };
});

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({ env: { GITONE_PNGS: m.store } }),
}));
vi.mock("@/lib/og/pngCache", () => ({ cachedPng: m.cachedPng, PNG_HEADERS: {} }));
vi.mock("@/lib/scout", () => ({ scoutCard: vi.fn() }));
vi.mock("@/lib/og/renderCard26", () => ({ renderCardImage: vi.fn() }));

async function readKey(query: string): Promise<string | null> {
  const { GET } = await import("../app/api/card-image/[username]/route");
  const res = await GET(
    new Request(`http://localhost/torvalds.png${query}`),
    { params: Promise.resolve({ username: "torvalds" }) },
  );
  return res.headers.get("x-test-read-key");
}

async function writeKey(query: string): Promise<string | undefined> {
  const { POST } = await import("../app/api/cache-image/route");
  m.store.put.mockClear();
  const res = await POST(
    new Request(`http://localhost/api/cache-image?${query}`, {
      method: "POST",
      body: new Uint8Array(300_000).buffer,
    }),
  );
  expect(res.status).toBe(201);
  return m.store.put.mock.calls[0]?.[0] as string | undefined;
}

describe("pinned card variant warm writes", () => {
  beforeEach(() => {
    m.store.put.mockClear();
    m.cachedPng.mockClear();
  });

  it("writes the exact key the card route reads for a pinned flag and team", async () => {
    const read = await readKey("?country=nl&team=FER");
    const written = await writeKey("kind=card&login=torvalds&country=nl&team=FER");
    expect(written).toBe(read);
  });

  it("keeps the plain card key separate from a pinned variant", async () => {
    const plain = await writeKey("kind=card&login=torvalds");
    const pinned = await writeKey("kind=card&login=torvalds&country=nl");
    expect(pinned).not.toBe(plain);
  });

  it("resolves raw embed values to the same key as the page's normalised variant", async () => {
    const embedded = await readKey("?country=NL&team=fer");
    const warmed = await writeKey("kind=card&login=torvalds&country=nl&team=FER");
    expect(warmed).toBe(embedded);
  });

  it("matches a team-only query without injecting a resolved country", async () => {
    const embedded = await readKey("?team=FER");
    const warmed = await writeKey("kind=card&login=torvalds&team=FER");
    expect(warmed).toBe(embedded);
  });

  it("matches the plain embed when the page has no variant query", async () => {
    const embedded = await readKey("");
    const warmed = await writeKey("kind=card&login=torvalds");
    expect(warmed).toBe(embedded);
  });
});

describe("cookie-selected variant warm eligibility", () => {
  it("skips the warm when a stored team is absent from the query", () => {
    expect(
      canWarmQueryVariant({
        countryQuery: true,
        teamQuery: false,
        cookieCountry: null,
        cookieTeam: "FER",
      }),
    ).toBe(false);
  });

  it("skips the warm when a stored country is absent from the query", () => {
    expect(
      canWarmQueryVariant({
        countryQuery: false,
        teamQuery: true,
        cookieCountry: "nl",
        cookieTeam: null,
      }),
    ).toBe(false);
  });

  it("warms when the query describes both variants or no variant is stored", () => {
    expect(
      canWarmQueryVariant({
        countryQuery: true,
        teamQuery: true,
        cookieCountry: "nl",
        cookieTeam: "FER",
      }),
    ).toBe(true);
    expect(
      canWarmQueryVariant({ countryQuery: false, teamQuery: false }),
    ).toBe(true);
  });
});

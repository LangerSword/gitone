import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const store = new Map<string, string>();
vi.mock("@/lib/redis", () => ({
  redis: {
    get: async (k: string) => store.get(k) ?? null,
    set: async (k: string, v: string) => { store.set(k, v); },
  },
}));

import { fetchProfile } from "@/lib/github/client";

const NOW = new Date("2026-11-22T12:00:00Z");
const LOGIN = "teknium1";
const YEAR = 365 * 86_400_000;
const QUARTER = YEAR / 4;
const FROM = new Date(NOW.getTime() - YEAR).toISOString();
const TO = new Date(NOW.getTime() - YEAR + QUARTER).toISOString();
const FROM_Q = `from: \\"${FROM}\\"`;
const TO_Q = `to: \\"${TO}\\"`;
const headers = { "x-ratelimit-remaining": "4999", "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 3600) };
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers });
const bad = () => new Response("upstream timeout", { status: 504, headers });
const basics = {
  login: LOGIN, name: "Teknium", avatarUrl: "https://example.com/a.png",
  location: null, createdAt: "2023-03-07T00:00:00Z",
  followers: { totalCount: 7 },
  repositories: { totalCount: 0, nodes: [] },
};
const recent = {
  totalCommitContributions: 3, totalPullRequestContributions: 1,
  totalPullRequestReviewContributions: 1, totalIssueContributions: 1,
  restrictedContributionsCount: 0, commitContributionsByRepository: [],
  contributionCalendar: { weeks: [] },
};

beforeEach(() => { store.clear(); vi.stubEnv("GITHUB_TOKEN", "tokA"); vi.stubEnv("GITHUB_TOKENS", ""); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("fetchProfile network fallback", () => {
  it("rebuilds from quarter-year windows after a 504 on the full profile query", async () => {
    const windows: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: unknown, init?: RequestInit) => {
      const body = String(init?.body);
      if (body.includes("query Profile")) return bad();
      if (body.includes("query Basics")) return ok({ data: { user: basics } });
      if (body.includes("query RecentWindow")) {
        const m = body.match(/from: \\\"([^"]+)\\\", to: \\\"([^"]+)\\\"/);
        if (m) windows.push(`${m[1]}/${m[2]}`);
        return ok({ data: { user: { recent } } });
      }
      return ok({ data: { user: {} } });
    }));

    const payload = await fetchProfile(LOGIN, NOW);
    expect(payload.login).toBe(LOGIN);
    expect(windows.length).toBe(4);
  }, 30_000);

  it("splits a quarter that times out instead of failing the scout", async () => {
    let attempts = 0;
    const bodies: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: unknown, init?: RequestInit) => {
      const body = String(init?.body);
      bodies.push(body);
      if (body.includes("query Profile")) return bad();
      if (body.includes("query Basics")) return ok({ data: { user: basics } });
      if (body.includes("query RecentWindow")) {
        if (body.includes(FROM_Q) && body.includes(TO_Q) && attempts++ < 2) return bad();
        return ok({ data: { user: { recent } } });
      }
      return ok({ data: { user: {} } });
    }));

    const payload = await fetchProfile(LOGIN, NOW);
    expect(payload.login).toBe(LOGIN);
    expect(attempts).toBe(2);
    expect(bodies.filter((b) => b.includes("query RecentWindow")).length).toBeGreaterThan(4);
  }, 30_000);
});

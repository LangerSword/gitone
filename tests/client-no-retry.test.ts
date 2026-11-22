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
const LOGIN = "heavyuser";
const headers = { "x-ratelimit-remaining": "4999", "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 3600) };
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers });
const bad = () => new Response("upstream timeout", { status: 504, headers });
const basics = {
  login: LOGIN, name: "Heavy User", avatarUrl: "https://example.com/a.png",
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

describe("fetchProfile heavy-query budget", () => {
  it("does not retry a 504 on the full profile query before falling back", async () => {
    let profileCalls = 0;
    vi.stubGlobal("fetch", vi.fn(async (_url: unknown, init?: RequestInit) => {
      const body = String(init?.body);
      if (body.includes("query Profile")) { profileCalls++; return bad(); }
      if (body.includes("query Basics")) return ok({ data: { user: basics } });
      if (body.includes("query RecentWindow")) return ok({ data: { user: { recent } } });
      return ok({ data: { user: {} } });
    }));

    const payload = await fetchProfile(LOGIN, NOW);
    expect(payload.login).toBe(LOGIN);
    expect(profileCalls).toBe(1);
  }, 30_000);
});

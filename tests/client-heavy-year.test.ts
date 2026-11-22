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
const headers = { "x-ratelimit-remaining": "4999", "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 3600) };
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers });

const user = {
  login: LOGIN,
  name: "Teknium",
  avatarUrl: "https://example.com/a.png",
  location: null,
  createdAt: "2023-03-07T00:00:00Z",
  followers: { totalCount: 7 },
  repositories: { totalCount: 0, nodes: [] },
  recent: {
    totalCommitContributions: 3,
    totalPullRequestContributions: 1,
    totalPullRequestReviewContributions: 1,
    totalIssueContributions: 1,
    restrictedContributionsCount: 0,
    commitContributionsByRepository: [],
    contributionCalendar: { weeks: [] },
  },
};

const yearContrib = (commits: number) => ({
  totalCommitContributions: commits,
  totalPullRequestContributions: 1,
  totalPullRequestReviewContributions: 2,
  totalIssueContributions: 3,
  restrictedContributionsCount: 4,
});
const fullYear = (y: number) => ({
  [`y${y}`]: yearContrib(10),
});

beforeEach(() => { store.clear(); vi.stubEnv("GITHUB_TOKEN", "tokA"); vi.stubEnv("GITHUB_TOKENS", ""); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("fetchProfile heavy current year", () => {
  it("rebuilds a dropped current year from windowed queries instead of omitting it", async () => {
    const windows: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: unknown, init?: RequestInit) => {
      const body = String(init?.body);
      if (body.includes("query Profile")) return ok({ data: { user } });
      if (body.includes("query Lifetime")) {
        // GitHub drops the heavy current year from the aliased batch.
        return ok({ data: { user: { ...fullYear(2023), ...fullYear(2024), ...fullYear(2025) } } });
      }
      if (body.includes("query YearWindow")) {
        const m = body.match(/from: \\"([^"]+)\\", to: \\"([^"]+)\\"/);
        if (m) windows.push(`${m[1]}/${m[2]}`);
        return ok({ data: { user: { y: yearContrib(10) } } });
      }
      return ok({ data: { user: {} } });
    }));

    const payload = await fetchProfile(LOGIN, NOW);
    const y2026 = payload.years.find((y) => y.year === 2026);
    expect(y2026).toBeDefined();
    expect(y2026?.commits).toBe(40);
    expect(y2026?.restricted).toBe(16);
    expect(windows.length).toBe(4);
  }, 30_000);
});

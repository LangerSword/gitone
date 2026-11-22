import "server-only";
import { tokenPool, pickToken, pickFailover, recordTokenHealth, benchToken, type PoolToken } from "./tokens";
import type { YearBreakdown } from "@/lib/racing/types";

// Server-only GitHub client, on the GraphQL API (api.github.com/graphql).
// GraphQL is authenticated-only, so a token is REQUIRED — which also puts
// us on the ~5,000 req/hr tier instead of the ~60/hr unauthenticated REST tier.
// Tokens come from the pool in ./tokens (GITHUB_TOKENS, or GITHUB_TOKEN as a
// pool of one): each scout is hash-sharded to one token, with a single
// failover retry if that token turns out to be rate-limited.
//
// Lifetime contributions need one contributionsCollection window per calendar
// year (each window must span ≤1yr). GitHub's resolver times out (~10s) if too
// many windows share a request, so we fetch the profile in one fast query,
// then the years in small parallel batches with a retry — and tolerate a
// dropped batch (the figure is only used log-scaled, so a missing year barely
// moves it).
//
// GitHub also rejects contributionsCollection outright (RESOURCE_LIMITS_EXCEEDED)
// when the window holds too many contribution events. Only hyperactive
// profiles trip it, but for them the one-shot profile query dies — so
// fetchProfile falls back to rebuilding the same payload from date-windowed
// slices, each small enough to fit the budget (see fetchProfileWindowed).

export type GithubErrorType =
  | "invalid"
  | "notfound"
  | "resource"
  | "ratelimit"
  | "network"
  | "config";

export interface GithubError {
  type: GithubErrorType;
  message: string;
  // True for a 5xx or request timeout: the cheap windowed rebuild can cure
  // these, while a 404, bad token or GraphQL error cannot.
  fallbackable?: boolean;
}

export interface RawRepo {
  stars: number;
  language: string | null;
  createdAt: string;
  pushedAt: string;
}

export interface RawRepoLanguage {
  language: string | null;
}

// Flat, normalized profile — all fields below are real GitHub data.
export interface RawPayload {
  login: string;
  name: string | null;
  avatarUrl: string;
  location: string | null;
  createdAt: string;
  followers: number;
  publicRepos: number;
  repos: RawRepo[];
  languageRepos: RawRepoLanguage[];
  recentCommits: number; // the "recent" fields cover the last 365 days
  recentPRs: number;
  recentReviews: number;
  recentIssues: number;
  recentRestricted: number; // last-year private contributions (count only)
  recentActiveDays: number;
  contributionCalendarWeeks: number[]; // per-week lap totals, oldest first
  lifetimeContributions: number;
  years: YearBreakdown[];
}

const ENDPOINT = "https://api.github.com/graphql";
const VALID = /^(?=.*[a-z\d])[a-z\d-]{1,39}$/i;
const GITHUB_EPOCH_YEAR = 2008;
const LIFETIME_BATCH = 4;
const MIN_CONTRIBUTED_LANG_COMMITS = 3;
const REQUEST_TIMEOUT_MS = 8_000;

const fail = (type: GithubErrorType, message: string, fallbackable = false): never => {
  throw { type, message, ...(fallbackable ? { fallbackable: true } : {}) } satisfies GithubError;
};

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

// --- GraphQL response shapes (only the fields we read) ---
interface UserNode {
  login: string;
  name: string | null;
  avatarUrl: string;
  location: string | null;
  createdAt: string;
  followers: { totalCount: number };
  repositories: {
    totalCount: number;
    nodes: {
      nameWithOwner: string;
      stargazerCount: number;
      primaryLanguage: { name: string } | null;
      createdAt: string;
      pushedAt: string;
    }[];
  };
  recent: {
    totalCommitContributions: number;
    totalPullRequestContributions: number;
    totalPullRequestReviewContributions: number;
    totalIssueContributions: number;
    restrictedContributionsCount: number;
    commitContributionsByRepository: {
      contributions: { totalCount: number };
      repository: {
        nameWithOwner: string;
        isFork: boolean;
        isPrivate: boolean;
        primaryLanguage: { name: string } | null;
      };
    }[];
    contributionCalendar: {
      weeks: { contributionDays: { contributionCount: number }[] }[];
    };
  };
}

interface YearContrib {
  totalCommitContributions: number;
  totalIssueContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
  restrictedContributionsCount: number;
}

// POSTs a query, retrying transient failures. Terminal failures (bad token,
// not found, rate limit) throw a GithubError; success returns the user node.
async function gql<T>(
  query: string,
  login: string,
  tok: PoolToken,
  retries = 1,
): Promise<{ user: T | null }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    let res: Response;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    try {
      res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tok.token}`,
          "Content-Type": "application/json",
          "User-Agent": "gitone-scout/1.0",
        },
        body: JSON.stringify({ query, variables: { login } }),
        signal: ctrl.signal,
      });
    } catch {
      if (attempt < retries) {
        await delay();
        continue;
      }
      return fail("network", "Couldn't reach GitHub — check your connection.", true);
    } finally {
      clearTimeout(timer);
    }

    recordTokenHealth(tok.idx, res.headers); // fire-and-forget, never blocks

    if (res.status === 401) return fail("config", "GitHub token is invalid or expired.");
    if (res.status === 403 || res.status === 429) {
      benchToken(tok.idx, res.headers);
      return fail("ratelimit", "GitHub rate limit hit. Try again shortly.");
    }
    if (res.status >= 500) {
      if (attempt < retries) {
        await delay();
        continue;
      }
      return fail("network", `GitHub is unavailable (${res.status}).`, true);
    }
    if (!res.ok) return fail("network", `GitHub returned an error (${res.status}).`);

    let body: { data?: { user: T | null }; errors?: { type?: string; message?: string }[] };
    try {
      body = await res.json();
    } catch {
      if (attempt < retries) {
        await delay();
        continue;
      }
      return fail("network", "GitHub returned a malformed response.");
    }

    if (body.errors?.some((e) => e.type === "RATE_LIMITED" || e.type === "RATE_LIMIT")) {
      benchToken(tok.idx, res.headers);
      return fail("ratelimit", "GitHub rate limit hit. Try again shortly.");
    }
    if (body.errors?.length && !body.data?.user) {
      if (body.errors.every((e) => e.type === "NOT_FOUND")) return { user: null };
      if (body.errors.some((e) => e.type === "RESOURCE_LIMITS_EXCEEDED"))
        return fail("resource", "This profile's contribution history is too heavy for one query.");
      return fail("network", body.errors[0]?.message ?? "GitHub returned a GraphQL error.");
    }
    return { user: body.data?.user ?? null };
  }
  return fail("network", "GitHub request failed."); // unreachable; satisfies the type checker
}

function profileQuery(): string {
  return `
    query Profile($login: String!) {
      user(login: $login) {
        login
        name
        avatarUrl(size: 960)
        location
        createdAt
        followers { totalCount }
        repositories(ownerAffiliations: OWNER, isFork: false, first: 100, orderBy: { field: STARGAZERS, direction: DESC }) {
          totalCount
          nodes { nameWithOwner stargazerCount primaryLanguage { name } createdAt pushedAt }
        }
        recent: contributionsCollection {
          totalCommitContributions
          totalPullRequestContributions
          totalPullRequestReviewContributions
          totalIssueContributions
          restrictedContributionsCount
          commitContributionsByRepository(maxRepositories: 100) {
            contributions { totalCount }
            repository { nameWithOwner isFork isPrivate primaryLanguage { name } }
          }
          contributionCalendar { weeks { contributionDays { contributionCount } } }
        }
      }
    }`;
}

type RecentNode = UserNode["recent"];
type BasicsNode = Omit<UserNode, "recent">;

const RECENT_YEAR_MS = 365 * 86_400_000;
const RECENT_WINDOW_SPLITS = 2;

function basicsQuery(): string {
  return `
    query Basics($login: String!) {
      user(login: $login) {
        login
        name
        avatarUrl(size: 960)
        location
        createdAt
        followers { totalCount }
        repositories(ownerAffiliations: OWNER, isFork: false, first: 100, orderBy: { field: STARGAZERS, direction: DESC }) {
          totalCount
          nodes { nameWithOwner stargazerCount primaryLanguage { name } createdAt pushedAt }
        }
      }
    }`;
}

function recentWindowQuery(fromIso: string, toIso: string): string {
  return `
    query RecentWindow($login: String!) {
      user(login: $login) {
        recent: contributionsCollection(from: "${fromIso}", to: "${toIso}") {
          totalCommitContributions
          totalPullRequestContributions
          totalPullRequestReviewContributions
          totalIssueContributions
          restrictedContributionsCount
          commitContributionsByRepository(maxRepositories: 100) {
            contributions { totalCount }
            repository { nameWithOwner isFork isPrivate primaryLanguage { name } }
          }
          contributionCalendar { weeks { contributionDays { contributionCount } } }
        }
      }
    }`;
}

function emptyRecent(): RecentNode {
  return {
    totalCommitContributions: 0,
    totalPullRequestContributions: 0,
    totalPullRequestReviewContributions: 0,
    totalIssueContributions: 0,
    restrictedContributionsCount: 0,
    commitContributionsByRepository: [],
    contributionCalendar: { weeks: [] },
  };
}

function combineRecent(parts: RecentNode[]): RecentNode {
  const out = emptyRecent();
  const byRepo = new Map<
    string,
    RecentNode["commitContributionsByRepository"][number]
  >();
  for (const p of parts) {
    out.totalCommitContributions += p.totalCommitContributions;
    out.totalPullRequestContributions += p.totalPullRequestContributions;
    out.totalPullRequestReviewContributions += p.totalPullRequestReviewContributions;
    out.totalIssueContributions += p.totalIssueContributions;
    out.restrictedContributionsCount += p.restrictedContributionsCount;
    out.contributionCalendar.weeks.push(...p.contributionCalendar.weeks);
    for (const c of p.commitContributionsByRepository ?? []) {
      const seen = byRepo.get(c.repository.nameWithOwner);
      if (seen) seen.contributions.totalCount += c.contributions.totalCount;
      else
        byRepo.set(c.repository.nameWithOwner, {
          contributions: { totalCount: c.contributions.totalCount },
          repository: c.repository,
        });
    }
  }
  out.commitContributionsByRepository = [...byRepo.values()];
  return out;
}

async function fetchRecentWindow(
  login: string,
  tok: PoolToken,
  from: Date,
  to: Date,
  splitsLeft: number,
): Promise<RecentNode> {
  try {
    const { user } = await gql<{ recent: RecentNode }>(
      recentWindowQuery(from.toISOString(), to.toISOString()),
      login,
      tok,
    );
    return user?.recent ?? emptyRecent();
  } catch (e) {
    const err = e as GithubError;
    // Resource, 5xx or timeout on a wide window all mean one request has too
    // much work. Halve and retry; zero the slice only at the floor.
    if (err.type !== "resource" && !err.fallbackable) throw e;
    if (splitsLeft === 0) return emptyRecent(); // over budget at the floor — zeros beat no card
    const mid = new Date((from.getTime() + to.getTime()) / 2);
    const left = await fetchRecentWindow(login, tok, from, mid, splitsLeft - 1);
    const right = await fetchRecentWindow(login, tok, new Date(mid.getTime() + 1), to, splitsLeft - 1);
    return combineRecent([left, right]);
  }
}

async function fetchProfileWindowed(
  login: string,
  tok: PoolToken,
  now: Date,
): Promise<UserNode | null> {
  const { user } = await gql<BasicsNode>(basicsQuery(), login, tok);
  if (!user) return null;
  // Start the fallback at quarter-year slices; heavy profiles blow the 8s
  // budget on half-year windows, then spend another 8s on each retry.
  const sliceMs = RECENT_YEAR_MS / 4;
  const from = new Date(now.getTime() - RECENT_YEAR_MS);
  const parts: RecentNode[] = [];
  for (let i = 0; i < 4; i++) {
    const start = new Date(from.getTime() + i * sliceMs + (i ? 1 : 0));
    const end = new Date(from.getTime() + (i + 1) * sliceMs);
    parts.push(await fetchRecentWindow(login, tok, start, end, RECENT_WINDOW_SPLITS));
  }
  return { ...user, recent: combineRecent(parts) };
}

function lifetimeQuery(years: number[], currentYear: number, nowIso: string): string {
  const aliases = years
    .map((y) => {
      const to = y === currentYear ? nowIso : `${y}-12-31T23:59:59Z`;
      return `        y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${to}") { totalCommitContributions totalIssueContributions totalPullRequestContributions totalPullRequestReviewContributions restrictedContributionsCount }`;
    })
    .join("\n");
  return `
    query Lifetime($login: String!) {
      user(login: $login) {
${aliases}
      }
    }`;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export const yearTotal = (y: YearBreakdown) =>
  y.commits + y.prs + y.reviews + y.issues + y.restricted;

// Every year's contribution breakdown — the substrate for the lifetime total.
// Each batch is best-effort: a year that fails after its retry is OMITTED
// (not zeroed), so "quiet year" stays distinguishable from "unknown year".
async function fetchYears(
  login: string,
  tok: PoolToken,
  createdYear: number,
  currentYear: number,
  nowIso: string,
): Promise<YearBreakdown[]> {
  const wanted: number[] = [];
  for (let y = Math.max(createdYear, GITHUB_EPOCH_YEAR); y <= currentYear; y++) wanted.push(y);

  const yearRows = async (batch: number[]): Promise<YearBreakdown[]> => {
    const { user } = await gql<Record<string, YearContrib | null>>(
      lifetimeQuery(batch, currentYear, nowIso),
      login,
      tok,
      0, // the year-by-year fallback below is safer than a blind retry
    );
    if (!user) return [];
    return batch.flatMap((y) => {
      const c = user[`y${y}`];
      if (!c) return [];
      return [{
        year: y,
        commits: c.totalCommitContributions,
        prs: c.totalPullRequestContributions,
        reviews: c.totalPullRequestReviewContributions,
        issues: c.totalIssueContributions,
        restricted: c.restrictedContributionsCount,
      }];
    });
  };

  const rows = await Promise.all(
    chunk(wanted, LIFETIME_BATCH).map(async (batch) => {
      try {
        return await yearRows(batch);
      } catch {
        // Aliased years pool their resource cost, so one hyperactive year
        // sinks its whole batch — retry each year alone and drop only the
        // truly over-budget years.
        const singles = await Promise.all(
          batch.map((y) => yearRows([y]).catch(() => [] as YearBreakdown[])),
        );
        return singles.flat();
      }
    }),
  );
  return rows.flat().sort((a, b) => a.year - b.year);
}

export async function fetchProfile(username: string, now = new Date()): Promise<RawPayload> {
  const login = username.trim().replace(/^@/, "");
  if (!VALID.test(login)) return fail("invalid", "That doesn't look like a GitHub username.");

  const pool = tokenPool();
  if (!pool.length) return fail("config", "Server is missing a GitHub token.");

  let tok = pickToken(login, pool) as PoolToken;

  const fetchUser = async (t: PoolToken): Promise<UserNode | null> => {
    try {
      const { user } = await gql<UserNode>(profileQuery(), login, t, 0);
      return user;
    } catch (e) {
      const err = e as GithubError;
      // A 5xx or 8s abort on the full-year query is the heavy-profile failure
      // the cheap basics + windowed rebuild is designed to answer.
      if (err.type !== "resource" && !err.fallbackable) throw e;
      return fetchProfileWindowed(login, t, now);
    }
  };

  let user: UserNode | null;
  try {
    user = await fetchUser(tok);
  } catch (e) {
    // Only a rate limit is cured by another token — retry once on the
    // healthiest token, if the pool has one.
    if ((e as GithubError).type !== "ratelimit" || pool.length < 2) throw e;
    const fallback = await pickFailover(tok.idx, pool);
    if (!fallback) throw e; // every other token is benched too
    tok = fallback;
    user = await fetchUser(tok);
  }
  if (!user) return fail("notfound", "No GitHub user by that name.");

  const createdYear = new Date(user.createdAt).getUTCFullYear();
  const years = await fetchYears(
    login,
    tok,
    createdYear,
    now.getUTCFullYear(),
    now.toISOString(),
  );

  return normalize(user, years);
}

function normalize(user: UserNode, years: YearBreakdown[]): RawPayload {
  const lifetimeContributions = years.reduce((s, y) => s + yearTotal(y), 0);
  const repos: RawRepo[] = user.repositories.nodes.map((n) => ({
    stars: n.stargazerCount ?? 0,
    language: n.primaryLanguage?.name ?? null,
    createdAt: n.createdAt,
    pushedAt: n.pushedAt,
  }));

  // Language diversity is scored over the UNION of the repos a user *owns*
  // and the public repos they've recently *committed to*, deduped by repo.
  const languageByRepo = new Map<string, string | null>();
  for (const n of user.repositories.nodes) {
    languageByRepo.set(n.nameWithOwner, n.primaryLanguage?.name ?? null);
  }
  for (const c of user.recent.commitContributionsByRepository ?? []) {
    const r = c.repository;
    if (r.isFork || r.isPrivate || !r.primaryLanguage) continue;
    if (c.contributions.totalCount < MIN_CONTRIBUTED_LANG_COMMITS) continue;
    if (languageByRepo.has(r.nameWithOwner)) continue;
    languageByRepo.set(r.nameWithOwner, r.primaryLanguage.name);
  }
  const languageRepos: RawRepoLanguage[] = [...languageByRepo.values()].map((language) => ({ language }));

  const recentActiveDays = user.recent.contributionCalendar.weeks.reduce(
    (days, w) => days + w.contributionDays.filter((d) => d.contributionCount > 0).length,
    0,
  );
  const contributionCalendarWeeks = user.recent.contributionCalendar.weeks.map(
    (w) => w.contributionDays.reduce((s, d) => s + d.contributionCount, 0),
  );

  return {
    login: user.login,
    name: user.name,
    avatarUrl: user.avatarUrl,
    location: user.location,
    createdAt: user.createdAt,
    followers: user.followers.totalCount,
    publicRepos: user.repositories.totalCount,
    repos,
    languageRepos,
    recentCommits: user.recent.totalCommitContributions,
    recentPRs: user.recent.totalPullRequestContributions,
    recentReviews: user.recent.totalPullRequestReviewContributions,
    recentIssues: user.recent.totalIssueContributions,
    recentRestricted: user.recent.restrictedContributionsCount,
    recentActiveDays,
    contributionCalendarWeeks,
    lifetimeContributions,
    years,
  };
}

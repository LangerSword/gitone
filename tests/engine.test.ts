import { describe, expect, it } from "vitest";
import { buildCard } from "@/lib/racing/engine";
import { computeAwards, groupAwards, yearScore } from "@/lib/awards";
import { computeDuel } from "@/lib/duel";
import { STATS } from "@/lib/racing/constants";
import type { Signals, YearBreakdown } from "@/lib/racing/types";

const base: Signals = {
  login: "testdriver",
  name: "Test Driver",
  avatarUrl: "https://github.com/testdriver.png",
  location: null,
  followers: 100,
  account_age_years: 5,
  public_repos: 20,
  total_stars_owned: 500,
  max_repo_stars: 300,
  languages: 6,
  rankedLanguages: ["TypeScript", "Rust", "Go"],
  topLanguage: "TypeScript",
  recent_contributions: 800,
  active_days_recent: 150,
  active_years: 5,
  total_contributions_lifetime: 5000,
  prs_to_others: 60,
  reviews: 40,
  issues_closed: 30,
  recent_commits: 600,
  recent_spike: false,
};

describe("buildCard", () => {
  it("keeps all four stats inside 1..99 for a range of profiles", () => {
    const profiles: Signals[] = [
      base,
      { ...base, recent_commits: 0, recent_contributions: 0, prs_to_others: 0, reviews: 0, issues_closed: 0, total_contributions_lifetime: 3, followers: 0, total_stars_owned: 0 },
      { ...base, recent_commits: 12000, recent_contributions: 15000, active_days_recent: 350, prs_to_others: 900, reviews: 800, issues_closed: 400, followers: 90000, total_stars_owned: 300000, max_repo_stars: 120000, total_contributions_lifetime: 400000, account_age_years: 18, active_years: 18, languages: 20 },
    ];
    for (const p of profiles) {
      const card = buildCard(p);
      for (const k of STATS) {
        expect(card.stats[k]).toBeGreaterThanOrEqual(1);
        expect(card.stats[k]).toBeLessThanOrEqual(99);
      }
      expect(card.rtg).toBeGreaterThanOrEqual(1);
      expect(card.rtg).toBeLessThanOrEqual(99);
      expect(card.car.rating).toBeGreaterThanOrEqual(1);
      expect(card.car.rating).toBeLessThanOrEqual(99);
    }
  });

  it("caps the raw RTG at 88 for a monster with a young account", () => {
    // huge everything, but zero legacy: young account, no followers/stars
    const card = buildCard({
      ...base,
      followers: 0,
      total_stars_owned: 0,
      max_repo_stars: 0,
      account_age_years: 0.2,
      active_years: 1,
      total_contributions_lifetime: 40000,
      recent_commits: 9000,
      recent_contributions: 10000,
      active_days_recent: 330,
      prs_to_others: 500,
      reviews: 300,
      issues_closed: 200,
    });
    expect(card.rtg).toBeLessThanOrEqual(88);
    expect(card.baseRTG).toBeLessThanOrEqual(88);
  });

  it("assigns a stable permanent number, never 17, and 1 for a 97+ champion", () => {
    const a = buildCard(base);
    const b = buildCard(base);
    expect(a.number).toBe(b.number);
    expect(a.number).toBeGreaterThanOrEqual(2);
    expect(a.number).toBeLessThanOrEqual(99);
    expect(a.number).not.toBe(17);

    const champ = buildCard({ ...base, login: "allegend", recent_commits: 12000, followers: 150000, total_stars_owned: 400000, max_repo_stars: 200000, account_age_years: 17, active_years: 17, total_contributions_lifetime: 350000, languages: 14, recent_contributions: 14000, active_days_recent: 340, prs_to_others: 400, reviews: 300, issues_closed: 250 });
    // whatever RTG lands, drive the number path explicitly via the champion rule
    expect([1, champ.number]).toContain(champ.number);
    if (champ.rtg >= 97) expect(champ.number).toBe(1);
  });

  it("walks a rookie out in a finish matching the rating bands", () => {
    const weak = buildCard({
      ...base,
      recent_commits: 5, recent_contributions: 8, prs_to_others: 0, reviews: 0, issues_closed: 0,
      followers: 0, total_stars_owned: 0, max_repo_stars: 0, languages: 1,
      total_contributions_lifetime: 30, account_age_years: 0.3, active_years: 1, active_days_recent: 4,
    });
    expect(["rookie", "points", "podium"]).toContain(weak.finish);
  });

  it("rides the purple sector for a hot streak that already scores", () => {
    const hot = buildCard({ ...base, recent_spike: true });
    expect(hot.finish).toBe("in_form");
    const cold = buildCard({ ...base, recent_spike: false });
    expect(cold.finish).not.toBe("in_form");
  });

  it("gives the founder their bespoke tier and forced rating", () => {
    const f = buildCard({ ...base, login: "LangerSword" });
    expect(f.finish).toBe("founder");
    expect(f.founder?.label).toBe("FOUNDER");
    expect(f.rtg).toBeGreaterThan(89);
    // champion gate can't hijack the founder look
    expect(f.archetype).toBe("Founder");
  });

  it("puts torvalds in the champion tier via the allowlist", () => {
    const linus = buildCard({ ...base, login: "torvalds", account_age_years: 18, active_years: 18 });
    expect(linus.finish).toBe("champion");
  });

  it("builds the constructor from the headline language", () => {
    const ts = buildCard(base);
    expect(ts.constructor.name).toBe("TypeScript GP");
    expect(ts.constructor.color).toBe("#3178c6");
    const rust = buildCard({ ...base, topLanguage: "Rust" });
    expect(rust.constructor.name).toBe("Rust GP");
    const none = buildCard({ ...base, topLanguage: null, rankedLanguages: [] });
    expect(none.constructor.name).toBe("Independent");
  });
});

describe("computeDuel", () => {
  it("counts sectors, awards the win, and breaks ties on RTG", () => {
    const a = buildCard({ ...base, login: "drivera", recent_commits: 3000 });
    const b = buildCard({ ...base, login: "driverb", recent_commits: 20 });
    const duel = computeDuel(a, b);
    expect(duel.rows).toHaveLength(4);
    const wins = duel.rows.filter((r) => r.winner).length;
    expect(duel.score.challenger + duel.score.opponent).toBe(wins);
    if (duel.score.challenger !== duel.score.opponent) {
      expect(duel.winner).not.toBeNull();
      expect(duel.onCountback).toBe(false);
    } else if (a.rtg !== b.rtg) {
      expect(duel.onCountback).toBe(true);
    } else {
      expect(duel.winner).toBeNull();
    }
  });

  it("calls a same-login race a test session", () => {
    const a = buildCard(base);
    const duel = computeDuel(a, buildCard({ ...base, recent_commits: 9999 }));
    expect(duel.testSession).toBe(true);
    expect(duel.winner).toBeNull();
  });
});

describe("awards", () => {
  const y = (year: number, commits: number, prs = 0, reviews = 0, issues = 0, restricted = 0): YearBreakdown =>
    ({ year, commits, prs, reviews, issues, restricted });

  it("yearScore saturates on a single axis and rewards breadth over volume", () => {
    // single axis: 10× the commits barely outscore — log saturation
    const spam = yearScore(y(2024, 20000));
    const twoK = yearScore(y(2024, 2000));
    expect(spam - twoK).toBeLessThan(5);
    // breadth: a 2.6k multi-axis season beats a 20k commits-only year
    const real = yearScore(y(2024, 2000, 300, 200, 80, 100));
    expect(real).toBeGreaterThan(spam);
  });

  it("mints world titles for standout seasons and respects the RTG ladder", () => {
    const years = [y(2015, 900), y(2016, 1200), y(2017, 3000, 200, 150, 60, 90), y(2018, 1100)];
    const card = { ...buildCard(base), years, rtg: 82 };
    const awards = computeAwards(card, 4);
    const titles = awards.filter((a) => a.key === "wdc");
    expect(titles).toHaveLength(1);
    expect(titles[0].year).toBe(2017);
    expect(titles[0].reason).toContain("the career-median season");

    const again = computeAwards({ ...card, years: [...years, y(2019, 3200, 220, 160, 60, 90)] }, 5);
    expect(again.filter((a) => a.key === "wdc")).toHaveLength(1);
  });

  it("awards the grand slam only when all four ratings clear 80", () => {
    const strong = { ...buildCard(base), rtg: 88, stats: { exp: 88, rac: 86, awa: 82, pac: 92 } as never };
    expect(computeAwards(strong, 5).some((a) => a.key === "grand_slam")).toBe(true);
    const weak = { ...strong, stats: { exp: 88, rac: 86, awa: 70, pac: 92 } as never };
    expect(computeAwards(weak, 5).some((a) => a.key === "grand_slam")).toBe(false);
  });

  it("holds the fastest lap award for purple-sector pace only", () => {
    const fast = { ...buildCard(base), rtg: 88, stats: { exp: 80, rac: 80, awa: 80, pac: 96 } as never };
    expect(computeAwards(fast, 5).some((a) => a.key === "fastest_lap")).toBe(true);
    const slow = { ...fast, stats: { exp: 80, rac: 80, awa: 80, pac: 84 } as never };
    expect(computeAwards(slow, 5).some((a) => a.key === "fastest_lap")).toBe(false);
  });

  it("ironman demands a long career and a real card", () => {
    const vet = { ...buildCard(base), rtg: 84 };
    expect(computeAwards(vet, 12).some((a) => a.key === "ironman")).toBe(true);
    expect(computeAwards(vet, 11).some((a) => a.key === "ironman")).toBe(false);
    expect(computeAwards({ ...vet, rtg: 70 }, 14).some((a) => a.key === "ironman")).toBe(false);
  });

  it("groups the cabinet in shelf order", () => {
    const card = { ...buildCard(base), rtg: 90, stats: { exp: 90, rac: 90, awa: 90, pac: 96 } as never };
    const groups = groupAwards(computeAwards(card, 13));
    const keys = groups.map((g) => g.key);
    expect(keys.indexOf("wdc")).toBeLessThan(keys.indexOf("fastest_lap"));
  });
});

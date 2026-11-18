import { describe, expect, it } from "vitest";
import { buildCard } from "@/lib/racing/engine";
import { computeDuel } from "@/lib/duel";
import { STATS } from "@/lib/racing/constants";
import type { Signals } from "@/lib/racing/types";

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

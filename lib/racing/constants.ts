import type { Finish, FounderMeta, StatKey, Stats } from "./types";

// The six driver-rating categories, verbatim from the EA F1 games.
// RTG is the pace-weighted combination of all six.
export const STATS: StatKey[] = ["pac", "rac", "awa", "exp", "tyr", "wet"];

export const STAT_LABELS: Record<StatKey, string> = {
  exp: "EXP",
  rac: "RAC",
  awa: "AWA",
  pac: "PAC",
  tyr: "TYR",
  wet: "WET",
};

export const STAT_NAMES: Record<StatKey, string> = {
  exp: "Experience",
  rac: "Racecraft",
  awa: "Awareness",
  pac: "Pace",
  tyr: "Tyre Management",
  wet: "Wet Pace",
};

// How the EA F1 games describe each stat — our scouting copy mirrors it.
export const STAT_COPY: Record<StatKey, { what: string; scouted: string }> = {
  pac: {
    what: "Turning the timing screens purple. Lap times against the clock, and against your teammate.",
    scouted: "commit velocity, laps turned this season",
  },
  rac: {
    what: "The masters of the overtake. Working through the pack to finish higher than you started.",
    scouted: "PRs worked through other people's fields, battles judged in review",
  },
  awa: {
    what: "Stay out of the stewards' room. Penalties cost more the heavier they are.",
    scouted: "hazards flagged early, race-by-race presence",
  },
  exp: {
    what: "Experience counts. Races started over a career, results banked season after season.",
    scouted: "seasons on the grid, lifetime mileage",
  },
  tyr: {
    what: "Looking after the rubber over a stint. Consistency session after session keeps the tyres — and the career — alive.",
    scouted: "race-by-race presence, active days this season",
  },
  wet: {
    what: "When the rain comes, the greats adapt. Range across languages and conditions is wet-weather pace.",
    scouted: "languages on the books, adaptability",
  },
};

// The GOAT invariant: Torvalds is the ceiling at 98. Every other card is
// capped at 95, which is also the founder's fixed rating.
export const GOAT_LOGIN = "torvalds";
// The GOAT tier honours multiple legends — Torvalds is the ceiling (98), the
// rest of the pantheon shares the platinum crest below him.
export const GOAT_LOGINS = ["torvalds", "gaearon", "sindresorhus", "antfu"];
export const GOAT_RTG = 98;
export const RIVAL_RTG_CAP = 95;

export const K = {
  // magnitude → the gravity-well center the six stats sit around
  magnitude: { w1: 0.5, w2: 0.4, w3: 0.5, w4: 0.08, b: -2.8, lo: 48, hi: 82 },
  // antagonist pairs: raw speed vs banked experience, overtaking vs clean
  // record. Nobody is elite at everything (see engine §3.3).
  tension: {
    alpha: 0.55,
    pairs: [
      ["pac", "exp"],
      ["rac", "awa"],
    ] as [StatKey, StatKey][],
  },
  spike: { base: 8 },
  legacy: { a: 1.0, b: 0.7, c: 0.3, d: 0.3, e: 0.3, f: 6.0, activeCap: 15, bonusMax: 11 },
  ovrCap: 88,
  finish: { championMin: 90, championLegacy: 0.5, winnerMin: 85, podiumMin: 75, pointsMin: 65 },
  // #1 is the champion's number, earned. #17 was permanently retired in 2015.
  championNumberAt: 97,
  retiredNumbers: [17],
  iconAllowlist: ["torvalds"],
};

// EA: "a combination of all driver stats, with Pace having a greater weighting."
export const RTG_WEIGHTS: Stats = { pac: 0.3, rac: 0.2, awa: 0.15, exp: 0.15, tyr: 0.1, wet: 0.1 };

export const FINISH_LABELS: Record<Finish, string> = {
  rookie: "ROOKIE",
  points: "POINTS",
  podium: "PODIUM",
  winner: "WINNER",
  in_form: "IN FORM",
  champion: "CHAMPION",
  founder: "1 OF 1",
};

// The people who built gitone. Matched case-insensitively in buildCard; each
// gets a forced overall (>89) and a bespoke one-of-one founder's edition.
export const FOUNDERS: Record<string, FounderMeta> = {
  langersword: {
    accent: "#f5d67b", // championship gold — a one-of-one edition
    label: "1 OF 1",
    tagline: "Founder of gitone — they built the very scout reading this card",
    edition: "1 OF 1",
    legend: "The Hamilton Legacy",
    legendRecord: "7× World Champion · 106 Wins · 105 Poles · 209 Podiums",
  },
};

export const FOUNDER_RTG: Record<string, number> = {
  langersword: 95,
};

// Raw-signal caps for the report's metric normalizations (0–99 at the cap).
export const METRIC_CAPS: Record<string, { cap: number; label: string; unit?: string }> = {
  laps: { cap: 3000, label: "laps completed", unit: "this season" },
  overtakes: { cap: 400, label: "overtakes", unit: "PRs to other fields" },
  battles: { cap: 400, label: "battles judged", unit: "reviews" },
  hazards: { cap: 400, label: "hazards flagged", unit: "issues raised" },
  seasons: { cap: 15, label: "seasons on the grid", unit: "active years" },
  silverware: { cap: 20000, label: "silverware", unit: "stars owned" },
  grandstand: { cap: 50000, label: "grandstand", unit: "followers" },
  mileage: { cap: 100000, label: "career mileage", unit: "lifetime contributions" },
};

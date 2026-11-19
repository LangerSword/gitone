import type { AwardInstance, AwardKey, Card, YearBreakdown } from "./racing/types";
import { STATS } from "./racing/constants";

// The trophy cabinet, translated from the football original. Four awards,
// each honest to its own data:
//
//   World Championship — WON, per season. A career season that towers over
//                        the rest (log multi-factor score, so volume spam
//                        can't brute-force it and a commits-only legend
//                        still counts). Repeats demand a stronger card.
//   Grand Slam          — HELD. All six ratings at 80+: pole, win, fastest
//                        lap, every lap led.
//   Fastest Lap Award   — HELD, current form. Purple-sector pace, 88+.
//   Ironman             — HELD. 12+ seasons on the grid and still racing.
//
// Computed server-side at scout time and stored on the card, so cached cards
// keep their cabinet. Duels never mint any of these — corners showcase what
// each card walked in with.

export type { AwardInstance, AwardKey } from "./racing/types";

export interface AwardMeta {
  title: string;
  shelfLabel: string;
  metricLabel: string; // the badge pill in the details modal
  description: string;
}

export const AWARD_META: Record<AwardKey, AwardMeta> = {
  wdc: {
    title: "World Championship",
    shelfLabel: "WORLD CHAMPIONSHIP",
    metricLabel: "Season of a Legend",
    description:
      "The sport's highest honour, for a calendar season that towers over the rest of a career. Any constructor, any style. What counts is that the season was undeniable.",
  },
  grand_slam: {
    title: "Grand Slam",
    shelfLabel: "GRAND SLAM",
    metricLabel: "Perfect Weekend",
    description:
      "Pole, the win, the fastest lap, and every single lap led. Awarded to drivers whose card has no weak sector: all six ratings at 80 or better.",
  },
  fastest_lap: {
    title: "Fastest Lap Award",
    shelfLabel: "FASTEST LAP",
    metricLabel: "Purple Sector",
    description:
      "Held, not kept: the season's pace award goes to current form. It stays while the laps keep coming in purple.",
  },
  ironman: {
    title: "Ironman",
    shelfLabel: "IRONMAN",
    metricLabel: "Never Missed a Season",
    description:
      "For careers measured in decades, not sprints: twelve or more seasons on the grid, and still racing.",
  },
  wcc26: {
    title: "2026 Constructors' Championship",
    shelfLabel: "CONSTRUCTORS '26",
    metricLabel: "Mercedes-AMG Petronas",
    description:
      "Mercedes-AMG Petronas took the 2026 World Constructors' Championship. Choosing the Mercedes livery carries that silverware onto the card.",
  },
  wdc26: {
    title: "2026 Drivers' Championship",
    shelfLabel: "DRIVERS '26",
    metricLabel: "Kimi Antonelli · Italy",
    description:
      "Kimi Antonelli took the 2026 World Drivers' Championship. Choosing Italy for the flag carries that title onto the card.",
  },
  pole: {
    title: "Pole Position",
    shelfLabel: "POLE POSITION",
    metricLabel: "Qualifying Master",
    description:
      "Saturday belongs to them. A pace rating of 90 or better — the card that lines up on pole when the grid forms.",
  },
  hat_trick: {
    title: "Hat-Trick",
    shelfLabel: "HAT-TRICK",
    metricLabel: "Pole · Win · Fastest Lap",
    description:
      "Pole, the win and the fastest lap in one weekend. Pace 88+, racecraft 85+ and an overall of 90+: the perfect trifecta.",
  },
  podium: {
    title: "Podium Regular",
    shelfLabel: "PODIUM REGULAR",
    metricLabel: "Always in the Mix",
    description:
      "Three or more seasons on the grid and an overall of 85+: the driver who is always spraying the champagne.",
  },
  century: {
    title: "Century Club",
    shelfLabel: "CENTURY CLUB",
    metricLabel: "20k Career Contributions",
    description:
      "A career measured in distance: 20,000 or more lifetime contributions banked across the seasons.",
  },
  founders_edition: {
    title: "Founder's Edition · 1 of 1",
    shelfLabel: "1 OF 1",
    metricLabel: "The Hamilton Legacy",
    description:
      "A one-of-one founder's edition cut after Lewis Hamilton — 7 titles, 106 wins, 105 poles, 209 podiums. The only card of its kind on the grid.",
  },
};

// ---- The shared season score -----------------------------------------------
// Log multi-factor, same physics as the scoring engine's Lg() curves: each
// dimension saturates, so 20k commits barely outscore 2k and a spammer caps
// out on one axis while any real season collects across several.

const lg = (n: number) => Math.log10(1 + Math.max(0, n));

export const yearScore = (y: YearBreakdown): number =>
  4 * lg(y.commits) + 3 * lg(y.prs) + 3 * lg(y.reviews) + 2 * lg(y.issues) + 2 * lg(y.restricted);

const rawTotal = (y: YearBreakdown) => y.commits + y.prs + y.reviews + y.issues + y.restricted;

// Every award requires a real profile; a floor, never a driver (the rating is
// generous, so this only keeps genuinely thin cards off the podium).
const AWARD_RTG_FLOOR = 80;

// ---- World Championship ----------------------------------------------------
// A season wins when it clears the floor AND either stands out against the
// profile's own career median (the spike path) or is elite in absolute terms
// (the legend path). Cap 3 (champions get a 4th for a monster season), and
// repeats demand a stronger card: each extra title needs a higher RTG.

const WDC_FLOOR = 16; // a genuinely strong season, in score terms
const WDC_MIN_RAW = 2000; // and in raw volume — no title under 2k contributions
const WDC_RATIO = 1.2; // spike path: 1.2× the career-median season
const WDC_ELITE = 19.5; // legend path: elite in absolute terms, ratio waived
const WDC_CAP = 3;
const WDC_FOURTH = 28; // a champion's 4th title demands a monster season
const WDC_RTG_LADDER = [AWARD_RTG_FLOOR, 87, 94, 94];

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

// "commits, PRs and reviews" — the kinds of work that made the season.
const workKinds = (y: YearBreakdown) => {
  const kinds = (
    [
      [y.commits, "commits"],
      [y.prs, "PRs"],
      [y.reviews, "reviews"],
      [y.issues, "issues"],
      [y.restricted, "private work"],
    ] as const
  )
    .filter(([n]) => n > 0)
    .map(([, label]) => label);
  if (kinds.length === 1) return `all in ${kinds[0]}`;
  return `spread over ${kinds.slice(0, -1).join(", ")} and ${kinds[kinds.length - 1]}`;
};

function worldTitles(card: Card): AwardInstance[] {
  const years = card.years ?? [];
  if (card.rtg < AWARD_RTG_FLOOR || years.length < 2) return [];

  const scored = years.map((y) => ({ y, score: yearScore(y) }));
  const mid = median(scored.map((s) => s.score));
  if (mid <= 0) return [];

  const qualifying = scored
    .filter(
      (s) =>
        rawTotal(s.y) >= WDC_MIN_RAW &&
        s.score >= WDC_FLOOR &&
        (s.score >= WDC_RATIO * mid || s.score >= WDC_ELITE),
    )
    .sort((a, b) => b.score - a.score);
  const elite = card.finish === "champion" || card.finish === "founder";
  const eliteCap = elite && qualifying[WDC_CAP]?.score >= WDC_FOURTH ? WDC_CAP + 1 : WDC_CAP;
  const rtgCap = WDC_RTG_LADDER.filter((floor) => card.rtg >= floor).length;
  // Reasons are factual and third-person (cards are mostly viewed by OTHERS),
  // and never claim a rank: rank comes from score, where breadth can beat raw
  // volume.
  return qualifying
    .slice(0, Math.min(eliteCap, rtgCap))
    .sort((a, b) => a.y.year - b.y.year)
    .map(({ y, score }) => {
      const ratio = score / mid;
      const lead =
        ratio >= WDC_RATIO ? `${ratio.toFixed(1)}× the career-median season` : "An elite season";
      return {
        key: "wdc" as const,
        year: y.year,
        reason: `${lead}: ${rawTotal(y).toLocaleString()} contributions, ${workKinds(y)}.`,
      };
    });
}

// ---- Grand Slam / Fastest Lap / Ironman (held awards) -----------------------

function grandSlam(card: Card): AwardInstance[] {
  if (card.rtg < AWARD_RTG_FLOOR) return [];
  const s = card.stats;
  if (!STATS.every((k) => s[k] >= 80)) return [];
  return [
    {
      key: "grand_slam" as const,
      reason: `Pole, win, fastest lap, every lap led: EXP ${s.exp}, RAC ${s.rac}, AWA ${s.awa}, PAC ${s.pac}, TYR ${s.tyr}, WET ${s.wet}. No weak sector on the card.`,
    },
  ];
}

const FASTEST_LAP_PAC = 88;

function fastestLap(card: Card): AwardInstance[] {
  if (card.rtg < AWARD_RTG_FLOOR || card.stats.pac < FASTEST_LAP_PAC) return [];
  return [
    {
      key: "fastest_lap" as const,
      reason: `On current form: PAC ${card.stats.pac}. The award stays while the laps keep coming in purple.`,
    },
  ];
}

const IRONMAN_SEASONS = 12;

function ironman(card: Card, signalsSeasons: number): AwardInstance[] {
  if (card.rtg < AWARD_RTG_FLOOR || signalsSeasons < IRONMAN_SEASONS) return [];
  return [
    {
      key: "ironman" as const,
      reason: `${signalsSeasons} seasons on the grid and still racing. Careers like this are measured in decades.`,
    },
  ];
}

// ---- Pole / Hat-Trick / Podium / Century (held awards) ----------------------

function polePosition(card: Card): AwardInstance[] {
  if (card.rtg < AWARD_RTG_FLOOR || card.stats.pac < 90) return [];
  return [{ key: "pole" as const, reason: `PAC ${card.stats.pac}: lines up on pole when the grid forms.` }];
}

function hatTrick(card: Card): AwardInstance[] {
  const s = card.stats;
  if (card.rtg < 90 || s.pac < 88 || s.rac < 85) return [];
  return [{ key: "hat_trick" as const, reason: `Pole, win, fastest lap: PAC ${s.pac}, RAC ${s.rac}, RTG ${card.rtg}. The perfect weekend.` }];
}

function podiumRegular(card: Card, activeSeasons: number): AwardInstance[] {
  if (card.rtg < 85 || activeSeasons < 3) return [];
  return [{ key: "podium" as const, reason: `${activeSeasons} seasons and RTG ${card.rtg}: always in the podium mix.` }];
}

const CENTURY_MILEAGE = 20000;
function centuryClub(card: Card): AwardInstance[] {
  const mileage = card.report.metrics.find((m) => m.label === "career mileage")?.value ?? 0;
  if (mileage < CENTURY_MILEAGE) return [];
  return [{ key: "century" as const, reason: `${mileage.toLocaleString()} lifetime contributions — a century of race distance.` }];
}

// The one-of-one founder's edition: a Hamilton-legacy tribute, minted only for
// the people who built gitone. No floor, no data gate — it is the edition itself.
function foundersEdition(card: Card): AwardInstance[] {
  if (card.finish !== "founder") return [];
  return [
    {
      key: "founders_edition" as const,
      reason:
        "A one-of-one founder's edition cut after Lewis Hamilton: 7 titles, 106 wins, 105 poles, 209 podiums. The only card of its kind on the grid.",
    },
  ];
}

// ---- Cabinet ---------------------------------------------------------------

export function computeAwards(card: Card, activeSeasons: number): AwardInstance[] {
  return [
    ...foundersEdition(card),
    ...worldTitles(card),
    ...grandSlam(card),
    ...hatTrick(card),
    ...polePosition(card),
    ...fastestLap(card),
    ...podiumRegular(card, activeSeasons),
    ...ironman(card, activeSeasons),
    ...centuryClub(card),
  ];
}

/** Cabinet grouped for display: one shelf slot per award type, instances inside. */
export interface AwardGroup {
  key: AwardKey;
  instances: AwardInstance[];
}

const SHELF_ORDER: readonly AwardKey[] = ["founders_edition", "wcc26", "wdc26", "wdc", "grand_slam", "hat_trick", "pole", "fastest_lap", "podium", "ironman", "century"];

// Real-world 2026 silverware that follows the reader's choices, not the
// profile's data: the Mercedes livery carries the constructors' title, the
// Italian flag carries the drivers' title. These are stored with the card and
// survive the report, the PNG query and a returning visit.
export function overrideAwards(teamCode: string | null | undefined, country: string | null | undefined): AwardInstance[] {
  const out: AwardInstance[] = [];
  if (teamCode?.trim().toUpperCase() === "MER") {
    out.push({
      key: "wcc26",
      year: 2026,
      reason: "Mercedes-AMG Petronas won the 2026 World Constructors' Championship. The livery carries the title.",
    });
  }
  if (country?.trim().toLowerCase() === "it") {
    out.push({
      key: "wdc26",
      year: 2026,
      reason: "Kimi Antonelli won the 2026 World Drivers' Championship. The Italian flag carries the title.",
    });
  }
  return out;
}

// Append override silverware without duplicating an award the profile already
// holds (same key and year).
export function mergeAwards(base: AwardInstance[] = [], extra: AwardInstance[] = []): AwardInstance[] {
  const seen = new Set(base.map((a) => `${a.key}:${a.year ?? "held"}`));
  return [...base, ...extra.filter((a) => !seen.has(`${a.key}:${a.year ?? "held"}`))];
}

export function groupAwards(awards: AwardInstance[] = []): AwardGroup[] {
  return SHELF_ORDER.flatMap((key) => {
    const instances = awards.filter((a) => a.key === key);
    return instances.length ? [{ key, instances }] : [];
  });
}

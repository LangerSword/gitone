export type StatKey = "exp" | "rac" | "awa" | "pac";
export type Stats = Record<StatKey, number>;
export type Profile = Record<StatKey, number>;

// The trophy cabinet keys (see lib/awards for the rules).
export type AwardKey = "wdc" | "grand_slam" | "fastest_lap" | "ironman" | "wcc26" | "wdc26";

// One earned trophy. WDC titles carry the season; held awards
// (grand slam / fastest lap / ironman) are current-form and carry no year.
export interface AwardInstance {
  key: AwardKey;
  year?: number;
  reason: string; // short, plain why-it-was-given (modal)
}

// Card tiers, EA-F1 flavoured. The 90s stay a legacy gate (see engine §4).
export type Finish = "rookie" | "points" | "podium" | "winner" | "in_form" | "champion" | "founder";

// The chassis: playful car-spec ratings, every one traced to a real signal.
export interface CarSpec {
  cor: number; // cornering ← language range
  top: number; // top speed ← biggest hit (max repo stars)
  aero: number; // downforce ← total grip from the crowd (stars owned)
  rel: number; // reliability ← seasons raced without breakdowns
  rating: number; // headline car rating (mean, clamped)
}

export interface Signals {
  login: string;
  name: string;
  avatarUrl: string;
  location: string | null;
  followers: number;
  account_age_years: number;
  public_repos: number;
  total_stars_owned: number;
  max_repo_stars: number;
  languages: number; // count of distinct primary languages
  rankedLanguages?: string[];
  topLanguage?: string | null;
  recent_contributions: number;
  active_days_recent: number;
  active_years: number;
  total_contributions_lifetime: number;
  prs_to_others: number;
  reviews: number;
  issues_closed: number;
  recent_commits: number;
  recent_spike: boolean;
  // Per-week lap counts for the last ~year (calendar weeks, oldest first) —
  // the telemetry lap chart. Optional: hand-authored sample Signals stay valid.
  recent_calendar?: number[];
  years?: YearBreakdown[];
}

export interface YearBreakdown {
  year: number;
  commits: number;
  prs: number;
  reviews: number;
  issues: number;
  restricted: number;
}

export interface Metric {
  label: string;
  value: number; // real GitHub count
  unit?: string;
  score: number; // 0–99 normalization of value
}

export interface Report {
  wetPace: number; // 1–5, language range = wet-weather adaptability
  tyre: number; // 1–5, race-by-race presence = tyre management
  drsOpen: boolean; // recent spike: DRS flap open
  reasons: { wetPace: string; tyre: string; drs: string };
  metrics: Metric[];
}

export interface Archetype {
  name: string;
  blurb: string;
}

// A constructor identity built from the driver's headline language: the
// card's livery colour, the name on the band, and the short code for the
// timing tower. Independent when no language could be resolved.
export interface Constructor {
  language: string | null;
  name: string;
  code: string;
  color: string; // livery hex
  ink: string; // text ink that reads on the livery colour
}

export interface FounderMeta {
  accent: string; // hex; drives the badge, glow and OG accent
  label: string;
  tagline: string;
}

export interface Card {
  login: string;
  name: string;
  avatarUrl: string;
  country: string | null; // lowercase ISO-ish flag code
  stats: Stats;
  baseRTG: number;
  rtg: number; // the headline number, legacy bonus included
  number: number; // permanent driver number (#1 earned at 97+, #17 retired)
  finish: Finish;
  finishLabel: string;
  archetype: string;
  archetypeBlurb: string;
  constructor: Constructor;
  car: CarSpec;
  topLanguage: string | null;
  languageLogo?: { name: string; slug: string } | null;
  founder?: FounderMeta;
  years?: YearBreakdown[];
  // Per-week lap counts for the telemetry chart (see Signals.recent_calendar).
  recent_calendar?: number[];
  // The trophy cabinet, computed at scout time (lib/awards via lib/scout).
  awards?: AwardInstance[];
  legacy: { L: number };
  report: Report;
}

// The fields a card needs to paint. The landing fan and start grid render
// from a snapshot of these (lib/racing/samples) so they never wait on a
// network round-trip; the report page passes a full Card, which is a
// structural superset.
export type CardPreview = Pick<
  Card,
  "login" | "name" | "avatarUrl" | "country" | "stats" | "rtg" | "number" | "finish" | "finishLabel" | "constructor"
>;

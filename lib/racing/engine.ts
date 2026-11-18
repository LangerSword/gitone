import { constructorFor } from "./livery";
import { topLanguageLogo } from "../github/languages";
import { countryForLogin } from "../geo";
import { METRIC_CAPS, RTG_WEIGHTS, STATS, K, FINISH_LABELS, FOUNDERS, FOUNDER_RTG, GOAT_LOGIN, GOAT_RTG, RIVAL_RTG_CAP } from "./constants";
import type {
  Archetype,
  Card,
  CarSpec,
  Finish,
  Metric,
  Profile,
  Report,
  Signals,
  Stats,
} from "./types";

// FNV-1a over the lowercased login — same shard function as the token pool,
// reused here so a driver's number is stable across machines and renders.
function hashLogin(login: string): number {
  let h = 0x811c9dc5;
  const s = login.toLowerCase();
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const Lg = (x: number) => Math.log10(Math.max(0, x) + 1);
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const vals = (s: Stats) => STATS.map((k) => s[k]);

// §2 — raw estimates on the EA F1 0–99 scale, each traced to a real signal.
function rawStats(s: Signals): Stats {
  // Pace: laps turned this season plus the velocity behind them. A burst of
  // commits on few days is qualifying pace; a year of daily laps is race pace.
  const velocity = s.recent_commits / Math.max(s.active_days_recent, 1);
  const o: Stats = {
    pac: 34 + 12 * Lg(s.recent_commits + 0.5 * s.recent_contributions) + Math.min(velocity, 16) * 0.85,
    // Racecraft: every PR into someone else's field is a position gained;
    // reviews are the wheel-to-wheel it took to get there.
    rac: 38 + 13 * Lg(s.prs_to_others) + 9 * Lg(s.reviews),
    // Awareness: hazards flagged early plus race-by-race presence. The
    // stewards never see the driver who shows up every session.
    awa: 34 + 12 * Lg(s.issues_closed) + 18 * Math.min(s.active_days_recent / 240, 1),
    // Experience: seasons raced and mileage banked, weighted toward results.
    exp: 28 + 10 * Lg(s.total_contributions_lifetime) + 2.0 * Math.min(s.active_years, 12),
  };
  for (const k of STATS) o[k] = clamp(Math.round(o[k]), 1, 99);
  return o;
}

// §3.1 — magnitude → gravity-well center the four sit around.
function center(s: Signals): number {
  const { w1, w2, w3, w4, b, lo, hi } = K.magnitude;
  const M = sigmoid(
    w1 * Lg(s.total_stars_owned) +
      w2 * Lg(s.followers) +
      w3 * Lg(s.total_contributions_lifetime) +
      w4 * s.account_age_years +
      b,
  );
  return lerp(lo, hi, M);
}

// §3.2 — z-score of their own four.
function zscore(raw: Stats): Profile {
  const v = vals(raw);
  const m = mean(v);
  const sd = Math.sqrt(mean(v.map((x) => (x - m) ** 2))) || 1;
  const p = {} as Profile;
  STATS.forEach((k, i) => (p[k] = (v[i] - m) / sd));
  return p;
}

// §3.3 — penalise antagonist pairs: raw pace vs banked experience, overtaking
// vs a clean record. Nobody is elite at everything.
function applyTension(p: Profile): Profile {
  const out = { ...p };
  for (const [a, b] of K.tension.pairs) {
    const overlap = Math.max(0, Math.min(out[a], out[b]));
    const weaker = out[a] <= out[b] ? a : b;
    out[weaker] -= K.tension.alpha * overlap;
  }
  return out;
}

// §3.4 — spike around the center; specialists get spikier cards.
function spike(p: Profile, c: number): Stats {
  const v = vals(p);
  const lop = clamp((Math.max(...v) - Math.min(...v)) / 4, 0, 1);
  const spread = K.spike.base * (1 + lop);
  const m = mean(v);
  const stats = {} as Stats;
  STATS.forEach((k) => (stats[k] = clamp(Math.round(c + spread * (p[k] - m)), 1, 99)));
  return stats;
}

// §3.5 — EA's rule: overall is a combination of the four with Pace weighted
// greater. Stats alone cap at 88.
function weightedRTG(stats: Stats): number {
  const rtg = STATS.reduce((s, k) => s + stats[k] * RTG_WEIGHTS[k], 0);
  return Math.min(Math.round(rtg), K.ovrCap);
}

// §4 — the 88→99 range is bought with years and sustained influence.
function legacyScore(s: Signals): number {
  const { a, b, c, d, e, f, activeCap } = K.legacy;
  const z =
    a * Math.log(s.account_age_years + 1) +
    b * Math.min(s.active_years, activeCap) +
    c * Lg(s.followers) +
    d * Lg(s.total_stars_owned) +
    e * Lg(s.max_repo_stars) -
    f;
  return sigmoid(z);
}

function pickFinish(rtg: number, L: number, recentSpike: boolean, login: string): Finish {
  if (K.iconAllowlist.includes(login)) return "champion";
  if (rtg >= K.finish.championMin && L >= K.finish.championLegacy) return "champion";
  // A hot streak rides the purple sector — but only once the driver scores.
  if (recentSpike && rtg >= K.finish.pointsMin) return "in_form";
  if (rtg >= K.finish.winnerMin) return "winner";
  if (rtg >= K.finish.podiumMin) return "podium";
  if (rtg >= K.finish.pointsMin) return "points";
  return "rookie";
}

// Permanent driver number: hash-stable across renders, #1 earned at 97+,
// #17 permanently retired (Jules Bianchi, 2015).
function driverNumber(login: string, rtg: number): number {
  if (rtg >= K.championNumberAt) return 1;
  const pool: number[] = [];
  for (let n = 2; n <= 99; n++) if (!K.retiredNumbers.includes(n)) pool.push(n);
  return pool[hashLogin(login) % pool.length];
}

function archetypeFromShape(st: Stats, s: Signals, finish: Finish): Archetype {
  if (finish === "founder")
    return { name: "Founder", blurb: "built gitone: the scout reading this card is theirs" };
  const top = [...STATS].sort((a, b) => st[b] - st[a]);
  const spread = Math.max(...vals(st)) - Math.min(...vals(st));
  if (finish === "champion" && spread < 8)
    return { name: "The Complete Racer", blurb: "no weak sector anywhere on the card" };
  if (s.languages >= 12)
    return { name: "Rainmaster", blurb: "adapts to any conditions: " + s.languages + " languages on the books" };
  if (top[0] === "pac") return { name: "Quali Monster", blurb: "raw one-lap pace: commits faster than the field" };
  if (top[0] === "rac")
    return { name: "Streetfighter", blurb: "works through the pack: PRs landed through heavy review traffic" };
  if (top[0] === "awa")
    return { name: "The Metronome", blurb: "never in the stewards' room: shows up every session, flags every hazard" };
  return { name: "The Veteran", blurb: "races banked across seasons: results that outlast the hype cycles" };
}

// The chassis: four playful car-spec ratings, every one a real signal.
function buildCar(s: Signals): CarSpec {
  const cor = clamp(Math.round(52 + 7 * Math.sqrt(s.languages)), 1, 99);
  const top = clamp(Math.round(36 + 15 * Lg(s.max_repo_stars)), 1, 99);
  const aero = clamp(Math.round(38 + 10 * Lg(s.total_stars_owned)), 1, 99);
  const rel = clamp(Math.round(38 + 4 * Math.min(s.active_years, 15)), 1, 99);
  return { cor, top, aero, rel, rating: clamp(Math.round((cor + top + aero + rel) / 4), 1, 99) };
}

function metric(key: keyof typeof METRIC_CAPS, value: number): Metric {
  const { cap, label, unit } = METRIC_CAPS[key];
  const score = clamp(Math.round((99 * Lg(value)) / Lg(cap)), 0, 99);
  return { label, value: Math.round(value), unit, score };
}

function buildReport(s: Signals): Report {
  const wetPace = clamp(Math.ceil(s.languages / 4), 1, 5);
  const tyre = clamp(1 + Math.floor(s.active_days_recent / 75), 1, 5);
  return {
    wetPace,
    tyre,
    drsOpen: s.recent_spike,
    reasons: {
      wetPace: s.languages + " languages on the books: wet-pace " + wetPace + "/5",
      tyre: s.active_days_recent + " active days this season: tyre wear " + tyre + "/5",
      drs: s.recent_spike
        ? "running at more than double the career pace: DRS open"
        : "career-pace laps: DRS closed",
    },
    metrics: [
      metric("laps", s.recent_commits),
      metric("overtakes", s.prs_to_others),
      metric("battles", s.reviews),
      metric("hazards", s.issues_closed),
      metric("seasons", s.active_years),
      metric("silverware", s.total_stars_owned),
      metric("grandstand", s.followers),
      metric("mileage", s.total_contributions_lifetime),
    ],
  };
}

export function buildCard(s: Signals): Card {
  const stats = spike(applyTension(zscore(rawStats(s))), center(s));
  const baseRTG = weightedRTG(stats);
  const L = legacyScore(s);

  // Founders get a forced rating (>89) and the bespoke founder tier, driven
  // straight through so the champion gate can't hijack the look.
  const login = s.login.toLowerCase();
  const founder = FOUNDERS[login];
  let rtg = founder ? FOUNDER_RTG[login] : clamp(baseRTG + Math.round(K.legacy.bonusMax * L), 1, 99);
  // Torvalds is the measuring stick: force his headline number and keep every
  // other card at least one point below it.
  rtg = login === GOAT_LOGIN ? GOAT_RTG : Math.min(rtg, RIVAL_RTG_CAP);
  const finish: Finish = founder ? "founder" : pickFinish(rtg, L, s.recent_spike, s.login);
  const archetype = archetypeFromShape(stats, s, finish);
  const constructor = constructorFor(s.topLanguage);
  const topLanguage = s.topLanguage ?? null;

  return {
    login: s.login,
    name: s.name,
    avatarUrl: s.avatarUrl,
    country: countryForLogin(s.login, s.location),
    stats,
    baseRTG,
    rtg,
    number: driverNumber(s.login, rtg),
    finish,
    finishLabel: FINISH_LABELS[finish],
    archetype: archetype.name,
    archetypeBlurb: archetype.blurb,
    constructor,
    car: buildCar(s),
    topLanguage,
    languageLogo: topLanguageLogo(s.rankedLanguages ?? []),
    ...(founder ? { founder } : null),
    ...(s.years ? { years: s.years } : null),
    ...(s.recent_calendar ? { recent_calendar: s.recent_calendar } : null),
    legacy: { L },
    report: buildReport(s),
  };
}

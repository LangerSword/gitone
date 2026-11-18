import type { Card, StatKey } from "./racing/types";
import { METRIC_CAPS, STAT_LABELS, STATS } from "./racing/constants";

export type DuelSide = "challenger" | "opponent";

export interface DuelRow {
  key: StatKey;
  label: string;
  challenger: number;
  opponent: number;
  /** Higher value takes the row; equal values score for neither side. */
  winner: DuelSide | null;
}

export interface DuelReceipt {
  label: string;
  challenger: number;
  opponent: number;
}

export interface Duel {
  challenger: Card;
  opponent: Card;
  rows: DuelRow[];
  score: Record<DuelSide, number>;
  /** null = Draw. */
  winner: DuelSide | null;
  /** true when a level scoreline was decided by RTG (countback). */
  onCountback: boolean;
  /** Same login in both cars — a test session, always a Draw. */
  testSession: boolean;
  receipts: DuelReceipt[];
}

const RECEIPTS: { metric: keyof typeof METRIC_CAPS; label: string }[] = [
  { metric: "laps", label: METRIC_CAPS.laps.label },
  { metric: "overtakes", label: METRIC_CAPS.overtakes.label },
  { metric: "battles", label: METRIC_CAPS.battles.label },
  { metric: "silverware", label: METRIC_CAPS.silverware.label },
  { metric: "grandstand", label: METRIC_CAPS.grandstand.label },
  { metric: "mileage", label: METRIC_CAPS.mileage.label },
];

const metricValue = (card: Card, metric: keyof typeof METRIC_CAPS): number => {
  const label = METRIC_CAPS[metric].label;
  return card.report.metrics.find((m) => m.label === label)?.value ?? 0;
};

export function tallyRows(rows: DuelRow[]): { a: number; b: number } {
  return {
    a: rows.filter((r) => r.winner === "challenger").length,
    b: rows.filter((r) => r.winner === "opponent").length,
  };
}

// Dominance — how one-sided the race reads. Scoreline-first, margins season
// the rest (see the gitfut duel notes: raw totals bunch 45–95 and read ~50/50;
// one +21 blowout nearly cancels five narrow losses). A won row's margin
// share is at least half, so the blend lands on the scoreline winner's side.
const FULL_ROW_GAP = 20;
const ROW_WEIGHT = 0.7;

export function dominanceShare(rows: DuelRow[]): number {
  if (rows.length === 0) return 50;
  const { a, b } = tallyRows(rows);
  const rowShare = (a + (rows.length - a - b) / 2) / rows.length;
  const marginShare =
    rows.reduce(
      (t, r) =>
        t +
        0.5 +
        Math.max(-0.5, Math.min(0.5, (r.challenger - r.opponent) / (2 * FULL_ROW_GAP))),
      0,
    ) / rows.length;
  return Math.round((ROW_WEIGHT * rowShare + (1 - ROW_WEIGHT) * marginShare) * 100);
}

export function computeDuel(challenger: Card, opponent: Card): Duel {
  const testSession =
    challenger.login.toLowerCase() === opponent.login.toLowerCase();

  const rows: DuelRow[] = STATS.map((key) => {
    const a = challenger.stats[key];
    const b = opponent.stats[key];
    return {
      key,
      label: STAT_LABELS[key],
      challenger: a,
      opponent: b,
      winner: a === b ? null : a > b ? "challenger" : "opponent",
    };
  });

  const tally = tallyRows(rows);
  const score: Record<DuelSide, number> = {
    challenger: tally.a,
    opponent: tally.b,
  };

  // Scoreline first; RTG countback only when level; Draw when both level.
  let winner: DuelSide | null = null;
  let onCountback = false;
  if (!testSession) {
    if (score.challenger !== score.opponent) {
      winner = score.challenger > score.opponent ? "challenger" : "opponent";
    } else if (challenger.rtg !== opponent.rtg) {
      winner = challenger.rtg > opponent.rtg ? "challenger" : "opponent";
      onCountback = true;
    }
  }

  const receipts: DuelReceipt[] = RECEIPTS.map(({ metric, label }) => ({
    label,
    challenger: metricValue(challenger, metric),
    opponent: metricValue(opponent, metric),
  }));

  return {
    challenger,
    opponent,
    rows,
    score,
    winner,
    onCountback,
    testSession,
    receipts,
  };
}

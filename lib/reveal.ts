// Duel reveal sequencer — a pure state machine for the versus broadcast.
// Given the row count and the user's reduced-motion preference it returns the
// timed phases of the race: the walkout (both cars enter from their sides),
// the live shootout (sector rows resolve ONE BY ONE), the chequered flag (the
// result banner lands) and the settled frame (receipts + share fade in).
// No DOM, no side effects — the React layer subscribes to these phases.

export type DuelPhase =
  | { kind: "walkout" }
  | { kind: "row"; row: number } // rows 0..n resolved up to and including `row`
  | { kind: "result" }
  | { kind: "settled" };

export interface DuelStep {
  phase: DuelPhase;
  at: number; // ms offset from reveal start
}

const FIRST_ROW_AT = 1100; // after both walkouts land (~1s)
const ROW_GAP = 550; // one sector every half-second-ish
const RESULT_GAP = 600; // beat between the last sector and the flag
const SETTLE_GAP = 900; // receipts + share rise after the flag

export function duelSequenceFor(
  reducedMotion: boolean,
  rowCount: number,
): DuelStep[] {
  // Accessibility: collapse straight to the final frame — same payoff, no
  // motion. One step, at zero, so nothing masked ever paints.
  if (reducedMotion) return [{ phase: { kind: "settled" }, at: 0 }];

  const steps: DuelStep[] = [{ phase: { kind: "walkout" }, at: 0 }];
  for (let row = 0; row < rowCount; row++) {
    steps.push({
      phase: { kind: "row", row },
      at: FIRST_ROW_AT + row * ROW_GAP,
    });
  }
  const lastRowAt = FIRST_ROW_AT + Math.max(0, rowCount - 1) * ROW_GAP;
  steps.push({ phase: { kind: "result" }, at: lastRowAt + RESULT_GAP });
  steps.push({
    phase: { kind: "settled" },
    at: lastRowAt + RESULT_GAP + SETTLE_GAP,
  });
  return steps;
}

// How many sector rows are resolved in a given phase — the scoreline, the
// stadium lights and the row list all render off this single number, so the
// broadcast never runs ahead of itself.
export function resolvedRows(phase: DuelPhase, rowCount: number): number {
  if (phase.kind === "row") return Math.min(rowCount, phase.row + 1);
  if (phase.kind === "result" || phase.kind === "settled") return rowCount;
  return 0;
}
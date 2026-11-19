"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { type DuelPhase, duelSequenceFor } from "@/lib/reveal";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Layout effect on the client so the first phase lands BEFORE the browser
// paints; plain effect on the server, where useLayoutEffect only warns and
// does nothing.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// Drives the duel broadcast from the pure sequencer, plus a skip() that jumps
// straight to "settled" (tap-anywhere-to-skip) and cancels every pending step.
// Under reduced motion the whole sequence is the lone settled step at 0 — no
// walkout, no flash of the masked lights-out frame.
export function useDuelReveal(rowCount: number): {
  phase: DuelPhase;
  skip: () => void;
} {
  const [phase, setPhase] = useState<DuelPhase>(
    () => duelSequenceFor(false, rowCount)[0]?.phase ?? { kind: "walkout" },
  );
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useIsomorphicLayoutEffect(() => {
    const steps = duelSequenceFor(prefersReducedMotion(), rowCount);
    // Land the first step synchronously, before paint. On the animated path
    // that's "walkout" (already the initial state — a no-op set).
    setPhase(steps[0].phase);
    timers.current = steps
      .slice(1)
      .map((s) => setTimeout(() => setPhase(s.phase), s.at));
    return () => timers.current.forEach(clearTimeout);
  }, [rowCount]);

  const skip = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase({ kind: "settled" });
  }, []);

  return { phase, skip };
}
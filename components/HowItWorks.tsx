"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { STAT_COPY } from "@/lib/racing/constants";
import { FINISH_LABELS } from "@/lib/racing/constants";
import type { StatKey, Finish } from "@/lib/racing/types";

const STAT_ORDER: StatKey[] = ["pac", "rac", "awa", "exp"];
const TIERS: Finish[] = ["rookie", "points", "podium", "winner", "champion", "in_form"];

const STEPS = [
  {
    kicker: "MEASURED AGAINST YOU",
    title: "YOUR OWN CURVE, NOT THE WORLD'S.",
    body: "We do not compare you to the average developer. Every signal is weighed against your own profile: a strong season lifts the card, a quiet one shows where the time went. Two people with the same raw numbers can still read differently.",
  },
  {
    kicker: "EVERY CARD HAS A SHAPE",
    title: "NOBODY IS ELITE AT EVERYTHING.",
    body: "Your strongest signals push the four ratings up; the weakest pull them down. That tension gives the card its shape, and the shape decides your position, archetype and constructor. It is read from the data, never picked by you.",
  },
  {
    kicker: "THE 90s ARE EARNED",
    title: "ONE BIG YEAR WON'T CROWN YOU.",
    body: "Raw ratings cap at 88. To live in the 90s you need seasons on the grid and influence that lasted: lifetime mileage, stars earned, reviews judged. A legendary card is a track record, not a sprint. The ceiling is real: Torvalds holds 98, every other card is capped at 95.",
  },
  {
    kicker: "LIVERY IS YOURS",
    title: "THE CAR DOESN'T CHANGE THE DRIVER.",
    body: "Pick any 2026 constructor and the frame, rim light and stat accents follow its colour. The numbers stay yours. The same card is served as a PNG at /<login>.png, so a README embed re-scouts itself every two hours.",
  },
];

// One editorial modal, opened from the hero and from the report. No wizard,
// no carousel: four steps, a source table, and the door out.
export function HowItWorks({
  label = "HOW IT WORKS ↗",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "mono inline-flex min-h-11 items-center font-bold tracking-[0.1em] underline decoration-white/20 underline-offset-4 transition-colors hover:text-[var(--ink)]"
        }
        style={{ color: "var(--dim)" }}
      >
        {label}
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
          style={{ background: "rgba(4,5,7,0.86)", backdropFilter: "blur(12px)" }}
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="hiw-title"
            onClick={(e) => e.stopPropagation()}
            className="glass relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-[660px] overflow-y-auto outline-none"
            style={{ animation: "rise-in .4s cubic-bezier(.16,1,.3,1) both" }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center text-[18px] transition-colors hover:bg-white/10"
              style={{ color: "var(--dim)", border: "1px solid var(--line)" }}
            >
              ×
            </button>

            <div className="p-6 sm:p-9">
              <p className="eyebrow eyebrow-red">THE SCOUT&apos;S EYE</p>
              <h2 id="hiw-title" className="display mt-2 text-[clamp(30px,4.6vw,46px)] leading-[0.95]" style={{ color: "var(--ink)" }}>
                WE DON&apos;T RANK YOU.
                <br />
                WE READ YOUR SEASON<span style={{ color: "var(--f1-red)" }}>.</span>
              </h2>
              <p className="mt-4 max-w-[540px] text-[14px] leading-relaxed" style={{ color: "var(--dim)" }}>
                Four signals from your live GitHub, weighed against each other and against your own
                history. The card is a scouting report, not a scoreboard.
              </p>

              <div className="mt-7">
                {STEPS.map((s, i) => (
                  <div key={s.kicker} className="border-t py-5" style={{ borderColor: "var(--line)" }}>
                    <div className="flex items-baseline gap-3">
                      <span className="mono text-[10.5px] font-bold tracking-[0.18em]" style={{ color: i === 2 ? "var(--f1-yellow)" : "var(--f1-red)" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="mono text-[10.5px] font-bold tracking-[0.18em]" style={{ color: i === 2 ? "var(--f1-yellow)" : "var(--dim)" }}>
                        {s.kicker}
                      </span>
                    </div>
                    <h3 className="display mt-2 text-[19px] leading-tight" style={{ color: "var(--ink)" }}>
                      {s.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "var(--dim)" }}>
                      {s.body}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-5" style={{ borderColor: "var(--line)" }}>
                <p className="eyebrow">WHAT FEEDS THE FOUR</p>
                <div className="mt-3 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                  {STAT_ORDER.map((k) => (
                    <div key={k} className="flex items-baseline gap-3">
                      <span className="mono w-9 flex-none text-[12px] font-extrabold" style={{ color: "var(--f1-red)" }}>
                        {k.toUpperCase()}
                      </span>
                      <span className="text-[12.5px] leading-snug" style={{ color: "var(--dim)" }}>
                        {STAT_COPY[k].scouted}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-1.5 border-t pt-4" style={{ borderColor: "var(--line)" }}>
                {TIERS.map((t) => (
                  <span
                    key={t}
                    className="mono px-1.5 py-1 text-[10px] font-bold tracking-[0.12em]"
                    style={{ background: "rgba(255,255,255,0.05)", color: t === "champion" ? "var(--f1-yellow)" : "var(--faint)" }}
                  >
                    {FINISH_LABELS[t]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// The pit-wall loading screen. Five start lights come on one by one, hold,
// then go out — the same sequence as the scout button — while the wall
// reads the profile. The radio rotates real-sounding race calls, never a
// fake percentage.
const RADIO = [
  "BOX, BOX. WE ARE READING THE PROFILE.",
  "PUSH NOW, PUSH NOW — PULLING THE LAST SEASON.",
  "GAP TO THE FIELD: MEASURING.",
  "TYRES ARE GOOD. KEEP THE LAPS COMING.",
  "WE ARE CHECKING THE DATA. STAY OUT.",
  "DRS ENABLED. OPENING THE GRAPH.",
];

export function LoadingScreen({ login, overlay = false }: { login?: string; overlay?: boolean }) {
  // The hero already ran the formation sequence; the pit wall holds all five
  // lights on, so handing off from the form to the route never rewinds to one.
  const lit = 5;
  const out = false;
  const [tick, setTick] = useState(0);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1700);
    const slowTimer = setTimeout(() => setSlow(true), 9000);
    return () => {
      clearInterval(id);
      clearTimeout(slowTimer);
    };
  }, []);

  return (
    <div
      className={`${overlay ? "fixed inset-0 z-[90]" : "h-[100dvh]"} flex flex-col overflow-y-auto`}
      role="status"
      aria-live="polite"
      aria-label={login ? `Scouting ${login}` : "Loading the scout report"}
      style={{
        background:
          "radial-gradient(70% 48% at 50% 0%, rgba(255,30,0,0.07), transparent 68%), var(--bg-0)",
      }}
    >
      {/* the gantry */}
      <div className="flex flex-none items-center justify-between px-5 py-4 sm:px-8">
        <span className="mono text-[10px] font-bold tracking-[0.24em]" style={{ color: "var(--faint)" }}>
          GITONE · PIT WALL
        </span>
        <span className="mono flex items-center gap-2 text-[10px] tracking-[0.2em]" style={{ color: "var(--faint)" }}>
          <span
            aria-hidden
            className="inline-block h-[6px] w-[6px] rounded-full"
            style={{ background: "var(--f1-red)", animation: "blink 1.1s ease-in-out infinite" }}
          />
          LIVE
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        {/* five lights on a carbon beam */}
        <div
          className="mb-9 flex items-center gap-4 px-7 py-5"
          style={{
            background: "linear-gradient(180deg, #16191f, #0c0e11)",
            border: "1px solid var(--line)",
            boxShadow: "0 24px 50px -30px rgba(0,0,0,.9), inset 0 1px 0 rgba(255,255,255,.05)",
          }}
        >
          <div className="lights">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className={`lamp ${out ? "out" : lit > i ? "on" : ""}`} style={{ width: 20, height: 20 }} />
            ))}
          </div>
          <span className="mono ml-1 w-[104px] text-left text-[10px] font-bold leading-tight tracking-[0.18em]" style={{ color: out ? "var(--green)" : "var(--dim)" }}>
            {out ? "LIGHTS OUT" : lit < 5 ? "LIGHTS ON" : "HOLD"}
          </span>
        </div>

        <h1 className="display m-0 text-[clamp(34px,6vw,64px)] leading-none" style={{ color: "var(--ink)" }}>
          SCOUTING
          {login && (
            <span className="mono ml-2 align-middle text-[0.42em] font-bold tracking-[0.02em]" style={{ color: "var(--f1-red)" }}>
              @{login}
            </span>
          )}
        </h1>

        <p key={tick} className="radio-line mono mt-4 h-5 text-[11px] tracking-[0.12em]" style={{ color: "var(--dim)" }}>
          <span style={{ color: "var(--f1-red)" }}>PIT RADIO · </span>
          {RADIO[tick % RADIO.length]}
        </p>

        {/* indeterminate sweep, not a fake percent */}
        <div className="mt-8 h-[4px] w-[min(300px,72vw)] overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full w-1/2"
            style={{
              background: "linear-gradient(90deg, transparent, var(--f1-red) 32%, var(--f1-red) 68%, transparent)",
              animation: "load-sweep 1.15s cubic-bezier(.4,0,.6,1) infinite",
              boxShadow: "0 0 12px rgba(255,30,0,.6)",
            }}
          />
        </div>

        <div className="mono mt-6 grid w-[min(420px,80vw)] grid-cols-4 gap-3 text-[10px] tracking-[0.14em]" style={{ color: "var(--faint)" }}>
          {["EXP", "RAC", "AWA", "PAC"].map((k) => (
            <span key={k} className="border-t pt-2" style={{ borderColor: "var(--line)" }}>
              {k}
            </span>
          ))}
        </div>

        {slow && (
          <Link href="/" className="mono mt-6 text-[9.5px] tracking-[0.16em] underline decoration-white/20 underline-offset-4 transition-colors hover:text-[var(--ink)]" style={{ color: "var(--faint)" }}>
            TAKING LONGER THAN EXPECTED — BACK TO THE GRID
          </Link>
        )}
      </div>

      <div className="mono flex flex-none flex-wrap items-center justify-between gap-2 px-5 py-4 text-[9px] tracking-[0.18em] sm:px-8" style={{ color: "var(--faint)" }}>
        <span>READING GITHUB GRAPHQL</span>
        <span>SCORING SEASONS · PRs · REVIEWS</span>
      </div>
    </div>
  );
}

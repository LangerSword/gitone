"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "./LoadingScreen";
import { HowItWorks } from "./HowItWorks";

// The scout input. Submitting starts the race: the pit-wall overlay takes
// over, runs the five lights, and hands the route to Next while the server
// is already scouting — the reader never sits on a blank page.
export function ScoutForm({
  autoFocus = false,
  scoutCount = null,
}: {
  autoFocus?: boolean;
  scoutCount?: number | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [login, setLogin] = useState("");
  const [target, setTarget] = useState<string | null>(null);
  const [phase, setPhase] = useState(0); // 0 idle → 1..5 lights → 6 out

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, [autoFocus]);

  const start = (raw: string) => {
    const clean = raw.trim().replace(/^@/, "");
    if (!clean || target || phase > 0) return;
    // Light the hero's own gantry first: the button and the five lamps are
    // the immediate feedback, before the full-screen pit wall takes over.
    setLogin(clean);
    setPhase(1);
    for (let i = 2; i <= 5; i++) {
      timers.current.push(setTimeout(() => setPhase(i), (i - 1) * 140));
    }
    timers.current.push(setTimeout(() => setPhase(6), 5 * 140 + 120));
    timers.current.push(setTimeout(() => setTarget(clean), 5 * 140 + 240));
    timers.current.push(
      setTimeout(() => router.push(`/${encodeURIComponent(clean)}`), 5 * 140 + 320),
    );
  };

  if (target) {
    return typeof document !== "undefined"
      ? createPortal(<LoadingScreen login={target} overlay />, document.body)
      : <LoadingScreen login={target} overlay />;
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          start(login);
        }}
        className="flex flex-col gap-2.5 sm:flex-row"
      >
        <div className="relative flex-1">
          <span className="mono pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold" style={{ color: "var(--f1-red)" }}>
            @
          </span>
          <input
            ref={inputRef}
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            disabled={phase > 0}
            placeholder="github login"
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            aria-label="GitHub login"
            className="scout-input h-[54px] w-full pl-9 pr-4 text-[15px] font-medium disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={!login.trim() || phase > 0}
          aria-live="polite"
          className="group flex h-[54px] items-center justify-center gap-3 px-7 text-[13px] font-extrabold tracking-[0.18em] transition-[background,transform,box-shadow] disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-px"
          style={{
            background: phase > 0 ? "linear-gradient(180deg, #ff3b1f, var(--f1-red))" : "var(--f1-red)",
            color: "#fff",
            boxShadow:
              phase > 0
                ? "0 0 0 4px rgba(255,30,0,.2), 0 0 40px rgba(255,30,0,.65), 0 14px 34px -18px rgba(255,30,0,.9)"
                : "0 14px 34px -18px rgba(255,30,0,.85)",
          }}
        >
          <span className="mono">{phase > 0 ? "SCOUTING" : "SCOUT"}</span>
          <span aria-hidden className="text-[15px] transition-transform group-hover:translate-x-1">
            →
          </span>
        </button>
      </form>

      {/* the light bank stays in the hero at rest, and runs the formation
          sequence on submit before the pit wall takes over */}
      <div className="mt-3.5 flex items-center gap-3" aria-live="polite">
        <div className="lights" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => {
            const cls = phase === 6 ? "out" : phase > 0 ? (i < phase ? "on" : "") : i === 4 ? "on" : "";
            return <span key={i} className={`lamp ${cls}`} />;
          })}
        </div>
        <span className="mono text-[9.5px] tracking-[0.2em]" style={{ color: phase === 6 ? "var(--green)" : "var(--faint)" }}>
          {phase === 0 ? "GRID READY" : phase === 5 ? "HOLD" : phase === 6 ? "LIGHTS OUT" : "FORMATION"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px]" style={{ color: "var(--faint)" }}>
        <span>
          try{" "}
          {["torvalds", "sindresorhus"].map((name, i) => (
            <span key={name}>
              {i > 0 && " · "}
              <button
                type="button"
                onClick={() => start(name)}
                className="mono underline decoration-white/20 underline-offset-4 transition-colors hover:text-[var(--ink)]"
                style={{ color: "var(--dim)" }}
              >
                {name}
              </button>
            </span>
          ))}
          {" · "}or your own
        </span>
        <HowItWorks />
        {scoutCount != null && scoutCount > 0 && (
          <span className="mono inline-flex items-baseline gap-1.5 text-[11px]" style={{ color: "var(--faint)" }}>
            <span className="tabular-nums" style={{ color: "var(--ink)" }}>
              {scoutCount.toLocaleString("en-US")}
            </span>
            cards rated
          </span>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";

// The pit-wall loading screen, driven by GSAP. A realistic double-row start
// gantry blooms its lamps one column at a time on a cold load; when handed
// off from the scout button it carries the lit state (never rewinds). While
// the wall reads the profile the lamps breathe in a slow ripple, a telemetry
// head sweeps the track, and the pit radio crossfades real-sounding calls —
// never a fake percentage. One ease vocabulary, transforms/opacity only.
const RADIO = [
  "BOX, BOX. WE ARE READING THE PROFILE.",
  "PUSH NOW, PUSH NOW. PULLING THE LAST SEASON.",
  "GAP TO THE FIELD: MEASURING.",
  "TYRES ARE GOOD. KEEP THE LAPS COMING.",
  "WE ARE CHECKING THE DATA. STAY OUT.",
  "DRS ENABLED. OPENING THE GRAPH.",
];
const COLS = 5;
const EASE = "power3.out";

export function LoadingScreen({ login, overlay = false }: { login?: string; overlay?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const cores = useRef<(HTMLSpanElement | null)[]>([]);
  const blooms = useRef<(HTMLSpanElement | null)[]>([]);
  const sweep = useRef<HTMLDivElement>(null);
  const radio = useRef<HTMLParagraphElement>(null);
  const [tick, setTick] = useState(0);
  const [slow, setSlow] = useState(false);

  // pit radio rotates; GSAP crossfades each call in
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2100);
    const slowTimer = setTimeout(() => setSlow(true), 9000);
    return () => { clearInterval(id); clearTimeout(slowTimer); };
  }, []);

  useEffect(() => {
    const el = radio.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el, { opacity: 0, y: 7 }, { opacity: 1, y: 0, duration: 0.45, ease: EASE });
    }, root);
    return () => ctx.revert();
  }, [tick]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      const coreEls = cores.current.filter(Boolean) as HTMLSpanElement[];
      const bloomEls = blooms.current.filter(Boolean) as HTMLSpanElement[];
      // entrance: gantry + title + stat rail settle in
      gsap.fromTo("[data-gantry]", { opacity: 0, y: 14, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: EASE });
      gsap.fromTo("[data-title]", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.08, ease: EASE });
      gsap.fromTo("[data-stat]", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, delay: 0.2, ease: EASE });

      if (reduce) {
        gsap.set(coreEls, { opacity: 1 });
        gsap.set(bloomEls, { opacity: 0.85 });
        return;
      }
      if (overlay) {
        // carried handoff — lamps already lit, no rewind
        gsap.set(coreEls, { opacity: 1 });
        gsap.set(bloomEls, { opacity: 0.9 });
      } else {
        // cold load — bloom each column in sequence like a real start
        gsap.set(coreEls, { opacity: 0.14 });
        gsap.set(bloomEls, { opacity: 0, scale: 0.5 });
        gsap.to(coreEls, { opacity: 1, duration: 0.16, stagger: 0.13, ease: "power2.out", delay: 0.25 });
        gsap.to(bloomEls, { opacity: 0.95, scale: 1, duration: 0.32, stagger: 0.13, ease: EASE, delay: 0.25 });
      }
      // living ripple across the lit lamps — a slow system-check breathing
      gsap.to(bloomEls, { opacity: 0.55, scale: 0.86, duration: 0.9, stagger: { each: 0.16, repeat: -1, yoyo: true }, ease: "sine.inOut", delay: overlay ? 0.4 : 1.3 });
      // telemetry head sweeping the track with a glowing trail
      if (sweep.current) {
        gsap.fromTo(sweep.current, { xPercent: -130 }, { xPercent: 430, duration: 1.5, ease: "power2.inOut", repeat: -1, repeatDelay: 0.15 });
      }
    }, root);
    return () => ctx.revert();
  }, [overlay]);

  return (
    <div
      ref={root}
      className={`${overlay ? "fixed inset-0 z-[90]" : "h-[100dvh]"} flex flex-col overflow-y-auto`}
      role="status"
      aria-live="polite"
      aria-label={login ? `Scouting ${login}` : "Loading the scout report"}
      style={{ background: "radial-gradient(70% 48% at 50% 0%, rgba(193,18,31,0.1), transparent 68%), var(--bg-0)" }}
    >
      <div className="flex flex-none items-center justify-between px-5 py-4 sm:px-8">
        <span className="mono text-[11px] font-bold tracking-[0.24em]" style={{ color: "var(--faint)" }}>GITONE · PIT WALL</span>
        <span className="mono flex items-center gap-2 text-[11px] tracking-[0.2em]" style={{ color: "var(--faint)" }}>
          <span aria-hidden className="inline-block h-[6px] w-[6px] rounded-full" style={{ background: "var(--f1-red)", animation: "blink 1.1s ease-in-out infinite" }} />
          LIVE
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        {/* the start gantry: five columns, two lamps each, on a carbon beam */}
        <div
          data-gantry
          className="mb-9 px-7 pb-6 pt-5"
          style={{ background: "linear-gradient(180deg, #181b22, #0b0d10)", border: "1px solid var(--line)", borderRadius: 10, boxShadow: "0 24px 50px -30px rgba(0,0,0,.9), inset 0 1px 0 rgba(255,255,255,.06)" }}
        >
          <div aria-hidden className="mx-auto mb-4 h-[5px] w-[70%] rounded-full" style={{ background: "linear-gradient(180deg, #2a2e37, #14161b)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.08)" }} />
          <div className="flex items-start gap-5">
            {Array.from({ length: COLS }).map((_, c) => (
              <div key={c} className="flex flex-col items-center gap-2.5">
                {[0, 1].map((r) => {
                  const i = c * 2 + r;
                  return (
                    <span key={r} className="relative inline-flex h-[20px] w-[20px] items-center justify-center">
                      <span ref={(el) => { blooms.current[i] = el; }} aria-hidden className="absolute rounded-full" style={{ inset: -7, background: "radial-gradient(circle, rgba(255,42,20,0.75), transparent 68%)", filter: "blur(3px)", opacity: 0 }} />
                      <span ref={(el) => { cores.current[i] = el; }} className="relative inline-block h-[18px] w-[18px] rounded-full" style={{ background: "radial-gradient(circle at 36% 30%, #ff7a6a, #d3141f 46%, #6e0800 78%)", boxShadow: "inset 0 0 0 1px rgba(255,140,130,.5), inset 0 -2px 4px rgba(0,0,0,.5)", opacity: 0.14 }} />
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mono mt-4 text-center text-[10.5px] font-bold tracking-[0.22em]" style={{ color: "var(--dim)" }}>HOLD · LIGHTS ON</div>
        </div>

        <h1 data-title className="display m-0 text-[clamp(34px,6vw,64px)] leading-none" style={{ color: "var(--ink)" }}>
          SCOUTING
          {login && <span className="mono ml-2 align-middle text-[0.42em] font-bold tracking-[0.02em]" style={{ color: "var(--f1-red)" }}>@{login}</span>}
        </h1>

        <p ref={radio} className="mono mt-4 h-5 text-[12px] tracking-[0.12em]" style={{ color: "var(--dim)" }}>
          <span style={{ color: "var(--f1-red)" }}>PIT RADIO · </span>
          {RADIO[tick % RADIO.length]}
        </p>

        {/* telemetry sweep — a glowing head on a dark track, not a fake percent */}
        <div className="mt-8 h-[4px] w-[min(300px,72vw)] overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div ref={sweep} className="h-full w-1/3 rounded-full" style={{ background: "linear-gradient(90deg, transparent, var(--f1-red) 45%, #ff6a5d 55%, transparent)", boxShadow: "0 0 14px rgba(255,42,20,.6)" }} />
        </div>

        <div className="mono mt-6 grid w-[min(420px,80vw)] grid-cols-4 gap-3 text-[11px] tracking-[0.14em]" style={{ color: "var(--faint)" }}>
          {["EXP", "RAC", "AWA", "PAC"].map((k) => (
            <span key={k} data-stat className="border-t pt-2" style={{ borderColor: "var(--line)" }}>{k}</span>
          ))}
        </div>

        {slow && (
          <Link href="/" className="mono mt-6 text-[10.5px] tracking-[0.16em] underline decoration-white/20 underline-offset-4 transition-colors hover:text-[var(--ink)]" style={{ color: "var(--faint)" }}>
            TAKING LONGER THAN EXPECTED — BACK TO THE GRID
          </Link>
        )}
      </div>

      <div className="mono flex flex-none flex-wrap items-center justify-between gap-2 px-5 py-4 text-[10.5px] tracking-[0.18em] sm:px-8" style={{ color: "var(--faint)" }}>
        <span>READING GITHUB GRAPHQL</span>
        <span>SCORING SEASONS · PRs · REVIEWS</span>
      </div>
    </div>
  );
}

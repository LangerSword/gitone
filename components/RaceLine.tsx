"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { SAMPLE_CARDS } from "@/lib/racing/samples";

// An original racey lower-third: a live lap around a stylised circuit, a
// streaming speed trace and a ticking telemetry readout, plus the top of the
// grid. Pure SVG + CSS motion; the numerals are written straight to the DOM on
// a slow interval (no React re-render), so it paints instantly with the server
// HTML and collapses under reduced motion.
const TRACK =
  "M30,62 C18,42 30,20 56,18 C86,16 96,36 122,33 C152,30 160,15 178,22 C193,28 188,50 168,55 C148,60 140,73 110,73 C80,73 70,64 50,67 C40,68 36,68 30,62 Z";

const TRACE = (() => {
  const pts: string[] = [];
  for (let x = 0; x <= 600; x += 12) {
    const v = 20 + 16 * Math.abs(Math.sin(x / 95)) + 7 * Math.sin(x / 31) + (x % 120 < 18 ? -12 : 0);
    pts.push(`${x},${(44 - v).toFixed(1)}`);
  }
  return pts.join(" ");
})();

const GRID = [...SAMPLE_CARDS].sort((a, b) => b.rtg - a.rtg).slice(0, 3);

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const getSnap = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const getServerSnap = () => false;

const fmtLap = (ms: number) =>
  `1:${String(Math.floor(ms / 60000) % 60).padStart(2, "0")}.${String(Math.floor((ms % 60000) / 10)).padStart(3, "0")}`;

export function RaceLine() {
  const reduce = useSyncExternalStore(subscribe, getSnap, getServerSnap);
  const speedRef = useRef<HTMLSpanElement>(null);
  const lapRef = useRef<HTMLSpanElement>(null);
  const gearRef = useRef<HTMLSpanElement>(null);
  const lapMs = useRef(74213);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      const now = Date.now();
      const speed = Math.round(282 + Math.sin(now / 900) * 34 + Math.sin(now / 260) * 7);
      lapMs.current = lapMs.current + 150 > 93000 ? 61000 : lapMs.current + 150;
      const gear = speed > 300 ? 8 : speed > 270 ? 7 : speed > 240 ? 6 : 5;
      if (speedRef.current) speedRef.current.textContent = String(speed);
      if (lapRef.current) lapRef.current.textContent = fmtLap(lapMs.current);
      if (gearRef.current) gearRef.current.textContent = String(gear);
    }, 150);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <section aria-label="Live race telemetry" className="relative overflow-hidden border-y" style={{ borderColor: "var(--line)", background: "linear-gradient(180deg, rgba(255,255,255,0.02), transparent)" }}>
      <div className="mx-auto flex max-w-[1240px] items-center gap-6 px-5 py-3 sm:px-8">
        {/* the live lap */}
        <div className="relative flex-none">
          <svg width="188" height="82" viewBox="0 0 200 88" fill="none" aria-hidden style={{ display: "block" }}>
            <path d={TRACK} stroke="rgba(255,255,255,0.05)" strokeWidth="13" strokeLinejoin="round" />
            <path d={TRACK} stroke="rgba(255,255,255,0.16)" strokeWidth="7" strokeLinejoin="round" />
            <path d={TRACK} stroke="var(--f1-red)" strokeWidth="1.4" strokeDasharray="3 9" opacity="0.5" />
            {[[56, 18], [178, 22], [110, 73]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="2.4" fill="rgba(255,255,255,0.4)" />
            ))}
            <circle r="4.5" fill="var(--f1-red)" style={{ filter: "drop-shadow(0 0 6px rgba(193,18,31,0.9))" }}>
              {!reduce && <animateMotion dur="7s" repeatCount="indefinite" path={TRACK} rotate="auto" />}
            </circle>
          </svg>
          <span className="mono absolute -top-0.5 left-0 text-[9px] font-bold tracking-[0.2em]" style={{ color: "var(--f1-red)" }}>
            LIVE LAP
          </span>
        </div>

        {/* streaming speed trace + readout */}
        <div className="relative min-w-0 flex-1">
          <div className="flex items-baseline gap-3">
            <span className="mono text-[9px] font-bold tracking-[0.2em]" style={{ color: "var(--faint)" }}>
              TELEMETRY · SPEED
            </span>
            <span ref={speedRef} className="mono text-[26px] font-extrabold leading-none tabular-nums" style={{ color: "var(--ink)" }}>
              287
            </span>
            <span className="mono text-[10px] tracking-[0.14em]" style={{ color: "var(--faint)" }}>KM/H</span>
            <span className="mono ml-auto text-[12px] font-bold tracking-[0.06em]" style={{ color: "var(--faint)" }}>
              GEAR <span ref={gearRef} className="text-[15px]" style={{ color: "var(--f1-red)" }}>7</span> · LAP <span ref={lapRef} className="text-[15px]" style={{ color: "var(--ink)" }}>1:14.213</span>
            </span>
          </div>
          <div className="relative mt-1 h-[38px] overflow-hidden">
            <div className="flex w-max" style={{ animation: reduce ? undefined : "trace-run 9s linear infinite" }}>
              {[0, 1].map((k) => (
                <svg key={k} width="600" height="38" viewBox="0 0 600 44" fill="none" aria-hidden style={{ display: "block" }}>
                  <polyline points={`${TRACE} 600,44 0,44`} fill="rgba(193,18,31,0.10)" stroke="none" />
                  <polyline points={TRACE} stroke="var(--f1-red)" strokeWidth="1.6" opacity="0.85" />
                </svg>
              ))}
            </div>
            <span className="pointer-events-none absolute inset-y-0 left-0 w-10" style={{ background: "linear-gradient(90deg, var(--bg-0), transparent)" }} />
            <span className="pointer-events-none absolute inset-y-0 right-0 w-10" style={{ background: "linear-gradient(270deg, var(--bg-0), transparent)" }} />
            <span aria-hidden className="pointer-events-none absolute inset-y-0" style={{ left: "62%", width: 2, background: "var(--f1-red)", boxShadow: "0 0 8px rgba(193,18,31,0.85)" }} />
          </div>
        </div>

        {/* top of the grid */}
        <div className="hidden flex-none lg:block">
          <div className="mono mb-1 text-[9px] font-bold tracking-[0.2em]" style={{ color: "var(--faint)" }}>
            TOP OF THE GRID
          </div>
          <div className="flex flex-col gap-1">
            {GRID.map((c, i) => (
              <Link key={c.login} href={`/${c.login}`} className="group flex items-center gap-2">
                <span className="mono w-3 text-[10px]" style={{ color: i === 0 ? "var(--f1-red)" : "var(--faint)" }}>{i + 1}</span>
                <span aria-hidden className="h-[5px] w-[5px] rounded-full" style={{ background: c.constructor.color }} />
                <span className="mono text-[12px] font-bold tracking-[0.06em] transition-colors group-hover:text-[var(--ink)]" style={{ color: "var(--dim)" }}>
                  {c.login.toUpperCase().slice(0, 12)}
                </span>
                <span className="mono ml-auto text-[13px] font-extrabold" style={{ color: c.constructor.color }}>{c.rtg}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

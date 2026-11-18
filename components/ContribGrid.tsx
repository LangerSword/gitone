"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { SAMPLE_CARDS } from "@/lib/racing/samples";

// The landing's lower-third fuses both identities: a GitHub contribution
// heatmap (the "gitty" signature) whose cells light up in a wave racing left to
// right, scored in the timing-screen colours (green personal bests, purple
// fastest weeks), beside a live speed/gear/lap readout and the top of the grid.
// The grid is precomputed once as an SVG string (one flight node, like gitfut),
// the numerals tick straight to the DOM, and everything collapses under
// reduced motion.
const COLS = 52;
const ROWS = 7;
const PITCH = 11;
const CELL = 8.5;
const GREENS = ["#0e4429", "#006d32", "#26a641", "#39d353"];

const GRID_SVG = (() => {
  let rects = "";
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const seed = (r * 7 + c * 13 + ((c * r) % 5)) % 12;
      const x = c * PITCH;
      const y = r * PITCH;
      const delay = (c * 0.045).toFixed(3);
      if (seed < 3) {
        rects += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="#161b22"/>`;
      } else if (seed === 11) {
        rects += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="#b36bff" class="contrib-cell" style="--cd:${delay}s"/>`;
      } else {
        const g = GREENS[(seed - 3) % GREENS.length];
        rects += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${g}" class="contrib-cell" style="--cd:${delay}s"/>`;
      }
    }
  }
  const w = COLS * PITCH;
  const h = ROWS * PITCH;
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${rects}</svg>`;
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

export function ContribGrid() {
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
    <section aria-label="GitHub contributions, live" className="relative overflow-hidden border-y" style={{ borderColor: "var(--line)", background: "linear-gradient(180deg, rgba(57,211,83,0.03), transparent)" }}>
      <div className="mx-auto max-w-[1240px] px-5 py-2.5 sm:px-8">
        <div className="mb-2 flex items-center gap-3">
          <span className="mono flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em]" style={{ color: "#39d353" }}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: "#39d353" }} />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "#39d353" }} />
            </span>
            GITHUB CONTRIBUTIONS · LIVE
          </span>
          <span className="mono ml-auto hidden text-[12px] font-bold tracking-[0.06em] sm:inline" style={{ color: "var(--faint)" }}>
            SPEED <span ref={speedRef} className="text-[15px]" style={{ color: "var(--ink)" }}>287</span> KM/H · GEAR <span ref={gearRef} className="text-[15px]" style={{ color: "var(--f1-red)" }}>7</span> · LAP <span ref={lapRef} className="text-[15px]" style={{ color: "var(--ink)" }}>1:14.213</span>
          </span>
        </div>
        <div className="flex items-center gap-5">
          {/* GRID_SVG is a static, deterministic SVG string built only from
              numeric constants above — no user input — so injecting it is safe
              (one flight node instead of 364 rects, the gitfut approach). */}
          <div className="relative h-[64px] min-w-0 flex-1" dangerouslySetInnerHTML={{ __html: GRID_SVG }} />
          <div className="hidden flex-none lg:block">
            <div className="mono mb-1 text-[10px] font-bold tracking-[0.2em]" style={{ color: "var(--faint)" }}>
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
      </div>
    </section>
  );
}

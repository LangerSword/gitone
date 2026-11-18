"use client";

// A minimal GitHub contribution strip for the foot of the report and duel
// pages: one row of commit cells in GitHub green with a live scan sweeping
// across, so the bottom of every page carries the "gitty" pulse without
// shouting. Deterministic SVG (one flight node), reduced-motion safe.
const COLS = 72;
const PITCH = 11;
const CELL = 8.5;
const GREENS = ["#0e4429", "#006d32", "#26a641", "#39d353"];

const STRIP_SVG = (() => {
  let rects = "";
  for (let c = 0; c < COLS; c++) {
    const seed = (c * 13 + 7) % 12;
    const x = c * PITCH;
    const fill = seed < 3 ? "#161b22" : seed === 11 ? "#b36bff" : GREENS[(seed - 3) % GREENS.length];
    rects += `<rect x="${x}" y="0" width="${CELL}" height="${CELL}" rx="2" fill="${fill}"/>`;
  }
  return `<svg viewBox="0 0 ${COLS * PITCH} ${CELL}" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">${rects}</svg>`;
})();

export function GitStrip() {
  return (
    <div aria-hidden className="relative z-10 mx-auto w-full max-w-[1240px] px-5 pb-3 sm:px-8">
      <div className="flex items-center gap-3">
        <span className="mono flex flex-none items-center gap-1.5 text-[9px] font-bold tracking-[0.2em]" style={{ color: "#39d353" }}>
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#39d353" }} />
          GITHUB · LIVE
        </span>
        <div className="relative h-[9px] min-w-0 flex-1 overflow-hidden">
          {/* static, deterministic SVG string — no user input, safe to inject */}
          <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: STRIP_SVG }} />
          <div className="contrib-scan pointer-events-none absolute inset-0" style={{ backgroundImage: "linear-gradient(90deg, transparent 46%, rgba(57,211,83,0.55) 49%, rgba(255,255,255,0.35) 50%, rgba(57,211,83,0.55) 51%, transparent 54%)", backgroundSize: "200% 100%", mixBlendMode: "screen" }} />
        </div>
      </div>
    </div>
  );
}

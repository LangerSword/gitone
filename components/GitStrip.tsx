// A minimal GitHub contribution strip for the foot of every page: one quiet,
// static row of commit cells in GitHub green. No animation, no purple, no
// telemetry — just a faint "gitty" hairline. Deterministic SVG (one flight
// node), zero JS.
const COLS = 72;
const PITCH = 11;
const CELL = 7;
const GREENS = ["#0e4429", "#006d32", "#26a641", "#39d353"];

const STRIP_SVG = (() => {
  let rects = "";
  for (let c = 0; c < COLS; c++) {
    const seed = (c * 13 + 7) % 12;
    const x = c * PITCH;
    const fill = seed < 3 ? "#161b22" : GREENS[(seed - 3) % GREENS.length];
    rects += `<rect x="${x}" y="0" width="${CELL}" height="${CELL}" rx="1.5" fill="${fill}"/>`;
  }
  return `<svg viewBox="0 0 ${COLS * PITCH} ${CELL}" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">${rects}</svg>`;
})();

export function GitStrip() {
  return (
    <div aria-hidden className="relative z-10 mx-auto w-full max-w-[1240px] px-5 pb-3 sm:px-8">
      <div className="flex items-center gap-3 opacity-60">
        <span className="mono flex flex-none items-center gap-1.5 text-[9px] font-bold tracking-[0.2em]" style={{ color: "#39d353" }}>
          <span className="inline-block h-1 w-1 rounded-full" style={{ background: "#39d353" }} />
          GITHUB
        </span>
        <div className="relative h-[7px] min-w-0 flex-1 overflow-hidden">
          {/* static, deterministic SVG string — no user input, safe to inject */}
          <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: STRIP_SVG }} />
        </div>
      </div>
    </div>
  );
}

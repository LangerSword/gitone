import Link from "next/link";
import { SAMPLE_CARDS } from "@/lib/racing/samples";

// The landing's lower-third, kept minimal: a GitHub contribution heatmap with
// one slow, faint scan drifting across it (CSS only, reduced-motion safe), a
// static telemetry readout and the top of the grid. No ticking numerals, no
// pulsing cells — a single calm motion. The grid is a precomputed SVG string
// (one flight node), so this whole band is a server component with zero JS.
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
      const fill = seed < 3 ? "#161b22" : seed === 11 ? "#b36bff" : GREENS[(seed - 3) % GREENS.length];
      rects += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${fill}"/>`;
    }
  }
  const w = COLS * PITCH;
  const h = ROWS * PITCH;
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${rects}</svg>`;
})();

const GRID = [...SAMPLE_CARDS].sort((a, b) => b.rtg - a.rtg).slice(0, 3);

export function ContribGrid() {
  return (
    <section aria-label="GitHub contributions, live" className="relative overflow-hidden border-y" style={{ borderColor: "var(--line)", background: "linear-gradient(180deg, rgba(57,211,83,0.03), transparent)" }}>
      <div className="mx-auto max-w-[1240px] px-5 py-2.5 sm:px-8">
        <div className="mb-2 flex items-center gap-3">
          <span className="mono flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em]" style={{ color: "#39d353" }}>
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#39d353" }} />
            GITHUB CONTRIBUTIONS · LIVE
          </span>
          <span className="mono ml-auto hidden text-[12px] font-bold tracking-[0.06em] sm:inline" style={{ color: "var(--faint)" }}>
            SPEED <span className="text-[15px]" style={{ color: "var(--ink)" }}>287</span> KM/H · GEAR <span className="text-[15px]" style={{ color: "var(--f1-red)" }}>7</span> · LAP <span className="text-[15px]" style={{ color: "var(--ink)" }}>1:14.213</span>
          </span>
        </div>
        <div className="flex items-center gap-5">
          {/* GRID_SVG is a static, deterministic SVG string built only from
              numeric constants — no user input — so injecting it is safe. */}
          <div className="relative h-[64px] min-w-0 flex-1 overflow-hidden">
            <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: GRID_SVG }} />
            <div className="contrib-scan pointer-events-none absolute inset-0" style={{ backgroundImage: "linear-gradient(90deg, transparent 46%, rgba(57,211,83,0.3) 49%, rgba(255,255,255,0.2) 50%, rgba(57,211,83,0.3) 51%, transparent 54%)", backgroundSize: "200% 100%", mixBlendMode: "screen" }} />
          </div>
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

"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/* The GitHub contribution floor — gitfut's footer motif, brought to life with
   GSAP and kept always running. A deterministic grid of commit cells (server
   rendered, zero layout shift) sits faint along the foot of every page; GSAP
   sends a wave of commit light flowing across it, sweeps a scan beam over the
   year, and lands random commits with a bright pop. No personal telemetry —
   just the ambient "the grid is alive" signature. Honors reduced motion. */

const ROWS = 4;
const COLS = 48;
const GREENS = ["#0e4429", "#006d32", "#26a641", "#39d353"];
const EMPTY = "#161b22";

const CELLS = Array.from({ length: ROWS * COLS }, (_, i) => {
  const seed = (i * 13 + 7) % 12;
  return seed < 3 ? EMPTY : GREENS[(seed - 3) % GREENS.length];
});

export function GitStrip() {
  const root = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const el = root.current;
      const grid = gridRef.current;
      if (!el || !grid) return;
      const ctx = gsap.context(() => {
        const cells = gsap.utils.toArray<HTMLElement>("[data-cell]", el);
        const lit = cells.filter((c) => c.dataset.base !== EMPTY);
        const beam = el.querySelector<HTMLElement>("[data-beam]");

        // a wave of commit light flowing across the grid, forever
        gsap.fromTo(
          lit,
          { opacity: 0.2 },
          {
            opacity: 1,
            duration: 1.5,
            ease: "sine.inOut",
            stagger: { each: 0.035, from: "start", grid: [ROWS, COLS], axis: "x" },
            repeat: -1,
            yoyo: true,
          }
        );

        // the read-head sweeping the contribution year
        if (beam) {
          gsap.fromTo(beam, { x: -90 }, { x: () => grid.clientWidth + 90, duration: 3.6, ease: "none", repeat: -1 });
        }

        // commits landing at random — a bright pop that settles back to base
        const land = () => {
          const c = lit[(Math.random() * lit.length) | 0];
          gsap.fromTo(
            c,
            { backgroundColor: "#7bf59a", scale: 1.6 },
            { backgroundColor: c.dataset.base, scale: 1, duration: 0.85, ease: "power2.out", overwrite: "auto" }
          );
          gsap.delayedCall(0.14 + Math.random() * 0.3, land);
        };
        land();

        // the LIVE dot breathes
        gsap.to("[data-live]", { opacity: 0.35, scale: 0.7, duration: 0.85, ease: "sine.inOut", repeat: -1, yoyo: true });
      }, el);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={root} aria-hidden className="relative z-10 mx-auto w-full max-w-[1240px] px-5 pb-4 sm:px-8">
      <div className="flex items-center gap-3 opacity-80">
        <span className="mono flex flex-none items-center gap-1.5 text-[9px] font-bold tracking-[0.2em]" style={{ color: "#39d353" }}>
          <span data-live className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#39d353", boxShadow: "0 0 6px #39d353" }} />
          GITHUB
        </span>

        <div
          ref={gridRef}
          className="relative min-w-0 flex-1 overflow-hidden"
          style={{ maskImage: "linear-gradient(to top, #000 55%, transparent)", WebkitMaskImage: "linear-gradient(to top, #000 55%, transparent)" }}
        >
          <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gridAutoRows: "7px", gap: "2px" }}>
            {CELLS.map((base, i) => (
              <div key={i} data-cell data-base={base} style={{ backgroundColor: base, borderRadius: "1.5px" }} />
            ))}
          </div>
          <div
            data-beam
            className="pointer-events-none absolute inset-y-0 left-0 w-[90px]"
            style={{ background: "linear-gradient(90deg, transparent, rgba(123,245,154,0.5), transparent)", mixBlendMode: "screen" }}
          />
        </div>

        <span className="mono flex flex-none items-center gap-1.5 text-[9px] font-bold tracking-[0.2em] text-white/40">
          LIVE
        </span>
      </div>
    </div>
  );
}

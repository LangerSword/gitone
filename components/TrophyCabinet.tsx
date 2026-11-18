"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { AWARD_META, groupAwards } from "@/lib/awards";
import type { AwardInstance, AwardKey } from "@/lib/racing/types";
import { Tip } from "./dossier";
import { TrophyArt } from "./TrophyArt";

const TINT: Record<AwardKey, string> = {
  wdc: "#e7c463",
  grand_slam: "#b39ddb",
  fastest_lap: "#b36bff",
  ironman: "#d99a5b",
  wcc26: "#5fd39a",
  wdc26: "#7fb2e5",
};

function Shine({ delay = 0 }: { delay?: number }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[12px]">
      <span
        className="trophy-shine absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        style={{ animation: `trophy-shine 3.8s ease-in-out ${delay}s infinite` }}
      />
    </span>
  );
}

// Trophy details dialog: a large floating metal piece under a warm glow, with
// every instance the card holds. Dialog semantics, focus on open, Escape and
// backdrop close, entrance transition.
function AwardDialog({ awardKey, instances, onClose }: { awardKey: AwardKey; instances: AwardInstance[]; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const meta = AWARD_META[awardKey];
  const tint = TINT[awardKey];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    const t = setTimeout(() => setShown(true), 10);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 backdrop-blur-[8px]"
      style={{ background: "rgba(8,8,12,0.82)", opacity: shown ? 1 : 0, transition: "opacity .25s ease" }}
      role="presentation"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="award-title"
        onClick={(e) => e.stopPropagation()}
        className="glass relative flex max-h-[85vh] w-[min(580px,100%)] flex-col items-center gap-5 overflow-auto rounded-[20px] p-8 outline-none sm:flex-row sm:items-start sm:gap-7 sm:p-10"
        style={{ opacity: shown ? 1 : 0, transform: shown ? "none" : "translateY(14px) scale(.985)", transition: "opacity .4s ease, transform .45s cubic-bezier(.16,1,.3,1)" }}
      >
        <button onClick={onClose} aria-label="Close" className="btn btn-ghost absolute right-4 top-4 h-8 w-8 rounded-[10px] p-0">
          <X size={15} aria-hidden />
        </button>

        <div className="relative flex flex-none flex-col items-center sm:sticky sm:top-0 sm:self-center">
          <span aria-hidden className="absolute inset-0 -m-10 rounded-full" style={{ background: `radial-gradient(circle, ${tint}40, transparent 70%)` }} />
          <span className="trophy-float relative" style={{ animation: "trophy-float 5s ease-in-out infinite" }}>
            <TrophyArt award={awardKey} size={184} />
          </span>
          <span aria-hidden className="mt-1 h-3.5 w-28 rounded-full" style={{ background: `radial-gradient(ellipse, ${tint}77, transparent 72%)`, filter: "blur(3px)" }} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 text-center sm:text-left">
          <h3 id="award-title" className="display text-[26px] leading-tight" style={{ color: tint }}>
            {meta.title}
          </h3>
          <span className="mono mx-auto inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-[0.16em] sm:mx-0" style={{ background: `${tint}1f`, color: tint }}>
            {meta.metricLabel.toUpperCase()}
          </span>
          <p className="mt-1 text-[14px] leading-relaxed" style={{ color: "var(--dim)" }}>
            {meta.description}
          </p>
          <ul className="mt-3 flex flex-col gap-2 border-t pt-3" style={{ borderColor: "var(--line)" }}>
            {instances.map((a) => (
              <li key={`${a.year ?? "held"}`} className="text-left">
                <span className="mono mr-2 text-[12px] font-bold tracking-[0.14em]" style={{ color: tint }}>
                  {a.year ?? "CURRENT FORM"}
                </span>
                <span className="text-[12.5px] leading-snug" style={{ color: "var(--dim)" }}>
                  {a.reason}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// The report's trophy cabinet: a shelf of floating metal pieces, each with a
// museum label and a ×N multiplier, opening its details dialog. Empty state is
// honest — no silverware yet.
export function TrophyCabinet({ awards }: { awards: AwardInstance[] }) {
  const [openKey, setOpenKey] = useState<AwardKey | null>(null);
  const groups = groupAwards(awards);
  const openGroup = groups.find((g) => g.key === openKey);

  return (
    <div>
      {groups.length === 0 ? (
        <p className="mono mt-4 text-[12.5px] leading-relaxed" style={{ color: "var(--faint)" }}>
          No silverware yet. Titles are earned season by season: a standout year, a grand
          slam across all four ratings, purple-sector pace, or an ironman career.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {groups.map((g, i) => {
            const tint = TINT[g.key];
            const n = g.instances.length;
            return (
              <Tip key={g.key} text={AWARD_META[g.key].description} align="left">
                <button
                  type="button"
                  onClick={() => setOpenKey(g.key)}
                  aria-label={`${AWARD_META[g.key].title} details`}
                  className="group relative flex flex-col items-center gap-1.5 rounded-[14px] border border-transparent px-3 py-2.5 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--line)] hover:bg-white/[0.03] active:scale-[.98]"
                >
                  <span className="relative flex h-[62px] w-[62px] items-center justify-center">
                    <span aria-hidden className="absolute bottom-0 h-3 w-12 rounded-full" style={{ background: `radial-gradient(ellipse, ${tint}55, transparent 70%)`, filter: "blur(2px)" }} />
                    <span className="trophy-float relative" style={{ animation: `trophy-float 5s ease-in-out ${i * 0.4}s infinite` }}>
                      <TrophyArt award={g.key} size={56} />
                    </span>
                    <Shine delay={i * 0.5} />
                    {n > 1 && (
                      <span className="mono absolute -right-1.5 -top-1 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold leading-none" style={{ background: tint, color: "#15151e", boxShadow: "0 2px 8px rgba(0,0,0,.5)" }}>
                        ×{n}
                      </span>
                    )}
                  </span>
                  <span className="mono text-center text-[9.5px] font-bold uppercase tracking-[0.1em]" style={{ color: tint }}>
                    {AWARD_META[g.key].shelfLabel}
                  </span>
                </button>
              </Tip>
            );
          })}
        </div>
      )}
      {openGroup && (
        <AwardDialog awardKey={openGroup.key} instances={openGroup.instances} onClose={() => setOpenKey(null)} />
      )}
    </div>
  );
}

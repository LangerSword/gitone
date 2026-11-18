"use client";

import { useEffect, useRef, useState } from "react";
import { Crown, Medal, Trophy, X, Zap } from "lucide-react";
import { AWARD_META, groupAwards } from "@/lib/awards";
import type { AwardInstance, AwardKey } from "@/lib/racing/types";
import { Tip } from "./dossier";

const ICONS: Record<AwardKey, typeof Trophy> = {
  wdc: Trophy,
  grand_slam: Crown,
  fastest_lap: Zap,
  ironman: Medal,
};

const TINT: Record<AwardKey, string> = {
  wdc: "#f5d67b",
  grand_slam: "#b455ff",
  fastest_lap: "#b455ff",
  ironman: "#f0a52c",
};

// Trophy details dialog: every instance the card holds — a 2× World Champion
// lists both seasons with their reasons. Dialog semantics, focus on open,
// Escape and backdrop close.
function AwardDialog({
  awardKey,
  instances,
  onClose,
}: {
  awardKey: AwardKey;
  instances: AwardInstance[];
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const meta = AWARD_META[awardKey];
  const Icon = ICONS[awardKey];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 backdrop-blur-[10px]"
      style={{ background: "rgba(5,5,8,0.85)" }}
      role="presentation"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="award-title"
        onClick={(e) => e.stopPropagation()}
        className="glass relative flex w-[min(580px,100%)] max-h-[85vh] flex-col gap-5 overflow-auto rounded-[20px] p-8 outline-none sm:flex-row sm:items-start sm:gap-7 sm:p-10"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 transition-colors hover:bg-white/10"
          style={{ color: "var(--dim)" }}
        >
          <X size={15} />
        </button>
        <div
          className="flex flex-none items-center justify-center rounded-xl sm:sticky sm:top-0"
          style={{ width: 96, height: 96, background: `${TINT[awardKey]}14`, boxShadow: `0 0 34px ${TINT[awardKey]}33, inset 0 0 0 1px ${TINT[awardKey]}44` }}
        >
          <Icon size={46} strokeWidth={1.6} style={{ color: TINT[awardKey] }} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 text-center sm:text-left">
          <h3 id="award-title" className="text-2xl font-black uppercase leading-tight tracking-wide" style={{ color: TINT[awardKey] }}>
            {meta.title}
          </h3>
          <span
            className="mono mx-auto inline-block rounded px-2 py-0.5 text-[10px] font-bold tracking-[0.16em] sm:mx-0"
            style={{ background: `${TINT[awardKey]}1a`, color: TINT[awardKey] }}
          >
            {meta.metricLabel.toUpperCase()}
          </span>
          <p className="mt-1 text-[14px] leading-relaxed" style={{ color: "var(--dim)" }}>
            {meta.description}
          </p>
          <ul className="mt-3 flex flex-col gap-2 border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {instances.map((a) => (
              <li key={`${a.year ?? "held"}`} className="text-left">
                <span className="mono mr-2 text-[12px] font-bold tracking-[0.14em]" style={{ color: TINT[awardKey] }}>
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

// The report's trophy cabinet: one shelf chip per award, each opening its
// details dialog. Empty state is honest — no silverware yet.
export function TrophyCabinet({ awards }: { awards: AwardInstance[] }) {
  const [openKey, setOpenKey] = useState<AwardKey | null>(null);
  const groups = groupAwards(awards);

  const openGroup = groups.find((g) => g.key === openKey);

  return (
    <div>
      {groups.length === 0 ? (
        <p className="mono mt-4 text-[11.5px] leading-relaxed" style={{ color: "var(--faint)" }}>
          No silverware yet. Titles are earned season by season: a standout year, a grand
          slam across all four ratings, purple-sector pace, or an ironman career.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2.5">
          {groups.map((g) => {
            const Icon = ICONS[g.key];
            const tint = TINT[g.key];
            const held = g.key !== "wdc";
            return (
              <Tip key={g.key} text={AWARD_META[g.key].description} align="left">
                <button
                  type="button"
                  onClick={() => setOpenKey(g.key)}
                  className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 transition-transform hover:scale-[1.04]"
                  style={{
                    background: `${tint}12`,
                    boxShadow: `inset 0 0 0 1px ${tint}40, 0 6px 22px -8px ${tint}66`,
                  }}
                  aria-label={`${AWARD_META[g.key].title} details`}
                >
                  <Icon size={17} strokeWidth={1.8} style={{ color: tint }} />
                  <span className="mono text-[11.5px] font-bold tracking-[0.12em]" style={{ color: tint }}>
                    {AWARD_META[g.key].shelfLabel}
                    {held ? "" : ` ×${g.instances.length}`}
                  </span>
                </button>
              </Tip>
            );
          })}
        </div>
      )}
      {openGroup && (
        <AwardDialog
          awardKey={openGroup.key}
          instances={openGroup.instances}
          onClose={() => setOpenKey(null)}
        />
      )}
    </div>
  );
}

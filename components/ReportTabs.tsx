"use client";

import { useState } from "react";
import { StatRadar } from "./StatRadar";
import { MetricBar, Section } from "./dossier";
import { STATS, STAT_LABELS, STAT_NAMES, STAT_COPY } from "@/lib/racing/constants";
import { formatCount } from "@/lib/format";
import type { Card } from "@/lib/racing/types";

const TABS = ["RATINGS", "TELEMETRY", "CAR", "SIGNALS"] as const;
type Tab = (typeof TABS)[number];

const CAR_TIPS: Record<string, string> = {
  COR: "Cornering: the range of languages in the repos you work across.",
  TOP: "Top speed: the stars on your single biggest repo.",
  AERO: "Downforce: all the stars your repos have earned.",
  REL: "Reliability: the number of seasons you've kept racing.",
};

function LapChart({ card }: { card: Card }) {
  const weeks = card.recent_calendar ?? [];
  const max = Math.max(1, ...weeks);
  const maxIdx = weeks.indexOf(max);
  const livery = card.constructor.color;
  return (
    <div>
      <div className="flex items-end gap-[3px] h-24" role="img" aria-label="Laps per week over the last season">
        {weeks.map((v, i) => {
          const h = v === 0 ? 8 : Math.max(14, (v / max) * 100);
          const isFL = v > 0 && i === maxIdx;
          return (
            <span
              key={i}
              className="flex-1 rounded-[1px]"
              style={{
                height: `${h}%`,
                background: isFL ? "var(--purple)" : v === 0 ? "rgba(255,255,255,0.06)" : livery,
                opacity: v === 0 || isFL ? 1 : 0.42 + (0.58 * v) / max,
                boxShadow: isFL ? "0 0 10px var(--purple)" : "none",
              }}
            />
          );
        })}
      </div>
      <div className="mono mt-3 flex justify-between text-[10px]" style={{ color: "var(--faint)" }}>
        <span>52 WEEKS AGO</span>
        <span style={{ color: "var(--purple)" }}>FL {max}</span>
        <span>{formatCount(weeks.reduce((s, v) => s + v, 0))} LAPS</span>
        <span>NOW</span>
      </div>
    </div>
  );
}

// One panel, four tabs. The report's data used to be a long right-hand rail
// that demanded a lot of scrolling; now every readout is one click away and
// the whole dossier fits a laptop viewport.
export function ReportTabs({ card, accent }: { card: Card; accent: string }) {
  const [tab, setTab] = useState<Tab>("RATINGS");

  return (
    <Section title="THE READOUT" accent={accent}>
      <div className="mb-4 flex gap-1 rounded-lg p-1" style={{ background: "rgba(255,255,255,0.04)" }} role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className="mono flex-1 rounded-md py-2 text-[10px] font-bold tracking-[0.12em] transition-colors"
            style={{
              background: tab === t ? accent : "transparent",
              color: tab === t ? "#15151e" : "var(--dim)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div role="tabpanel" style={{ animation: "row-in .3s ease-out both" }}>
        {tab === "RATINGS" && (
          <>
            <div className="mb-4 flex justify-center">
              <StatRadar card={card} size={180} />
            </div>
            <div className="flex flex-col gap-[13px]">
              {STATS.map((k, i) => (
                <MetricBar
                  key={k}
                  label={`${STAT_LABELS[k]} · ${STAT_NAMES[k]}`}
                  value={card.stats[k]}
                  score={card.stats[k]}
                  accent={accent}
                  tip={STAT_COPY[k].what}
                  index={i}
                />
              ))}
            </div>
          </>
        )}

        {tab === "TELEMETRY" && (
          <>
            <p className="mono mb-3 text-[11px]" style={{ color: "var(--dim)" }}>
              Laps per week, last season. Purple marks the fastest week.
            </p>
            <LapChart card={card} />
          </>
        )}

        {tab === "CAR" && (
          <>
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-[13px]" style={{ color: "var(--dim)" }}>
                {card.constructor.name}
              </span>
              <span className="mono text-[16px] font-bold" style={{ color: accent }}>
                CHASSIS {card.car.rating}
              </span>
            </div>
            <div className="flex flex-col gap-[13px]">
              {(["cor", "top", "aero", "rel"] as const).map((k, i) => (
                <MetricBar
                  key={k}
                  label={k.toUpperCase()}
                  value={card.car[k]}
                  score={card.car[k]}
                  accent={card.constructor.color}
                  tip={CAR_TIPS[k.toUpperCase()]}
                  index={i}
                />
              ))}
            </div>
          </>
        )}

        {tab === "SIGNALS" && (
          <div className="flex flex-col gap-[13px]">
            {card.report.metrics.map((m, i) => (
              <MetricBar
                key={m.label}
                label={m.label}
                value={m.value}
                score={m.score}
                accent={accent}
                unit={m.unit}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

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
  const total = weeks.reduce((s, v) => s + v, 0);
  const livery = card.constructor.color;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="mono text-[11px] font-bold tracking-[0.1em]" style={{ color: "var(--purple)" }}>
          PEAK {max}
        </span>
        <span className="mono text-[11px] tracking-[0.1em]" style={{ color: "var(--faint)" }}>
          {formatCount(total)} LAPS
        </span>
      </div>
      <div className="flex h-28 items-end gap-[2px]" role="img" aria-label="Laps per week over the last season">
        {weeks.map((v, i) => {
          const h = v === 0 ? 4 : Math.max(8, (v / max) * 100);
          const isPeak = v > 0 && i === maxIdx;
          return (
            <span
              key={i}
              title={`${v} laps · week ${i + 1}`}
              className="flex-1 rounded-[1px]"
              style={{
                height: `${h}%`,
                background: isPeak ? "var(--purple)" : livery,
                opacity: isPeak ? 1 : 0.5,
                boxShadow: isPeak ? "0 0 10px rgba(179,107,255,.7)" : "none",
              }}
            />
          );
        })}
      </div>
      <div className="mono mt-2 flex justify-between text-[11px] tracking-[0.1em]" style={{ color: "var(--faint)" }}>
        <span>52 WEEKS AGO</span>
        <span>NOW</span>
      </div>
    </div>
  );
}

// One panel, four tabs. Every readout is one click away, so the whole
// dossier fits a laptop viewport instead of demanding a long scroll.
export function ReportTabs({ card, accent }: { card: Card; accent: string }) {
  const [tab, setTab] = useState<Tab>("RATINGS");

  return (
    <Section
      title="THE READOUT"
      accent={accent}
      aside={<span className="mono text-[11px] tracking-[0.12em]" style={{ color: "var(--faint)" }}>LIVE DATA</span>}
    >
      <div className="mb-4 flex border-b" style={{ borderColor: "var(--line)" }} role="tablist">
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t)}
              className="mono relative flex-1 cursor-pointer py-2 text-[11.5px] font-bold tracking-[0.1em] transition-colors hover:text-[var(--dim)]"
              style={{ color: active ? "var(--ink)" : "var(--faint)" }}
            >
              {t}
              {active && <span aria-hidden className="absolute inset-x-0 -bottom-px h-[2px]" style={{ background: accent }} />}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" style={{ animation: "row-in .3s ease-out both" }}>
        {tab === "RATINGS" && (
          <>
            <div className="mb-4 flex justify-center">
              <StatRadar card={card} size={210} />
            </div>
            <div className="flex flex-col gap-[12px]">
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
            <p className="mono mb-3 text-[11px] tracking-[0.1em]" style={{ color: "var(--dim)" }}>
              LAPS PER WEEK, LAST SEASON. PURPLE IS THE PEAK WEEK.
            </p>
            <LapChart card={card} />
          </>
        )}

        {tab === "CAR" && (
          <>
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-[13.5px]" style={{ color: "var(--dim)" }}>
                {card.constructor.name}
              </span>
              <span className="mono text-[15px] font-bold" style={{ color: accent }}>
                CHASSIS {card.car.rating}
              </span>
            </div>
            <div className="flex flex-col gap-[12px]">
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
          <div className="flex flex-col gap-[12px]">
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

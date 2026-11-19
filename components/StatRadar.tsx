"use client";

import { useState } from "react";
import { STATS, STAT_LABELS, STAT_COPY, STAT_NAMES } from "@/lib/racing/constants";
import type { Card, StatKey } from "@/lib/racing/types";

// Six-axis telemetry radar. Labels sit OUTSIDE the plot ring so they never
// collide with the vertex markers; three concentric rings give a readable
// scale. Hover, focus, tap or keyboard an axis to read what it measures.

export function StatRadar({ card, size = 210 }: { card: Card; size?: number }) {
  const [active, setActive] = useState<StatKey>("pac");
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 46; // plot radius, leaving room for outside labels
  const labelR = R + 26;
  const accent = card.constructor.color;

  const angleFor = (i: number) => (-90 + (i * 360) / STATS.length) * (Math.PI / 180);
  const point = (i: number, r: number) => {
    const a = angleFor(i);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  };
  const val = (v: number) => (Math.max(v, 1) / 99) * R;

  const poly = STATS.map((k, i) => point(i, val(card.stats[k])).join(",")).join(" ");
  const rings = [0.33, 0.66, 1].map((f) => STATS.map((_, i) => point(i, R * f).join(",")).join(" "));

  return (
    <div>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="group"
        aria-label="Driver rating radar. Choose an axis to read its meaning."
        style={{ display: "block", margin: "0 auto", overflow: "visible" }}
      >
        {rings.map((g, i) => (
          <polygon
            key={i}
            points={g}
            fill={i === 2 ? "rgba(255,255,255,0.025)" : "none"}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={1}
          />
        ))}
        {[0.33, 0.66, 1].map((f, i) => {
          const a = (-45 * Math.PI) / 180;
          const tx = cx + R * f * Math.cos(a);
          const ty = cy + R * f * Math.sin(a);
          return (
            <text key={i} x={tx + 5} y={ty - 3} fontFamily="var(--font-mono)" fontSize={8.5} fill="rgba(245,245,247,0.34)">
              {Math.round(f * 99)}
            </text>
          );
        })}

        <polygon points={poly} fill={`${accent}2e`} stroke={accent} strokeWidth={2.4} strokeLinejoin="round" />

        {STATS.map((k, i) => {
          const [x, y] = point(i, R);
          const [lx, ly] = point(i, labelR);
          const [vx, vy] = point(i, val(card.stats[k]));
          const hot = card.stats[k] >= 90;
          const on = active === k;
          return (
            <g
              key={k}
              role="button"
              tabIndex={0}
              aria-label={`${STAT_LABELS[k]} ${STAT_NAMES[k]}: ${card.stats[k]} out of 99`}
              aria-pressed={on}
              onPointerEnter={() => setActive(k)}
              onFocus={() => setActive(k)}
              onClick={() => setActive(k)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActive(k);
                }
              }}
              style={{ cursor: "pointer", outline: "none" }}
            >
              <line x1={cx} y1={cy} x2={x} y2={y} stroke={on ? accent : "rgba(255,255,255,0.14)"} strokeWidth={on ? 2 : 1} />
              <circle cx={vx} cy={vy} r={22} fill="transparent" />
              <circle cx={vx} cy={vy} r={on ? 6.5 : hot ? 5 : 4} fill={hot ? "var(--purple)" : accent} stroke="#15151e" strokeWidth={1.5} />
              {on && <circle cx={vx} cy={vy} r={11} fill="none" stroke={hot ? "var(--purple)" : accent} strokeWidth={1} opacity={0.55} />}
              <text
                x={lx}
                y={ly + 4}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={12}
                fontWeight={700}
                letterSpacing={1.2}
                fill={on ? "var(--ink)" : "rgba(245,245,247,0.6)"}
              >
                {STAT_LABELS[k]}
              </text>
              <text
                x={lx}
                y={ly + 17}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={11}
                fontWeight={800}
                fill={hot ? "var(--purple)" : on ? accent : "rgba(245,245,247,0.42)"}
              >
                {card.stats[k]}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 text-center" aria-live="polite">
        <div className="mono text-[11px] font-bold tracking-[0.12em]" style={{ color: card.stats[active] >= 90 ? "var(--purple)" : accent }}>
          {STAT_LABELS[active]} <span style={{ color: "var(--ink)" }}>{card.stats[active]}</span>{" "}
          <span style={{ color: "var(--faint)" }}>· {STAT_NAMES[active].toUpperCase()}</span>
        </div>
        <p className="mx-auto mt-1 max-w-[250px] text-[11.5px] leading-snug" style={{ color: "var(--faint)" }}>
          {STAT_COPY[active].what}
        </p>
      </div>
    </div>
  );
}

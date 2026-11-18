"use client";

import { useState } from "react";
import { STAT_LABELS, STAT_COPY, STAT_NAMES } from "@/lib/racing/constants";
import type { Card, StatKey } from "@/lib/racing/types";

// Four-axis telemetry radar with a real readout: hover, focus, tap or keyboard
// an axis and the caption explains what the rating measures. Pure SVG, no
// chart library, no animation loop.
const ORDER: StatKey[] = ["pac", "rac", "exp", "awa"];

export function StatRadar({ card, size = 176 }: { card: Card; size?: number }) {
  const [active, setActive] = useState<StatKey>("pac");
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 34;
  const accent = card.constructor.color;

  const angleFor = (i: number) => (-90 + i * 90) * (Math.PI / 180);
  const point = (i: number, r: number) => {
    const a = angleFor(i);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  };
  const val = (v: number) => (Math.max(v, 1) / 99) * R;

  const poly = ORDER.map((k, i) => point(i, val(card.stats[k])).join(",")).join(" ");
  const grid = [0.33, 0.66, 1].map((f) => ORDER.map((_, i) => point(i, R * f).join(",")).join(" "));

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
        {grid.map((g, i) => (
          <polygon key={i} points={g} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
        ))}

        <polygon points={poly} fill={`${accent}55`} stroke={accent} strokeWidth={2.4} />

        {ORDER.map((k, i) => {
          const [x, y] = point(i, R);
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
              <line x1={cx} y1={cy} x2={x} y2={y} stroke={on ? accent : "rgba(255,255,255,0.13)"} strokeWidth={on ? 2 : 1} />
              <circle cx={vx} cy={vy} r={20} fill="transparent" />
              <circle cx={vx} cy={vy} r={on ? 7 : hot ? 5 : 4} fill={hot ? "var(--purple)" : accent} stroke="#0a0a0d" strokeWidth={1.5} />
              {on && <circle cx={vx} cy={vy} r={11} fill="none" stroke={hot ? "var(--purple)" : accent} strokeWidth={1} opacity={0.55} />}
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={11}
                fontWeight={700}
                letterSpacing={1.4}
                fill={on ? "#f6f1e8" : "rgba(246,241,232,0.55)"}
              >
                {STAT_LABELS[k]}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 text-center" aria-live="polite">
        <div className="mono text-[10px] font-bold tracking-[0.12em]" style={{ color: card.stats[active] >= 90 ? "var(--purple)" : accent }}>
          {STAT_LABELS[active]} <span style={{ color: "var(--ink)" }}>{card.stats[active]}</span>{" "}
          <span style={{ color: "var(--faint)" }}>· {STAT_NAMES[active].toUpperCase()}</span>
        </div>
        <p className="mx-auto mt-1 max-w-[250px] text-[10.5px] leading-snug" style={{ color: "var(--faint)" }}>
          {STAT_COPY[active].what}
        </p>
      </div>
    </div>
  );
}

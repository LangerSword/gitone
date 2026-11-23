"use client";

import type { Card } from "@/lib/racing/types";

// A lap-shaped view of the six real ratings. This is NOT measured on-track
// telemetry: each pair of stats drives one sector's throttle line, and the
// weaker half of a pair places a brake marker. The label says so on the panel.
function trace(card: Card) {
  const stats = [card.stats.pac, card.stats.rac, card.stats.awa, card.stats.exp, card.stats.tyr, card.stats.wet];
  const points: string[] = [];
  const brakes: { x: number; y: number }[] = [];
  for (let i = 0; i < stats.length; i += 1) {
    const v = Math.max(0, Math.min(99, stats[i])) / 99;
    const x = 20 + i * 112;
    const throttleY = 96 - v * 74;
    points.push(`${x},${throttleY.toFixed(1)}`);
    if (stats[i] < 70) brakes.push({ x, y: throttleY });
  }
  return { points: points.join(" "), brakes };
}

function Lap({ card, color, label }: { card: Card; color: string; label: string }) {
  const { points, brakes } = trace(card);
  return (
    <div className="w-full">
      <div className="mono mb-1.5 flex items-center justify-between text-[10px] font-bold tracking-[0.16em]" style={{ color }}>
        <span>{label}</span>
        <span style={{ color: "var(--faint)" }}>THROTTLE · BRAKE</span>
      </div>
      <svg viewBox="0 0 600 110" preserveAspectRatio="none" className="h-[74px] w-full" role="img" aria-label={`${card.name} stat-derived throttle trace`}>
        <rect x="0" y="0" width="600" height="110" fill="transparent" />
        {[208, 416].map((x) => (
          <line key={x} x1={x} y1="4" x2={x} y2="106" stroke="rgba(240,232,216,0.12)" strokeWidth="1" strokeDasharray="3 4" />
        ))}
        <line x1="0" y1="22" x2="600" y2="22" stroke="rgba(240,232,216,0.06)" strokeWidth="1" />
        <line x1="0" y1="59" x2="600" y2="59" stroke="rgba(240,232,216,0.06)" strokeWidth="1" />
        <line x1="0" y1="98" x2="600" y2="98" stroke="rgba(240,232,216,0.12)" strokeWidth="1" />
        <text x="4" y="18" fill="var(--faint)" fontSize="8" fontFamily="monospace">100%</text>
        <text x="4" y="55" fill="var(--faint)" fontSize="8" fontFamily="monospace">50%</text>
        <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {brakes.map((b) => (
          <line key={b.x} x1={b.x} y1={b.y} x2={b.x} y2="98" stroke="#c1121f" strokeWidth="3" />
        ))}
        {["S1", "S2", "S3"].map((s, i) => (
          <text key={s} x={100 + i * 208} y="108" fill="var(--faint)" fontSize="9" fontFamily="monospace" textAnchor="middle">{s}</text>
        ))}
      </svg>
    </div>
  );
}

export function LapTelemetry({ a, b, accentA, accentB }: { a: Card; b?: Card; accentA: string; accentB?: string }) {
  return (
    <div className="w-full rounded-[14px] border px-4 py-3.5" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.02)" }}>
      <div className="mono mb-3 flex items-center justify-between text-[10px] font-bold tracking-[0.18em]" style={{ color: "var(--dim)" }}>
        <span>{b ? "COMPARISON TELEMETRY" : "LAP TELEMETRY"}</span>
        <span style={{ color: "var(--faint)" }}>STAT-DERIVED · NOT LAP TIMING</span>
      </div>
      <div className="space-y-3">
        <Lap card={a} color={accentA} label={a.login.toUpperCase()} />
        {b && accentB && <Lap card={b} color={accentB} label={b.login.toUpperCase()} />}
      </div>
    </div>
  );
}

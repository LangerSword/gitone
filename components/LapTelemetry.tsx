"use client";

import type { Card } from "@/lib/racing/types";

// A lap-shaped view of the six real ratings. This is NOT measured on-track
// telemetry: each rating drives one throttle point, and a sub-70 rating places
// a brake marker at that point. The panel says so on its face.
type Trace = { points: string; brakes: { x: number; y: number }[] };

function trace(card: Card): Trace {
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

function Grid() {
  return (
    <>
      {[208, 416].map((x) => (
        <line key={x} x1={x} y1="4" x2={x} y2="106" stroke="rgba(240,232,216,0.12)" strokeWidth="1" strokeDasharray="3 4" />
      ))}
      <line x1="0" y1="22" x2="600" y2="22" stroke="rgba(240,232,216,0.06)" strokeWidth="1" />
      <line x1="0" y1="59" x2="600" y2="59" stroke="rgba(240,232,216,0.06)" strokeWidth="1" />
      <line x1="0" y1="98" x2="600" y2="98" stroke="rgba(240,232,216,0.12)" strokeWidth="1" />
      <text x="4" y="18" fill="var(--faint)" fontSize="8" fontFamily="monospace">100%</text>
      <text x="4" y="55" fill="var(--faint)" fontSize="8" fontFamily="monospace">50%</text>
      <text x="4" y="94" fill="var(--faint)" fontSize="8" fontFamily="monospace">0%</text>
      {["S1", "S2", "S3"].map((s, i) => (
        <text key={s} x={100 + i * 208} y="108" fill="var(--faint)" fontSize="9" fontFamily="monospace" textAnchor="middle">{s}</text>
      ))}
    </>
  );
}

function TraceLine({ t, color }: { t: Trace; color: string }) {
  return (
    <>
      <polyline points={t.points} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {t.brakes.map((b) => (
        <line key={b.x} x1={b.x} y1={b.y} x2={b.x} y2="98" stroke={color} strokeOpacity="0.35" strokeWidth="1.5" />
      ))}
    </>
  );
}

export function LapTelemetry({ a, b, accentA, accentB }: { a: Card; b?: Card; accentA: string; accentB?: string }) {
  const compare = !!b && !!accentB;
  return (
    <div className="w-full rounded-[14px] border px-4 py-3.5" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.02)" }}>
      <div className="mono mb-3 flex items-center justify-between text-[10px] font-bold tracking-[0.18em]" style={{ color: "var(--dim)" }}>
        <span>{compare ? "PERFORMANCE OVERLAY" : "LAP TELEMETRY"}</span>
        <span style={{ color: "var(--faint)" }}>STAT-DERIVED · NOT LAP TIMING</span>
      </div>

      {compare && b ? (
        <>
          <div className="mono mb-1.5 flex flex-wrap items-center gap-4 text-[10px] font-bold tracking-[0.14em]">
            <span className="flex items-center gap-1.5" style={{ color: accentA }}>
              <span aria-hidden className="inline-block h-[2px] w-4" style={{ background: accentA }} />
              {a.login.toUpperCase()}
            </span>
            <span className="flex items-center gap-1.5" style={{ color: accentB! }}>
              <span aria-hidden className="inline-block h-[2px] w-4" style={{ background: accentB }} />
              {b.login.toUpperCase()}
            </span>
            <span style={{ color: "var(--faint)" }}>FAINT DROP = BRAKE</span>
          </div>
          <svg viewBox="0 0 600 110" preserveAspectRatio="none" className="h-[110px] w-full" role="img" aria-label={`${a.name} versus ${b.name} stat-derived performance overlay`}>
            <Grid />
            <TraceLine t={trace(a)} color={accentA} />
            <TraceLine t={trace(b)} color={accentB!} />
          </svg>
        </>
      ) : (
        <svg viewBox="0 0 600 110" preserveAspectRatio="none" className="h-[96px] w-full" role="img" aria-label={`${a.name} stat-derived throttle trace`}>
          <Grid />
          <TraceLine t={trace(a)} color={accentA} />
        </svg>
      )}
    </div>
  );
}

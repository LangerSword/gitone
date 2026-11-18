import { STATS, STAT_LABELS } from "@/lib/racing/constants";
import type { Card } from "@/lib/racing/types";

// Four-axis telemetry radar — the gitfut StatRadar's paddock sibling. Pure
// SVG, server-renderable, driven by the card's four stats with the livery
// as the trace colour and the purple sector ringing any 90+ axis.
export function StatRadar({ card, size = 220 }: { card: Card; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 38; // room for the axis labels at R + 24

  // four axes: up, right, down, left (PAC up — pace leads)
  const angleFor = (i: number) => (-90 + i * 90) * (Math.PI / 180);
  const point = (i: number, r: number) => {
    const a = angleFor(i);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  };
  const val = (v: number) => (Math.max(v, 1) / 99) * R;

  const order = ["pac", "rac", "exp", "awa"] as const;
  const poly = order
    .map((k, i) => point(i, val(card.stats[k])).join(","))
    .join(" ");

  const grid = [0.33, 0.66, 1].map((f) =>
    order.map((_, i) => point(i, R * f).join(",")).join(" "),
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Driver rating radar">
      {grid.map((g, i) => (
        <polygon key={i} points={g} fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.13)" strokeWidth={1} />
      ))}
      {order.map((_, i) => {
        const [x, y] = point(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.13)" strokeWidth={1} />;
      })}
      <polygon points={poly} fill={`${card.constructor.color}66`} stroke={card.constructor.color} strokeWidth={3} />
      {order.map((k, i) => {
        const [x, y] = point(i, val(card.stats[k]));
        const hot = card.stats[k] >= 90;
        return <circle key={k} cx={x} cy={y} r={hot ? 6 : 4.5} fill={hot ? "#b455ff" : card.constructor.color} stroke="#0a0a0d" strokeWidth={1.5} />;
      })}
      {order.map((k, i) => {
        const [x, y] = point(i, R + 24);
        return (
          <text
            key={k}
            x={x}
            y={y + 4}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={12}
            fontWeight={700}
            letterSpacing={2}
            fill="rgba(237,238,242,0.8)"
          >
            {STAT_LABELS[STATS.find((s) => s === k) as (typeof STATS)[number]]}
          </text>
        );
      })}
    </svg>
  );
}

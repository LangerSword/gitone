import { FAN_CARDS } from "@/lib/racing/samples";
import { MiniCard } from "./MiniCard";

// The hero: three real cards, preloaded from the sample snapshot. One big
// card in front, two leaning behind, a warm pool of light under them. No
// network on first paint, no wall of cards.
const LAYOUT = [
  { card: FAN_CARDS[1].card, x: -152, rotate: -12, top: 108, width: 188, z: 1 },
  { card: FAN_CARDS[2].card, x: 152, rotate: 12, top: 108, width: 188, z: 1, label: "LEGEND" as const },
  { card: FAN_CARDS[3].card, x: 0, rotate: 0, top: 16, width: 248, z: 3, label: "GOAT" as const },
];

export function FanCards() {
  return (
    <div className="relative flex w-full items-center justify-center" style={{ height: 440 }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: 460,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(255,61,31,0.2), rgba(110,243,197,0.07) 48%, transparent 74%)",
          filter: "blur(22px)",
        }}
      />

      {LAYOUT.map((c, i) => (
        <div
          key={c.card.login}
          className="fan-slot absolute"
          style={{ left: "50%", top: c.top, transform: `translateX(calc(-50% + ${c.x}px))`, zIndex: c.z }}
        >
          <div
            className="fan-card"
            style={
              {
                "--rot": `${c.rotate}deg`,
                animationDelay: `${160 + i * 110}ms`,
              } as React.CSSProperties
            }
          >
            <MiniCard card={c.card} label={c.label} width={c.width} priority={i === 2} />
          </div>
        </div>
      ))}

      {/* two live chips, the only copy on the visual side */}
      <span
        className="mono absolute right-[2%] top-[16%] inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[9px] font-bold tracking-[0.14em]"
        style={{ background: "rgba(7,8,10,0.72)", border: "1px solid rgba(246,241,232,0.14)", color: "var(--ink)", backdropFilter: "blur(8px)" }}
      >
        <span aria-hidden className="h-[6px] w-[6px] rounded-full" style={{ background: "var(--f1-red)", boxShadow: "0 0 10px var(--f1-red)" }} />
        RTG 94 · LIVE
      </span>
      <span
        className="mono absolute bottom-[12%] left-[3%] rounded-full px-3 py-1.5 text-[9px] font-bold tracking-[0.14em]"
        style={{ background: "rgba(110,243,197,0.1)", border: "1px solid rgba(110,243,197,0.3)", color: "var(--mint)" }}
      >
        PAC 96 · FASTEST
      </span>
    </div>
  );
}

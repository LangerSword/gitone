import { FAN_CARDS, SAMPLE_CARDS } from "@/lib/racing/samples";
import { MiniCard } from "./MiniCard";

// The hero: four real cards, preloaded from the sample snapshot. Torvalds
// leads on the right, ThePrimeagen anchors the left, two champions lean in
// between. No network on first paint, no wall of cards.
const prime = SAMPLE_CARDS.find((c) => c.login === "ThePrimeagen") ?? FAN_CARDS[0].card;

const LAYOUT = [
  { card: prime, x: -168, rotate: -16, top: 132, width: 152, z: 1 },
  { card: FAN_CARDS[1].card, x: -56, rotate: -6, top: 94, width: 172, z: 2 },
  { card: FAN_CARDS[2].card, x: 56, rotate: 6, top: 94, width: 172, z: 2, label: "LEGEND" as const },
  { card: FAN_CARDS[3].card, x: 168, rotate: 14, top: 42, width: 196, z: 4, label: "GOAT" as const },
];

export function FanCards() {
  return (
    <div className="fan-stage relative flex w-full items-center justify-center" style={{ height: 460 }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: 480,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(201,121,69,0.22), rgba(121,199,164,0.08) 48%, transparent 74%)",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: 440,
          height: 440,
          borderRadius: "50%",
          border: "1px solid rgba(214,133,74,0.16)",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: 356,
          height: 356,
          borderRadius: "50%",
          border: "1px solid rgba(240,232,216,0.07)",
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
                animationDelay: `${150 + i * 100}ms`,
              } as React.CSSProperties
            }
          >
            <MiniCard card={c.card} label={c.label} width={c.width} priority />
          </div>
        </div>
      ))}

      <span
        className="mono absolute right-[1%] top-[12%] inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10.5px] font-bold tracking-[0.14em]"
        style={{ background: "rgba(7,8,10,0.72)", border: "1px solid rgba(246,241,232,0.14)", color: "var(--ink)", backdropFilter: "blur(8px)" }}
      >
        <span aria-hidden className="h-[6px] w-[6px] rounded-full" style={{ background: "var(--f1-red)", boxShadow: "0 0 10px rgba(201,121,69,.7)" }} />
        RTG {FAN_CARDS[3].card.rtg} · LIVE
      </span>
      <span
        className="mono absolute bottom-[9%] left-[4%] rounded-full px-3 py-1.5 text-[10.5px] font-bold tracking-[0.14em]"
        style={{ background: "rgba(121,199,164,0.1)", border: "1px solid rgba(121,199,164,0.3)", color: "var(--green)" }}
      >
        PAC {FAN_CARDS[3].card.stats.pac} · FASTEST
      </span>
    </div>
  );
}

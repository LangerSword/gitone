import Link from "next/link";
import type { CardPreview } from "@/lib/racing/types";
import { DriverCard26 } from "./DriverCard26";

// The shelf card: the full F1 26 grammar at 132px, so the landing fan and
// the start grid are the same object as the report card, only smaller.
// Labels are the only extra: P1 for the GOAT, LEGEND for Felix.
export function MiniCard({
  card,
  label,
  width = 132,
  priority = false,
}: {
  card: CardPreview;
  label?: "GOAT" | "LEGEND";
  width?: number;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/${card.login}`}
      className="mini-card group relative block flex-none"
      style={{ width, scrollSnapAlign: "start" }}
      title={`${card.name} · RTG ${card.rtg}`}
      aria-label={`${card.name}, rated ${card.rtg}. Open the scout report.`}
    >
      <div className="transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:scale-[1.02]">
        <DriverCard26 card={card} eager={priority} />
      </div>
      {label && (
        <span
          className="mono absolute -top-2 left-3 z-[6] px-1.5 py-0.5 text-[8px] font-extrabold tracking-[0.16em]"
          style={{
            background: label === "GOAT" ? "var(--f1-yellow)" : "var(--purple)",
            color: label === "GOAT" ? "#15130a" : "#160a20",
            boxShadow: "0 4px 12px rgba(0,0,0,.45)",
          }}
        >
          {label === "GOAT" ? "P1 · GOAT" : "LEGEND"}
        </span>
      )}
    </Link>
  );
}

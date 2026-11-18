import Link from "next/link";
import { Crown, Sparkles } from "lucide-react";
import type { Card } from "@/lib/racing/types";
import { STATS, STAT_LABELS } from "@/lib/racing/constants";
import { flagUrl } from "@/lib/flagUrl";
import { cardDisplayName } from "@/lib/text";

// A miniature of the F1 26 rating card for the landing page showcase: same
// chamfer, same team slash, same giant RTG and stat boxes. Pin labels put
// the GOAT and Felix at the front of the grid before a scout has landed.
export function MiniCard({
  card,
  login,
  label,
}: {
  card: Card | null;
  login: string;
  label?: "GOAT" | "LEGEND";
}) {
  const livery = card?.constructor.color ?? "#e10600";
  const name = card ? cardDisplayName(card.name).toUpperCase() : login.toUpperCase();
  const flag = flagUrl(card?.country ?? null, 80);
  const tilt = label === "GOAT" ? "rotate(-3deg)" : label === "LEGEND" ? "rotate(2deg)" : "none";

  return (
    <Link
      href={`/${login}`}
      className="group relative block flex-none"
      style={{ width: 118, height: 177, transform: tilt, scrollSnapAlign: "start" }}
      title={card ? `${card.name} · RTG ${card.rtg}` : `${login} · scouting…`}
    >
      <div
        className="absolute inset-0 transition-transform duration-200 group-hover:-translate-y-1.5"
        style={{
          clipPath:
            "polygon(11px 0, 100% 0, 100% calc(100% - 11px), calc(100% - 11px) 100%, 0 100%, 0 11px)",
          background: "linear-gradient(155deg, #191920, #0e0e15)",
          boxShadow:
            label === "GOAT"
              ? "0 0 0 1px #ffd10088, 0 12px 34px -14px #ffd10066"
              : "0 12px 30px -16px rgba(0,0,0,0.8)",
        }}
      >
        {/* team slash */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(122deg, transparent 24%, ${livery}55 24%, ${livery}70 43%, transparent 43%, transparent 62%, ${livery}22 62%, transparent 78%)`,
          }}
        />
        {/* photo */}
        <div className="absolute left-0 top-[7%] w-[58%] h-[62%] overflow-hidden">
          {card && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.avatarUrl}
              alt=""
              className="w-full h-full object-cover object-top"
              style={{ filter: "contrast(1.1) saturate(0.85)" }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, transparent 50%, #101017 98%), linear-gradient(90deg, transparent 55%, #101017 100%)`,
            }}
          />
        </div>
        {/* number + flag */}
        <div className="absolute left-[6%] top-[9%] flex items-center gap-1.5">
          <span
            className="mono text-[11px] font-extrabold leading-none px-1 py-0.5 rounded"
            style={{ background: livery, color: card?.constructor.ink ?? "#15151e" }}
          >
            {card?.number ?? "—"}
          </span>
          {flag && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={flag} alt="" className="h-2.5 w-auto" />
          )}
        </div>
        {/* RTG */}
        <div className="absolute right-[6%] top-[5%] text-right">
          <div className="mono text-[6px] tracking-[0.2em]" style={{ color: "rgba(243,243,244,0.7)" }}>
            RTG
          </div>
          <div
            style={{
              fontFamily: "var(--font-titillium), sans-serif",
              fontWeight: 900,
              fontSize: 38,
              lineHeight: 0.84,
              color: "#fff",
              textShadow: `0 0 18px ${livery}aa`,
            }}
          >
            {card?.rtg ?? "—"}
          </div>
        </div>
        {/* identity */}
        <div className="absolute left-[6%] top-[68%] w-[88%]">
          <div
            className="truncate"
            style={{ fontFamily: "var(--font-titillium), sans-serif", fontWeight: 900, fontSize: 13, lineHeight: 1, color: "#fff" }}
          >
            {name}
          </div>
          <div className="mono truncate text-[6px] tracking-[0.14em]" style={{ color: livery }}>
            {card?.constructor.name.toUpperCase() ?? "SCOUTING"}
          </div>
        </div>
        {/* stat boxes */}
        <div className="absolute left-[5%] right-[5%] top-[84%] flex gap-[2px]">
          {STATS.map((k) => (
            <div
              key={k}
              className="flex-1 text-center border rounded-[2px] py-[2px]"
              style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" }}
            >
              <div className="mono text-[5px]" style={{ color: "rgba(243,243,244,0.6)" }}>
                {STAT_LABELS[k]}
              </div>
              <div className="mono text-[10px] font-extrabold leading-none" style={{ color: (card?.stats[k] ?? 0) >= 90 ? "#b455ff" : "#fff" }}>
                {card?.stats[k] ?? "·"}
              </div>
            </div>
          ))}
        </div>
      </div>
      {label && (
        <span
          className="mono absolute -top-2 left-1/2 -translate-x-1/2 rounded px-1.5 py-0.5 text-[7px] font-bold tracking-[0.12em] whitespace-nowrap"
          style={{
            background: label === "GOAT" ? "#ffd100" : "#b455ff",
            color: "#15151e",
            zIndex: 3,
          }}
        >
          {label === "GOAT" ? "P1 · GOAT" : "LEGEND"}
        </span>
      )}
      {label === "GOAT" && (
        <Crown size={13} className="absolute -top-3 right-0" style={{ color: "#ffd100", fill: "#ffd10055" }} />
      )}
      {label === "LEGEND" && <Sparkles size={11} className="absolute -top-2 right-0" style={{ color: "#b455ff" }} />}
    </Link>
  );
}

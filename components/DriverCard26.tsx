import type { Card, StatKey } from "@/lib/racing/types";
import { STATS, STAT_LABELS } from "@/lib/racing/constants";
import { resolveCardTheme } from "./finishTheme";
import { cardDisplayName } from "@/lib/text";
import { flagUrl } from "@/lib/flagUrl";

// The official F1 26 driver-rating card grammar: portrait 2:3, chamfered
// top-left and bottom-right, a diagonal team-color slash behind the driver,
// a giant RTG, surname + flag + constructor at the bottom, and compact
// stat boxes along the base. Container-query scaled (1cqw = 1% width).
export function DriverCard26({ card }: { card: Card }) {
  const theme = resolveCardTheme(card);
  const livery = card.constructor.color;
  const flag = flagUrl(card.country, 80);
  const displayName = cardDisplayName(card.name).toUpperCase();

  return (
    <div
      style={{
        width: "100%",
        containerType: "inline-size",
        clipPath:
          "polygon(5.5cqw 0, 100% 0, 100% calc(100% - 5.5cqw), calc(100% - 5.5cqw) 100%, 0 100%, 0 5.5cqw)",
        filter: `drop-shadow(0 2cqw 4cqw ${theme.glow})`,
      }}
    >
      <div
        style={{
          borderRadius: "1cqw",
          padding: "1.2cqw",
          background: theme.foil,
          position: "relative",
        }}
      >
        <div
          className="gitone-card"
          style={{
            position: "relative",
            aspectRatio: "400 / 600",
            width: "100%",
            overflow: "hidden",
            background: "linear-gradient(155deg, #191920 0%, #0e0e15 60%, #12121b 100%)",
          }}
        >
          {/* the signature F1 26 device: a team-colour diagonal slash */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `linear-gradient(122deg, transparent 24%, ${livery}55 24%, ${livery}70 43%, transparent 43%, transparent 62%, ${livery}22 62%, transparent 78%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(115deg, rgba(255,255,255,0.025) 0 2px, transparent 2px 11px), radial-gradient(80% 50% at 50% 0%, rgba(255,255,255,0.06), transparent 70%)",
            }}
          />

          {/* driver photo, left, cool-graded and faded into the card */}
          <div style={{ position: "absolute", left: 0, top: "7%", width: "58%", height: "62%", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.avatarUrl}
              alt={card.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top",
                filter: "contrast(1.1) saturate(0.85)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `radial-gradient(80% 60% at 50% 10%, ${livery}22, transparent 60%), linear-gradient(180deg, transparent 55%, #101017 98%), linear-gradient(90deg, transparent 60%, #101017 100%)`,
              }}
            />
          </div>

          {/* number + flag, tucked below the top-left chamfer */}
          <div style={{ position: "absolute", left: "6%", top: "9.5%", display: "flex", alignItems: "center", gap: "2cqw" }}>
            <span
              className="mono"
              style={{
                background: livery,
                color: card.constructor.ink,
                fontSize: "6cqw",
                fontWeight: 800,
                lineHeight: 1,
                padding: "1cqw 2cqw",
                borderRadius: "0.8cqw",
              }}
            >
              {card.number}
            </span>
            {flag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={flag} alt="" style={{ height: "4cqw", width: "auto", borderRadius: "0.3cqw" }} />
            )}
          </div>

          {/* the giant rating */}
          <div style={{ position: "absolute", right: "6%", top: "5%", textAlign: "right" }}>
            <div className="mono" style={{ fontSize: "3cqw", letterSpacing: "0.32em", color: "rgba(243,243,244,0.7)" }}>
              RTG
            </div>
            <div
              style={{
                fontFamily: "var(--font-titillium), sans-serif",
                fontWeight: 900,
                fontSize: "30cqw",
                lineHeight: 0.84,
                color: "#ffffff",
                textShadow: `0 0 6cqw ${livery}bb, 0 0.6cqw 2cqw rgba(0,0,0,0.6)`,
              }}
            >
              {card.rtg}
            </div>
          </div>

          {/* finish tier, small under the number */}
          <div
            className="mono"
            style={{
              position: "absolute",
              left: "6%",
              top: "22%",
              fontSize: "2.6cqw",
              fontWeight: 800,
              letterSpacing: "0.2em",
              color: theme.ink,
              background: `${theme.accent}22`,
              border: `1px solid ${theme.accent}55`,
              padding: "0.8cqw 1.5cqw",
              borderRadius: "0.6cqw",
            }}
          >
            {card.finishLabel}
          </div>

          {/* identity block, below the photo */}
          <div style={{ position: "absolute", left: "6%", top: "68.5%", width: "88%" }}>
            <div
              style={{
                fontFamily: "var(--font-titillium), sans-serif",
                fontWeight: 900,
                fontSize: "11.5cqw",
                lineHeight: 0.92,
                color: "#ffffff",
                whiteSpace: "nowrap",
                textShadow: `0 0.4cqw 2cqw rgba(0,0,0,0.6)`,
              }}
            >
              {displayName}
            </div>
            <div
              className="mono"
              style={{ marginTop: "1.4cqw", fontSize: "2.9cqw", color: livery, letterSpacing: "0.16em" }}
            >
              {card.constructor.name.toUpperCase()}
            </div>
          </div>

          {/* F1 26 stat boxes — compact, equal, with the 90+ sector tinted */}
          <div
            style={{
              position: "absolute",
              left: "5%",
              right: "5%",
              top: "84%",
              display: "flex",
              gap: "1.6cqw",
            }}
          >
            {STATS.map((k: StatKey) => (
              <div
                key={k}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "0.6cqw",
                  padding: "1.4cqw 0.6cqw 1.2cqw",
                  textAlign: "center",
                }}
              >
                <div className="mono" style={{ fontSize: "2.3cqw", color: "rgba(243,243,244,0.6)", letterSpacing: "0.1em" }}>
                  {STAT_LABELS[k]}
                </div>
                <div
                  className="mono"
                  style={{
                    marginTop: "0.5cqw",
                    fontSize: "6.4cqw",
                    fontWeight: 800,
                    lineHeight: 1,
                    color: card.stats[k] >= 90 ? "var(--purple)" : "#ffffff",
                  }}
                >
                  {card.stats[k]}
                </div>
              </div>
            ))}
          </div>

          <div
            className="mono"
            style={{
              position: "absolute",
              left: "6%",
              bottom: "2%",
              fontSize: "2cqw",
              letterSpacing: "0.2em",
              color: "rgba(243,243,244,0.35)",
            }}
          >
            GITONE · @{card.login}
          </div>
        </div>
      </div>
    </div>
  );
}

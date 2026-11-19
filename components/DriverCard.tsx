import type { Card, StatKey } from "@/lib/racing/types";
import { STATS, STAT_LABELS } from "@/lib/racing/constants";
import { artLayers, resolveCardTheme, statColor } from "./finishTheme";
import { cardDisplayName } from "@/lib/text";
import { flagUrl } from "@/lib/flagUrl";

// The gitone driver card — a material object, not a panel. Foil frame cut
// per finish, livery bokeh and speed-streak art behind the surface, the
// photo bled left with a duotone rim-light, the driver's number ghosted
// behind the ratings. Scales via container queries (1cqw = 1% of card
// width); lib/og/renderCard.tsx mirrors these exact positions for the
// embeddable .png.

export function DriverCard({ card }: { card: Card }) {
  const theme = resolveCardTheme(card);
  const livery = card.constructor.color;
  const flag = flagUrl(card.country, 80);
  const displayName = cardDisplayName(card.name).toUpperCase();
  const c = statColor;

  return (
    <div
      style={{
        width: "100%",
        containerType: "inline-size",
        // the card is NOT a rectangle: a livery-cut chamfer at the top-right
        // and a smaller cut at the bottom-left, like a real driver card
        clipPath:
          "polygon(0 0, calc(100% - 5.5cqw) 0, 100% 5.5cqw, 100% 100%, 4.5cqw 100%, 0 calc(100% - 4.5cqw))",
        filter: `drop-shadow(0 1.4cqw 3.4cqw ${theme.glow})`,
      }}
    >
      <div
        style={{
          position: "relative",
          borderRadius: "1.6cqw",
          padding: "1.5cqw",
          // the frame — the finish's foil (Topps Chrome materials: base,
          // checker flag, gold, and the iridescent superfractor)
          background: theme.foil,
        }}
      >
        {/* checker-flag chrome, only on the rare finishes */}
        {(card.finish === "podium" || card.finish === "winner" || card.finish === "champion") && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "conic-gradient(rgba(255,255,255,0.14) 0 25%, transparent 0 50%, rgba(255,255,255,0.14) 0 75%, transparent 0)",
              backgroundSize: "2cqw 2cqw",
              opacity: 0.35,
              pointerEvents: "none",
            }}
          />
        )}
      <div
        className="gitone-card"
        style={{
          position: "relative",
          aspectRatio: "640 / 390",
          width: "100%",
          overflow: "hidden",
          borderRadius: "0.8cqw",
          background: "#15151e",
        }}
      >
        {/* art: livery bokeh, streaks, grain, vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: artLayers(livery, card.finish).join(","),
            backgroundColor: "#0a0a0d",
          }}
        />
        {/* ghost number watermark */}
        <div
          style={{
            position: "absolute",
            right: "3%",
            top: "13%",
            fontFamily: "var(--font-barlowc), sans-serif",
            fontWeight: 900,
            fontStyle: "italic",
            fontSize: "28cqw",
            lineHeight: 0.8,
            color: "transparent",
            WebkitTextStroke: `0.2cqw ${theme.accent}`,
            opacity: 0.13,
          }}
        >
          {card.number}
        </div>
        {/* diagonal gloss sheen — the laminate catch-light */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(115deg, rgba(255,255,255,0.07) 0%, transparent 22%, transparent 64%, rgba(255,255,255,0.045) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* photo — bled left, duotone + rim light */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "37%",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.avatarUrl}
            alt={card.name}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
              filter: "saturate(0.88) contrast(1.04)",
            }}
          />
          {/* duotone + edge fade into the art */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `radial-gradient(90% 70% at 65% 12%, ${livery}30, transparent 60%), linear-gradient(90deg, rgba(10,10,13,0.15) 0%, transparent 18%, transparent 72%, #0a0a0d 100%), linear-gradient(180deg, rgba(10,10,13,0.25) 0%, transparent 22%, transparent 62%, rgba(8,8,11,0.72) 100%)`,
              boxShadow: "inset 0 0 0 0.3cqw rgba(255,255,255,0.08)",
            }}
          />
          {/* checkered base strip under the photo */}
          <div
            className="checker"
            style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: "3.2cqw", opacity: 0.5 }}
          />
        </div>

        {/* flag chip */}
        {flag && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={flag}
            alt=""
            style={{
              position: "absolute",
              left: "2.4%",
              top: "3%",
              height: "3.6cqw",
              width: "auto",
              borderRadius: "0.3cqw",
              boxShadow: "0 0.2cqw 0.8cqw rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.3)",
            }}
          />
        )}

        {/* driver number chip — foil material */}
        <div
          style={{
            position: "absolute",
            left: "2.4%",
            bottom: "9.5%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.6cqw 1.6cqw",
            borderRadius: "0.6cqw",
            background: theme.foil,
            boxShadow: `0 0.5cqw 1.6cqw rgba(0,0,0,0.6), inset 0 0 0 1px ${theme.foilEdge}`,
          }}
        >
          <span
            className="mono"
            style={{ fontSize: "6.4cqw", fontWeight: 800, lineHeight: 1, color: "#0c0c0f", paddingTop: "0.2cqw" }}
          >
            {card.number}
          </span>
        </div>

        {/* finish chip — the card's tier, in its own material */}
        <div
          style={{
            position: "absolute",
            right: "8%",
            top: "4.5%",
            padding: "0.5cqw 1.3cqw 0.4cqw",
            borderRadius: "0.5cqw",
            background: theme.foil,
            boxShadow: `inset 0 0 0 1px ${theme.foilEdge}, 0 0.4cqw 1.2cqw rgba(0,0,0,0.5)`,
          }}
        >
          <span
            className="mono"
            style={{ fontSize: "2.1cqw", fontWeight: 800, letterSpacing: "0.14em", color: "#0c0c0f" }}
          >
            {card.finishLabel}
          </span>
        </div>

        {/* identity block */}
        <div style={{ position: "absolute", left: "40.5%", top: "7.5%", width: "34%" }}>
          <div
            className="mono"
            style={{
              fontSize: "2.3cqw",
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: livery,
              textShadow: `0 0 1.4cqw ${livery}55`,
            }}
          >
            {card.constructor.name.toUpperCase()}
          </div>
          <div
            style={{
              marginTop: "0.6cqw",
              fontFamily: "var(--font-barlowc), sans-serif",
              fontWeight: 900,
              fontSize: "8.2cqw",
              lineHeight: 0.96,
              color: "#f4f5f9",
              textShadow: `0 0.2cqw 1.2cqw rgba(0,0,0,0.65), 0 0 3cqw ${theme.accent}33`,
              whiteSpace: "nowrap",
            }}
          >
            {displayName}
          </div>
          <div
            className="mono"
            style={{ marginTop: "0.7cqw", fontSize: "2.4cqw", color: "rgba(237,238,242,0.6)" }}
          >
            @{card.login}
          </div>
          <div
            className="mono"
            style={{
              marginTop: "0.5cqw",
              fontSize: "2.05cqw",
              letterSpacing: "0.1em",
              color: theme.ink,
              textShadow: `0 0 1.2cqw ${theme.glow}`,
            }}
          >
            {card.archetype.toUpperCase()}
          </div>
        </div>

        {/* RTG — the headline number, glowing in the finish accent */}
        <div style={{ position: "absolute", right: "2.4%", top: "11%", textAlign: "right" }}>
          <div
            className="mono"
            style={{ fontSize: "2.2cqw", letterSpacing: "0.3em", color: "rgba(244,245,249,0.85)", fontWeight: 700 }}
          >
            RTG
          </div>
          <div style={{ position: "relative" }}>
            {/* halo behind the number */}
            <div
              style={{
                position: "absolute",
                inset: "-30% -20%",
                background: `radial-gradient(60% 70% at 70% 60%, ${theme.accent}40, transparent 70%)`,
                pointerEvents: "none",
              }}
              aria-hidden="true"
            />
            <div
              style={{
                position: "relative",
                fontFamily: "var(--font-barlowc), sans-serif",
                fontWeight: 900,
                fontSize: "15cqw",
                lineHeight: 0.86,
                color: "#ffffff",
                textShadow: `0 0 1.4cqw rgba(255,255,255,0.35), 0 0 4cqw ${theme.accent}aa, 0 0.3cqw 1cqw rgba(0,0,0,0.7)`,
              }}
            >
              {card.rtg}
            </div>
          </div>
        </div>

        {/* the six rating bars */}
        <div style={{ position: "absolute", left: "40.5%", top: "45%", width: "56.5%" }}>
          {STATS.map((k: StatKey, i: number) => (
            <div
              key={k}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.6cqw",
                marginTop: i === 0 ? 0 : "1.0cqw",
              }}
            >
              <span
                className="mono"
                style={{
                  width: "5.4cqw",
                  fontSize: "2.5cqw",
                  fontWeight: 700,
                  lineHeight: 1,
                  color: "rgba(237,238,242,0.55)",
                  letterSpacing: "0.05em",
                }}
              >
                {STAT_LABELS[k]}
              </span>
              <div
                style={{
                  flex: 1,
                  height: "1.5cqw",
                  borderRadius: "0.9cqw",
                  background: "rgba(255,255,255,0.08)",
                  boxShadow: "inset 0 0.2cqw 0.5cqw rgba(0,0,0,0.55)",
                  overflow: "hidden",
                }}
              >
                <div
                  className="bar-fill"
                  style={{
                    width: `${card.stats[k]}%`,
                    height: "100%",
                    borderRadius: "0.9cqw",
                    background: c(card.stats[k], theme),
                    boxShadow: `0 0 1.4cqw ${c(card.stats[k], theme)}66`,
                    animationDelay: `${0.15 + i * 0.09}s`,
                  }}
                />
              </div>
              <span
                className="mono"
                style={{
                  width: "6.6cqw",
                  textAlign: "right",
                  fontSize: "3.2cqw",
                  fontWeight: 800,
                  lineHeight: 1,
                  color: c(card.stats[k], theme),
                  textShadow: card.stats[k] >= 90 ? `0 0 1.6cqw ${theme.hot}` : "none",
                }}
              >
                {card.stats[k]}
              </span>
            </div>
          ))}
        </div>

        {/* chassis strip */}
        <div
          style={{
            position: "absolute",
            left: "40.5%",
            right: "3.5%",
            bottom: "5%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `0.24cqw solid ${livery}`,
            paddingTop: "1.2cqw",
            opacity: 0.92,
          }}
        >
          <span className="mono" style={{ fontSize: "2.3cqw", color: "rgba(237,238,242,0.75)" }}>
            <span style={{ color: "rgba(237,238,242,0.5)" }}>CHASSIS</span>{" "}
            <span style={{ color: "#f4f5f9", fontWeight: 700 }}>{card.car.rating}</span>
            {(["cor", "top", "aero", "rel"] as const).map((k) => (
              <span key={k}>
                {" · "}
                <span style={{ color: "rgba(237,238,242,0.5)" }}>{k.toUpperCase()}</span>{" "}
                <span style={{ color: "#f4f5f9", fontWeight: 700 }}>{card.car[k]}</span>
              </span>
            ))}
          </span>
          <span
            className="mono"
            style={{ fontSize: "2.05cqw", color: theme.ink, letterSpacing: "0.18em", opacity: 0.85 }}
          >
            GITONE
          </span>
        </div>
      </div>
      </div>
    </div>
  );
}

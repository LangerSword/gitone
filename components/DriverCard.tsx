import type { Card, StatKey } from "@/lib/racing/types";
import { STATS, STAT_LABELS } from "@/lib/racing/constants";
import { resolveCardTheme, statColor } from "./finishTheme";
import { cardDisplayName } from "@/lib/text";
import { flagUrl } from "@/lib/flagUrl";

// The gitone driver card — EA F1-game rating style, landscape carbon, one
// livery accent band per constructor. Scales entirely via container queries
// (1cqw = 1% of card width), so the same card serves the page, the starting
// grid and the Satori embed (lib/og/card.tsx mirrors these exact positions).
// Aspect locked to 640:390.

export function DriverCard({ card }: { card: Card }) {
  const theme = resolveCardTheme(card);
  const livery = card.constructor.color;
  const liveryInk = card.constructor.ink;
  const flag = flagUrl(card.country, 80);
  const displayName = cardDisplayName(card.name).toUpperCase();
  const statColorFor = (v: number) => statColor(v, theme);

  return (
    <div
      className="gitone-card carbon"
      style={{
        position: "relative",
        aspectRatio: "640 / 390",
        containerType: "inline-size",
        width: "100%",
        borderRadius: "1cqw",
        overflow: "hidden",
        background: "linear-gradient(160deg, #17171c 0%, #0c0c0f 55%, #101014 100%)",
        boxShadow: `0 1cqw 3cqw -0.8cqw ${theme.glow}, inset 0 0 0 1px rgba(255,255,255,0.05)`,
      }}
    >
      {/* livery rail */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "3.1%",
          height: "100%",
          background: livery,
        }}
      />
      {/* livery glow behind the photo */}
      <div
        style={{
          position: "absolute",
          left: "-4%",
          top: "-18%",
          width: "52%",
          height: "88%",
          background: `radial-gradient(closest-side, ${livery}2e, transparent)`,
        }}
      />

      {/* top band: constructor + finish chip */}
      <div
        className="mono"
        style={{
          position: "absolute",
          left: "5.4%",
          top: "3.6%",
          fontSize: "2.35cqw",
          fontWeight: 700,
          letterSpacing: "0.18em",
          color: livery,
        }}
      >
        {card.constructor.name.toUpperCase()}
      </div>
      <div
        className="mono"
        style={{
          position: "absolute",
          right: "3.2%",
          top: "2.9%",
          fontSize: "2.05cqw",
          fontWeight: 800,
          letterSpacing: "0.14em",
          padding: "0.45cqw 1.1cqw 0.35cqw",
          borderRadius: "0.5cqw",
          background: theme.accent,
          color: "#0c0c0f",
        }}
      >
        {card.finishLabel}
      </div>

      {/* photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={card.avatarUrl}
        alt={card.name}
        style={{
          position: "absolute",
          left: "5.2%",
          top: "10.2%",
          width: "33.4%",
          height: "63%",
          objectFit: "cover",
          objectPosition: "top",
          borderRadius: "0.8cqw",
          filter: "saturate(0.92)",
        }}
      />
      {/* photo fade + livery tint */}
      <div
        style={{
          position: "absolute",
          left: "5.2%",
          top: "10.2%",
          width: "33.4%",
          height: "63%",
          borderRadius: "0.8cqw",
          background: `linear-gradient(180deg, transparent 40%, #0c0c0fee 96%), radial-gradient(120% 90% at 80% 10%, ${livery}26, transparent 60%)`,
        }}
      />
      {/* flag chip */}
      {flag && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={flag}
          alt=""
          style={{
            position: "absolute",
            left: "6.6%",
            top: "12.6%",
            height: "3.4cqw",
            width: "auto",
            borderRadius: "0.3cqw",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.28)",
          }}
        />
      )}
      {/* driver number chip */}
      <div
        style={{
          position: "absolute",
          left: "5.2%",
          top: "59.4%",
          minWidth: "13.4%",
          height: "13.8%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: livery,
          color: liveryInk,
          borderRadius: "0.6cqw 0.9cqw 0 0",
        }}
      >
        <span
          className="mono"
          style={{ fontSize: "7cqw", fontWeight: 800, lineHeight: 1, paddingTop: "0.3cqw" }}
        >
          {card.number}
        </span>
      </div>

      {/* name block */}
      <div style={{ position: "absolute", left: "41.8%", top: "12.4%", width: "36%" }}>
        <div
          style={{
            fontFamily: "var(--font-titillium), sans-serif",
            fontWeight: 900,
            fontSize: "7.6cqw",
            lineHeight: 0.98,
            letterSpacing: "0.01em",
            color: "var(--ink)",
          }}
        >
          {displayName}
        </div>
        <div
          className="mono"
          style={{ marginTop: "1.1cqw", fontSize: "2.45cqw", color: "var(--dim)", letterSpacing: "0.06em" }}
        >
          @{card.login}
        </div>
        <div
          className="mono"
          style={{ marginTop: "0.7cqw", fontSize: "2.2cqw", color: "var(--faint)", letterSpacing: "0.08em" }}
        >
          {card.archetype.toUpperCase()}
        </div>
      </div>

      {/* RTG block */}
      <div style={{ position: "absolute", right: "3.4%", top: "10.6%", textAlign: "right" }}>
        <div
          className="mono"
          style={{ fontSize: "2.3cqw", letterSpacing: "0.3em", color: "var(--dim)", fontWeight: 700 }}
        >
          RTG
        </div>
        <div
          style={{
            fontFamily: "var(--font-titillium), sans-serif",
            fontWeight: 900,
            fontSize: "14.2cqw",
            lineHeight: 0.9,
            color: card.finish === "champion" || card.finish === "in_form" || card.finish === "founder"
              ? theme.accent
              : "var(--ink)",
          }}
        >
          {card.rtg}
        </div>
        <div
          className="mono"
          style={{ fontSize: "2.3cqw", color: "var(--faint)", letterSpacing: "0.14em", marginTop: "0.4cqw" }}
        >
          CAR {card.car.rating}
        </div>
      </div>

      {/* the four rating bars */}
      <div style={{ position: "absolute", left: "41.8%", top: "47%", width: "54.8%" }}>
        {STATS.map((k: StatKey, i: number) => (
          <div
            key={k}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.6cqw",
              marginTop: i === 0 ? 0 : "2.15cqw",
            }}
          >
            <span
              className="mono"
              style={{ width: "5.2cqw", fontSize: "2.7cqw", fontWeight: 700, color: "var(--dim)", letterSpacing: "0.06em" }}
            >
              {STAT_LABELS[k]}
            </span>
            <div
              style={{
                flex: 1,
                height: "1.55cqw",
                borderRadius: "0.8cqw",
                background: "rgba(255,255,255,0.07)",
                overflow: "hidden",
              }}
            >
              <div
                className="bar-fill"
                style={{
                  width: `${card.stats[k]}%`,
                  height: "100%",
                  borderRadius: "0.8cqw",
                  background: statColorFor(card.stats[k]),
                  animationDelay: `${0.15 + i * 0.09}s`,
                }}
              />
            </div>
            <span
              className="mono"
              style={{
                width: "6.4cqw",
                textAlign: "right",
                fontSize: "3.5cqw",
                fontWeight: 800,
                color: statColorFor(card.stats[k]),
              }}
            >
              {card.stats[k]}
            </span>
          </div>
        ))}
      </div>

      {/* divider + chassis strip */}
      <div
        style={{
          position: "absolute",
          left: "5.2%",
          right: "3.2%",
          top: "88.6%",
          height: "0.28cqw",
          background: livery,
          opacity: 0.4,
        }}
      />
      <div
        className="mono"
        style={{
          position: "absolute",
          left: "5.2%",
          top: "91%",
          fontSize: "2.15cqw",
          color: "var(--faint)",
          letterSpacing: "0.05em",
        }}
      >
        CHASSIS{" "}
        {(["cor", "top", "aero", "rel"] as const).map((k, i) => (
          <span key={k}>
            {i > 0 ? " · " : ""}
            <span style={{ color: "var(--dim)" }}>{k.toUpperCase()}</span>{" "}
            <span style={{ color: "var(--ink)", fontWeight: 700 }}>{card.car[k]}</span>
          </span>
        ))}
      </div>
      <div
        className="mono"
        style={{
          position: "absolute",
          right: "3.2%",
          top: "91%",
          fontSize: "2.15cqw",
          color: "var(--faint)",
          letterSpacing: "0.14em",
        }}
      >
        GITONE
      </div>
    </div>
  );
}

import type { CardPreview, StatKey } from "@/lib/racing/types";
import { STATS, STAT_LABELS } from "@/lib/racing/constants";
import { resolveCardTheme, rgba } from "./finishTheme";
import { flagUrl } from "@/lib/flagUrl";

/* The F1 26 rating card, rebuilt from the season-pack reference: an
   octagonal silhouette chamfered on all four corners, a team-colour rim,
   a full-bleed portrait that fades into the identity band, the rating at
   top-left, the driver number at top-right, and a four-column stat rail
   along the base with the labels above the values.

   Everything scales from the card's own width (1cqw = 1% of the card), so
   the same component is a 300px hero and a 118px shelf card without a
   second layout. */

function nameLines(name: string) {
  const display = name.trim().toUpperCase().replace(/\.$/, "");
  const parts = display.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: "", last: display };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

function avatarFor(url: string): string {
  // GitHub's avatar CDN accepts a size hint; the card never needs the 960px
  // original, so ask for a 2× card-width copy instead of downloading 4×.
  return url.replace(/([?&])s=\d+/, "$1s=640");
}

export function DriverCard26({
  card,
  eager = false,
}: {
  card: CardPreview;
  eager?: boolean;
}) {
  const theme = resolveCardTheme(card);
  const livery = card.constructor.color;
  const flag = flagUrl(card.country, 80);
  const { first, last } = nameLines(card.name);
  const nameSize = last.length > 11 ? 8.2 : last.length > 8 ? 9.4 : 10.8;
  const avatar = avatarFor(card.avatarUrl);

  return (
    <div
      data-card="f1-26"
      style={{
        width: "100%",
        containerType: "inline-size",
        borderRadius: 18,
        overflow: "hidden",
        filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.55))",
      }}
    >
      {/* the team-colour rim */}
      <div
        style={{
          padding: "1.15cqw",
          borderRadius: 18,
          overflow: "hidden",
          background: `linear-gradient(148deg, ${livery} 0%, ${rgba(livery, 0.28)} 22%, ${rgba(livery, 0.95)} 48%, rgba(255,255,255,0.55) 58%, ${rgba(livery, 0.5)} 76%, ${livery} 100%)`,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "2 / 3",
            overflow: "hidden",
            borderRadius: 14,
            background: "linear-gradient(160deg, #1c2027 0%, #0b0c0f 56%, #111318 100%)",
          }}
        >
          {/* carbon + the team's diagonal speed band */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `linear-gradient(118deg, transparent 18%, ${rgba(livery, 0.34)} 18%, ${rgba(livery, 0.5)} 25%, transparent 25%, transparent 58%, ${rgba(livery, 0.16)} 58%, transparent 74%), repeating-linear-gradient(116deg, rgba(255,255,255,0.024) 0 1px, transparent 1px 9px)`,
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `radial-gradient(72% 52% at 50% 0%, ${rgba(livery, 0.3)}, transparent 66%), radial-gradient(50% 42% at 50% 58%, rgba(0,0,0,0.08), transparent 70%)`,
            }}
          />

          {/* portrait: full bleed, fading into the identity band */}
          <div
            style={{
              position: "absolute",
              inset: "0 0 auto 0",
              height: "60%",
              overflow: "hidden",
              maskImage: "linear-gradient(to bottom, #000 58%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, #000 58%, transparent 100%)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatar}
              alt={card.name}
              width={640}
              height={640}
              loading={eager ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={eager ? "high" : "auto"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top center",
                filter: "contrast(1.06) saturate(0.82) brightness(0.96)",
              }}
            />
            {/* the livery rim light and the vignette that seats the head */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(58% 70% at 70% 18%, ${rgba(livery, 0.24)}, transparent 62%), radial-gradient(80% 60% at 50% 35%, transparent 45%, rgba(8,9,11,0.62) 100%), linear-gradient(90deg, rgba(8,9,11,0.55), transparent 28%, transparent 72%, rgba(8,9,11,0.55))`,
              }}
            />
          </div>

          {/* rating, top-left — the number the whole card answers to */}
          <div style={{ position: "absolute", left: "5.5%", top: "3.6%" }}>
            <div
              className="mono"
              style={{ fontSize: "3.2cqw", fontWeight: 700, letterSpacing: "0.26em", color: "rgba(242,243,240,0.62)" }}
            >
              RTG
            </div>
            <div
              className="display"
              style={{
                marginTop: "0.4cqw",
                fontSize: "23cqw",
                lineHeight: 0.78,
                letterSpacing: "-0.045em",
                color: "#ffffff",
                textShadow: `0 0 5cqw ${rgba(livery, 0.75)}, 0 0.8cqw 2.4cqw rgba(0,0,0,0.55)`,
              }}
            >
              {card.rtg}
            </div>
            <div
              className="mono"
              style={{
                display: "inline-block",
                marginTop: "1.2cqw",
                fontSize: "3.0cqw",
                fontWeight: 800,
                letterSpacing: "0.14em",
                color: theme.ink,
                background: rgba(theme.accent, 0.16),
                border: `1px solid ${rgba(theme.accent, 0.42)}`,
                padding: "0.7cqw 1.4cqw",
              }}
            >
              {card.finishLabel}
            </div>
          </div>

          {/* number and flag, top-right */}
          <div style={{ position: "absolute", right: "5.5%", top: "4%", textAlign: "right" }}>
            <div
              className="mono"
              style={{ fontSize: "2.9cqw", fontWeight: 700, letterSpacing: "0.24em", color: "rgba(242,243,240,0.5)" }}
            >
              NO.
            </div>
            <div
              className="mono"
              style={{
                marginTop: "0.2cqw",
                fontSize: "6.4cqw",
                fontWeight: 800,
                lineHeight: 1,
                color: livery,
                textShadow: `0 0 3cqw ${rgba(livery, 0.55)}`,
              }}
            >
              {String(card.number).padStart(2, "0")}
            </div>
            {flag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={flag}
                alt=""
                width={48}
                height={32}
                style={{ display: "block", marginLeft: "auto", marginTop: "1.2cqw", height: "3.4cqw", width: "auto", boxShadow: "0 0 0 1px rgba(255,255,255,0.18)" }}
              />
            )}
          </div>

          {/* identity band */}
          <div data-zone="identity" style={{ position: "absolute", left: "5.5%", right: "5.5%", top: "56.5%" }}>
            {first && (
              <div
                className="display"
                style={{ fontSize: `${Math.max(3.4, nameSize * 0.42)}cqw`, lineHeight: 1, color: "rgba(242,243,240,0.62)", marginBottom: "0.5cqw", letterSpacing: "0.03em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {first}
              </div>
            )}
            <div className="display" style={{ fontSize: `${nameSize}cqw`, lineHeight: 0.88, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {last}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2cqw", marginTop: "1.6cqw" }}>
              <span aria-hidden style={{ width: "3.2cqw", height: "0.5cqw", background: livery }} />
              <span
                className="mono"
                style={{ fontSize: "3.2cqw", fontWeight: 700, letterSpacing: "0.14em", color: livery, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {card.constructor.name.toUpperCase()}
              </span>
            </div>
          </div>

          {/* the stat rail: labels over values, hairlines between, no boxes */}
          <div
            data-zone="stats"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: "1.4cqw",
              height: "19.5%",
              display: "flex",
              background: "linear-gradient(180deg, rgba(8,9,11,0.1), rgba(8,9,11,0.62))",
              borderTop: `1px solid ${rgba(livery, 0.34)}`,
            }}
          >
            {STATS.map((k: StatKey, i) => (
              <div
                key={k}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5cqw",
                  borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <span className="mono" style={{ fontSize: "3.6cqw", fontWeight: 700, letterSpacing: "0.12em", color: "rgba(242,243,240,0.55)" }}>
                  {STAT_LABELS[k]}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: "6.7cqw",
                    fontWeight: 800,
                    lineHeight: 1,
                    color: card.stats[k] >= 90 ? "var(--purple)" : "#ffffff",
                    textShadow: card.stats[k] >= 90 ? "0 0 3cqw rgba(180,107,255,0.55)" : "none",
                  }}
                >
                  {card.stats[k]}
                </span>
              </div>
            ))}
          </div>

          {/* the team's colour, closing the card */}
          <div aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "0.8cqw", background: livery }} />

          {/* maker's mark */}
          <div
            className="mono"
            style={{
              position: "absolute",
              right: "5.5%",
              bottom: "22.2%",
              fontSize: "1.9cqw",
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: "rgba(242,243,240,0.42)",
            }}
          >
            GITONE
          </div>
        </div>
      </div>
    </div>
  );
}

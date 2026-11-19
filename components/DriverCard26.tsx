import type { CardPreview, StatKey } from "@/lib/racing/types";
import { STATS, STAT_LABELS } from "@/lib/racing/constants";
import { resolveCardTheme, rgba } from "./finishTheme";
import { flagUrl } from "@/lib/flagUrl";

/* The F1 26 driver card, cut in the FOOTBALL collectible grammar (the FUT
   icon/GOAT crest). The face is a real struck-metal plate — brushed grain, a
   beveled rim, a specular seam glint and a tonal "F1 26" engraving — baked as
   art (public/cards/f1-gold.png), not faked with flat CSS gradients, which is
   what reads as AI-generated. The plate is anodised to the team's livery via a
   colour blend so no two cards read the same; the founder GOAT stays minted
   gold. The portrait is masked to the crest, feathered and kept in full colour
   (gitfut's avatarTint), and the numbers/name are set in DINPro Condensed in a
   dark engraved ink, the way the reference presses its type into the metal.

   Everything scales from the card's own width (1cqw = 1% of the card), so the
   same component is a 300px hero and a 118px shelf card. */

const METAL = "/cards/f1-gold.png";
const PLATE_MASK = `url("${METAL}")`;
const INK = "#33290f"; // dark engraved ink on the light metal
const WIDE = "var(--font-din-bold), 'DINPro Condensed', sans-serif";
const MED = "var(--font-din-medium), 'DINPro Condensed', sans-serif";

function nameLines(name: string) {
  const display = name.trim().toUpperCase().replace(/\.$/, "");
  const parts = display.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: "", last: display };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

function avatarFor(url: string): string {
  return url.replace(/([?&])s=\d+/, "$1s=640");
}

// gitfut's feather: a radial ellipse (sides) nested with a top and bottom fade.
const FEATHER = "radial-gradient(ellipse 70% 84% at 52% 40%, #000 56%, transparent 88%)";
const FADE_TOP = "linear-gradient(to bottom, transparent 0%, #000 18%)";
const FADE_BOTTOM = "linear-gradient(to bottom, #000 72%, transparent 100%)";

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
  const nameSize = last.length > 11 ? 8.0 : last.length > 8 ? 9.8 : 11.0;
  const avatar = avatarFor(card.avatarUrl);
  const founder = card.finish === "founder";
  const label = rgba(INK, 0.68);

  return (
    <div
      data-card="f1-26"
      style={{
        width: "100%",
        containerType: "inline-size",
        position: "relative",
        aspectRatio: "540 / 820",
        filter: `drop-shadow(0 12px 22px rgba(0,0,0,0.5)) drop-shadow(0 0 10px ${theme.glow})`,
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* the struck-metal plate — its alpha carries the crest silhouette */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={METAL}
        alt=""
        aria-hidden
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill" }}
      />

      {/* livery anodising: hue-shift the metal to the team colour. The founder
          GOAT is left as minted gold. Masked to the plate so it never spills. */}
      {!founder && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: livery,
            mixBlendMode: "color",
            opacity: 0.66,
            WebkitMaskImage: PLATE_MASK,
            maskImage: PLATE_MASK,
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
          }}
        />
      )}

      {/* portrait: masked to the crest, feathered on every edge, full colour,
          centre-right so the left identity column stays clear */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          WebkitMaskImage: PLATE_MASK,
          maskImage: PLATE_MASK,
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "26%",
            top: "6.5%",
            width: "68%",
            height: "50%",
            WebkitMaskImage: FEATHER,
            maskImage: FEATHER,
            filter: "drop-shadow(0 2cqw 4cqw rgba(40,30,10,0.35))",
          }}
        >
          <div style={{ width: "100%", height: "100%", WebkitMaskImage: FADE_BOTTOM, maskImage: FADE_BOTTOM }}>
            <div style={{ position: "relative", width: "100%", height: "100%", WebkitMaskImage: FADE_TOP, maskImage: FADE_TOP }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatar}
                alt={card.name}
                width={640}
                height={640}
                loading={eager ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={eager ? "high" : "auto"}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 22%", filter: "saturate(1.1) contrast(1.05) brightness(1.02)" }}
              />
              {/* avatarTint: transparent centre keeps the photo colourful, ramping
                  to the livery metal at the edges so it seats into the plate */}
              <div aria-hidden style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 72% 76% at 52% 40%, transparent 46%, ${rgba(livery, 0.3)} 78%, rgba(58,46,22,0.42))` }} />
            </div>
          </div>
        </div>
      </div>

      {/* the founder 1/1 gets a living holographic sweep over the gold */}
      {founder && (
        <div
          aria-hidden
          className="holo-sweep"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(115deg, transparent 42%, rgba(255,250,230,0.28) 50%, rgba(255,244,214,0.16) 54%, transparent 62%)",
            backgroundSize: "250% 250%",
            mixBlendMode: "screen",
            WebkitMaskImage: PLATE_MASK,
            maskImage: PLATE_MASK,
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
            pointerEvents: "none",
          }}
        />
      )}

      {/* left identity column: rating, number, flag — the FUT grammar, engraved */}
      <div style={{ position: "absolute", left: "13%", top: "9%" }}>
        <div className="mono" style={{ fontSize: "3.1cqw", fontWeight: 700, letterSpacing: "0.26em", color: label }}>
          RTG
        </div>
        <div style={{ fontFamily: MED, fontWeight: 500, marginTop: "0.5cqw", fontSize: "19cqw", lineHeight: 0.95, color: INK }}>
          {card.rtg}
        </div>
      </div>

      <div style={{ position: "absolute", left: "13%", top: "26.5%" }}>
        <div className="mono" style={{ fontSize: "2.8cqw", fontWeight: 700, letterSpacing: "0.24em", color: label }}>
          NO.
        </div>
        <div style={{ fontFamily: WIDE, fontWeight: 700, marginTop: "0.3cqw", fontSize: "8cqw", lineHeight: 1, color: INK }}>
          {String(card.number).padStart(2, "0")}
        </div>
      </div>

      {flag && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={flag}
          alt=""
          width={48}
          height={32}
          style={{ position: "absolute", left: "13%", top: "37%", height: "4.4cqw", width: "auto", boxShadow: "0 0 0 1px rgba(51,41,15,0.3)" }}
        />
      )}

      {/* the finish chip — a thin engraved plate, not a filled sticker */}
      <div
        className="mono"
        style={{
          position: "absolute",
          left: "13%",
          top: "44%",
          display: "inline-block",
          fontSize: "2.7cqw",
          fontWeight: 800,
          letterSpacing: "0.12em",
          color: INK,
          border: `1px solid ${rgba(INK, 0.4)}`,
          padding: "0.5cqw 1.1cqw",
          whiteSpace: "nowrap",
        }}
      >
        {card.finishLabel}
      </div>

      {/* name — centred across the crest below the seam, dark engraved DIN */}
      <div data-zone="identity" style={{ position: "absolute", left: "10%", right: "10%", top: "58%", textAlign: "center" }}>
        {first && (
          <div style={{ fontFamily: WIDE, fontWeight: 700, fontSize: `${Math.max(2.8, nameSize * 0.4)}cqw`, lineHeight: 1, color: label, marginBottom: "0.6cqw", letterSpacing: "0.06em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {first}
          </div>
        )}
        <div style={{ fontFamily: WIDE, fontWeight: 700, fontSize: `${nameSize}cqw`, lineHeight: 1, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {last}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.2cqw", marginTop: "1cqw" }}>
          <span aria-hidden style={{ width: "3cqw", height: "0.5cqw", background: rgba(INK, 0.55) }} />
          <span className="mono" style={{ fontSize: "3cqw", fontWeight: 700, letterSpacing: "0.14em", color: label, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {card.constructor.name.toUpperCase()}
          </span>
          <span aria-hidden style={{ width: "3cqw", height: "0.5cqw", background: rgba(INK, 0.55) }} />
        </div>
      </div>

      {/* the stat rail: four columns, labels over values, hairlines between */}
      <div
        data-zone="stats"
        style={{ position: "absolute", left: "20%", right: "20%", top: "72%", height: "10.5%", display: "flex" }}
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
              borderLeft: i === 0 ? "none" : `1px solid ${rgba(INK, 0.28)}`,
            }}
          >
            <span className="mono" style={{ fontSize: "3.1cqw", fontWeight: 700, letterSpacing: "0.1em", color: label }}>
              {STAT_LABELS[k]}
            </span>
            <span style={{ fontFamily: WIDE, fontWeight: 700, fontSize: "7.6cqw", lineHeight: 1, color: INK }}>
              {card.stats[k]}
            </span>
          </div>
        ))}
      </div>

      {/* the one-of-one's commemorative serial — tone-on-tone, minted plate */}
      {founder && (
        <div className="mono" style={{ position: "absolute", left: 0, right: 0, top: "84.5%", textAlign: "center", fontSize: "1.9cqw", fontWeight: 700, letterSpacing: "0.14em", color: rgba(INK, 0.7) }}>
          № 001/001 · EST. 26
        </div>
      )}

      {/* maker's mark + handle, centred above the point */}
      <div className="mono" style={{ position: "absolute", left: 0, right: 0, top: founder ? "87.5%" : "86.5%", textAlign: "center", fontSize: "2.1cqw", fontWeight: 700, letterSpacing: "0.16em", color: rgba(INK, 0.6) }}>
        GITONE · @{card.login}
      </div>
    </div>
  );
}

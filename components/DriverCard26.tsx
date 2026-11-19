import { useId } from "react";
import type { CardPreview, StatKey } from "@/lib/racing/types";
import { STATS, STAT_LABELS, GOAT_LOGIN } from "@/lib/racing/constants";
import { resolveCardTheme, rgba } from "./finishTheme";
import { flagUrl } from "@/lib/flagUrl";

/* The F1 26 driver card. Every rank is cut from its OWN silhouette — a range
   innovated from the EA F1 game cards (F1 20→26) and the broadcast cut-corner
   grammar, not one shape stamped on everyone:

     founder   the football GOAT crest — a struck-metal 1/1, reserved for the
               founder of gitone alone (baked art, holographic sweep, serial)
     goat      a faceted crown crest — the measuring stick (Torvalds), a peaked
               crown notch over chamfered shoulders, distinct from the grid
     champion  F1 25/26 cut-corner polygon: stepped shoulder, 45° nose + heel
     in_form   F1 24 octagonal speed-cut, all four corners chamfered
     winner    F1 23 single big nose chamfer + cut heel
     podium    twin shoulder chamfers, flat heel
     points    one nose chamfer
     rookie    a minimal cut heel

   The non-founder faces are struck metal built in layers — a directional gold
   sheen, livery anodising, crisp anisotropic hairlines, a sharp specular band,
   a bevel and the F1 diagonal team pinstripe hatch — clipped to the cut, with a
   neon team-colour frame tracing the polygon. The portrait stays full colour
   and feathered; numbers/name are DINPro Condensed in engraved ink. The hover
   glare is clipped to the silhouette so no bounding rectangle ever shows.

   Everything scales from the card's own width (1cqw = 1% of the card). */

const METAL = "/cards/f1-gold.webp"; // founder crest (baked struck metal)
const GRAIN = "/cards/f1-metal.webp"; // micro-grain overlay
const PLATE_MASK = `url("${METAL}")`;
const INK = "#33290f";
const WIDE = "var(--font-din-bold), 'DINPro Condensed', sans-serif";
const MED = "var(--font-din-medium), 'DINPro Condensed', sans-serif";

// Silhouettes in a 540×820 viewBox (the card's own aspect). Each rank has a
// distinct signature cut from the FUT crest grammar — notched/peaked tops,
// waisted sides, pointed or notched heels — not a flat chamfered rectangle.
const SHAPES: Record<string, [number, number][]> = {
  // three-point crown over chamfered shoulders
  goat: [[24, 64], [170, 64], [200, 20], [235, 52], [270, 12], [305, 52], [340, 20], [370, 64], [516, 64], [516, 720], [440, 796], [24, 796]],
  // lone top peak, waisted sides, concave heel notch
  champion: [[270, 16], [336, 54], [474, 54], [516, 98], [496, 410], [516, 704], [432, 792], [270, 744], [108, 792], [24, 704], [44, 410], [24, 98], [66, 54], [204, 54]],
  // octagonal speed-cut with a waist
  in_form: [[118, 22], [422, 22], [516, 108], [500, 410], [516, 712], [422, 798], [118, 798], [24, 712], [40, 410], [24, 108]],
  // diagonal slash: big nose chamfer + cut heel
  winner: [[24, 22], [378, 22], [516, 158], [516, 796], [162, 796], [24, 662]],
  // twin top peaks, waisted sides, downward heel point
  podium: [[24, 64], [158, 64], [208, 22], [254, 58], [300, 22], [350, 64], [516, 64], [496, 410], [516, 704], [432, 792], [270, 818], [108, 792], [24, 704], [44, 410]],
  // top step-notch + nose chamfer + angled heel
  points: [[24, 22], [198, 22], [198, 58], [240, 58], [240, 22], [438, 22], [516, 98], [516, 704], [438, 796], [200, 796], [24, 722]],
  // small shoulder step + cut heel
  rookie: [[62, 22], [516, 22], [516, 722], [440, 796], [24, 796], [24, 80], [62, 80]],
};
const toClip = (pts: [number, number][]) =>
  `polygon(${pts.map(([x, y]) => `${((x / 540) * 100).toFixed(2)}% ${((y / 820) * 100).toFixed(2)}%`).join(", ")})`;
const toPoints = (pts: [number, number][]) => pts.map(([x, y]) => `${x},${y}`).join(" ");

function nameLines(name: string) {
  const display = name.trim().toUpperCase().replace(/\.$/, "");
  const parts = display.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: "", last: display };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}
function avatarFor(url: string): string {
  return url.replace(/([?&])s=\d+/, "$1s=640");
}

const FEATHER = "radial-gradient(ellipse 70% 84% at 52% 40%, #000 56%, transparent 88%)";
const FADE_TOP = "linear-gradient(to bottom, transparent 0%, #000 18%)";
const FADE_BOTTOM = "linear-gradient(to bottom, #000 72%, transparent 100%)";

export function DriverCard26({ card, eager = false }: { card: CardPreview; eager?: boolean }) {
  const gid = useId().replace(/:/g, "");
  const theme = resolveCardTheme(card);
  const livery = card.constructor.color;
  const flag = flagUrl(card.country, 80);
  const { first, last } = nameLines(card.name);
  const nameSize = last.length > 11 ? 8.0 : last.length > 8 ? 9.8 : 11.0;
  const avatar = avatarFor(card.avatarUrl);
  const founder = card.finish === "founder" || !!card.founder;
  const goat = !founder && (card.login.toLowerCase() === GOAT_LOGIN || (card.number === 1 && card.rtg >= 97));
  const label = rgba(INK, 0.68);
  const pts = goat ? SHAPES.goat : (SHAPES[card.finish] ?? SHAPES.champion);
  const clip = toClip(pts);
  const chip = goat ? "THE GOAT" : card.finishLabel;

  const portrait = (
    <div
      style={{
        position: "absolute", left: "26%", top: "6.5%", width: "68%", height: "50%",
        WebkitMaskImage: FEATHER, maskImage: FEATHER,
        filter: "drop-shadow(0 2cqw 4cqw rgba(40,30,10,0.35))",
      }}
    >
      <div style={{ width: "100%", height: "100%", WebkitMaskImage: FADE_BOTTOM, maskImage: FADE_BOTTOM }}>
        <div style={{ position: "relative", width: "100%", height: "100%", WebkitMaskImage: FADE_TOP, maskImage: FADE_TOP }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt={card.name} width={640} height={640} loading={eager ? "eager" : "lazy"} decoding="async" fetchPriority={eager ? "high" : "auto"}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 22%", filter: "saturate(1.12) contrast(1.06) brightness(1.03)" }} />
          <div aria-hidden style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 72% 76% at 52% 40%, transparent 46%, ${rgba(livery, 0.3)} 78%, rgba(58,46,22,0.42))` }} />
        </div>
      </div>
    </div>
  );

  const glare = (
    <div aria-hidden className="tilt-glare"
      style={{
        position: "absolute", inset: 0,
        ...(founder
          ? { WebkitMaskImage: PLATE_MASK, maskImage: PLATE_MASK, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" }
          : { clipPath: clip }),
        background: `
          linear-gradient(115deg, transparent calc(var(--mx, 50%) - 22%), rgba(255,255,255,.05) calc(var(--mx, 50%) - 9%), rgba(255,255,255,.22) var(--mx, 50%), rgba(255,255,255,.06) calc(var(--mx, 50%) + 9%), transparent calc(var(--mx, 50%) + 20%)),
          radial-gradient(120% 90% at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,.10), transparent 60%)`,
        mixBlendMode: "screen", pointerEvents: "none", zIndex: 6,
      }}
    />
  );

  return (
    <div data-card="f1-26"
      style={{
        width: "100%", containerType: "inline-size", position: "relative", aspectRatio: "540 / 820",
        filter: `drop-shadow(0 12px 22px rgba(0,0,0,0.5)) drop-shadow(0 0 10px ${theme.glow})`,
        userSelect: "none", WebkitUserSelect: "none",
      }}
    >
      {founder ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={METAL} alt="" aria-hidden loading={eager ? "eager" : "lazy"} decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill" }} />
          <div style={{ position: "absolute", inset: 0, WebkitMaskImage: PLATE_MASK, maskImage: PLATE_MASK, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" }}>
            {portrait}
          </div>
          <div aria-hidden className="holo-sweep"
            style={{
              position: "absolute", inset: 0,
              backgroundImage: "linear-gradient(115deg, transparent 42%, rgba(255,250,230,0.28) 50%, rgba(255,244,214,0.16) 54%, transparent 62%)",
              backgroundSize: "250% 250%", mixBlendMode: "screen",
              WebkitMaskImage: PLATE_MASK, maskImage: PLATE_MASK, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", pointerEvents: "none",
            }}
          />
        </>
      ) : (
        <>
          {/* struck-metal face built in layers, clipped to the cut */}
          <div style={{ position: "absolute", inset: 0, clipPath: clip }}>
            {/* directional gold sheen — the anisotropic body of the metal */}
            <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(155deg, #f4dd94 0%, #d8b462 22%, #a8843a 46%, #e6c878 62%, #8a6a2c 82%, #c9a24e 100%)" }} />
            {/* micro-grain so it is machined, not a flat gradient */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={GRAIN} alt="" aria-hidden loading={eager ? "eager" : "lazy"} decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill", mixBlendMode: "overlay", opacity: 0.3 }} />
            {/* anodise to the team livery (hue shift, grain preserved) */}
            <div aria-hidden style={{ position: "absolute", inset: 0, background: livery, mixBlendMode: "color", opacity: 0.55 }} />
            {/* crisp anisotropic brush hairlines */}
            <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 1px, rgba(0,0,0,0.10) 1px 2px, transparent 2px 5px)", mixBlendMode: "overlay", opacity: 0.7 }} />
            {/* F1 diagonal team pinstripe hatch */}
            <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(115deg, ${rgba(livery, 0.65)} 0 3px, transparent 3px 12px)`, mixBlendMode: "overlay", opacity: 0.6 }} />
            {/* sharp specular band sweeping the struck face */}
            <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(115deg, transparent 34%, rgba(255,250,230,0.55) 47%, rgba(255,255,255,0.85) 50%, rgba(255,250,230,0.4) 53%, transparent 66%)", mixBlendMode: "screen" }} />
            {/* bevel: light catches the top-left rim, shadow falls bottom-right */}
            <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.1) 18%, transparent 42%, transparent 72%, rgba(30,22,6,0.5) 100%)", mixBlendMode: "overlay" }} />
            {portrait}
            {/* darken the lower data zone so the engraved type reads */}
            <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(180deg, transparent 52%, rgba(48,38,16,0.18) 78%, rgba(48,38,16,0.32) 100%)" }} />
          </div>

          {/* neon team-colour frame tracing the cut, metal gradient + glow */}
          <svg aria-hidden viewBox="0 0 540 820" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}>
            <defs>
              <linearGradient id={`rim-${gid}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={rgba(livery, 0.95)} />
                <stop offset="45%" stopColor="#ffffff" stopOpacity="0.85" />
                <stop offset="100%" stopColor={rgba(livery, 0.9)} />
              </linearGradient>
              <filter id={`glow-${gid}`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <polygon points={toPoints(pts)} fill="none" stroke={rgba(livery, 0.55)} strokeWidth="9" filter={`url(#glow-${gid})`} opacity="0.7" />
            <polygon points={toPoints(pts)} fill="none" stroke={`url(#rim-${gid})`} strokeWidth="4" strokeLinejoin="miter" />
            <polygon points={toPoints(pts)} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinejoin="miter" transform="translate(0,1)" />
          </svg>
        </>
      )}

      {/* left identity column: rating, number, flag — engraved */}
      <div style={{ position: "absolute", left: "14%", top: "9.5%", zIndex: 3 }}>
        <div className="mono" style={{ fontSize: "3.1cqw", fontWeight: 700, letterSpacing: "0.26em", color: label }}>RTG</div>
        <div style={{ fontFamily: MED, fontWeight: 500, marginTop: "0.5cqw", fontSize: "19cqw", lineHeight: 0.95, color: INK }}>{card.rtg}</div>
      </div>
      <div style={{ position: "absolute", left: "14%", top: "27%", zIndex: 3 }}>
        <div className="mono" style={{ fontSize: "2.8cqw", fontWeight: 700, letterSpacing: "0.24em", color: label }}>NO.</div>
        <div style={{ fontFamily: WIDE, fontWeight: 700, marginTop: "0.3cqw", fontSize: "8cqw", lineHeight: 1, color: INK }}>{String(card.number).padStart(2, "0")}</div>
      </div>
      {flag && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={flag} alt="" width={48} height={32} style={{ position: "absolute", left: "14%", top: "37.5%", height: "4.4cqw", width: "auto", boxShadow: "0 0 0 1px rgba(51,41,15,0.3)", zIndex: 3 }} />
      )}
      <div className="mono" style={{ position: "absolute", left: "14%", top: "44.5%", zIndex: 3, display: "inline-block", fontSize: "2.7cqw", fontWeight: 800, letterSpacing: "0.12em", color: INK, border: `1px solid ${rgba(INK, 0.4)}`, padding: "0.5cqw 1.1cqw", whiteSpace: "nowrap" }}>
        {chip}
      </div>

      {/* name — centred below the seam, dark engraved DIN */}
      <div data-zone="identity" style={{ position: "absolute", left: "10%", right: "10%", top: "58%", textAlign: "center", zIndex: 3 }}>
        {first && (
          <div style={{ fontFamily: WIDE, fontWeight: 700, fontSize: `${Math.max(2.8, nameSize * 0.4)}cqw`, lineHeight: 1, color: label, marginBottom: "0.6cqw", letterSpacing: "0.06em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{first}</div>
        )}
        <div style={{ fontFamily: WIDE, fontWeight: 700, fontSize: `${nameSize}cqw`, lineHeight: 1, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{last}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.2cqw", marginTop: "1cqw" }}>
          <span aria-hidden style={{ width: "3cqw", height: "0.5cqw", background: rgba(INK, 0.55) }} />
          <span className="mono" style={{ fontSize: "3cqw", fontWeight: 700, letterSpacing: "0.14em", color: label, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.constructor.name.toUpperCase()}</span>
          <span aria-hidden style={{ width: "3cqw", height: "0.5cqw", background: rgba(INK, 0.55) }} />
        </div>
      </div>

      {/* the stat rail: four columns, labels over values, hairlines between */}
      <div data-zone="stats" style={{ position: "absolute", left: "20%", right: "20%", top: "72%", height: "10.5%", display: "flex", zIndex: 3 }}>
        {STATS.map((k: StatKey, i) => (
          <div key={k} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5cqw", borderLeft: i === 0 ? "none" : `1px solid ${rgba(INK, 0.28)}` }}>
            <span className="mono" style={{ fontSize: "3.1cqw", fontWeight: 700, letterSpacing: "0.1em", color: label }}>{STAT_LABELS[k]}</span>
            <span style={{ fontFamily: WIDE, fontWeight: 700, fontSize: "7.6cqw", lineHeight: 1, color: INK }}>{card.stats[k]}</span>
          </div>
        ))}
      </div>

      {founder && (
        <div className="mono" style={{ position: "absolute", left: 0, right: 0, top: "84.5%", textAlign: "center", fontSize: "1.9cqw", fontWeight: 700, letterSpacing: "0.14em", color: rgba(INK, 0.7), zIndex: 3 }}>
          № 001/001 · EST. 26
        </div>
      )}
      <div className="mono" style={{ position: "absolute", left: 0, right: 0, top: founder ? "87.5%" : "86.5%", textAlign: "center", fontSize: "2.1cqw", fontWeight: 700, letterSpacing: "0.16em", color: rgba(INK, 0.6), zIndex: 3 }}>
        GITONE · @{card.login}
      </div>

      {glare}
    </div>
  );
}

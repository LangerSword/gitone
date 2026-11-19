import { useId } from "react";
import type { CardPreview, StatKey } from "@/lib/racing/types";
import { STATS, STAT_LABELS, GOAT_LOGIN } from "@/lib/racing/constants";
import { resolveCardTheme, rgba } from "./finishTheme";
import { flagUrl } from "@/lib/flagUrl";

/* The F1 26 driver card. Every rank is cut from its OWN smooth shield — the
   elegant collectible-crest grammar gitfut uses (a refined top edge, concave
   waisted sides, a pointed heel), NOT angular cartoon crowns or zigzags:

     founder   the football GOAT crest, a struck-metal 1/1 (baked art)
     goat      a crested shield — convex crown peak, the measuring stick
     champion  a notch-crest shield — concave top notch, iridescent gold
     in_form   a chamfer-shoulder shield + team racing stripes
     winner    an asymmetric nose shield + team racing stripes
     podium    a twin-scallop shoulder shield + team racing stripes
     points    a single-notch shield
     rookie    a clean rounded-shoulder shield

   The face is struck metal built in layers (directional sheen, livery
   anodising, anisotropic hairlines, a sharp specular band, a bevel, diagonal
   pinstripes) clipped to the curved silhouette, with a neon team frame tracing
   it. Some tiers wear a bold vertical team stripe like a TOTY livery. The
   portrait stays full colour and feathered; the hover glare is clipped to the
   silhouette so no bounding rectangle shows. Scales via 1cqw. */

const METAL = "/cards/f1-gold.webp";
const GRAIN = "/cards/f1-metal.webp";
const INK = "#33290f";
const WIDE = "var(--font-din-bold), 'DINPro Condensed', sans-serif";
const MED = "var(--font-din-medium), 'DINPro Condensed', sans-serif";

// gitfut's exact grammar (traced from its card art): a scalloped/crested top,
// STRAIGHT vertical sides, and a heel tapering to a centre point. Elegant, not
// waisted, not zigzag. The top edge is each rank's signature.
const BODY = "L 513,656 C 513,722 418,782 270,798 C 122,782 23,722 23,656 Z";
const PATHS: Record<string, string> = {
  goat: `M 23,107 C 23,60 50,32 110,30 C 160,28 220,12 270,12 C 320,12 380,28 430,30 C 490,32 513,60 513,107 ${BODY}`,
  champion: `M 23,107 C 23,60 50,30 117,28 Q 270,66 423,28 C 490,30 513,60 513,107 ${BODY}`,
  in_form: `M 23,107 C 23,55 70,26 130,26 L 410,26 C 470,26 513,55 513,107 ${BODY}`,
  winner: `M 23,107 L 23,26 L 350,26 C 450,26 513,70 513,107 ${BODY}`,
  podium: `M 23,107 C 23,55 55,32 120,32 C 180,32 220,58 270,58 C 320,58 360,32 420,32 C 485,32 513,55 513,107 ${BODY}`,
  points: `M 23,107 L 23,26 L 200,26 Q 235,26 248,56 Q 260,84 295,84 L 440,84 C 485,84 513,100 513,107 ${BODY}`,
  rookie: `M 23,107 C 23,55 55,26 115,26 L 425,26 C 485,26 513,55 513,107 ${BODY}`,
};
// The founder's original struck-metal crest, traced from the baked art: a
// smooth domed top, full-width straight sides, a heel swept to a centre point.
const FOUNDER_PATH = "M 212,2 L 324,2 C 400,8 470,40 512,86 C 528,100 536,108 536,118 L 536,692 C 530,752 400,806 268,818 C 136,806 6,752 0,692 L 0,118 C 0,108 8,100 24,86 C 66,40 136,8 212,2 Z";
const STRIPED = new Set(["in_form", "winner", "podium"]);

// Scale a 540×820 path into objectBoundingBox (0–1) space so the clip scales
// with the card. All commands used (M/L/C/Q) take x,y coordinate pairs.
function norm(d: string): string {
  return d.replace(/([MLCQSTZ])([^MLCQSTZ]*)/gi, (_m, cmd: string, args: string) => {
    if (/z/i.test(cmd)) return "Z";
    const nums = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    return cmd + nums.map((n, i) => (i % 2 === 0 ? n / 540 : n / 820).toFixed(4)).join(" ");
  });
}

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
  const path = founder ? FOUNDER_PATH : goat ? PATHS.goat : (PATHS[card.finish] ?? PATHS.champion);
  const clipId = `clip-${gid}`;
  const clipCss = `url(#${clipId})`;
  const striped = !founder && STRIPED.has(card.finish);
  const chip = goat ? "THE GOAT" : card.finishLabel;

  const portrait = (
    <div style={{ position: "absolute", left: "26%", top: "6.5%", width: "68%", height: "50%", WebkitMaskImage: FEATHER, maskImage: FEATHER, filter: "drop-shadow(0 2cqw 4cqw rgba(40,30,10,0.35))" }}>
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

  const glareBg = `linear-gradient(115deg, transparent calc(var(--mx, 50%) - 22%), rgba(255,255,255,.05) calc(var(--mx, 50%) - 9%), rgba(255,255,255,.22) var(--mx, 50%), rgba(255,255,255,.06) calc(var(--mx, 50%) + 9%), transparent calc(var(--mx, 50%) + 20%)), radial-gradient(120% 90% at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,.10), transparent 60%)`;
  // clip-path (not mask-image) clips the glare: mask-image + a background on
  // the same node composites black in Chromium.
  const glare = (
    <div aria-hidden className="tilt-glare" style={{ position: "absolute", inset: 0, clipPath: clipCss, background: glareBg, mixBlendMode: "screen", pointerEvents: "none", zIndex: 6 }} />
  );

  return (
    <div data-card="f1-26"
      style={{ width: "100%", containerType: "inline-size", position: "relative", aspectRatio: "540 / 820", filter: `drop-shadow(0 12px 22px rgba(0,0,0,0.5)) drop-shadow(0 0 10px ${theme.glow})`, userSelect: "none", WebkitUserSelect: "none" }}
    >
      {/* the curved clip shared by the face, holo and glare */}
      {(
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
          <defs>
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              <path d={norm(path)} />
            </clipPath>
          </defs>
        </svg>
      )}

      {founder ? (
        <div style={{ position: "absolute", inset: 0, clipPath: clipCss }}>
          {/* bright struck-gold base, then the baked crest (F1 26 emboss +
              checkered band) laid over it as a texture — same recipe as the
              polygon tiers, which composite reliably */}
          <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(155deg, #f7e3a1 0%, #e3c06a 24%, #b8923f 48%, #ecd082 64%, #9a7832 84%, #d4ad58 100%)" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={METAL} alt="" aria-hidden loading={eager ? "eager" : "lazy"} decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill", mixBlendMode: "soft-light", opacity: 0.9 }} />
          {portrait}
          <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(180deg, transparent 52%, rgba(48,38,16,0.16) 78%, rgba(48,38,16,0.3) 100%)" }} />
          <div aria-hidden className="holo-sweep" style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(115deg, transparent 42%, rgba(255,250,230,0.3) 50%, rgba(255,244,214,0.18) 54%, transparent 62%)", backgroundSize: "250% 250%", mixBlendMode: "screen", pointerEvents: "none" }} />
        </div>
      ) : (
        <>
          <div style={{ position: "absolute", inset: 0, clipPath: clipCss }}>
            <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(155deg, #f4dd94 0%, #d8b462 22%, #a8843a 46%, #e6c878 62%, #8a6a2c 82%, #c9a24e 100%)" }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={GRAIN} alt="" aria-hidden loading={eager ? "eager" : "lazy"} decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill", mixBlendMode: "overlay", opacity: 0.3 }} />
            <div aria-hidden style={{ position: "absolute", inset: 0, background: livery, mixBlendMode: "color", opacity: 0.55 }} />
            {/* bold vertical team racing stripes on striped tiers (TOTY-style) */}
            {striped && (
              <>
                <div aria-hidden style={{ position: "absolute", top: 0, bottom: 0, left: "30%", width: "13%", background: livery, mixBlendMode: "overlay", opacity: 0.85 }} />
                <div aria-hidden style={{ position: "absolute", top: 0, bottom: 0, left: "47%", width: "4%", background: livery, mixBlendMode: "overlay", opacity: 0.7 }} />
                <div aria-hidden style={{ position: "absolute", top: 0, bottom: 0, left: "30%", width: "13%", backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.35), transparent 30%, transparent 70%, rgba(0,0,0,0.25))", mixBlendMode: "soft-light" }} />
              </>
            )}
            <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 1px, rgba(0,0,0,0.10) 1px 2px, transparent 2px 5px)", mixBlendMode: "overlay", opacity: 0.7 }} />
            <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(115deg, ${rgba(livery, 0.65)} 0 3px, transparent 3px 12px)`, mixBlendMode: "overlay", opacity: striped ? 0.3 : 0.6 }} />
            <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(115deg, transparent 34%, rgba(255,250,230,0.55) 47%, rgba(255,255,255,0.85) 50%, rgba(255,250,230,0.4) 53%, transparent 66%)", mixBlendMode: "screen" }} />
            <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.1) 18%, transparent 42%, transparent 72%, rgba(30,22,6,0.5) 100%)", mixBlendMode: "overlay" }} />
            {portrait}
            <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(180deg, transparent 52%, rgba(48,38,16,0.18) 78%, rgba(48,38,16,0.32) 100%)" }} />
          </div>

          {/* neon team frame tracing the curved cut */}
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
            <path d={path} fill="none" stroke={rgba(livery, 0.55)} strokeWidth="9" filter={`url(#glow-${gid})`} opacity="0.7" />
            <path d={path} fill="none" stroke={`url(#rim-${gid})`} strokeWidth="4" strokeLinejoin="round" />
            <path d={path} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinejoin="round" transform="translate(0,1)" />
          </svg>
        </>
      )}

      {/* left identity column */}
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
      <div className="mono" style={{ position: "absolute", left: "14%", top: "44.5%", zIndex: 3, display: "inline-block", fontSize: "2.7cqw", fontWeight: 800, letterSpacing: "0.12em", color: INK, border: `1px solid ${rgba(INK, 0.4)}`, padding: "0.5cqw 1.1cqw", whiteSpace: "nowrap" }}>{chip}</div>

      {/* name */}
      <div data-zone="identity" style={{ position: "absolute", left: "10%", right: "10%", top: "58%", textAlign: "center", zIndex: 3 }}>
        {first && <div style={{ fontFamily: WIDE, fontWeight: 700, fontSize: `${Math.max(2.8, nameSize * 0.4)}cqw`, lineHeight: 1, color: label, marginBottom: "0.6cqw", letterSpacing: "0.06em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{first}</div>}
        <div style={{ fontFamily: WIDE, fontWeight: 700, fontSize: `${nameSize}cqw`, lineHeight: 1, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{last}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.2cqw", marginTop: "1cqw" }}>
          <span aria-hidden style={{ width: "3cqw", height: "0.5cqw", background: rgba(INK, 0.55) }} />
          <span className="mono" style={{ fontSize: "3cqw", fontWeight: 700, letterSpacing: "0.14em", color: label, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.constructor.name.toUpperCase()}</span>
          <span aria-hidden style={{ width: "3cqw", height: "0.5cqw", background: rgba(INK, 0.55) }} />
        </div>
      </div>

      {/* stat rail */}
      <div data-zone="stats" style={{ position: "absolute", left: "20%", right: "20%", top: "72%", height: "10.5%", display: "flex", zIndex: 3 }}>
        {STATS.map((k: StatKey, i) => (
          <div key={k} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5cqw", borderLeft: i === 0 ? "none" : `1px solid ${rgba(INK, 0.28)}` }}>
            <span className="mono" style={{ fontSize: "3.1cqw", fontWeight: 700, letterSpacing: "0.1em", color: label }}>{STAT_LABELS[k]}</span>
            <span style={{ fontFamily: WIDE, fontWeight: 700, fontSize: "7.6cqw", lineHeight: 1, color: INK }}>{card.stats[k]}</span>
          </div>
        ))}
      </div>

      {founder && <div className="mono" style={{ position: "absolute", left: 0, right: 0, top: "84.5%", textAlign: "center", fontSize: "1.9cqw", fontWeight: 700, letterSpacing: "0.14em", color: rgba(INK, 0.7), zIndex: 3 }}>№ 001/001 · EST. 26</div>}
      <div className="mono" style={{ position: "absolute", left: 0, right: 0, top: founder ? "87.5%" : "86.5%", textAlign: "center", fontSize: "2.1cqw", fontWeight: 700, letterSpacing: "0.16em", color: rgba(INK, 0.6), zIndex: 3 }}>GITONE · @{card.login}</div>

      {glare}
    </div>
  );
}

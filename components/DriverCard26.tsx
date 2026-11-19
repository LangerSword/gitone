import { useId } from "react";
import type { CardPreview, StatKey } from "@/lib/racing/types";
import { STATS, STAT_LABELS, GOAT_LOGIN } from "@/lib/racing/constants";
import { resolveCardTheme, rgba } from "./finishTheme";
import { flagUrl } from "@/lib/flagUrl";

/* The F1 26 driver card, built the way gitfut builds its collectibles: the
   ENTIRE face is a baked plate of struck-metal art (its alpha carries the
   silhouette — shouldered/scalloped top, straight flanks, pointed chevron
   heel — plus the brushed grain, embossed watermark, engraved stripes and
   bevel border). Nothing is faked with flat CSS gradients. The portrait is
   masked into the plate's alpha and feathered in full colour; the rating,
   name, flag, constructor and stat rail are engraved over it in the plate's
   own ink. A whisper of team-livery anodising (colour blend, masked) seats each
   card in its constructor without drowning the plate's design. The founder
   keeps the bespoke F1 26 gold crest + a living holographic sweep. Scales via
   1cqw. */

const FOUNDER_PLATE = "/cards/f1-gold.png";
const FOUNDER_INK = "#33290f";
const WIDE = "var(--font-din-bold), 'DINPro Condensed', sans-serif";
const MED = "var(--font-din-medium), 'DINPro Condensed', sans-serif";

// Original F1 26 struck-metal plates (designed art, re-struck per tier), mapped
// to the F1 grid. Each plate brings its own cut, grain, ornament and border;
// the ink is chosen to read on that metal.
const PLATES: Record<string, { bg: string; ink: string }> = {
  rookie: { bg: "/cards/carbon.png", ink: "#e8eaef" },
  points: { bg: "/cards/steel.png", ink: "#2a2d33" },
  podium: { bg: "/cards/bronze.png", ink: "#3a2413" },
  winner: { bg: "/cards/gold.png", ink: "#46390c" },
  in_form: { bg: "/cards/sector.png", ink: "#ecd9ff" },
  champion: { bg: "/cards/iridescent.png", ink: "#3a2f10" },
};
const GOAT_PLATE = { bg: "/cards/platinum.png", ink: "#1a1d22" };

// The founder's original struck-metal crest, traced from the baked art: a
// smooth domed top, full-width straight sides, a heel swept to a centre point.
// Used only to clip the founder's holographic sweep (clip-path, never
// mask-image + screen, which composites black in Chromium).
const FOUNDER_PATH = "M 212,2 L 324,2 C 400,8 470,40 512,86 C 528,100 536,108 536,118 L 536,692 C 530,752 400,806 268,818 C 136,806 6,752 0,692 L 0,118 C 0,108 8,100 24,86 C 66,40 136,8 212,2 Z";

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
  const plate = founder ? { bg: FOUNDER_PLATE, ink: FOUNDER_INK } : goat ? GOAT_PLATE : (PLATES[card.finish] ?? PLATES.podium);
  const ink = plate.ink;
  const label = rgba(ink, 0.68);
  const plateMask = `url("${plate.bg}")`;
  const clipId = `clip-${gid}`;
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

  return (
    <div data-card="f1-26"
      style={{ width: "100%", containerType: "inline-size", position: "relative", aspectRatio: "540 / 820", filter: `drop-shadow(0 12px 22px rgba(0,0,0,0.5)) drop-shadow(0 0 10px ${theme.glow})`, userSelect: "none", WebkitUserSelect: "none" }}
    >
      {founder && (
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
          <defs>
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              <path d={norm(FOUNDER_PATH)} />
            </clipPath>
          </defs>
        </svg>
      )}

      {/* the baked plate — its alpha carries the crest silhouette and all the
          struck-metal detail (grain, emboss, engraving, bevel border) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={plate.bg} alt="" aria-hidden loading={eager ? "eager" : "lazy"} decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill" }} />

      {/* a whisper of team-livery anodising — colour blend keeps the plate's
          grain and relief, just seats it in the constructor. Founder stays minted. */}
      {!founder && (
        <div aria-hidden style={{ position: "absolute", inset: 0, background: livery, mixBlendMode: "color", opacity: 0.1, WebkitMaskImage: plateMask, maskImage: plateMask, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" }} />
      )}

      {/* portrait masked into the plate's alpha, feathered, full colour */}
      <div style={{ position: "absolute", inset: 0, WebkitMaskImage: plateMask, maskImage: plateMask, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" }}>{portrait}</div>

      {/* the founder 1/1 gets a living holographic sweep over the gold */}
      {founder && (
        <div aria-hidden className="holo-sweep" style={{ position: "absolute", inset: 0, clipPath: `url(#${clipId})`, backgroundImage: "linear-gradient(115deg, transparent 42%, rgba(255,250,230,0.28) 50%, rgba(255,244,214,0.16) 54%, transparent 62%)", backgroundSize: "250% 250%", mixBlendMode: "screen", pointerEvents: "none" }} />
      )}

      {/* left identity column */}
      <div style={{ position: "absolute", left: "14%", top: "9.5%", zIndex: 3 }}>
        <div className="mono" style={{ fontSize: "3.1cqw", fontWeight: 700, letterSpacing: "0.26em", color: label }}>RTG</div>
        <div style={{ fontFamily: MED, fontWeight: 500, marginTop: "0.5cqw", fontSize: "19cqw", lineHeight: 0.95, color: ink }}>{card.rtg}</div>
      </div>
      <div style={{ position: "absolute", left: "14%", top: "27%", zIndex: 3 }}>
        <div className="mono" style={{ fontSize: "2.8cqw", fontWeight: 700, letterSpacing: "0.24em", color: label }}>NO.</div>
        <div style={{ fontFamily: WIDE, fontWeight: 700, marginTop: "0.3cqw", fontSize: "8cqw", lineHeight: 1, color: ink }}>{String(card.number).padStart(2, "0")}</div>
      </div>
      {flag && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={flag} alt="" width={48} height={32} style={{ position: "absolute", left: "14%", top: "37.5%", height: "4.4cqw", width: "auto", boxShadow: "0 0 0 1px rgba(51,41,15,0.3)", zIndex: 3 }} />
      )}
      <div className="mono" style={{ position: "absolute", left: "14%", top: "44.5%", zIndex: 3, display: "inline-block", fontSize: "2.7cqw", fontWeight: 800, letterSpacing: "0.12em", color: ink, border: `1px solid ${rgba(ink, 0.4)}`, padding: "0.5cqw 1.1cqw", whiteSpace: "nowrap" }}>{chip}</div>

      {/* name */}
      <div data-zone="identity" style={{ position: "absolute", left: "10%", right: "10%", top: "58%", textAlign: "center", zIndex: 3 }}>
        {first && <div style={{ fontFamily: WIDE, fontWeight: 700, fontSize: `${Math.max(2.8, nameSize * 0.4)}cqw`, lineHeight: 1, color: label, marginBottom: "0.6cqw", letterSpacing: "0.06em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{first}</div>}
        <div style={{ fontFamily: WIDE, fontWeight: 700, fontSize: `${nameSize}cqw`, lineHeight: 1, color: ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{last}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.2cqw", marginTop: "1cqw" }}>
          <span aria-hidden style={{ width: "3cqw", height: "0.5cqw", background: rgba(ink, 0.55) }} />
          <span className="mono" style={{ fontSize: "3cqw", fontWeight: 700, letterSpacing: "0.14em", color: label, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.constructor.name.toUpperCase()}</span>
          <span aria-hidden style={{ width: "3cqw", height: "0.5cqw", background: rgba(ink, 0.55) }} />
        </div>
      </div>

      {/* stat rail — six stats, 3×2: [pac,rac,awa] over [exp,tyr,wet]. Sits
          below the identity block (constructor line ends ~72%) and clears the
          GITONE footer at 86.5%. */}
      <div data-zone="stats" style={{ position: "absolute", left: "16%", right: "16%", top: "72.5%", height: "11.5%", display: "flex", flexDirection: "column", zIndex: 3 }}>
        {[STATS.slice(0, 3), STATS.slice(3)].map((row, r) => (
          <div key={row[0]} style={{ flex: 1, display: "flex", borderTop: r === 0 ? "none" : `1px solid ${rgba(ink, 0.28)}` }}>
            {row.map((k: StatKey, i) => (
              <div key={k} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderLeft: i === 0 ? "none" : `1px solid ${rgba(ink, 0.28)}` }}>
                <span className="mono" style={{ fontSize: "2.9cqw", fontWeight: 700, letterSpacing: "0.1em", lineHeight: 0.95, color: label }}>{STAT_LABELS[k]}</span>
                <span style={{ fontFamily: WIDE, fontWeight: 700, fontSize: "6.6cqw", lineHeight: 0.9, color: ink }}>{card.stats[k]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {founder && <div className="mono" style={{ position: "absolute", left: 0, right: 0, top: "84.5%", textAlign: "center", fontSize: "1.9cqw", fontWeight: 700, letterSpacing: "0.14em", color: rgba(ink, 0.7), zIndex: 3 }}>№ 001/001 · EST. 26</div>}
      <div className="mono" style={{ position: "absolute", left: 0, right: 0, top: founder ? "87.5%" : "86.5%", textAlign: "center", fontSize: "2.1cqw", fontWeight: 700, letterSpacing: "0.16em", color: rgba(ink, 0.78), zIndex: 3 }}>GITONE · @{card.login}</div>
    </div>
  );
}

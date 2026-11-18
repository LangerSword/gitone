import { ImageResponse } from "next/og";
import { STATS, STAT_LABELS } from "@/lib/racing/constants";
import { resolveCardTheme, statColor } from "@/components/finishTheme";
import { cardDisplayName } from "@/lib/text";
import { flagUrl } from "@/lib/flagUrl";
import { languageLogoUrl } from "@/lib/github/languages";
import type { Card } from "@/lib/racing/types";
import { loadCardFonts } from "./card";

// Server-side re-creation of the in-app DriverCard (components/DriverCard.tsx),
// used for the embeddable /<user>.png AND the social unfurl. Rendered with
// Satori (next/og); the layout IS DriverCard — percentage positions and cqw
// font sizes resolved to px at the chosen width (1cqw = 1% of card width), so
// the same tree scales by passing a different W. The DOM card's CSS overlays
// (photo fade, livery tint) become stacked background layers; no bitmap
// processing needed — the photo is a plain rectangular crop, so there's no
// sharp pipeline.

const CARD_ASPECT = 640 / 390;
const cardH = (w: number) => Math.round(w / CARD_ASPECT);

// rgba() from a #hex — Satori's gradient stops don't take 8-digit hex.
function hexAlpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

const AVATAR_FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><circle cx="160" cy="128" r="62" fill="rgba(255,255,255,0.18)"/><rect x="58" y="206" width="204" height="150" rx="80" fill="rgba(255,255,255,0.18)"/></svg>',
  );

async function fetchDataUri(url: string, timeoutMs = 4000): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get("content-type")?.split(";")[0] || "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export interface CardAssets {
  avatar: string | null;
  flag: string | null;
  logo: string | null;
}

export async function loadCardAssets(card: Card): Promise<CardAssets> {
  const [avatar, flag, logo] = await Promise.all([
    fetchDataUri(card.avatarUrl),
    card.country ? fetchDataUri(flagUrl(card.country, 80)!) : Promise.resolve(null),
    card.languageLogo ? fetchDataUri(languageLogoUrl(card.languageLogo.slug)) : Promise.resolve(null),
  ]);
  return { avatar, flag, logo };
}

// The gitone driver card as a Satori element at width `w`.
export function cardTree(card: Card, assets: CardAssets, w: number) {
  const H = cardH(w);
  const cqw = (n: number) => Math.round((n / 100) * w);
  const at = (left: number, top: number) => ({ position: "absolute" as const, left: `${left}%`, top: `${top}%` });
  const theme = resolveCardTheme(card);
  const livery = card.constructor.color;
  const liveryInk = card.constructor.ink;
  const displayName = cardDisplayName(card.name).toUpperCase();
  const statColorFor = (v: number) => statColor(v, theme);
  const { avatar, flag } = assets;

  const statRows = STATS.map((k, i) => (
    <div
      key={k}
      style={{
        display: "flex",
        alignItems: "center",
        marginTop: i === 0 ? 0 : cqw(2.15),
        gap: cqw(1.6),
      }}
    >
      <div
        style={{
          display: "flex",
          width: cqw(5.2),
          fontFamily: "JBMono",
          fontSize: cqw(2.7),
          fontWeight: 700,
          color: "#9a9ca6",
        }}
      >
        {STAT_LABELS[k]}
      </div>
      <div style={{ display: "flex", flex: 1, height: cqw(1.55), borderRadius: cqw(0.8), background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
        <div style={{ display: "flex", width: `${card.stats[k]}%`, height: "100%", borderRadius: cqw(0.8), background: statColorFor(card.stats[k]) }} />
      </div>
      <div
        style={{
          display: "flex",
          width: cqw(6.4),
          justifyContent: "flex-end",
          fontFamily: "JBMono",
          fontSize: cqw(3.5),
          fontWeight: 800,
          color: statColorFor(card.stats[k]),
        }}
      >
        {card.stats[k]}
      </div>
    </div>
  ));

  return (
    <div
      style={{
        width: w,
        height: H,
        display: "flex",
        position: "relative",
        fontFamily: "Titillium",
        borderRadius: cqw(1),
        overflow: "hidden",
        background: "linear-gradient(160deg, #17171c 0%, #0c0c0f 55%, #101014 100%)",
      }}
    >
      {/* livery rail + glow */}
      <div style={{ position: "absolute", left: 0, top: 0, width: "3.1%", height: "100%", background: livery, display: "flex" }} />
      <div
        style={{
          position: "absolute",
          left: "-4%",
          top: "-18%",
          width: "52%",
          height: "88%",
          display: "flex",
          background: `radial-gradient(closest-side, ${hexAlpha(livery, 0.18)}, rgba(0,0,0,0))`,
        }}
      />

      {/* top band */}
      <div
        style={{
          ...at(5.4, 3.6),
          display: "flex",
          fontFamily: "JBMono",
          fontSize: cqw(2.35),
          fontWeight: 700,
          letterSpacing: cqw(2.35 * 0.18),
          color: livery,
        }}
      >
        {card.constructor.name.toUpperCase()}
      </div>
      <div
        style={{
          position: "absolute",
          right: "3.2%",
          top: "2.9%",
          display: "flex",
          padding: `${cqw(0.45)}px ${cqw(1.1)}px ${cqw(0.35)}px`,
          borderRadius: cqw(0.5),
          background: theme.accent,
          color: "#0c0c0f",
          fontFamily: "JBMono",
          fontSize: cqw(2.05),
          fontWeight: 800,
          letterSpacing: cqw(2.05 * 0.14),
        }}
      >
        {card.finishLabel}
      </div>

      {/* photo + overlays — the silhouette fills the slot when the fetch
          fails, so the card never shows a hole */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatar ?? AVATAR_FALLBACK}
        alt={card.name}
        width={cqw(33.4)}
        height={Math.round(H * 0.63)}
        style={{ position: "absolute", left: "5.2%", top: "10.2%", objectFit: "cover", borderRadius: cqw(0.8) }}
      />
      <div
        style={{
          position: "absolute",
          left: "5.2%",
          top: "10.2%",
          width: "33.4%",
          height: "63%",
          borderRadius: cqw(0.8),
          display: "flex",
          backgroundImage: `radial-gradient(120% 90% at 80% 10%, ${hexAlpha(livery, 0.15)}, rgba(0,0,0,0) 60%), linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(12,12,15,0.93) 96%)`,
        }}
      />
      {flag && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={flag}
          alt=""
          width={Math.round(cqw(3.4) * 1.4)}
          height={cqw(3.4)}
          style={{ position: "absolute", left: "6.6%", top: "12.6%", objectFit: "contain", borderRadius: cqw(0.3) }}
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
          borderRadius: `${cqw(0.6)}px ${cqw(0.9)}px 0 0`,
        }}
      >
        <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(7), fontWeight: 800, lineHeight: 1 }}>{card.number}</div>
      </div>

      {/* name block */}
      <div style={{ ...at(41.8, 12.4), display: "flex", flexDirection: "column", width: "36%" }}>
        <div style={{ display: "flex", fontWeight: 900, fontSize: cqw(7.6), lineHeight: 0.98, color: "#edeef2" }}>{displayName}</div>
        <div style={{ display: "flex", marginTop: cqw(1.1), fontFamily: "JBMono", fontSize: cqw(2.45), color: "#9a9ca6" }}>@{card.login}</div>
        <div style={{ display: "flex", marginTop: cqw(0.7), fontFamily: "JBMono", fontSize: cqw(2.2), color: "#6a6c76" }}>{card.archetype.toUpperCase()}</div>
      </div>

      {/* RTG block */}
      <div style={{ position: "absolute", right: "3.4%", top: "10.6%", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(2.3), letterSpacing: cqw(0.7), color: "#9a9ca6", fontWeight: 700 }}>RTG</div>
        <div
          style={{
            display: "flex",
            fontWeight: 900,
            fontSize: cqw(14.2),
            lineHeight: 0.9,
            color: card.finish === "champion" || card.finish === "in_form" || card.finish === "founder" ? theme.accent : "#edeef2",
          }}
        >
          {card.rtg}
        </div>
        <div style={{ display: "flex", marginTop: cqw(0.4), fontFamily: "JBMono", fontSize: cqw(2.3), color: "#6a6c76" }}>CAR {card.car.rating}</div>
      </div>

      {/* the four rating bars */}
      <div style={{ ...at(41.8, 47), display: "flex", flexDirection: "column", width: "54.8%" }}>{statRows}</div>

      {/* divider + chassis strip */}
      <div style={{ position: "absolute", left: "5.2%", right: "3.2%", top: "88.6%", height: cqw(0.28), background: livery, opacity: 0.4, display: "flex" }} />
      <div
        style={{
          ...at(5.2, 91),
          display: "flex",
          fontFamily: "JBMono",
          fontSize: cqw(2.15),
          color: "#6a6c76",
        }}
      >
        <span>CHASSIS&nbsp;</span>
        {(["cor", "top", "aero", "rel"] as const).map((k, i) => (
          <span key={k}>
            {i > 0 ? " · " : ""}
            <span style={{ color: "#9a9ca6" }}>{k.toUpperCase()}</span>
            <span style={{ color: "#edeef2", fontWeight: 700 }}>{card.car[k]}</span>
          </span>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          right: "3.2%",
          top: "91%",
          display: "flex",
          fontFamily: "JBMono",
          fontSize: cqw(2.15),
          color: "#6a6c76",
          letterSpacing: cqw(0.3),
        }}
      >
        GITONE
      </div>
    </div>
  );
}

// The standalone embeddable card image: gitone/<user>.png.
export async function renderCardImage(card: Card, width = 1280): Promise<ImageResponse> {
  const [fonts, assets] = await Promise.all([loadCardFonts(), loadCardAssets(card)]);
  return new ImageResponse(cardTree(card, assets, width), {
    width,
    height: cardH(width),
    fonts,
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
  });
}

// The branded "visit to generate" hint for failed scouts on the embed route.
export async function renderFallbackImage(username: string): Promise<ImageResponse> {
  const fonts = await loadCardFonts();
  const W = 1280;
  const H = cardH(W);
  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #17171c 0%, #0c0c0f 55%, #101014 100%)",
          color: "#edeef2",
          fontFamily: "Titillium",
        }}
      >
        <div style={{ display: "flex", gap: 18 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                background: "radial-gradient(circle at 35% 30%, #ff4a41, #b30400 68%)",
                display: "flex",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", marginTop: 44, fontWeight: 900, fontSize: 72, letterSpacing: 4 }}>GITONE</div>
        <div style={{ display: "flex", marginTop: 18, fontFamily: "JBMono", fontSize: 34, color: "#9a9ca6" }}>@{username}</div>
        <div style={{ display: "flex", marginTop: 22, fontFamily: "JBMono", fontSize: 26, color: "#6a6c76" }}>
          scout this driver at the grid
        </div>
      </div>
    ),
    { width: W, height: H, fonts, headers: { "Cache-Control": "public, max-age=300" } },
  );
}

export { cardH };

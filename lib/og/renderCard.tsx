import { ImageResponse } from "next/og";
import { STATS, STAT_LABELS } from "@/lib/racing/constants";
import { artLayers, resolveCardTheme, statColor } from "@/components/finishTheme";
import { cardDisplayName } from "@/lib/text";
import { flagUrl } from "@/lib/flagUrl";
import { languageLogoUrl } from "@/lib/github/languages";
import type { Card } from "@/lib/racing/types";
import { loadCardFonts } from "./card";

// Server-side re-creation of the in-app DriverCard (components/DriverCard.tsx),
// used for the embeddable /<user>.png AND the social unfurl. Rendered with
// Satori (next/og); the layout IS DriverCard v2 — foil frame, art layers,
// bled photo, ghost number — with cqw sizes resolved to px at the render
// width. Effects the DOM does with CSS text-shadow/masks are approximated
// with flat gradient layers (the photo's edge fade paints the art's base
// colour over the crop, exactly like the DOM overlay does).

const CARD_ASPECT = 640 / 390;
const FRAME = 0.015; // foil frame thickness, fraction of render width

const framePad = (w: number) => Math.round(FRAME * w);
const innerW = (w: number) => w - 2 * framePad(w);
const innerH = (w: number) => Math.round(innerW(w) / CARD_ASPECT);
export const cardH = (w: number) => innerH(w) + 2 * framePad(w);

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

export async function fetchDataUri(url: string, timeoutMs = 4000): Promise<string | null> {
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

// The gitone driver card as a Satori element at width `w` (frame included).
export function cardTree(card: Card, assets: CardAssets, w: number) {
  const H = innerH(w);
  const IW = innerW(w);
  // sizes resolve against the INNER card (the DOM's cqw unit)
  const cqw = (n: number) => Math.round((n / 100) * IW);
  const theme = resolveCardTheme(card);
  const livery = card.constructor.color;
  const displayName = cardDisplayName(card.name).toUpperCase();
  const c = statColor;
  const { avatar, flag } = assets;

  const statRows = STATS.map((k, i) => (
    <div
      key={k}
      style={{
        display: "flex",
        alignItems: "center",
        marginTop: i === 0 ? 0 : cqw(1.0),
        gap: cqw(1.6),
      }}
    >
      <div
        style={{
          display: "flex",
          width: cqw(5.4),
          fontFamily: "JBMono",
          fontSize: cqw(2.5),
          fontWeight: 700,
          lineHeight: 1,
          color: "rgba(237,238,242,0.55)",
        }}
      >
        {STAT_LABELS[k]}
      </div>
      <div style={{ display: "flex", flex: 1, height: cqw(1.5), borderRadius: cqw(0.9), background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            width: `${card.stats[k]}%`,
            height: "100%",
            borderRadius: cqw(0.9),
            background: c(card.stats[k], theme),
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          width: cqw(6.6),
          justifyContent: "flex-end",
          fontFamily: "JBMono",
          fontSize: cqw(3.2),
          fontWeight: 800,
          lineHeight: 1,
          color: c(card.stats[k], theme),
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
        height: H + 2 * framePad(w),
        display: "flex",
        borderRadius: Math.round(0.016 * w),
        padding: framePad(w),
        background: theme.foil,
      }}
    >
      <div
        style={{
          width: IW,
          height: H,
          display: "flex",
          position: "relative",
          borderRadius: Math.round(0.008 * w),
          overflow: "hidden",
          backgroundColor: "#15151e",
          backgroundImage: artLayers(livery, card.finish).join(","),
        }}
      >
        {/* ghost number watermark */}
        <div
          style={{
            position: "absolute",
            right: "3%",
            top: "13%",
            display: "flex",
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: cqw(28),
            lineHeight: 0.8,
            color: theme.accent,
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
            display: "flex",
            backgroundImage:
              "linear-gradient(115deg, rgba(255,255,255,0.07) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 64%, rgba(255,255,255,0.045) 100%)",
          }}
        />

        {/* photo — bled left, duotone + edge fade into the art */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatar ?? AVATAR_FALLBACK}
          alt={card.name}
          width={cqw(37)}
          height={H}
          style={{ position: "absolute", left: 0, top: 0, objectFit: "cover", objectPosition: "top" }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "37%",
            height: "100%",
            display: "flex",
            backgroundImage: `radial-gradient(90% 70% at 65% 12%, ${hexAlpha(livery, 0.19)}, rgba(0,0,0,0) 60%), linear-gradient(90deg, rgba(10,10,13,0.15) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 72%, #0a0a0d 100%), linear-gradient(180deg, rgba(10,10,13,0.25) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 62%, rgba(8,8,11,0.72) 100%)`,
          }}
        />
        {/* checkered base strip under the photo */}
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: "37%",
            height: cqw(3.2),
            display: "flex",
            opacity: 0.4,
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.35) 0 6px, transparent 6px 12px)",
          }}
        />

        {/* flag chip */}
        {flag && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={flag}
            alt=""
            width={Math.round(cqw(3.6) * 1.4)}
            height={cqw(3.6)}
            style={{ position: "absolute", left: "2.4%", top: "3%", objectFit: "contain", borderRadius: cqw(0.3) }}
          />
        )}

        {/* driver number chip — foil material */}
        <div
          style={{
            position: "absolute",
            left: "2.4%",
            bottom: "10.5%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: `${cqw(0.6)}px ${cqw(1.6)}px`,
            borderRadius: cqw(0.6),
            background: theme.foil,
          }}
        >
          <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(6.4), fontWeight: 800, lineHeight: 1, color: "#0c0c0f" }}>
            {card.number}
          </div>
        </div>

        {/* finish chip — the card's tier, in its own material */}
        <div
          style={{
            position: "absolute",
            right: "8%",
            top: "4.5%",
            display: "flex",
            padding: `${cqw(0.5)}px ${cqw(1.3)}px ${cqw(0.4)}px`,
            borderRadius: cqw(0.5),
            background: theme.foil,
          }}
        >
          <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(2.1), fontWeight: 800, letterSpacing: cqw(0.3), color: "#0c0c0f" }}>
            {card.finishLabel}
          </div>
        </div>

        {/* identity block */}
        <div style={{ position: "absolute", left: "40.5%", top: "7.5%", display: "flex", flexDirection: "column", width: "34%" }}>
          <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(2.3), fontWeight: 700, letterSpacing: cqw(0.46), color: livery }}>
            {card.constructor.name.toUpperCase()}
          </div>
          <div style={{ display: "flex", marginTop: cqw(0.6), fontWeight: 900, fontSize: cqw(8.2), lineHeight: 0.96, color: "#f4f5f9" }}>
            {displayName}
          </div>
          <div style={{ display: "flex", marginTop: cqw(0.7), fontFamily: "JBMono", fontSize: cqw(2.4), color: "rgba(237,238,242,0.6)" }}>
            @{card.login}
          </div>
          <div style={{ display: "flex", marginTop: cqw(0.5), fontFamily: "JBMono", fontSize: cqw(2.05), letterSpacing: cqw(0.2), color: theme.ink }}>
            {card.archetype.toUpperCase()}
          </div>
        </div>

        {/* RTG block */}
        <div style={{ position: "absolute", right: "2.4%", top: "11%", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(2.2), letterSpacing: cqw(0.66), color: "rgba(244,245,249,0.85)", fontWeight: 700 }}>
            RTG
          </div>
          {/* halo behind the number */}
          <div
            style={{
              position: "relative",
              display: "flex",
              backgroundImage: `radial-gradient(60% 70% at 70% 60%, ${hexAlpha(theme.accent, 0.28)}, rgba(0,0,0,0) 70%)`,
            }}
          >
            <div style={{ display: "flex", fontWeight: 900, fontSize: cqw(15), lineHeight: 0.86, color: "#ffffff" }}>
              {card.rtg}
            </div>
          </div>
        </div>

        {/* the six rating bars */}
        <div style={{ position: "absolute", left: "40.5%", top: "45%", display: "flex", flexDirection: "column", width: "56.5%" }}>
          {statRows}
        </div>

        {/* chassis strip */}
        <div
          style={{
            position: "absolute",
            left: "40.5%",
            right: "3.5%",
            bottom: "6%",
            display: "flex",
            borderTop: `${Math.max(2, cqw(0.24))}px solid ${livery}`,
            paddingTop: cqw(1.2),
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(2.3), color: "rgba(237,238,242,0.75)" }}>
            <span style={{ color: "rgba(237,238,242,0.5)" }}>CHASSIS&nbsp;</span>
            <span style={{ color: "#f4f5f9", fontWeight: 700 }}>{card.car.rating}</span>
            {(["cor", "top", "aero", "rel"] as const).map((k) => (
              <span key={k}>
                {" · "}
                <span style={{ color: "rgba(237,238,242,0.5)" }}>{k.toUpperCase()}</span>
                <span style={{ color: "#f4f5f9", fontWeight: 700 }}>{card.car[k]}</span>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(2.05), letterSpacing: cqw(0.37), color: theme.ink }}>
            GITONE
          </div>
        </div>
      </div>
    </div>
  );
}

// The standalone embeddable card image: gitone/<user>.png. Rendered at 960
// (1.5x the 640 design width), then masked through the same livery-cut
// chamfer the DOM card uses — Satori has no clip-path, so sharp bakes the
// alpha via dest-in (gitfut's avatar-feather trick, applied to the card).
export async function renderCardImage(card: Card, width = 960): Promise<Response> {
  const [fonts, assets] = await Promise.all([loadCardFonts(), loadCardAssets(card)]);
  const H = cardH(width);
  const image = new ImageResponse(cardTree(card, assets, width), {
    width,
    height: H,
    fonts,
  });
  const cut = Math.round(0.055 * width);
  const cutB = Math.round(0.045 * width);
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${H}"><polygon points="0,0 ${width - cut},0 ${width},${cut} ${width},${H} ${cutB},${H} 0,${H - cutB}" fill="#fff"/></svg>`,
  );
  const sharp = (await import("sharp")).default;
  const png = await sharp(Buffer.from(await image.arrayBuffer()))
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
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

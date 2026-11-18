import { ImageResponse } from "next/og";
import { STATS, STAT_LABELS } from "@/lib/racing/constants";
import { resolveCardTheme } from "@/components/finishTheme";
import { flagUrl } from "@/lib/flagUrl";
import type { Card } from "@/lib/racing/types";
import { loadCardFonts } from "./card";
import { loadCardAssets } from "./renderCard";

// Satori twin of components/DriverCard26.tsx — the season-pack grammar:
// octagonal silhouette, team rim, full-bleed portrait, rating top-left,
// number top-right, four-column stat rail. Satori has no clip-path, so
// sharp bakes the four chamfers into the PNG alpha; the OG unfurl draws
// matching corner covers on a solid ground.
const FRAME = 0.0115;
const framePad = (w: number) => Math.round(FRAME * w);
const innerW = (w: number) => w - 2 * framePad(w);
const innerH = (w: number) => Math.round(innerW(w) * 1.5);
export const cardH = (w: number) => innerH(w) + 2 * framePad(w);

function hexAlpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

const AVATAR_FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640"><circle cx="320" cy="250" r="120" fill="rgba(255,255,255,0.16)"/><rect x="120" y="400" width="400" height="300" rx="160" fill="rgba(255,255,255,0.16)"/></svg>',
  );

export function cardTree(card: Card, assets: Awaited<ReturnType<typeof loadCardAssets>>, w: number) {
  const H = innerH(w);
  const IW = innerW(w);
  const cqw = (n: number) => Math.round((n / 100) * IW);
  const theme = resolveCardTheme(card);
  const livery = card.constructor.color;
  const display = card.name.trim().toUpperCase().replace(/\.$/, "");
  const parts = display.split(/\s+/).filter(Boolean);
  const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
  const last = parts[parts.length - 1] ?? display;
  const nameSize = last.length > 11 ? 8.2 : last.length > 8 ? 9.4 : 10.8;
  const flag = assets.flag ?? flagUrl(card.country, 80);

  const stats = STATS.map((k, i) => (
    <div
      key={k}
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: cqw(0.5),
        borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(3.0), fontWeight: 700, letterSpacing: cqw(0.42), color: "rgba(242,243,240,0.55)" }}>
        {STAT_LABELS[k]}
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: "JBMono",
          fontSize: cqw(6.4),
          fontWeight: 800,
          lineHeight: 1,
          color: card.stats[k] >= 90 ? "#b46bff" : "#ffffff",
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
        padding: framePad(w),
        borderRadius: Math.round(w * 0.028),
        overflow: "hidden",
        backgroundImage: `linear-gradient(148deg, ${livery} 0%, ${hexAlpha(livery, 0.28)} 22%, ${hexAlpha(livery, 0.95)} 48%, rgba(255,255,255,0.55) 58%, ${hexAlpha(livery, 0.5)} 76%, ${livery} 100%)`,
      }}
    >
      <div
        style={{
          width: IW,
          height: H,
          display: "flex",
          position: "relative",
          overflow: "hidden",
          borderRadius: Math.round(w * 0.02),
          backgroundImage: "linear-gradient(160deg, #1c2027 0%, #0b0c0f 56%, #111318 100%)",
        }}
      >
        {/* team speed band + carbon haze */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage: `linear-gradient(118deg, rgba(0,0,0,0) 18%, ${hexAlpha(livery, 0.34)} 18%, ${hexAlpha(livery, 0.5)} 25%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 58%, ${hexAlpha(livery, 0.16)} 58%, rgba(0,0,0,0) 74%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage: `radial-gradient(72% 52% at 50% 0%, ${hexAlpha(livery, 0.3)}, rgba(0,0,0,0) 66%)`,
          }}
        />

        {/* full-bleed portrait, faded into the identity band */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assets.avatar ?? AVATAR_FALLBACK}
          alt={card.name}
          width={IW}
          height={Math.round(H * 0.6)}
          style={{ position: "absolute", left: 0, top: 0, objectFit: "cover", objectPosition: "top center" }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: IW,
            height: Math.round(H * 0.6),
            display: "flex",
            backgroundImage: `linear-gradient(180deg, rgba(8,9,11,0) 52%, #0b0c0f 98%), linear-gradient(90deg, rgba(8,9,11,0.55) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 72%, rgba(8,9,11,0.55) 100%), radial-gradient(58% 70% at 70% 18%, ${hexAlpha(livery, 0.22)}, rgba(0,0,0,0) 62%)`,
          }}
        />

        {/* rating */}
        <div style={{ position: "absolute", left: "5.5%", top: "3.6%", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(2.9), fontWeight: 700, letterSpacing: cqw(0.87), color: "rgba(242,243,240,0.62)" }}>
            RTG
          </div>
          <div style={{ display: "flex", marginTop: cqw(0.4), fontWeight: 900, fontSize: cqw(23), lineHeight: 0.78, letterSpacing: -cqw(1), color: "#ffffff" }}>
            {card.rtg}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: cqw(1.2),
              fontFamily: "JBMono",
              fontSize: cqw(2.6),
              fontWeight: 800,
              letterSpacing: cqw(0.42),
              color: theme.ink,
              background: hexAlpha(theme.accent, 0.16),
              border: `1px solid ${hexAlpha(theme.accent, 0.42)}`,
              padding: `${cqw(0.7)}px ${cqw(1.4)}px`,
            }}
          >
            {card.finishLabel}
          </div>
        </div>

        {/* number + flag */}
        <div style={{ position: "absolute", right: "5.5%", top: "4%", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(2.5), fontWeight: 700, letterSpacing: cqw(0.7), color: "rgba(242,243,240,0.5)" }}>
            NO.
          </div>
          <div style={{ display: "flex", marginTop: cqw(0.2), fontFamily: "JBMono", fontSize: cqw(6.4), fontWeight: 800, lineHeight: 1, color: livery }}>
            {String(card.number).padStart(2, "0")}
          </div>
          {flag && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={flag}
              alt=""
              width={Math.round(cqw(3.4) * 1.5)}
              height={cqw(3.4)}
              style={{ marginTop: cqw(1.2), objectFit: "contain", border: "1px solid rgba(255,255,255,0.18)" }}
            />
          )}
        </div>

        {/* identity */}
        <div style={{ position: "absolute", left: "5.5%", right: "5.5%", top: "56.5%", display: "flex", flexDirection: "column" }}>
          {first && (
            <div style={{ display: "flex", fontWeight: 900, fontSize: cqw(Math.max(3.4, nameSize * 0.42)), lineHeight: 1, letterSpacing: cqw(0.1), color: "rgba(242,243,240,0.62)" }}>
              {first}
            </div>
          )}
          <div style={{ display: "flex", marginTop: first ? cqw(0.5) : 0, fontWeight: 900, fontSize: cqw(nameSize), lineHeight: 0.88, color: "#ffffff" }}>
            {last}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: cqw(1.2), marginTop: cqw(1.6) }}>
            <div style={{ display: "flex", width: cqw(3.2), height: cqw(0.5), background: livery }} />
            <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(2.8), fontWeight: 700, letterSpacing: cqw(0.45), color: livery }}>
              {card.constructor.name.toUpperCase()}
            </div>
          </div>
        </div>

        {/* stat rail */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: cqw(1.4),
            height: "19.5%",
            display: "flex",
            backgroundImage: "linear-gradient(180deg, rgba(8,9,11,0.1), rgba(8,9,11,0.62))",
            borderTop: `1px solid ${hexAlpha(livery, 0.34)}`,
          }}
        >
          {stats}
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", height: cqw(0.8), background: livery }} />
        <div style={{ position: "absolute", right: "5.5%", bottom: "22.2%", display: "flex", fontFamily: "JBMono", fontSize: cqw(1.9), fontWeight: 700, letterSpacing: cqw(0.3), color: "rgba(242,243,240,0.42)" }}>
          GITONE
        </div>
      </div>
    </div>
  );
}

export async function renderCardImage(card: Card, width = 720): Promise<Response> {
  const [fonts, assets] = await Promise.all([loadCardFonts(), loadCardAssets(card)]);
  const H = cardH(width);
  const image = new ImageResponse(cardTree(card, assets, width), { width, height: H, fonts });
  const cut = Math.round(0.028 * width);
  // a clean rounded card, not a chamfered diamond
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${H}"><rect x="0" y="0" width="${width}" height="${H}" rx="${cut}" ry="${cut}" fill="#fff"/></svg>`,
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

export async function renderFallbackImage(username: string): Promise<Response> {
  const fonts = await loadCardFonts();
  const W = 720;
  const H = cardH(W);
  const image = new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #16191f 0%, #08090b 58%, #101318 100%)",
          color: "#f2f3f0",
          fontFamily: "Titillium",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                background: "radial-gradient(circle at 35% 30%, #ff5a4d, #8c0a00 70%)",
                display: "flex",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", marginTop: 40, fontWeight: 900, fontSize: 76, letterSpacing: 6 }}>GITONE</div>
        <div style={{ display: "flex", marginTop: 14, fontFamily: "JBMono", fontSize: 30, color: "#a2a7ae" }}>@{username}</div>
        <div style={{ display: "flex", marginTop: 18, fontFamily: "JBMono", fontSize: 22, color: "#6a7079" }}>
          scout this driver at the grid
        </div>
      </div>
    ),
    { width: W, height: H, fonts },
  );
  const png = await image.arrayBuffer();
  return new Response(png, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300" } });
}

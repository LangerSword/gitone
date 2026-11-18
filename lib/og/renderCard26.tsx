import { ImageResponse } from "next/og";
import { STATS, STAT_LABELS } from "@/lib/racing/constants";
import { resolveCardTheme } from "@/components/finishTheme";
import { cardDisplayName } from "@/lib/text";
import { flagUrl } from "@/lib/flagUrl";
import type { Card } from "@/lib/racing/types";
import { loadCardFonts } from "./card";
import { loadCardAssets } from "./renderCard";

// Satori twin of components/DriverCard26.tsx — the official F1 26 rating
// card grammar. Flat gradient layers stand in for CSS text-shadow/masks;
// sharp bakes the top-left / bottom-right chamfer into the PNG alpha.
const FRAME = 0.012;
const framePad = (w: number) => Math.round(FRAME * w);
const innerW = (w: number) => w - 2 * framePad(w);
const innerH = (w: number) => Math.round((innerW(w) * 3) / 2);
export const cardH = (w: number) => innerH(w) + 2 * framePad(w);

function hexAlpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export function cardTree(card: Card, assets: Awaited<ReturnType<typeof loadCardAssets>>, w: number) {
  const H = innerH(w);
  const IW = innerW(w);
  const cqw = (n: number) => Math.round((n / 100) * IW);
  const theme = resolveCardTheme(card);
  const livery = card.constructor.color;
  const displayName = cardDisplayName(card.name).toUpperCase();
  const flag = assets.flag ?? flagUrl(card.country, 80);

  const boxes = STATS.map((k) => (
    <div
      key={k}
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        padding: `${cqw(1.4)}px ${cqw(0.6)}px ${cqw(1.2)}px`,
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: cqw(0.6),
        background: "rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(2.3), color: "rgba(243,243,244,0.6)" }}>
        {STAT_LABELS[k]}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: cqw(0.5),
          fontFamily: "JBMono",
          fontSize: cqw(6.4),
          fontWeight: 800,
          lineHeight: 1,
          color: card.stats[k] >= 90 ? "#b455ff" : "#ffffff",
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
        borderRadius: cqw(1),
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
          overflow: "hidden",
          background: "linear-gradient(155deg, #191920 0%, #0e0e15 60%, #12121b 100%)",
        }}
      >
        {/* the F1 26 team slash */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage: `linear-gradient(122deg, rgba(0,0,0,0) 24%, ${hexAlpha(livery, 0.33)} 24%, ${hexAlpha(livery, 0.44)} 43%, rgba(0,0,0,0) 43%, rgba(0,0,0,0) 62%, ${hexAlpha(livery, 0.13)} 62%, rgba(0,0,0,0) 78%)`,
          }}
        />
        {/* photo */}
        <div style={{ position: "absolute", left: 0, top: "7%", width: "58%", height: "62%", display: "flex", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assets.avatar ?? ""}
            alt={card.name}
            width={cqw(58)}
            height={Math.round(H * 0.62)}
            style={{ objectFit: "cover", objectPosition: "top" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              backgroundImage: `radial-gradient(80% 60% at 50% 10%, ${hexAlpha(livery, 0.13)}, rgba(0,0,0,0) 60%), linear-gradient(180deg, rgba(0,0,0,0) 55%, #101017 98%), linear-gradient(90deg, rgba(0,0,0,0) 60%, #101017 100%)`,
            }}
          />
        </div>

        {/* number + flag */}
        <div style={{ position: "absolute", left: "6%", top: "9.5%", display: "flex", alignItems: "center", gap: cqw(2) }}>
          <div
            style={{
              display: "flex",
              background: livery,
              color: card.constructor.ink,
              fontFamily: "JBMono",
              fontSize: cqw(6),
              fontWeight: 800,
              lineHeight: 1,
              padding: `${cqw(1)}px ${cqw(2)}px`,
              borderRadius: cqw(0.8),
            }}
          >
            {card.number}
          </div>
          {flag && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={flag} alt="" width={cqw(6)} height={cqw(4)} style={{ objectFit: "contain", borderRadius: cqw(0.3) }} />
          )}
        </div>

        {/* RTG */}
        <div style={{ position: "absolute", right: "6%", top: "5%", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(3), letterSpacing: cqw(0.96), color: "rgba(243,243,244,0.7)" }}>
            RTG
          </div>
          <div style={{ display: "flex", fontWeight: 900, fontSize: cqw(30), lineHeight: 0.84, color: "#ffffff" }}>
            {card.rtg}
          </div>
        </div>

        {/* tier chip */}
        <div
          style={{
            position: "absolute",
            left: "6%",
            top: "22%",
            display: "flex",
            fontFamily: "JBMono",
            fontSize: cqw(2.6),
            fontWeight: 800,
            letterSpacing: cqw(0.52),
            color: theme.ink,
            background: hexAlpha(theme.accent, 0.14),
            border: `1px solid ${hexAlpha(theme.accent, 0.34)}`,
            borderRadius: cqw(0.6),
            padding: `${cqw(0.8)}px ${cqw(1.5)}px`,
          }}
        >
          {card.finishLabel}
        </div>

        {/* identity */}
        <div style={{ position: "absolute", left: "6%", top: "68.5%", display: "flex", flexDirection: "column", width: "88%" }}>
          <div style={{ display: "flex", fontWeight: 900, fontSize: cqw(11.5), lineHeight: 0.92, color: "#ffffff" }}>
            {displayName}
          </div>
          <div style={{ display: "flex", marginTop: cqw(1.4), fontFamily: "JBMono", fontSize: cqw(2.9), letterSpacing: cqw(0.46), color: livery }}>
            {card.constructor.name.toUpperCase()}
          </div>
        </div>

        {/* stat boxes */}
        <div style={{ position: "absolute", left: "5%", right: "5%", top: "84%", display: "flex", gap: cqw(1.6) }}>
          {boxes}
        </div>
        <div style={{ position: "absolute", left: "6%", bottom: "2%", display: "flex", fontFamily: "JBMono", fontSize: cqw(2), letterSpacing: cqw(0.4), color: "rgba(243,243,244,0.35)" }}>
          GITONE · @{card.login}
        </div>
      </div>
    </div>
  );
}

export async function renderCardImage(card: Card, width = 720): Promise<Response> {
  const [fonts, assets] = await Promise.all([loadCardFonts(), loadCardAssets(card)]);
  const H = cardH(width);
  const image = new ImageResponse(cardTree(card, assets, width), { width, height: H, fonts });
  const cut = Math.round(0.055 * width);
  // F1 26: top-left and bottom-right cut (the opposite of the old card)
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${H}"><polygon points="${cut},0 ${width},0 ${width},${H} ${width - cut},${H} 0,${cut} 0,${H}" fill="#fff"/></svg>`,
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
          background: "linear-gradient(155deg, #191920, #0e0e15)",
          color: "#f3f3f4",
          fontFamily: "Titillium",
        }}
      >
        <div style={{ display: "flex", fontSize: 72, fontWeight: 900 }}>GITONE</div>
        <div style={{ display: "flex", marginTop: 16, fontFamily: "JBMono", fontSize: 30, color: "#aaaab3" }}>@{username}</div>
        <div style={{ display: "flex", marginTop: 18, fontFamily: "JBMono", fontSize: 24, color: "#71717d" }}>
          scout this driver at the grid
        </div>
      </div>
    ),
    { width: W, height: H, fonts },
  );
  return new Response(await image.arrayBuffer(), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300" } });
}

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { STATS, STAT_LABELS } from "@/lib/racing/constants";
import { flagUrl } from "@/lib/flagUrl";
import type { Card } from "@/lib/racing/types";
import { loadCardFonts } from "./card";
import { loadCardAssets } from "./renderCard";

// Satori twin of components/DriverCard26.tsx — the struck-metal F1 crest.
// Satori has no blend-modes or masks, so the plate is composited with sharp:
// the baked metal PNG is anodised to the livery (libvips "colour" blend, the
// same hue-shift the DOM does with mix-blend-mode), the portrait is feathered
// through a radial alpha mask and seated into the plate, then Satori draws the
// dark engraved DIN-style type (Barlow Condensed) over the top. The crest's own
// alpha defines the silhouette; a dark ground frames it for the social unfurl.

const INK = "#33290f";
const ASPECT = 820 / 540;
export const cardH = (w: number) => Math.round(w * ASPECT);

function hexAlpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function nameParts(name: string) {
  const display = name.trim().toUpperCase().replace(/\.$/, "");
  const parts = display.split(/\s+/).filter(Boolean);
  return {
    first: parts.length > 1 ? parts.slice(0, -1).join(" ") : "",
    last: parts[parts.length - 1] ?? display,
  };
}

// The type layer only — transparent ground, absolute positions matching the DOM.
function textTree(card: Card, assets: Awaited<ReturnType<typeof loadCardAssets>>, w: number) {
  const H = cardH(w);
  const cqw = (n: number) => Math.round((n / 100) * w);
  const { first, last } = nameParts(card.name);
  const nameSize = last.length > 11 ? 8.0 : last.length > 8 ? 9.8 : 11.0;
  const label = hexAlpha(INK, 0.68);
  const flag = assets.flag ?? flagUrl(card.country, 80);
  const founder = card.finish === "founder";

  return (
    <div style={{ width: w, height: H, display: "flex", position: "relative", color: INK }}>
      {/* rating */}
      <div style={{ position: "absolute", left: "13%", top: "9%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(3.1), fontWeight: 700, letterSpacing: cqw(0.8), color: label }}>RTG</div>
        <div style={{ display: "flex", marginTop: cqw(0.5), fontFamily: "Titillium", fontWeight: 700, fontSize: cqw(19), lineHeight: 0.95, color: INK }}>{card.rtg}</div>
      </div>
      {/* number */}
      <div style={{ position: "absolute", left: "13%", top: "26.5%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(2.8), fontWeight: 700, letterSpacing: cqw(0.66), color: label }}>NO.</div>
        <div style={{ display: "flex", marginTop: cqw(0.3), fontFamily: "Titillium", fontWeight: 700, fontSize: cqw(8), lineHeight: 1, color: INK }}>{String(card.number).padStart(2, "0")}</div>
      </div>
      {/* flag */}
      {flag && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={flag} alt="" width={Math.round(cqw(4.4) * 1.5)} height={cqw(4.4)} style={{ position: "absolute", left: "13%", top: "37%", objectFit: "contain" }} />
      )}
      {/* finish chip */}
      <div style={{ position: "absolute", left: "13%", top: "44%", display: "flex", padding: `${cqw(0.5)}px ${cqw(1.1)}px`, border: `1px solid ${hexAlpha(INK, 0.4)}` }}>
        <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(2.7), fontWeight: 800, letterSpacing: cqw(0.32), color: INK }}>{card.finishLabel}</div>
      </div>
      {/* name */}
      <div style={{ position: "absolute", left: "10%", width: "80%", top: "58%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {first && (
          <div style={{ display: "flex", fontFamily: "Titillium", fontWeight: 700, fontSize: cqw(Math.max(2.8, nameSize * 0.4)), lineHeight: 1, letterSpacing: cqw(0.16), color: label, marginBottom: cqw(0.6) }}>{first}</div>
        )}
        <div style={{ display: "flex", fontFamily: "Titillium", fontWeight: 700, fontSize: cqw(nameSize), lineHeight: 1, color: INK }}>{last}</div>
        <div style={{ display: "flex", alignItems: "center", gap: cqw(1.2), marginTop: cqw(1) }}>
          <div style={{ display: "flex", width: cqw(3), height: cqw(0.5), background: hexAlpha(INK, 0.55) }} />
          <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(3), fontWeight: 700, letterSpacing: cqw(0.42), color: label }}>{card.constructor.name.toUpperCase()}</div>
          <div style={{ display: "flex", width: cqw(3), height: cqw(0.5), background: hexAlpha(INK, 0.55) }} />
        </div>
      </div>
      {/* stat rail */}
      <div style={{ position: "absolute", left: "20%", width: "60%", top: "72%", height: "10.5%", display: "flex" }}>
        {STATS.map((k, i) => (
          <div key={k} style={{ display: "flex", flex: 1, minWidth: 0, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: cqw(0.5), borderLeft: i === 0 ? "none" : `1px solid ${hexAlpha(INK, 0.28)}` }}>
            <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(3.1), fontWeight: 700, letterSpacing: cqw(0.2), color: label, whiteSpace: "nowrap" }}>{STAT_LABELS[k]}</div>
            <div style={{ display: "flex", fontFamily: "Titillium", fontWeight: 700, fontSize: cqw(7.6), lineHeight: 1, color: INK }}>{card.stats[k]}</div>
          </div>
        ))}
      </div>
      {founder && (
        <div style={{ position: "absolute", left: 0, right: 0, top: "84.5%", display: "flex", justifyContent: "center", fontFamily: "JBMono", fontSize: cqw(1.9), fontWeight: 700, letterSpacing: cqw(0.26), color: hexAlpha(INK, 0.7) }}>№ 001/001 · EST. 26</div>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: founder ? "87.5%" : "86.5%", display: "flex", justifyContent: "center", fontFamily: "JBMono", fontSize: cqw(2.1), fontWeight: 700, letterSpacing: cqw(0.34), color: hexAlpha(INK, 0.6) }}>GITONE · @{card.login}</div>
    </div>
  );
}

export const cardPad = (w: number) => Math.round(w * 0.07);
export const cardFrame = (w: number) => ({ W: w + cardPad(w) * 2, H: cardH(w) + cardPad(w) * 2 });

export async function renderCardPng(card: Card, width = 720): Promise<Buffer> {
  const [fonts, assets] = await Promise.all([loadCardFonts(), loadCardAssets(card)]);
  const sharp = (await import("sharp")).default;
  const w = width;
  const H = cardH(w);
  const livery = card.constructor.color;
  const founder = card.finish === "founder";

  // 1. the baked metal plate, resized to the card box (its alpha = the crest)
  const metalPath = join(process.cwd(), "public", "cards", "f1-gold.webp");
  const metalPng = await sharp(await readFile(metalPath)).resize(w, H, { fit: "fill" }).png().toBuffer();
  let plate = metalPng;

  // 2. anodise to the team livery — tint preserves the metal's luminosity (the
  //    brushed grain stays), shifting only the hue, like the DOM's colour blend.
  if (!founder) {
    plate = await sharp(metalPng).tint(livery).png().toBuffer();
  }

  // 3. feather the portrait and seat it into the plate
  if (assets.avatar) {
    const aw = Math.round(w * 0.68);
    const ah = Math.round(H * 0.5);
    const avatarBuf = Buffer.from(assets.avatar.split(",")[1], "base64");
    const crop = await sharp(avatarBuf).resize(aw, ah, { fit: "cover", position: "top" }).png().toBuffer();
    const radial = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${aw}" height="${ah}"><defs><radialGradient id="g" cx="50%" cy="40%" r="58%"><stop offset="46%" stop-color="#fff" stop-opacity="1"/><stop offset="80%" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
    );
    const topFade = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${aw}" height="${ah}"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fff" stop-opacity="0"/><stop offset="20%" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#t)"/></svg>`,
    );
    const botFade = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${aw}" height="${ah}"><defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="70%" stop-color="#fff" stop-opacity="1"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#b)"/></svg>`,
    );
    let f = await sharp(crop).composite([{ input: radial, blend: "dest-in" }]).png().toBuffer();
    f = await sharp(f).composite([{ input: topFade, blend: "dest-in" }]).png().toBuffer();
    const feathered = await sharp(f).composite([{ input: botFade, blend: "dest-in" }]).png().toBuffer();
    plate = await sharp(plate).composite([{ input: feathered, left: Math.round(w * 0.26), top: Math.round(H * 0.065) }]).png().toBuffer();
  }

  // 4. re-cut the crest silhouette so neither the tint nor the portrait spills past it
  plate = await sharp(plate).composite([{ input: metalPng, blend: "dest-in" }]).png().toBuffer();

  // 5. the engraved type layer
  const textPng = Buffer.from(await new ImageResponse(textTree(card, assets, w), { width: w, height: H, fonts }).arrayBuffer());

  // 6. frame the crest on a dark ground for the unfurl
  const pad = Math.round(w * 0.07);
  const W = w + pad * 2;
  const Hc = H + pad * 2;
  let out = await sharp({ create: { width: W, height: Hc, channels: 4, background: "#0d0e12" } })
    .composite([
      { input: plate, left: pad, top: pad },
      { input: textPng, left: pad, top: pad },
    ])
    .png()
    .toBuffer();
  const cut = Math.round(W * 0.03);
  const round = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Hc}"><rect width="${W}" height="${Hc}" rx="${cut}" ry="${cut}" fill="#fff"/></svg>`);
  out = await sharp(out).composite([{ input: round, blend: "dest-in" }]).png().toBuffer();

  return out;
}

export async function renderCardImage(card: Card, width = 720): Promise<Response> {
  const out = await renderCardPng(card, width);
  return new Response(new Uint8Array(out), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
  });
}

export async function renderFallbackImage(username: string): Promise<Response> {
  const fonts = await loadCardFonts();
  const W = 720;
  const H = cardH(W);
  const image = new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, #16191f 0%, #08090b 58%, #101318 100%)", color: "#f2f3f0", fontFamily: "Titillium" }}>
        <div style={{ display: "flex", gap: 12 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ width: 26, height: 26, borderRadius: 999, background: "radial-gradient(circle at 35% 30%, #ff5a4d, #8c0a00 70%)", display: "flex" }} />
          ))}
        </div>
        <div style={{ display: "flex", marginTop: 40, fontWeight: 900, fontSize: 76, letterSpacing: 6 }}>GITONE</div>
        <div style={{ display: "flex", marginTop: 14, fontFamily: "JBMono", fontSize: 30, color: "#a2a7ae" }}>@{username}</div>
        <div style={{ display: "flex", marginTop: 18, fontFamily: "JBMono", fontSize: 22, color: "#6a7079" }}>scout this driver at the grid</div>
      </div>
    ),
    { width: W, height: H, fonts },
  );
  const png = await image.arrayBuffer();
  return new Response(png, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300" } });
}

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { GOAT_LOGIN, GOAT_LOGINS, STATS, STAT_LABELS } from "@/lib/racing/constants";
import {
  FEATHER,
  cssBox,
  fadeBottomSvg,
  fadeTopSvg,
  featherSvg,
  portraitForCard,
} from "@/lib/racing/portrait";
import { flagUrl } from "@/lib/flagUrl";
import type { Card, Finish } from "@/lib/racing/types";
import { isWorkersRuntime, loadCardFonts, publicAssetDataUri } from "./card";
import { loadCardAssets } from "./renderCard";

// Satori twin of components/DriverCard26.tsx — the struck-metal F1 crest.
// Two render paths: on Node, sharp composites the baked metal PNG (anodised to
// the livery via libvips tint, the same hue-shift the DOM does with
// mix-blend-mode), feathers the portrait through radial alpha masks and seats
// it into the plate, then Satori draws the engraved DIN-style type (Barlow
// Condensed) over the top. On Cloudflare Workers — no libvips, no fs — a
// Satori-only pass layers the fetched per-tier plate PNG + fetched portrait +
// type instead. The crest's own alpha defines the silhouette; a dark ground
// frames it for the social unfurl.

const INK = "#33290f";
const ASPECT = 820 / 540;
export const cardH = (w: number) => Math.round(w * ASPECT);


// Livery colours like C's pale blue-grey read as white when used as a low-alpha
// glow. Boost saturation before painting so every livery halo has its own hue.
function glowHue(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let hue = 0;
  if (d) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  const sat = Math.min(1, Math.max(0.55, (max ? d / max : 0) * 1.9));
  const light = 0.55;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;
  const [rr, gg, bb] = hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x] : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x];
  return "#" + [rr, gg, bb].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("");
}

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
// `ink` is the plate's own engraving ink (per-tier on the Satori/Workers path).
function textTree(card: Card, assets: Awaited<ReturnType<typeof loadCardAssets>>, w: number, ink: string = INK) {
  const H = cardH(w);
  const cqw = (n: number) => Math.round((n / 100) * w);
  const { first, last } = nameParts(card.name);
  const nameSize = last.length > 11 ? 8.0 : last.length > 8 ? 9.8 : 11.0;
  const label = hexAlpha(ink, 0.68);
  const flag = assets.flag ?? flagUrl(card.country, 80);
  const founder = card.finish === "founder" || !!card.founder;
  const login = card.login.toLowerCase();
  const goat = !founder && (GOAT_LOGINS.includes(login) || login === GOAT_LOGIN || (card.number === 1 && card.rtg >= 97));
  const chip = goat ? "THE GOAT" : card.finishLabel;

  return (
    <div style={{ width: w, height: H, display: "flex", position: "relative", color: ink }}>
      {/* rating */}
      <div style={{ position: "absolute", left: "14%", top: "9.5%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(3.1), fontWeight: 700, letterSpacing: cqw(0.8), color: label }}>RTG</div>
        <div style={{ display: "flex", marginTop: cqw(0.5), fontFamily: "DINPro", fontWeight: 500, fontSize: cqw(19), lineHeight: 0.95, color: ink }}>{card.rtg}</div>
      </div>
      {/* number */}
      <div style={{ position: "absolute", left: "14%", top: "27%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(2.8), fontWeight: 700, letterSpacing: cqw(0.66), color: label }}>NO.</div>
        <div style={{ display: "flex", marginTop: cqw(0.3), fontFamily: "DINPro", fontWeight: 700, fontSize: cqw(8), lineHeight: 1, color: ink }}>{String(card.number).padStart(2, "0")}</div>
      </div>
      {/* flag */}
      {flag && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={flag} alt="" width={Math.round(cqw(4.4) * 1.5)} height={cqw(4.4)} style={{ position: "absolute", left: "14%", top: "37.5%", objectFit: "contain" }} />
      )}
      {/* finish chip */}
      <div style={{ position: "absolute", left: "14%", top: "44.5%", display: "flex", padding: `${cqw(0.5)}px ${cqw(1.1)}px`, border: `1px solid ${hexAlpha(ink, 0.4)}` }}>
        <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(2.7), fontWeight: 800, letterSpacing: cqw(0.32), color: ink }}>{chip}</div>
      </div>
      {/* name */}
      <div style={{ position: "absolute", left: "10%", width: "80%", top: "58%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {first && (
          <div style={{ display: "flex", fontFamily: "DINPro", fontWeight: 700, fontSize: cqw(Math.max(2.8, nameSize * 0.4)), lineHeight: 1, letterSpacing: cqw(0.16), color: label, marginBottom: cqw(0.6) }}>{first}</div>
        )}
        <div style={{ display: "flex", fontFamily: "DINPro", fontWeight: 700, fontSize: cqw(nameSize), lineHeight: 1, color: ink }}>{last}</div>
        <div style={{ display: "flex", alignItems: "center", gap: cqw(1.2), marginTop: cqw(1) }}>
          <div style={{ display: "flex", width: cqw(3), height: cqw(0.5), background: hexAlpha(ink, 0.55) }} />
          <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(3), fontWeight: 700, letterSpacing: cqw(0.42), color: label }}>{card.constructor.name.toUpperCase()}</div>
          <div style={{ display: "flex", width: cqw(3), height: cqw(0.5), background: hexAlpha(ink, 0.55) }} />
        </div>
      </div>
      {/* stat rail — six stats, 3×2: [pac,rac,awa] over [exp,tyr,wet] */}
      <div style={{ position: "absolute", left: "16%", width: "68%", top: "72.5%", height: "11.5%", display: "flex", flexDirection: "column" }}>
        {[STATS.slice(0, 3), STATS.slice(3)].map((row, r) => (
          <div key={row[0]} style={{ display: "flex", flex: 1, borderTop: r === 0 ? "none" : `1px solid ${hexAlpha(ink, 0.28)}` }}>
            {row.map((k, i) => (
              <div key={k} style={{ display: "flex", flex: 1, minWidth: 0, flexDirection: "column", alignItems: "center", justifyContent: "center", borderLeft: i === 0 ? "none" : `1px solid ${hexAlpha(ink, 0.28)}` }}>
                <div style={{ display: "flex", fontFamily: "JBMono", fontSize: cqw(2.9), fontWeight: 700, letterSpacing: cqw(0.2), lineHeight: 0.95, color: label, whiteSpace: "nowrap" }}>{STAT_LABELS[k]}</div>
                <div style={{ display: "flex", fontFamily: "DINPro", fontWeight: 700, fontSize: cqw(6.6), lineHeight: 0.9, color: ink }}>{card.stats[k]}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      {founder && (
        <div style={{ position: "absolute", left: 0, right: 0, top: "84.5%", display: "flex", justifyContent: "center", fontFamily: "JBMono", fontSize: cqw(1.9), fontWeight: 700, letterSpacing: cqw(0.26), color: hexAlpha(ink, 0.7) }}>№ 001/001 · EST. 26</div>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: founder ? "87.5%" : "86.5%", display: "flex", justifyContent: "center", fontFamily: "JBMono", fontSize: cqw(2.1), fontWeight: 700, letterSpacing: cqw(0.34), color: hexAlpha(ink, 0.6) }}>GITONE · @{card.login}</div>
    </div>
  );
}

export const cardPad = (w: number) => Math.round(w * 0.07);
export const cardFrame = (w: number) => ({ W: w + cardPad(w) * 2, H: cardH(w) + cardPad(w) * 2 });

// The pre-struck per-tier plates from public/cards — the same map the DOM card
// (components/DriverCard26.tsx) uses, so the Workers unfurl wears the right
// metal and ink without any sharp tinting.
const TIER_PLATES: Record<Finish, { bg: string; ink: string }> = {
  rookie: { bg: "/cards/carbon.webp", ink: "#e8eaef" },
  points: { bg: "/cards/steel.webp", ink: "#2a2d33" },
  podium: { bg: "/cards/bronze.webp", ink: "#3a2413" },
  winner: { bg: "/cards/gold.webp", ink: "#46390c" },
  in_form: { bg: "/cards/sector.webp", ink: "#ecd9ff" },
  champion: { bg: "/cards/iridescent.webp", ink: "#3a2f10" },
  founder: { bg: "/cards/f1-gold.webp", ink: INK },
};

export function pickPlate(card: Card): { bg: string; ink: string } {
  if (card.finish === "founder" || card.founder) return TIER_PLATES.founder;
  const login = card.login.toLowerCase();
  const goat = GOAT_LOGINS.includes(login) || login === GOAT_LOGIN || (card.number === 1 && card.rtg >= 97);
  if (goat) return { bg: "/cards/platinum.webp", ink: "#1a1d22" };
  return TIER_PLATES[card.finish] ?? TIER_PLATES.podium;
}

// Workers-safe twin of the sharp composite: one Satori pass layers the fetched
// plate PNG, the fetched portrait (softened with a radial vignette — Satori has
// no masks or blend-modes, so the livery anodising is skipped in favour of the
// pre-tinted tier plate) and the engraved type. No sharp, no fs.
async function renderCardPngSatori(card: Card, width: number): Promise<Buffer> {
  const plate = pickPlate(card);
  const pbox = portraitForCard(card);
  // width-appropriate plates: a cold composite must fit the Workers CPU
  // budget, and rasterising an 820px PNG for a 340px card is what pushed the
  // double-pass user OG over it (deterministic CF 1102s). Small renders load
  // the 420px twins; the full-size embed keeps the 820px set.
  const platePath =
    width <= 500
      ? plate.bg.replace(/^\/cards\//, "cards/og400/").replace(/\.webp$/, ".png")
      : plate.bg.replace(/^\/cards\//, "cards/og/").replace(/\.webp$/, ".png");
  const [fonts, assets, plateSrc] = await Promise.all([
    loadCardFonts(),
    loadCardAssets(card),
    // satori/resvg cannot decode webp — the tier plates ship as PNG twins in
    // /cards/og{,400}/ (palette-quantised) for every Satori composite; the
    // DOM <img> and the sharp twin keep the small webp originals.
    publicAssetDataUri(platePath),
  ]);
  const w = width;
  const H = cardH(w);
  const pad = cardPad(w);
  const W = w + pad * 2;
  const Hc = H + pad * 2;

  const image = new ImageResponse(
    (
      <div style={{ width: W, height: Hc, display: "flex", position: "relative" }}>
        {/* transparent frame — the card is a CUTOUT: the plate silhouette
            carries its own alpha, and wherever it's composited (README, OG
            canvas, versus poster) that surface shows through. No baked
            ground rectangle. */}
        <div style={{ position: "absolute", left: pad, top: pad, width: w, height: H, display: "flex" }}>
          {plateSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={plateSrc} alt="" width={w} height={H} style={{ position: "absolute", left: 0, top: 0, width: w, height: H, objectFit: "fill" }} />
          )}
          {assets.avatar && (
            /* the rim light behind the portrait — keeps dark silhouettes (black
               hair, night shots) from dissolving into dark plates. Satori has
               no z-index: document order is paint order, and this div precedes
               the portrait layer below. */
            <div
              style={{
                position: "absolute",
                left: `${pbox.left - 4}%`,
                top: `${pbox.top - 3}%`,
                width: `${pbox.width + 8}%`,
                height: `${pbox.height + 6}%`,
                backgroundImage: "radial-gradient(ellipse 50% 60% at 52% 42%, rgba(255,240,204,0.15), transparent 72%)",
              }}
            />
          )}
          {assets.avatar && (
            <div style={{ position: "absolute", ...cssBox(pbox), display: "flex" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assets.avatar}
                alt=""
                width={Math.round((pbox.width / 100) * w)}
                height={Math.round((pbox.height / 100) * H)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center 22%",
                  // Feather the portrait into the plate with a radial alpha mask
                  // (Satori supports mask-image) instead of a dark vignette, so
                  // the pfp reads as seated in the metal, not a pasted rectangle.
                  // The gradient reaches zero INSIDE the aperture on all four
                  // edges — no photo halo can reach the frame.
                  WebkitMaskImage: FEATHER,
                  maskImage: FEATHER,
                }}
              />
            </div>
          )}
          {textTree(card, assets, w, plate.ink)}
        </div>
      </div>
    ),
    { width: W, height: Hc, fonts },
  );
  return Buffer.from(await image.arrayBuffer());
}

export async function renderCardPng(card: Card, width = 720): Promise<Buffer> {
  // Node (next dev/start, VPS): the full sharp composite — livery anodising,
  // feathered portrait, crest re-cut. Workers has no libvips and no fs, so it
  // takes the Satori-only twin. OG_FORCE_SATORI=1 forces the Workers path on
  // Node for verification. A sharp failure also degrades to Satori, never 500.
  if (!isWorkersRuntime() && process.env.OG_FORCE_SATORI !== "1") {
    try {
      return await renderCardPngSharp(card, width);
    } catch (e) {
      console.error("[og] sharp card render failed — falling back to Satori:", e);
    }
  }
  return renderCardPngSatori(card, width);
}

async function renderCardPngSharp(card: Card, width: number): Promise<Buffer> {
  const [fonts, assets] = await Promise.all([loadCardFonts(), loadCardAssets(card)]);
  const sharp = (await import("sharp")).default;
  const w = width;
  const H = cardH(w);
  const livery = card.constructor.color;
  const pbox = portraitForCard(card);

  // 1. the baked plate for THIS tier, resized to the card box (its alpha =
  //    the crest). The old sharp path used one gold plate and tinted it, so
  //    every finish shared the same plain blue/gold metal; the DOM and the
  //    Workers twin both wear the real plate art.
  const tierPlate = pickPlate(card).bg.replace(/^\/cards\//, "");
  const metalPath = join(process.cwd(), "public", "cards", tierPlate);
  const metalPng = await sharp(await readFile(metalPath)).resize(w, H, { fit: "fill" }).png().toBuffer();
  let plate = metalPng;

  // 2. the tier plate already carries its own metal and ink — no livery tint.

  // 3. feather the portrait and seat it into the plate
  if (assets.avatar) {
    const aw = Math.round((pbox.width / 100) * w);
    const ah = Math.round((pbox.height / 100) * H);
    const avatarBuf = Buffer.from(assets.avatar.split(",")[1], "base64");
    // brightness lift matches the DOM's filter (1.09) so the Node PNG and the
    // in-app card agree on treatment.
    const crop = await sharp(avatarBuf).modulate({ brightness: 1.09 }).resize(aw, ah, { fit: "cover", position: "top" }).png().toBuffer();
    // the rim light: warm backlight composited onto the plate BEFORE the
    // portrait (paint order), keeping dark silhouettes off dark plates.
    const gw = Math.round(((pbox.width + 8) / 100) * w);
    const gh = Math.round(((pbox.height + 6) / 100) * H);
    const glow = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${gw}" height="${gh}"><defs><radialGradient id="r" cx="52%" cy="46%" rx="50%" ry="60%"><stop offset="0%" stop-color="rgb(255,240,204)" stop-opacity="0.15"/><stop offset="72%" stop-color="rgb(255,240,204)" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#r)"/></svg>`,
    );
    plate = await sharp(plate)
      .composite([{ input: glow, left: Math.round(((pbox.left - 4) / 100) * w), top: Math.round(((pbox.top - 3) / 100) * H) }])
      .png()
      .toBuffer();
    const radial = Buffer.from(featherSvg(aw, ah));
    const topFade = Buffer.from(fadeTopSvg(aw, ah));
    const botFade = Buffer.from(fadeBottomSvg(aw, ah));
    let f = await sharp(crop).composite([{ input: radial, blend: "dest-in" }]).png().toBuffer();
    f = await sharp(f).composite([{ input: topFade, blend: "dest-in" }]).png().toBuffer();
    const feathered = await sharp(f).composite([{ input: botFade, blend: "dest-in" }]).png().toBuffer();
    plate = await sharp(plate)
      .composite([{ input: feathered, left: Math.round((pbox.left / 100) * w), top: Math.round((pbox.top / 100) * H) }])
      .png()
      .toBuffer();
  }

  // 4. re-cut the crest silhouette so neither the tint nor the portrait spills past it
  plate = await sharp(plate).composite([{ input: metalPng, blend: "dest-in" }]).png().toBuffer();

  // 5. the engraved type layer
  const textPng = Buffer.from(await new ImageResponse(textTree(card, assets, w), { width: w, height: H, fonts }).arrayBuffer());

  // 6. frame the crest on a TRANSPARENT ground — the card is a cutout: the
  //    plate silhouette carries its own alpha, so the README/OG/poster
  //    surface shows through everywhere the card isn't.
  const pad = Math.round(w * 0.07);
  const W = w + pad * 2;
  const Hc = H + pad * 2;
  // A restrained livery floodlight around the object — the download reads as
  // a lit card on a dark surface, not a flat cutout. Alpha reaches zero before
  // the frame edge, so the PNG keeps its clean transparent surround.
  const glow = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Hc}"><defs><radialGradient id="l" cx="50%" cy="46%" r="52%"><stop offset="18%" stop-color="${glowHue(livery)}" stop-opacity="0.55"/><stop offset="100%" stop-color="${livery}" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#l)"/></svg>`,
  );
  const out = await sharp({ create: { width: W, height: Hc, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: glow, blend: "over" },
      { input: plate, left: pad, top: pad },
      { input: textPng, left: pad, top: pad },
    ])
    .png()
    .toBuffer();

  return out;
}

export async function renderCardImage(card: Card, width = 720): Promise<Response> {
  const out = await renderCardPng(card, width);
  return new Response(new Uint8Array(out), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
  });
}



// Direct Canvas 2D composition of the versus poster. No html-to-image, no
// SVG foreignObject, no hidden DOM stage: two already-warmed card PNGs are
// drawn into one 1200×630 frame with the broadcast furniture and sector table.
// The warm and the download therefore share one code path and finish in
// ~1s instead of ~50s.

import type { DuelRow, DuelSide } from "@/lib/duel";

export interface VersusStageDuel {
  rows: DuelRow[];
  score: Record<DuelSide, number>;
  aColor: string;
  bColor: string;
  subtitle: string;
}

const W = 1200;
const H = 630;
const CARD_W = 270;
const CARD_H = 410;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  font: string,
  color: string,
  align: CanvasTextAlign = "left",
) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(value, x, y);
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, "#181820");
  base.addColorStop(0.72, "#101014");
  base.addColorStop(1, "#0b0b0e");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  const red = ctx.createRadialGradient(190, -80, 10, 190, -80, 620);
  red.addColorStop(0, "rgba(193,18,31,.30)");
  red.addColorStop(1, "rgba(193,18,31,0)");
  ctx.fillStyle = red;
  ctx.fillRect(0, 0, W, H);

  const copper = ctx.createRadialGradient(1100, 700, 10, 1100, 700, 560);
  copper.addColorStop(0, "rgba(214,133,74,.20)");
  copper.addColorStop(1, "rgba(214,133,74,0)");
  ctx.fillStyle = copper;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(240,232,216,.055)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 30) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
  }
  for (let y = 0; y <= H; y += 30) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
  }
  ctx.stroke();
}

function drawSectors(ctx: CanvasRenderingContext2D, duel: VersusStageDuel) {
  const left = 330;
  const width = 540;
  const trackW = 175;
  duel.rows.forEach((row, i) => {
    const y = 284 + i * 23;
    const aWon = row.winner === "challenger";
    const bWon = row.winner === "opponent";
    const aInk = row.challenger >= 90 ? "#b46bff" : duel.aColor;
    const bInk = row.opponent >= 90 ? "#b46bff" : duel.bColor;

    if (aWon || bWon) {
      ctx.fillStyle = aWon ? `${duel.aColor}0d` : `${duel.bColor}0d`;
      ctx.fillRect(left, y - 15, width, 23);
    }
    ctx.fillStyle = "rgba(240,232,216,.08)";
    ctx.fillRect(left, y + 7, width, 1);

    text(ctx, `${aWon ? "● " : ""}${row.challenger}`, left + 42, y + 5, "700 11px JBMono, monospace", aInk, "right");
    text(ctx, row.label.toUpperCase(), left + width / 2, y + 5, "700 9px JBMono, monospace", "#9aa39c", "center");
    text(ctx, `${row.opponent}${bWon ? " ●" : ""}`, left + width - 42, y + 5, "700 11px JBMono, monospace", bInk, "left");

    const aTrackX = left + 50;
    const bTrackX = left + width - 50 - trackW;
    ctx.fillStyle = "rgba(240,232,216,.09)";
    ctx.fillRect(aTrackX, y, trackW, 4);
    ctx.fillRect(bTrackX, y, trackW, 4);
    ctx.fillStyle = aInk;
    ctx.globalAlpha = aWon ? 1 : 0.6;
    ctx.fillRect(aTrackX + trackW - (row.challenger / 100) * trackW, y, (row.challenger / 100) * trackW, 4);
    ctx.globalAlpha = bWon ? 1 : 0.6;
    ctx.fillRect(bTrackX, y, (row.opponent / 100) * trackW, 4);
    ctx.globalAlpha = 1;
  });
}

export async function composeVersusPng(
  a: string,
  b: string,
  duel?: VersusStageDuel,
): Promise<Blob | null> {
  if (typeof document === "undefined") return null;
  await document.fonts.ready;
  let aImg: HTMLImageElement;
  let bImg: HTMLImageElement;
  try {
    [aImg, bImg] = await Promise.all([
      loadImage(`/${encodeURIComponent(a)}.png`),
      loadImage(`/${encodeURIComponent(b)}.png`),
    ]);
  } catch (e) {
    console.error("[versus] card image failed:", e);
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  drawBackground(ctx);
  text(ctx, "GITONE / HEAD TO HEAD", 80, 56, "800 15px JBMono, monospace", "#9aa39c");
  text(ctx, duel?.subtitle ?? "RACE AT THE GRID", W / 2, 58, "800 13px JBMono, monospace", "#d6854a", "center");

  ctx.drawImage(aImg, 36, 108, CARD_W, CARD_H);
  ctx.drawImage(bImg, W - 36 - CARD_W, 108, CARD_W, CARD_H);
  text(ctx, `@${a}`, 36 + CARD_W / 2, 540, "800 13px JBMono, monospace", duel?.aColor ?? "#f0e8d8", "center");
  text(ctx, `@${b}`, W - 36 - CARD_W / 2, 540, "800 13px JBMono, monospace", duel?.bColor ?? "#f0e8d8", "center");

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.65)";
  ctx.shadowBlur = 44;
  ctx.shadowOffsetY = 18;
  text(ctx, "VS", W / 2, 285, "italic 900 118px DIN, Arial, sans-serif", "#f0e8d8", "center");
  ctx.restore();

  if (duel) drawSectors(ctx, duel);

  text(ctx, "gitone.langersword.in · season 26", W / 2, 608, "500 12px JBMono, monospace", "#9aa39c", "center");

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

// Both the client warmer and the download call this, so the unfurl and the
// exported file are literally the same frame.
export async function captureVersusPoster(
  a: string,
  b: string,
  duel?: VersusStageDuel,
): Promise<Blob | null> {
  return composeVersusPng(a, b, duel);
}

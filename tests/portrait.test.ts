import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { FEATHER, PORTRAIT, type PortraitWindow, portraitForCard } from "../lib/racing/portrait";
import type { Card } from "../lib/racing/types";

const PLATE: Record<keyof typeof PORTRAIT, string> = {
  rookie: "carbon.webp",
  points: "steel.webp",
  podium: "bronze.webp",
  winner: "gold.webp",
  in_form: "sector.webp",
  champion: "iridescent.webp",
  founder: "f1-gold.webp",
  goat: "platinum.webp",
};

const W = 540;
const H = 820;
const CLEARANCE = 0.03; // 3% of the card's width/height must be solid plate

async function alphaOf(file: string) {
  const buf = await readFile(join(process.cwd(), "public", "cards", file));
  const { data, info } = await sharp(buf).resize(W, H, { fit: "fill" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const alpha = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) alpha[i] = data[i * ch + 3];
  return alpha;
}

function outsideSamples(alpha: Uint8Array, box: PortraitWindow) {
  const x0 = Math.round((box.left / 100) * W);
  const x1 = Math.round(((box.left + box.width) / 100) * W);
  const y0 = Math.round((box.top / 100) * H);
  const y1 = Math.round(((box.top + box.height) / 100) * H);
  const mx = Math.round(CLEARANCE * W);
  const my = Math.round(CLEARANCE * H);
  let outside = 0;
  for (let y = y0; y <= y1; y += 2) {
    for (const x of [x0 - mx, x1 + mx]) {
      if (alpha[y * W + Math.max(0, Math.min(W - 1, x))] < 200) outside++;
    }
  }
  for (let x = x0; x <= x1; x += 2) {
    for (const y of [y0 - my, y1 + my]) {
      if (alpha[Math.max(0, Math.min(H - 1, y)) * W + x] < 200) outside++;
    }
  }
  return outside;
}

const base = {
  login: "driver",
  name: "Test Driver",
  finish: "podium" as const,
  number: 44,
  rtg: 80,
  founder: undefined,
} as unknown as Card;

describe("portrait aperture stays inside every plate", () => {
  for (const [key, file] of Object.entries(PLATE) as [keyof typeof PORTRAIT, string][]) {
    it(`${key}: ${file} has >=3% clearance around the portrait box`, async () => {
      expect(outsideSamples(await alphaOf(file), PORTRAIT[key])).toBe(0);
    });
  }

  it("the old one-size window did spill (guards against silent regression)", async () => {
    const old = { left: 26, top: 6.5, width: 68, height: 50 };
    expect(outsideSamples(await alphaOf("gold.webp"), old)).toBeGreaterThan(0);
    expect(outsideSamples(await alphaOf("iridescent.webp"), old)).toBeGreaterThan(0);
  });

  it("the feather reaches zero before every aperture edge", () => {
    // CSS radial-gradient(ellipse Rx% Ry% at Cx% Cy%, #000 S%, transparent 100%)
    const m = FEATHER.match(/ellipse (\d+)% (\d+)% at (\d+)% (\d+)%/);
    expect(m).not.toBeNull();
    const [rx, ry, cx, cy] = m!.slice(1).map(Number);
    expect(cx - rx).toBeGreaterThanOrEqual(0);
    expect(cx + rx).toBeLessThanOrEqual(100);
    expect(cy - ry).toBeGreaterThanOrEqual(0);
    expect(cy + ry).toBeLessThanOrEqual(100);
    expect(FEATHER).toContain("transparent 100%");
  });

  it("resolves the same aperture as the painted plate for founder and GOAT", () => {
    expect(portraitForCard({ ...base, finish: "founder" })).toBe(PORTRAIT.founder);
    expect(portraitForCard({ ...base, login: "torvalds" })).toBe(PORTRAIT.goat);
    expect(portraitForCard(base)).toBe(PORTRAIT.podium);
  });
});

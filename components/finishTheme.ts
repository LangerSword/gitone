import type { Card, Finish } from "@/lib/racing/types";

// hex (#rgb / #rrggbb) → rgba() string, so a single accent hex can drive
// translucent glows/tints without hand-writing each alpha variant.
export function rgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// Each finish maps to a trim treatment for the carbon card: the accent colour
// of its lines/chips, the ink that reads over it, and a glow for the card's
// drop-shadow. in_form rides the purple sector (F1 timing's fastest colour);
// champion wears the gold of the world championship trophy.
export interface CardTheme {
  accent: string; // trim lines, chips, bar track
  ink: string; // trim text
  glow: string; // card drop-shadow
  bar: string; // stat-bar fill for values under 90
  hot: string; // stat-bar fill for 90+ (the purple sector)
}

export const CARD_THEME: Record<Finish, CardTheme> = {
  rookie: { accent: "#8e9099", ink: "#c9ccd4", glow: "rgba(120,124,134,.28)", bar: "#a9adb8", hot: "#b455ff" },
  points: { accent: "#c9ccd4", ink: "#f5f6fa", glow: "rgba(190,196,210,.34)", bar: "#dfe3ec", hot: "#b455ff" },
  podium: { accent: "#e6c35c", ink: "#f7e8bd", glow: "rgba(225,185,80,.42)", bar: "#f3d679", hot: "#b455ff" },
  winner: { accent: "#f0a52c", ink: "#ffe9c2", glow: "rgba(240,165,44,.5)", bar: "#ffc85c", hot: "#b455ff" },
  in_form: { accent: "#b455ff", ink: "#ecd9ff", glow: "rgba(180,85,255,.5)", bar: "#b455ff", hot: "#d08cff" },
  champion: { accent: "#f5d67b", ink: "#fff3cf", glow: "rgba(245,214,123,.55)", bar: "#f5d67b", hot: "#ffe9a3" },
  founder: { accent: "#e10600", ink: "#ffd6d3", glow: "rgba(225,6,0,.5)", bar: "#ff5a52", hot: "#b455ff" },
};

// Per-card theme: identical for everyone except founders, whose accent is
// their own.
export function resolveCardTheme(card: Card): CardTheme {
  const base = CARD_THEME[card.finish];
  if (!card.founder) return base;
  const a = card.founder.accent;
  return { ...base, accent: a, ink: "#ffd6d3", glow: rgba(a, 0.5) };
}

// Sector colour for a stat value: purple at 90+, green at a personal
// improvement — here: 90+ is purple (fastest sector), the rest wear the
// finish's own bar colour.
export function statColor(value: number, theme: CardTheme): string {
  return value >= 90 ? theme.hot : theme.bar;
}

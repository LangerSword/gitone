import type { Card, Finish } from "@/lib/racing/types";

// hex (#rgb / #rrggbb) → rgba() string, so a single accent hex can drive
// translucent glows/tints without hand-writing each alpha variant.
export function rgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// Each finish is a material, not a colour: the foil the frame is cut from,
// the trim that reads over it, the glow the card sheds, and the palette the
// champagne confetti bursts in. in_form rides the purple sector; champion
// wears the world-championship gold; founder wears F1's own red.
export interface CardTheme {
  foil: string; // metallic frame gradient (the card's border material)
  foilEdge: string; // 1px edge highlight on the frame
  accent: string; // trim lines, chips, RTG glow
  ink: string; // trim text
  glow: string; // card drop-shadow / halo
  bar: string; // stat-bar fill 70–89
  hot: string; // stat-bar fill at 90+ (the purple sector)
  confetti: string[]; // the champagne burst on reveal
}

const SILVER_FOIL =
  "linear-gradient(135deg,#f4f6fa 0%,#b9c0cc 18%,#e8ecf2 32%,#8d95a3 50%,#dfe4ec 68%,#98a1b0 85%,#c7cedb 100%)";
const GOLD_FOIL =
  "linear-gradient(135deg,#f9e9b8 0%,#c9a13b 18%,#f5df9a 34%,#9c781f 52%,#f3d679 70%,#a8811e 88%,#e8c96a 100%)";
const ROSE_FOIL =
  "linear-gradient(135deg,#ffe2c4 0%,#d98a4a 20%,#ffcf9e 38%,#b06428 55%,#f2b57e 72%,#c47a3a 90%,#ffd9ad 100%)";
const PURPLE_FOIL =
  "linear-gradient(135deg,#ecd3ff 0%,#8b3fd4 20%,#d9a8ff 38%,#6a2aa8 55%,#c98cff 72%,#7c33c2 90%,#e5c2ff 100%)";
const IRIDESCENT_FOIL =
  "linear-gradient(135deg,#f7e8b5 0%,#e6b4e0 16%,#f3d67b 33%,#9fd8c9 50%,#f5d67b 66%,#d8a8f0 84%,#ffe9a3 100%)";
const RED_FOIL =
  "linear-gradient(135deg,#ffb3ad 0%,#c11a12 22%,#ff8a80 40%,#8f0c06 58%,#f5493f 76%,#b3140c 94%,#ff9d95 100%)";
const CARBON_FOIL =
  "linear-gradient(135deg,#3a3d45 0%,#14151a 22%,#2c2f36 42%,#0e0f13 62%,#33363d 82%,#17181d 100%)";

export const CARD_THEME: Record<Finish, CardTheme> = {
  rookie: {
    foil: CARBON_FOIL, foilEdge: "rgba(255,255,255,0.25)",
    accent: "#9aa0ab", ink: "#d4d8e0", glow: "rgba(90,94,104,0.35)",
    bar: "#aeb4bf", hot: "#b455ff",
    confetti: ["#9aa0ab", "#d4d8e0", "#5b5f68"],
  },
  points: {
    foil: SILVER_FOIL, foilEdge: "rgba(255,255,255,0.65)",
    accent: "#dfe4ec", ink: "#f6f8fb", glow: "rgba(190,196,210,0.4)",
    bar: "#dfe4ec", hot: "#b455ff",
    confetti: ["#dfe4ec", "#b9c0cc", "#ffffff", "#8e9099"],
  },
  podium: {
    foil: GOLD_FOIL, foilEdge: "rgba(255,246,214,0.75)",
    accent: "#f3d679", ink: "#f9ecbf", glow: "rgba(225,185,80,0.45)",
    bar: "#f3d679", hot: "#b455ff",
    confetti: ["#f3d679", "#c9a13f", "#ffffff", "#f9e9b8"],
  },
  winner: {
    foil: ROSE_FOIL, foilEdge: "rgba(255,236,214,0.75)",
    accent: "#f0a52c", ink: "#ffe9c2", glow: "rgba(240,165,44,0.5)",
    bar: "#ffc85c", hot: "#b455ff",
    confetti: ["#ffc85c", "#f0a52c", "#ffffff", "#ffcf9e"],
  },
  in_form: {
    foil: PURPLE_FOIL, foilEdge: "rgba(240,220,255,0.7)",
    accent: "#b455ff", ink: "#ecd9ff", glow: "rgba(180,85,255,0.55)",
    bar: "#b455ff", hot: "#d08cff",
    confetti: ["#b455ff", "#d08cff", "#ffffff", "#ecd9ff"],
  },
  champion: {
    foil: IRIDESCENT_FOIL, foilEdge: "rgba(255,250,230,0.85)",
    accent: "#f5d67b", ink: "#fff3cf", glow: "rgba(245,214,123,0.6)",
    bar: "#f5d67b", hot: "#ffe9a3",
    confetti: ["#f5d67b", "#f9e9b8", "#ffffff", "#e6b4e0", "#9fd8c9"],
  },
  founder: {
    foil: RED_FOIL, foilEdge: "rgba(255,205,200,0.75)",
    accent: "#e10600", ink: "#ffd6d3", glow: "rgba(225,6,0,0.55)",
    bar: "#ff5a52", hot: "#b455ff",
    confetti: ["#e10600", "#ff5a52", "#ffffff", "#ffd6d3"],
  },
};

export function resolveCardTheme(card: Card): CardTheme {
  const base = CARD_THEME[card.finish];
  if (!card.founder) return base;
  // Founders keep their bespoke accent driving trim and glow; the frame
  // stays the founder foil.
  return { ...base, accent: card.founder.accent, glow: rgba(card.founder.accent, 0.55) };
}

// Sector colour for a stat value — the timing screen's own bands: 90+ rides
// the purple sector, 80+ wears the finish's material full-strength, 70+ at
// three quarters, below that at half.
export function statColor(value: number, theme: CardTheme): string {
  if (value >= 90) return theme.hot;
  if (value >= 80) return theme.bar;
  if (value >= 70) return rgba(theme.bar, 0.75);
  return rgba(theme.bar, 0.5);
}

// Champagne palette per finish — champion pops gold + iridescent, founder
// bursts in their own accent.
export function confettiPalette(card: Card, theme: CardTheme): string[] {
  if (card.founder) return [card.founder.accent, "#ffffff", "#ffd6d3"];
  return theme.confetti;
}

// The art stack behind the card surface: livery bokeh, speed streaks, grain,
// vignette — with a finish-specific flourish layered on top (champion gold
// flecks, in_form's denser purple wash, the founder's deep red). Shared by
// the DOM card and (as flat gradients) the Satori embed.
export function artLayers(livery: string, finish?: string): string[] {
  const base = [
    `radial-gradient(58% 75% at 18% 12%, ${rgba(livery, 0.34)}, transparent 60%)`,
    `radial-gradient(42% 55% at 78% 85%, ${rgba(livery, 0.22)}, transparent 65%)`,
    `radial-gradient(30% 40% at 62% 18%, rgba(255,255,255,0.05), transparent 60%)`,
    "repeating-linear-gradient(115deg, rgba(255,255,255,0.028) 0 2px, transparent 2px 11px)",
    "repeating-linear-gradient(65deg, rgba(0,0,0,0.16) 0 1px, transparent 1px 7px)",
    "linear-gradient(180deg, transparent 55%, rgba(5,5,8,0.55) 100%)",
  ];
  if (finish === "champion")
    return [
      "radial-gradient(24% 30% at 45% 40%, rgba(245,214,123,0.2), transparent 70%)",
      `radial-gradient(58% 75% at 18% 12%, ${rgba(livery, 0.34)}, transparent 60%)`,
      "repeating-linear-gradient(72deg, rgba(245,214,123,0.05) 0 3px, transparent 3px 14px)",
      ...base.slice(1),
    ];
  if (finish === "in_form")
    return [
      "radial-gradient(70% 55% at 70% 20%, rgba(180,85,255,0.26), transparent 65%)",
      ...base.slice(1),
    ];
  if (finish === "founder")
    return [
      "radial-gradient(75% 60% at 30% 78%, rgba(225,6,0,0.24), transparent 62%)",
      ...base.slice(1),
    ];
  return base;
}

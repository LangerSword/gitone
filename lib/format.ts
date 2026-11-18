// Compact number formatting for display (1240 → "1.2k", 248723 → "249k").
const compact = (n: number, unit: number, suffix: string): string => {
  const scaled = n / unit;
  return scaled.toFixed(scaled >= 10 ? 0 : 1).replace(/\.0$/, "") + suffix;
};

export const formatCount = (n: number): string => {
  if (n >= 1_000_000) return compact(n, 1_000_000, "M");
  if (n >= 1000) {
    const thousands = compact(n, 1000, "k");
    return thousands === "1000k" ? compact(n, 1_000_000, "M") : thousands;
  }
  return String(Math.round(n));
};

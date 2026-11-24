// flagcdn.com URL for a lowercase flag code, or null. The UK home nations fly
// their own flags (gb-eng etc.); flagcdn serves all four as gb-* subtags.
const HOME_NATION = new Set(["gb-eng", "gb-sct", "gb-wls", "gb-nir"]);

export function flagUrl(code: string | null | undefined, width = 80): string | null {
  if (!code) return null;
  const c = code.toLowerCase();
  if (!/^[a-z]{2}(-[a-z]{3})?$/.test(c)) return null;
  if (!HOME_NATION.has(c) && c.includes("-")) return null;
  const path = `/api/flag/w${width}/${c}.png`;
  // Browser captures need a same-origin relative path (no CORS). Satori/sharp
  // running on the server needs an absolute URL.
  if (typeof window !== "undefined") return path;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gitone.langersword.in";
  return new URL(path, base).toString();
}

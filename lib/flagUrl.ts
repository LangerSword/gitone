// flagcdn.com URL for a lowercase flag code, or null. The UK home nations fly
// their own flags (gb-eng etc.); flagcdn serves all four as gb-* subtags.
const HOME_NATION = new Set(["gb-eng", "gb-sct", "gb-wls", "gb-nir"]);

export function flagUrl(code: string | null | undefined, width = 80): string | null {
  if (!code) return null;
  const c = code.toLowerCase();
  if (!/^[a-z]{2}(-[a-z]{3})?$/.test(c)) return null;
  if (!HOME_NATION.has(c) && c.includes("-")) return null;
  return `/api/flag/w${width}/${c}.png`;
}

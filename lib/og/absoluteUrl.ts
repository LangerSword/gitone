import "server-only";

// Satori/sharp only accepts absolute image URLs; DOM and browser captures
// must keep same-origin relative paths. Convert only at the server renderer.
export function absoluteAssetUrl(url: string): string {
  if (/^(data:|https?:)/.test(url)) return url;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gitone.langersword.in";
  return new URL(url, base).toString();
}

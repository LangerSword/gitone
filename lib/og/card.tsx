import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Loads Barlow Condensed + JetBrains Mono for next/og (Satori) text — the same
// faces the live card uses. The display family is registered under the legacy
// alias "Titillium" so the existing Satori tree references keep resolving; the
// glyphs are Barlow Condensed, matching the DOM card's --font-display.
export async function loadCardFonts() {
  const f = (name: string) => readFile(join(process.cwd(), "app", "fonts", name));
  const [bc600, bc700, bc800, bc600i, mono400, mono700, mono800] = await Promise.all([
    f("BarlowCondensed-SemiBold.ttf"),
    f("BarlowCondensed-Bold.ttf"),
    f("BarlowCondensed-ExtraBold.ttf"),
    f("BarlowCondensed-SemiBoldItalic.ttf"),
    f("JetBrainsMono-Regular.ttf"),
    f("JetBrainsMono-Bold.ttf"),
    f("JetBrainsMono-ExtraBold.ttf"),
  ]);
  return [
    { name: "Titillium", data: bc600, weight: 400 as const, style: "normal" as const },
    { name: "Titillium", data: bc600, weight: 600 as const, style: "normal" as const },
    { name: "Titillium", data: bc700, weight: 700 as const, style: "normal" as const },
    { name: "Titillium", data: bc800, weight: 800 as const, style: "normal" as const },
    { name: "Titillium", data: bc800, weight: 900 as const, style: "normal" as const },
    { name: "Titillium", data: bc600i, weight: 400 as const, style: "italic" as const },
    { name: "Titillium", data: bc600i, weight: 600 as const, style: "italic" as const },
    { name: "JBMono", data: mono400, weight: 400 as const, style: "normal" as const },
    { name: "JBMono", data: mono700, weight: 700 as const, style: "normal" as const },
    { name: "JBMono", data: mono800, weight: 800 as const, style: "normal" as const },
  ];
}

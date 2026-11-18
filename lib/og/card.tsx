import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Loads Titillium Web + JetBrains Mono for next/og (Satori) text — the same
// faces the live card uses, registered under the family names the Satori tree
// references ("Titillium", "JBMono").
export async function loadCardFonts() {
  const f = (name: string) => readFile(join(process.cwd(), "app", "fonts", name));
  const [tit400, tit600, tit700, tit900, mono400, mono700, mono800] = await Promise.all([
    f("TitilliumWeb-Regular.ttf"),
    f("TitilliumWeb-SemiBold.ttf"),
    f("TitilliumWeb-Bold.ttf"),
    f("TitilliumWeb-Black.ttf"),
    f("JetBrainsMono-Regular.ttf"),
    f("JetBrainsMono-Bold.ttf"),
    f("JetBrainsMono-ExtraBold.ttf"),
  ]);
  return [
    { name: "Titillium", data: tit400, weight: 400 as const, style: "normal" as const },
    { name: "Titillium", data: tit600, weight: 600 as const, style: "normal" as const },
    { name: "Titillium", data: tit700, weight: 700 as const, style: "normal" as const },
    { name: "Titillium", data: tit900, weight: 900 as const, style: "normal" as const },
    { name: "JBMono", data: mono400, weight: 400 as const, style: "normal" as const },
    { name: "JBMono", data: mono700, weight: 700 as const, style: "normal" as const },
    { name: "JBMono", data: mono800, weight: 800 as const, style: "normal" as const },
  ];
}

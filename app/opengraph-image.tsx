import { ImageResponse } from "next/og";
import { loadCard } from "@/lib/scout";
import { renderCardPng, cardFrame } from "@/lib/og/renderCard26";
import { loadCardFonts } from "@/lib/og/card";
import { cachedPng } from "@/lib/og/pngCache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // scouts a real card at request time; KV-cached after
export const size = { width: 1200, height: 630 };
export const alt = "gitone · your github, rated like f1";
export const contentType = "image/png";

const BG = "#0a0d10";

// Home unfurl: the lights are on. A REAL card sells the product better than
// type alone, so the root og shows the flagship example (torvalds, 98, #1)
// next to the tagline — rendered once, KV-cached, then served forever.
//
// Satori cannot parse the CSS `background` shorthand (gradient + color in one
// property renders transparent/white — that bug shipped the old white root
// unfurl); backgroundColor and backgroundImage must be separate properties.
export default async function OgImage() {
  return cachedPng("og:root:v3", async () => {
    const fonts = await loadCardFonts();
    const cardW = 340;
    const frame = cardFrame(cardW);
    let cardSrc: string | null = null;
    try {
      const res = await loadCard("torvalds");
      if ("card" in res) {
        const cardPng = await renderCardPng(res.card, cardW);
        cardSrc = `data:image/png;base64,${cardPng.toString("base64")}`;
      }
    } catch {
      // no card is fine — the type block carries the unfurl on its own
    }
    const top = Math.round((630 - frame.H) / 2);

    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            display: "flex",
            position: "relative",
            backgroundColor: BG,
            backgroundImage: "radial-gradient(70% 55% at 28% 18%, rgba(193, 18, 31, 0.16), rgba(0,0,0,0))",
            color: "#f2f3f0",
            fontFamily: "Titillium",
          }}
        >
          {cardSrc && (
            <div style={{ position: "absolute", left: 92, top, display: "flex" }}>
              <img src={cardSrc} width={frame.W} height={frame.H} alt="" style={{ display: "flex" }} />
            </div>
          )}

          <div style={{ position: "absolute", left: 560, top: 120, width: 560, display: "flex", flexDirection: "column" }}>
            {/* the start gantry — five lights on, the race is about to start */}
            <div style={{ display: "flex", gap: 14 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    display: "flex",
                    backgroundImage: "radial-gradient(circle at 35% 30%, #ff4a41, #b30400 68%)",
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", marginTop: 34, fontWeight: 900, fontSize: 92, lineHeight: 0.95, color: "#f2f3f0" }}>
              your github,
            </div>
            <div style={{ display: "flex", fontWeight: 900, fontSize: 92, lineHeight: 0.95, color: "#c1121f" }}>
              rated like f1.
            </div>
            <div style={{ display: "flex", marginTop: 26, fontFamily: "JBMono", fontSize: 23, color: "#9a9ca6" }}>
              EXP · RAC · AWA · PAC. Scored live from real commits
            </div>
            <div style={{ display: "flex", marginTop: 18, fontFamily: "JBMono", fontSize: 23, letterSpacing: 3, color: "#c1121f" }}>
              gitone.langersword.in
            </div>
          </div>
        </div>
      ),
      { ...size, fonts },
    );
  });
}

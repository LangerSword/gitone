import { ImageResponse } from "next/og";
import { loadCard } from "@/lib/scout";
import { renderCardPng, cardFrame } from "@/lib/og/renderCard26";
import { loadCardFonts } from "@/lib/og/card";
import { cachedPng } from "@/lib/og/pngCache";
import { STATS, STAT_LABELS } from "@/lib/racing/constants";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const alt = "gitone driver card";

const BG = "#0b0d10";

// Social unfurl for the scout report: the live card on the left, the
// headline numbers on the right. The card is a clean rounded rectangle now,
// so no corner masks are needed.
//
// The composite is CPU-heavy (card render + outer pass); a cold render can
// bust the Workers CPU budget and hand X/Discord a 503, which they cache as
// "no preview". KV-cache the PNG — repeats never render again.
export default async function OgImage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return cachedPng(`og:v6:${username.toLowerCase()}`, () => buildOg(username));
}

async function buildOg(username: string): Promise<Response> {
  const res = await loadCard(username);
  const fonts = await loadCardFonts();
  if ("error" in res) {
    return new ImageResponse(
      (
        <div style={{ width: 1200, height: 630, display: "flex", alignItems: "center", justifyContent: "center", background: BG, color: "#f2f3f0", fontFamily: "Titillium" }}>
          <div style={{ display: "flex", fontWeight: 900, fontSize: 88, letterSpacing: 6 }}>GITONE</div>
        </div>
      ),
      { ...size, fonts },
    );
  }

  const card = res.card;
  const cardW = 380;
  const frame = cardFrame(cardW);
  const cardPng = await renderCardPng(card, cardW);
  const cardSrc = `data:image/png;base64,${cardPng.toString("base64")}`;
  const top = Math.round((630 - frame.H) / 2);

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", position: "relative", background: BG }}>
        {/* a measuring grid, faint */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div style={{ position: "absolute", left: 72, top, display: "flex" }}>
          <img src={cardSrc} width={frame.W} height={frame.H} alt="" style={{ display: "flex" }} />
        </div>

        <div style={{ position: "absolute", left: 540, top: 96, width: 600, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 18, fontWeight: 700, letterSpacing: 5, color: "#6a7079" }}>
            GITONE · SCOUT REPORT
          </div>
          <div style={{ display: "flex", marginTop: 18, fontWeight: 900, fontSize: 58, lineHeight: 0.95, color: "#f2f3f0" }}>{card.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18 }}>
            <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 38, fontWeight: 800, color: card.constructor.color }}>{card.rtg}</div>
            <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 16, fontWeight: 700, letterSpacing: 3, color: "#a2a7ae" }}>
              {card.finishLabel} · #{String(card.number).padStart(2, "0")} · {card.constructor.name.toUpperCase()}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 42, borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 22 }}>
            {[STATS.slice(0, 3), STATS.slice(3)].map((row) => (
              <div key={row[0]} style={{ display: "flex", gap: 1 }}>
                {row.map((k) => (
                  <div key={k} style={{ display: "flex", flex: 1, flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 14, fontWeight: 700, letterSpacing: 3, color: "#6a7079" }}>{STAT_LABELS[k]}</div>
                    <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 36, fontWeight: 800, color: card.stats[k] >= 90 ? "#b46bff" : "#f2f3f0" }}>{card.stats[k]}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", marginTop: 44, fontFamily: "JBMono", fontSize: 15, letterSpacing: 2, color: "#6a7079" }}>
            @{card.login} · github, rated like f1
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}

// re-export so Next's file convention keeps picking up the route's headers
export const contentType = "image/png";

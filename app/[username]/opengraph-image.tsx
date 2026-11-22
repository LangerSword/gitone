import { ImageResponse } from "next/og";
import { loadCard } from "@/lib/scout";
import { renderCardPng, cardFrame } from "@/lib/og/renderCard26";
import { loadCardFonts } from "@/lib/og/card";
import { cachedPng } from "@/lib/og/pngCache";
import { STATS, STAT_LABELS } from "@/lib/racing/constants";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const alt = "gitone driver card";

const FIELD = "#0d0f12";
const INK = "#f0e8d8";
const SIGNAL = "#b3202c";
const MUTED = "#96949b";

function tint(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// Broadcast-editorial unfurl: the full card seated in its own livery light on
// the left, one confident typographic column on the right. The card owns all
// six stats; the column shows only the three fastest sectors as evidence —
// never a duplicated stat grid.
export default async function OgImage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return cachedPng(`og:v8:${username.toLowerCase()}`, () => buildOg(username));
}

async function buildOg(username: string): Promise<Response> {
  const res = await loadCard(username);
  const fonts = await loadCardFonts();
  if ("error" in res) {
    return new ImageResponse(
      (
        <div style={{ width: 1200, height: 630, display: "flex", alignItems: "center", justifyContent: "center", background: FIELD, color: INK, fontFamily: "Titillium" }}>
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
  const fastest = [...STATS].sort((a, b) => card.stats[b] - card.stats[a]).slice(0, 3);
  const nameSize = card.name.length > 18 ? 54 : card.name.length > 12 ? 62 : 72;
  const livery = card.constructor.color;

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", position: "relative", background: FIELD, fontFamily: "Titillium" }}>
        {/* faint broadcast scan texture */}
        <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: "linear-gradient(115deg, rgba(240,232,216,0.022) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        {/* livery floodlight + standing shadow seat the card as an object */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 620, height: 630, display: "flex", backgroundImage: `radial-gradient(ellipse 62% 68% at 34% 48%, ${tint(livery, 0.22)}, transparent 72%)` }} />
        <div style={{ position: "absolute", left: 78, top: 30, width: 440, height: 590, display: "flex", backgroundImage: "radial-gradient(ellipse 46% 38% at 50% 62%, rgba(0,0,0,0.6), transparent 72%)" }} />

        <div style={{ position: "absolute", left: 74, top, display: "flex" }}>
          <img src={cardSrc} width={frame.W} height={frame.H} alt="" style={{ display: "flex" }} />
        </div>

        <div style={{ position: "absolute", left: 560, top: 96, width: 580, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: "flex", width: 8, height: 8, borderRadius: 999, background: SIGNAL }} />
            ))}
            <div style={{ display: "flex", marginLeft: 12, fontFamily: "JBMono", fontSize: 13, fontWeight: 700, letterSpacing: 5, color: MUTED }}>GITONE · SEASON 26</div>
          </div>

          <div style={{ display: "flex", marginTop: 30, fontSize: nameSize, fontWeight: 900, lineHeight: 0.95, letterSpacing: -1, color: INK }}>{card.name}</div>

          <div style={{ display: "flex", marginTop: 26, alignItems: "baseline", gap: 16 }}>
            <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 54, fontWeight: 800, color: SIGNAL }}>{card.rtg}</div>
            <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 15, fontWeight: 700, letterSpacing: 2, color: MUTED }}>
              {card.finishLabel.toUpperCase()} · NO.{String(card.number).padStart(2, "0")} · {card.constructor.name.toUpperCase()}
            </div>
          </div>

          <div style={{ display: "flex", marginTop: 38, height: 1, background: "rgba(240,232,216,0.16)" }} />
          <div style={{ display: "flex", marginTop: 12, fontFamily: "JBMono", fontSize: 11, fontWeight: 700, letterSpacing: 4, color: MUTED }}>
            FASTEST SECTORS
          </div>
          <div style={{ display: "flex", marginTop: 14, gap: 18 }}>
            {fastest.map((k) => (
              <div key={k} style={{ display: "flex", flex: 1, flexDirection: "column", borderLeft: `2px solid ${tint(livery, 0.7)}`, paddingLeft: 14 }}>
                <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 11, letterSpacing: 2, color: MUTED }}>{STAT_LABELS[k]}</div>
                <div style={{ display: "flex", marginTop: 6, fontFamily: "JBMono", fontSize: 34, fontWeight: 800, color: card.stats[k] >= 90 ? "#b46bff" : INK }}>{card.stats[k]}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", marginTop: "auto", fontFamily: "JBMono", fontSize: 14, letterSpacing: 2, color: MUTED }}>
            @{card.login} · gitone.langersword.in
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}

// re-export so Next's file convention keeps picking up the route's headers
export const contentType = "image/png";

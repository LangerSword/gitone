import { ImageResponse } from "next/og";
import { loadCard } from "@/lib/scout";
import { renderCardPng, cardFrame } from "@/lib/og/renderCard26";
import { loadCardFonts, publicAssetDataUri } from "@/lib/og/card";
import { cachedPng } from "@/lib/og/pngCache";
import { cardImageFallback } from "@/lib/og/fallback";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const alt = "gitone driver card";

const FIELD = "#101014";
const LANDING =
  "radial-gradient(120% 90% at 16% -12%, rgba(193,18,31,0.17), transparent 54%), radial-gradient(80% 60% at 90% 16%, rgba(246,241,232,0.06), transparent 62%), linear-gradient(180deg, #181820, #101014 72%)";
const INK = "#f0e8d8";
const SIGNAL = "#d6854a";
const MUTED = "#9aa39c";

const SHORT: Record<string, string> = {
  wdc: "WORLD CHAMPIONSHIP",
  pole: "POLE POSITION",
  fastest_lap: "FASTEST LAP",
  grand_slam: "GRAND SLAM",
  ironman: "IRONMAN",
  hat_trick: "HAT-TRICK",
  podium: "PODIUM REGULAR",
  century: "CENTURY CLUB",
  wcc26: "CONSTRUCTORS '26",
  wdc26: "DRIVERS '26",
  founders_edition: "1 OF 1",
};

function tint(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// GitFut grammar, rebuilt for gitone: the card is the product surface on the
// left; the right side proves the rating with earned silverware, not a second
// copy of the stats. Petrol field, parchment ink, one copper signal.
export default async function OgImage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return cachedPng(`og:v20:${username.toLowerCase()}`, () => buildOg(username), undefined, () => cardImageFallback(username));
}

export async function buildOg(username: string): Promise<Response> {
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
  const [cardPng, ...awards] = await Promise.all([
    renderCardPng(card, cardW),
    ...[...new Set((card.awards ?? []).map((a) => a.key))].map((key) => publicAssetDataUri(`awards/still/${key}.png`)),
  ]);
  const cardSrc = `data:image/png;base64,${cardPng.toString("base64")}`;
  const top = Math.round((630 - frame.H) / 2);
  const nameSize = card.name.length > 18 ? 52 : card.name.length > 12 ? 60 : 70;
  const keys = [...new Set((card.awards ?? []).map((a) => a.key))];
  const livery = card.constructor.color;

  const trophyW = keys.length > 5 ? 62 : keys.length > 3 ? 74 : 88;
  const trophyH = Math.round(trophyW * 1.18);

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", position: "relative", background: FIELD, backgroundImage: LANDING, fontFamily: "Titillium" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: "linear-gradient(180deg, #181820, #101014)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: "radial-gradient(ellipse 80% 70% at 16% 100%, rgba(193,18,31,0.42), transparent 72%)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: "radial-gradient(ellipse 70% 60% at 90% 100%, rgba(246,241,232,0.34), transparent 72%)" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 630, display: "flex", backgroundImage: "linear-gradient(rgba(246,241,232,0.10) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 630, display: "flex", backgroundImage: "linear-gradient(90deg, rgba(246,241,232,0.10) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <div style={{ position: "absolute", left: 0, top: 440, width: 1200, height: 190, display: "flex", backgroundImage: "linear-gradient(180deg, transparent, rgba(193,18,31,0.14) 70%, rgba(0,0,0,0.42))" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 630, display: "flex", backgroundImage: `radial-gradient(ellipse 34% 64% at 22% 48%, ${tint(livery, 0.16)}, transparent 72%)` }} />

        <div style={{ position: "absolute", left: 74, top, display: "flex" }}>
          <img src={cardSrc} width={frame.W} height={frame.H} alt="" style={{ display: "flex" }} />
        </div>

        <div style={{ position: "absolute", left: 560, top: 78, width: 580, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: "flex", width: 8, height: 8, borderRadius: 999, background: SIGNAL }} />
            ))}
            <div style={{ display: "flex", marginLeft: 12, fontFamily: "JBMono", fontSize: 13, fontWeight: 700, letterSpacing: 5, color: MUTED }}>GITONE / SEASON 26</div>
          </div>

          <div style={{ display: "flex", marginTop: 26, fontSize: nameSize, fontWeight: 900, lineHeight: 0.95, letterSpacing: -1, color: INK }}>{card.name}</div>

          <div style={{ display: "flex", marginTop: 20, alignItems: "baseline", gap: 14 }}>
            <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 64, fontWeight: 800, color: SIGNAL }}>{card.rtg}</div>
            <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 14, fontWeight: 700, letterSpacing: 2, color: MUTED }}>
              {card.finishLabel.toUpperCase()} · NO.{String(card.number).padStart(2, "0")}
            </div>
          </div>

          <div style={{ display: "flex", marginTop: 28, height: 1, background: "rgba(240,232,216,0.16)" }} />
          <div style={{ display: "flex", marginTop: 12, fontFamily: "JBMono", fontSize: 11, fontWeight: 700, letterSpacing: 4, color: MUTED }}>THE CABINET</div>

          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 10, gap: 10, width: 580 }}>
            {keys.map((key, i) => (
              <div key={key} style={{ display: "flex", width: trophyW, flexDirection: "column", alignItems: "center" }}>
                {awards[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={awards[i]!} alt="" width={trophyW} height={trophyH} style={{ display: "flex", width: trophyW, height: trophyH, objectFit: "contain" }} />
                ) : (
                  <div style={{ display: "flex", width: trophyW, height: trophyH }} />
                )}
                <div style={{ display: "flex", marginTop: 4, fontFamily: "JBMono", fontSize: 8, fontWeight: 700, letterSpacing: 0, color: SIGNAL, textAlign: "center" }}>{SHORT[key] ?? key.replace(/_/g, " ").toUpperCase()}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", marginTop: "auto", fontFamily: "JBMono", fontSize: 13, letterSpacing: 2, color: MUTED }}>
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

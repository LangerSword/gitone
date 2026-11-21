import { ImageResponse } from "next/og";
import { loadPosterFonts, publicAssetDataUri } from "./card";
import { loadCardAssets } from "./renderCard";
import { pickPlate } from "./renderCard26";
import { computeDuel } from "@/lib/duel";
import { cardDisplayName } from "@/lib/text";
import type { Card } from "@/lib/racing/types";

// The battle unfurl / download — a broadcast race-result graphic in ONE
// Satori pass. The previous poster ran the card composite twice plus the
// outer frame (three ImageResponse runs), which the Workers free plan's
// ~10ms CPU cap killed deterministically (exceededCpu on every cold render).
// Layering the plates + portraits + a name strip directly into a single
// pass is the cost class the scout-report unfurl already survives, and the
// result KV-caches: each pair renders once, forever after ~0.2s.
const W = 1200;
const H = 630;
const CACHE = {
  "Cache-Control":
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

function Checkers({ y }: { y: number }) {
  return (
    <div style={{ position: "absolute", left: 0, top: y, width: W, height: 16, display: "flex" }}>
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} style={{ width: 30, height: 16, display: "flex", flexDirection: "column" }}>
          <div style={{ width: 30, height: 8, background: i % 2 ? "#15151e" : "#f5f5f7", display: "flex" }} />
          <div style={{ width: 30, height: 8, background: i % 2 ? "#f5f5f7" : "#15151e", display: "flex" }} />
        </div>
      ))}
    </div>
  );
}

// One driver's side, layered directly: plate, rim light, portrait, and a
// name strip in the card's own grammar — no inner composite.
function DriverSide({ card, plateSrc, assets, left }: { card: Card; plateSrc: string | null; assets: Awaited<ReturnType<typeof loadCardAssets>>; left: number }) {
  const CW = 246;
  const CH = Math.round(CW * (820 / 540));
  const name = cardDisplayName(card.name).toUpperCase();
  const accent = card.constructor.color;
  return (
    <div style={{ position: "absolute", left, top: 92, width: CW, height: CH, display: "flex", flexDirection: "column" }}>
      {plateSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={plateSrc} alt="" width={CW} height={CH} style={{ position: "absolute", left: 0, top: 0, width: CW, height: CH, objectFit: "fill" }} />
      )}
      {/* rim light behind the portrait — dark silhouettes stay separated */}
      <div
        style={{
          position: "absolute",
          left: "16%",
          top: "6%",
          width: "68%",
          height: "54%",
          backgroundImage: "radial-gradient(ellipse 50% 60% at 52% 42%, rgba(255,240,204,0.16), transparent 72%)",
        }}
      />
      {assets.avatar && (
        <div style={{ position: "absolute", left: "26%", top: "6.5%", width: "48%", height: "50%", display: "flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assets.avatar}
            alt=""
            width={Math.round(CW * 0.48)}
            height={Math.round(CH * 0.5)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 22%",
              // feather the portrait into the plate, same grammar as the card
              WebkitMaskImage: "radial-gradient(ellipse 72% 80% at 50% 42%, #000 52%, transparent 84%)",
              maskImage: "radial-gradient(ellipse 72% 80% at 50% 42%, #000 52%, transparent 84%)",
            }}
          />
        </div>
      )}
      {/* the name strip */}
      <div style={{ position: "absolute", left: 0, bottom: 36, width: CW, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 22, fontWeight: 800, letterSpacing: 2, color: accent }}>
          {card.rtg}
        </div>
        <div style={{ display: "flex", marginTop: 3, fontFamily: "JBMono", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#a2a7ae" }}>
          {card.finishLabel} · #{String(card.number).padStart(2, "0")}
        </div>
        <div style={{ display: "flex", marginTop: 5, fontFamily: "Titillium", fontWeight: 800, fontSize: name.length > 12 ? 17 : 20, lineHeight: 1, color: "#f5f5f7", textAlign: "center", maxWidth: CW - 20 }}>
          {name}
        </div>
        <div style={{ display: "flex", marginTop: 4, fontFamily: "JBMono", fontSize: 10, letterSpacing: 2, color: "#6a7079" }}>
          {card.constructor.name.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

export async function renderBattleImage(a: Card, b: Card): Promise<Response> {
  const duel = computeDuel(a, b);
  const { score, winner, onCountback, testSession } = duel;
  const winnerCard = winner === "challenger" ? a : winner === "opponent" ? b : null;
  const headline = testSession
    ? "TEST SESSION"
    : winnerCard
      ? `${cardDisplayName(winnerCard.name).toUpperCase()} TAKES IT`
      : "DEAD HEAT";
  const sub = testSession
    ? "SAME DRIVER, BOTH CARS"
    : winner
      ? `${score.challenger}-${score.opponent} ON SECTORS${onCountback ? " · RTG COUNTBACK" : ""}`
      : `${score.challenger}-${score.opponent} ON SECTORS · LEVEL ON RTG`;

  const pa = pickPlate(a);
  const pb = pickPlate(b);
  const [fonts, aAssets, bAssets, aPlate, bPlate] = await Promise.all([
    loadPosterFonts(),
    loadCardAssets(a),
    loadCardAssets(b),
    publicAssetDataUri(pa.bg.replace(/^\/cards\//, "cards/og400/").replace(/\.webp$/, ".png")),
    publicAssetDataUri(pb.bg.replace(/^\/cards\//, "cards/og400/").replace(/\.webp$/, ".png")),
  ]);

  const sideW = 246;
  const leftX = 64;
  const rightX = W - leftX - sideW;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#15151e",
          backgroundImage:
            "radial-gradient(760px 360px at 50% -12%, rgba(193,18,31,0.20), transparent 62%), radial-gradient(900px 240px at 50% 108%, rgba(255,255,255,0.05), transparent 70%)",
          position: "relative",
          fontFamily: "Titillium",
        }}
      >
        <Checkers y={0} />
        <Checkers y={H - 16} />

        <div style={{ display: "flex", justifyContent: "center", marginTop: 34, fontFamily: "JBMono", fontSize: 24, letterSpacing: 8, color: "#c9c9d4" }}>
          GITONE · RACE RESULT
        </div>

        <DriverSide card={a} plateSrc={aPlate} assets={aAssets} left={leftX} />
        <DriverSide card={b} plateSrc={bPlate} assets={bAssets} left={rightX} />

        {/* the scoreline between them — scoreboard only, the result call
            lives in the full-width band below */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 150 }}>
          <div style={{ display: "flex", fontFamily: "Titillium", fontWeight: 800, fontSize: 92, lineHeight: 1, color: "#c1121f" }}>
            {score.challenger}-{score.opponent}
          </div>
          <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 20, letterSpacing: 6, color: "#9b9bab", marginTop: 10 }}>
            SECTORS
          </div>
          <div style={{ display: "flex", width: 64, height: 64, borderRadius: 999, border: "2px solid rgba(193,18,31,0.5)", alignItems: "center", justifyContent: "center", marginTop: 24, fontFamily: "Titillium", fontWeight: 800, fontSize: 27, color: "#f5f5f7" }}>
            VS
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "auto", marginBottom: 28 }}>
          {/* the winner wears championship gold — the trophy read, same as the
              live banner; a dead heat stays in the timing-screen white */}
          <div
            style={{
              display: "flex",
              fontFamily: "Titillium",
              fontWeight: 800,
              fontSize: 54,
              lineHeight: 1,
              letterSpacing: 1,
              color: winnerCard ? "#f5d67b" : "#f5f5f7",
              textShadow: winnerCard ? "0 0 34px rgba(245,214,123,0.35), 0 2px 0 rgba(0,0,0,.55)" : "0 2px 0 rgba(0,0,0,.55)",
            }}
          >
            {headline}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 12 }}>
            <span style={{ display: "flex", fontFamily: "JBMono", fontSize: 21, letterSpacing: 4, color: "#c9c9d4" }}>
              {sub}
            </span>
            {/* the address rides WITH the result call — no floating footer */}
            <span style={{ display: "flex", fontFamily: "JBMono", fontSize: 21, letterSpacing: 3, color: "#c1121f" }}>
              gitone.langersword.in
            </span>
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts, headers: CACHE },
  );
}

export async function renderBattleFallback(a: string, b: string): Promise<Response> {
  const fonts = await loadPosterFonts();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#15151e", color: "#f5f5f7", fontFamily: "Titillium" }}>
        <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 26, letterSpacing: 8, color: "#c9c9d4" }}>GITONE · RACE RESULT</div>
        <div style={{ display: "flex", fontWeight: 800, fontSize: 72, marginTop: 24 }}>@{a} vs @{b}</div>
        <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 28, color: "#c1121f", marginTop: 20 }}>scout this battle at the grid</div>
      </div>
    ),
    { width: W, height: H, fonts, headers: CACHE },
  );
}

import { ImageResponse } from "next/og";
import { loadCardFonts } from "./card";
import { renderCardPng, cardFrame } from "./renderCard26";
import { computeDuel } from "@/lib/duel";
import { cardDisplayName } from "@/lib/text";
import type { Card } from "@/lib/racing/types";

// The battle unfurl / download: a broadcast race-result graphic with BOTH
// drivers' real rendered cards flanking the sector scoreline — the same card
// renderer the scout report unfurl uses, so the poster shows exactly what the
// product shows. Carbon stage, checkered chrome, championship-gold winner,
// the address baked in. One card render per side, then the composite.
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

export async function renderBattleImage(a: Card, b: Card): Promise<Response> {
  // Cards sit high and tight to the sides; the centre column carries ONLY the
  // live scoreboard (score / SECTORS / VS); the winner call + sub + URL run
  // full-width BELOW the cards. Cramming all six centre elements into the
  // gap between the cards is what made the first cut feel pinched.
  const cardW = 240;
  const frame = cardFrame(cardW);
  const [fonts, aPng, bPng] = await Promise.all([
    loadCardFonts(),
    renderCardPng(a, cardW),
    renderCardPng(b, cardW),
  ]);
  const aSrc = `data:image/png;base64,${aPng.toString("base64")}`;
  const bSrc = `data:image/png;base64,${bPng.toString("base64")}`;

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

  const cardTop = Math.round((630 - frame.H) / 2) - 56;
  const leftX = 96;
  const rightX = W - leftX - frame.W;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#15151e",
          backgroundImage:
            "radial-gradient(760px 360px at 50% -12%, rgba(193,18,31,0.20), transparent 62%), radial-gradient(900px 240px at 50% 108%, rgba(255,255,255,0.05), transparent 70%)",
          position: "relative",
          fontFamily: "Titillium",
        }}
      >
        <Checkers y={0} />
        <Checkers y={H - 16} />

        <div style={{ display: "flex", justifyContent: "center", marginTop: 36, fontFamily: "JBMono", fontSize: 24, letterSpacing: 8, color: "#c9c9d4" }}>
          GITONE · RACE RESULT
        </div>

        {/* the two cars — the actual rendered cards, challenger left / rival right */}
        <div style={{ position: "absolute", left: leftX, top: cardTop, display: "flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={aSrc} width={frame.W} height={frame.H} alt="" style={{ display: "flex" }} />
        </div>
        <div style={{ position: "absolute", left: rightX, top: cardTop, display: "flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bSrc} width={frame.W} height={frame.H} alt="" style={{ display: "flex" }} />
        </div>

        {/* the scoreline between them — scoreboard only, the result call
            lives in the full-width band below the cards */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 88 }}>
          <div style={{ display: "flex", fontFamily: "Titillium", fontWeight: 800, fontSize: 88, lineHeight: 1, color: "#c1121f" }}>
            {score.challenger}-{score.opponent}
          </div>
          <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 20, letterSpacing: 6, color: "#9b9bab", marginTop: 10 }}>
            SECTORS
          </div>
          <div style={{ display: "flex", width: 64, height: 64, borderRadius: 999, border: "2px solid rgba(193,18,31,0.5)", alignItems: "center", justifyContent: "center", marginTop: 22, fontFamily: "Titillium", fontWeight: 800, fontSize: 27, color: "#f5f5f7" }}>
            VS
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "auto", marginBottom: 30 }}>
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
  const fonts = await loadCardFonts();
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

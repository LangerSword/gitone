import { ImageResponse } from "next/og";
import { loadCardFonts } from "./card";
import { computeDuel } from "@/lib/duel";
import { cardDisplayName } from "@/lib/text";
import type { Card } from "@/lib/racing/types";

// The battle unfurl / download: a broadcast race-result graphic. Carbon stage,
// checkered chrome, the two drivers' name plates in their livery colours, a big
// sector scoreline and the winner. No avatar fetch — renders fast and reads
// like a timing-screen result, not a screenshot.
const W = 1200;
const H = 630;
const CACHE = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
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

function Plate({ card, align }: { card: Card; align: "left" | "right" }) {
  const name = cardDisplayName(card.name).toUpperCase();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "left" ? "flex-start" : "flex-end", width: 400 }}>
      <div style={{ display: "flex", width: 120, height: 6, background: card.constructor.color, marginBottom: 18 }} />
      <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 24, letterSpacing: 4, color: "#9b9bab" }}>
        {card.constructor.code} · #{String(card.number).padStart(2, "0")}
      </div>
      <div style={{ display: "flex", fontFamily: "Titillium", fontWeight: 800, fontSize: name.length > 12 ? 52 : 64, lineHeight: 1, color: "#f5f5f7", marginTop: 8, textAlign: align }}>
        {name}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 16 }}>
        <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 22, letterSpacing: 3, color: "#9b9bab" }}>RTG</div>
        <div style={{ display: "flex", fontFamily: "Titillium", fontWeight: 800, fontSize: 72, lineHeight: 1, color: card.constructor.color }}>
          {card.rtg}
        </div>
      </div>
    </div>
  );
}

export async function renderBattleImage(a: Card, b: Card): Promise<Response> {
  const fonts = await loadCardFonts();
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
            "radial-gradient(700px 340px at 50% -10%, rgba(193,18,31,0.22), transparent 62%), radial-gradient(900px 240px at 50% 108%, rgba(255,255,255,0.05), transparent 70%)",
          position: "relative",
          fontFamily: "Titillium",
        }}
      >
        <Checkers y={0} />
        <Checkers y={H - 16} />

        <div style={{ display: "flex", justifyContent: "center", marginTop: 40, fontFamily: "JBMono", fontSize: 24, letterSpacing: 8, color: "#c9c9d4" }}>
          GITONE · RACE RESULT
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 70px", marginTop: 36, flex: 1 }}>
          <Plate card={a} align="left" />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 220 }}>
            <div style={{ display: "flex", fontFamily: "Titillium", fontWeight: 800, fontSize: 96, lineHeight: 1, color: "#c1121f" }}>
              {score.challenger}-{score.opponent}
            </div>
            <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 22, letterSpacing: 6, color: "#9b9bab", marginTop: 6 }}>
              SECTORS
            </div>
            <div style={{ display: "flex", width: 64, height: 64, borderRadius: 999, border: "2px solid rgba(193,18,31,0.5)", alignItems: "center", justifyContent: "center", marginTop: 18, fontFamily: "Titillium", fontWeight: 800, fontSize: 30, color: "#f5f5f7" }}>
              VS
            </div>
          </div>
          <Plate card={b} align="right" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 34 }}>
          {/* the winner wears championship gold — the trophy read, same as the
              live banner; a dead heat stays in the timing-screen white */}
          <div
            style={{
              display: "flex",
              fontFamily: "Titillium",
              fontWeight: 800,
              fontSize: 56,
              lineHeight: 1,
              letterSpacing: 1,
              color: winnerCard ? "#f5d67b" : "#f5f5f7",
              textShadow: winnerCard ? "0 0 34px rgba(245,214,123,0.35), 0 2px 0 rgba(0,0,0,.55)" : "0 2px 0 rgba(0,0,0,.55)",
            }}
          >
            {headline}
          </div>
          <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 24, letterSpacing: 4, color: "#c9c9d4", marginTop: 12 }}>
            {sub}
          </div>
          {/* every shared frame carries the address — a poster without the
              product URL is a dead end */}
          <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 21, letterSpacing: 3, color: "#c1121f", marginTop: 14 }}>
            gitone.langersword.in
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

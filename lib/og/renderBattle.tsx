import { ImageResponse } from "next/og";
import { loadPosterFonts, publicAssetDataUri } from "./card";
import { fetchDataUri } from "./renderCard";
import { pickPlate } from "./renderCard26";
import { computeDuel, type Duel } from "@/lib/duel";
import type { Card } from "@/lib/racing/types";
import { GOAT_LOGIN, GOAT_LOGINS, STATS, STAT_LABELS } from "@/lib/racing/constants";
import { cssBox, FEATHER, portraitForCard, type PortraitWindow } from "@/lib/racing/portrait";

function withAlpha(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// The battle unfurl / download — a broadcast race-result graphic in ONE
// Satori pass. The previous poster ran the card composite twice plus the
// outer frame (three ImageResponse runs), which the Workers free plan's
// ~10ms CPU cap killed deterministically (exceededCpu on every cold render).
// Layering the plates + portraits + a name strip directly into a single
// pass is the cost class the scout-report unfurl already survives, and the
// result KV-caches: each pair renders once, forever after ~0.2s.
const W = 1200;
const LANDING = "radial-gradient(120% 90% at 16% -12%, rgba(193,18,31,0.17), transparent 54%), radial-gradient(80% 60% at 90% 16%, rgba(246,241,232,0.06), transparent 62%), linear-gradient(180deg, #181820, #101014 72%)";
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
          <div style={{ width: 30, height: 8, background: i % 2 ? "#0e1417" : "#f0e8d8", display: "flex" }} />
          <div style={{ width: 30, height: 8, background: i % 2 ? "#f0e8d8" : "#0e1417", display: "flex" }} />
        </div>
      ))}
    </div>
  );
}

// One driver's side: plate, portrait and the FULL card grammar — rating,
// number, chip, name and all six stats — in one Satori pass. The winner gets a
// livery wash behind the crest so the result reads before the scoreline.
function DriverSide({ card, plateSrc, avatar, left, winner, angle = 0 }: { card: Card; plateSrc: string | null; avatar: string | null; left: number; winner: boolean; angle?: number }) {
  const CW = 270;
  const CH = Math.round(CW * (820 / 540));
  const parts = card.name.trim().toUpperCase().replace(/\.$/, "").split(/\s+/).filter(Boolean);
  const firstName = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
  const lastName = parts[parts.length - 1] ?? "";
  const accent = card.constructor.color;
  const login = card.login.toLowerCase();
  const founder = card.finish === "founder" || !!card.founder;
  const goat = !founder && (GOAT_LOGINS.includes(login) || login === GOAT_LOGIN || (card.number === 1 && card.rtg >= 97));
  const chip = goat ? "THE GOAT" : card.finishLabel;
  const plateBox = portraitForCard(card);
  const pbox: PortraitWindow = {
    left: plateBox.left + (plateBox.width - 48) / 2,
    top: plateBox.top,
    width: 48,
    height: Math.min(plateBox.height, 44),
  };
  const ink = pickPlate(card).ink;
  return (
    <div style={{ position: "absolute", left, top: 112, width: CW, height: CH, display: "flex", ...(angle ? { transform: `rotate(${angle}deg)`, transformOrigin: "center center" } : {}) }}>
      {winner && (
        <div
          style={{
            position: "absolute",
            left: -18,
            top: -14,
            width: CW + 36,
            height: CH + 28,
            backgroundImage: `radial-gradient(ellipse 58% 42% at 50% 42%, ${withAlpha(accent, 0.42)}, transparent 74%)`,
          }}
        />
      )}
      {plateSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={plateSrc} alt="" width={CW} height={CH} style={{ position: "absolute", left: 0, top: 0, width: CW, height: CH, objectFit: "fill" }} />
      )}
      {/* rim light behind the portrait — dark silhouettes stay separated */}
      <div
        style={{
          position: "absolute",
          left: `${pbox.left - 4}%`,
          top: `${pbox.top - 3}%`,
          width: `${pbox.width + 8}%`,
          height: `${pbox.height + 6}%`,
          backgroundImage: "radial-gradient(ellipse 50% 60% at 52% 42%, rgba(255,240,204,0.16), transparent 72%)",
        }}
      />
      {avatar && (
        <div style={{ position: "absolute", ...cssBox(pbox), display: "flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatar}
            alt=""
            width={Math.round(CW * (pbox.width / 100))}
            height={Math.round(CH * (pbox.height / 100))}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 22%",
              WebkitMaskImage: FEATHER,
              maskImage: FEATHER,
            }}
          />
        </div>
      )}
      {/* rating + number + finish chip, engraved in the plate's own ink */}
      <div style={{ position: "absolute", left: "13%", top: "8%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 8, fontWeight: 700, letterSpacing: 2, color: withAlpha(ink, 0.7) }}>RTG</div>
        <div style={{ display: "flex", fontFamily: "Titillium", fontWeight: 800, fontSize: 46, lineHeight: 1, color: ink }}>{card.rtg}</div>
      </div>
      <div style={{ position: "absolute", left: "13%", top: "27%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 8, fontWeight: 700, letterSpacing: 2, color: withAlpha(ink, 0.7) }}>NO.</div>
        <div style={{ display: "flex", fontFamily: "Titillium", fontWeight: 800, fontSize: 15, lineHeight: 1, color: ink }}>{String(card.number).padStart(2, "0")}</div>
      </div>
      <div style={{ position: "absolute", left: "13%", top: "39%", display: "flex", padding: "2px 5px", border: `1px solid ${withAlpha(ink, 0.45)}`, fontFamily: "JBMono", fontSize: 8, fontWeight: 800, letterSpacing: 1, color: ink }}>
        {chip}
      </div>
      {/* identity */}
      <div style={{ position: "absolute", left: "8%", width: "84%", top: "55%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {firstName && <div style={{ display: "flex", fontFamily: "Titillium", fontWeight: 700, fontSize: 11, lineHeight: 1, letterSpacing: 2, color: withAlpha(ink, 0.7), textAlign: "center", maxWidth: CW - 20 }}>{firstName}</div>}
        <div style={{ display: "flex", marginTop: firstName ? 3 : 0, fontFamily: "Titillium", fontWeight: 800, fontSize: lastName.length > 12 ? 18 : 23, lineHeight: 1, color: ink, textAlign: "center", maxWidth: CW - 20 }}>{lastName}</div>
        <div style={{ display: "flex", marginTop: 4, fontFamily: "JBMono", fontSize: 8, fontWeight: 700, letterSpacing: 2, color: withAlpha(ink, 0.72) }}>{card.constructor.name.toUpperCase()}</div>
      </div>
      {/* the full six-stat rail, 3x2 — the poster no longer drops four stats */}
      <div style={{ position: "absolute", left: "10%", width: "80%", top: "70%", display: "flex", flexDirection: "column" }}>
        {[STATS.slice(0, 3), STATS.slice(3)].map((row, r) => (
          <div key={r} style={{ display: "flex", height: 28, borderTop: r === 0 ? "none" : `1px solid ${withAlpha(ink, 0.3)}` }}>
            {row.map((k, i) => (
              <div key={k} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderLeft: i === 0 ? "none" : `1px solid ${withAlpha(ink, 0.3)}` }}>
                <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 8, fontWeight: 700, letterSpacing: 1, color: withAlpha(ink, 0.7) }}>{STAT_LABELS[k]}</div>
                <div style={{ display: "flex", fontFamily: "Titillium", fontWeight: 800, fontSize: 18, lineHeight: 1, color: ink }}>{card.stats[k]}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, width: CW, top: "88%", display: "flex", justifyContent: "center", fontFamily: "JBMono", fontSize: 7, fontWeight: 700, letterSpacing: 2, color: withAlpha(ink, 0.75) }}>GITONE · @{card.login}</div>
    </div>
  );
}

// The sector comparison sits BETWEEN the two cards as a slim butterfly table:
// left value/bar, fixed centre label, right bar/value. Every row shares one
// 0-99 scale and marks its winner with a dot.
function SectorBoard({ duel, aColor, bColor, teaser }: { duel: Duel; aColor: string; bColor: string; teaser: boolean }) {
  if (teaser) {
    return (
      <div style={{ position: "absolute", left: 330, top: 286, width: 540, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", width: "100%", height: 12, justifyContent: "center", fontFamily: "JBMono", fontSize: 9, fontWeight: 700, letterSpacing: 4, color: "#9aa39c" }}>SIX SECTORS · ONE RESULT</div>
        <div style={{ display: "flex", width: "100%", marginTop: 8 }}>
          {duel.rows.map((row) => (
            <div key={row.key} style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 9, fontWeight: 700, color: "#f0e8d8" }}>{row.label}</div>
              <div style={{ display: "flex", width: "70%", height: 3, background: "rgba(240,232,216,0.14)" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", left: 330, top: 286, width: 540, display: "flex", flexDirection: "column" }}>
      {duel.rows.map((row, i) => {
        const aWon = row.winner === "challenger";
        const bWon = row.winner === "opponent";
        const aInk = row.challenger >= 90 ? "#b46bff" : aColor;
        const bInk = row.opponent >= 90 ? "#b46bff" : bColor;
        return (
          <div key={row.key} style={{ display: "flex", width: "100%", height: 23, alignItems: "center", borderBottom: i === duel.rows.length - 1 ? "none" : "1px solid rgba(240,232,216,0.08)", background: aWon ? withAlpha(aColor, 0.05) : bWon ? withAlpha(bColor, 0.05) : "transparent" }}>
            <div style={{ display: "flex", width: 42, alignItems: "center", justifyContent: "flex-end", fontFamily: "JBMono", fontSize: 11, fontWeight: 800, color: aInk, opacity: bWon ? 0.7 : 1 }}>
              {aWon && <div style={{ display: "flex", width: 3, height: 3, marginRight: 4, borderRadius: 999, background: aInk }} />}
              {row.challenger}
            </div>
            <div style={{ display: "flex", flex: 1, height: 4, marginLeft: 8, justifyContent: "flex-end", background: "rgba(240,232,216,0.09)" }}>
              <div style={{ display: "flex", width: `${row.challenger}%`, height: 4, background: aInk, opacity: aWon ? 1 : 0.55 }} />
            </div>
            <div style={{ display: "flex", width: 52, justifyContent: "center", fontFamily: "JBMono", fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "#9aa39c" }}>{row.label}</div>
            <div style={{ display: "flex", flex: 1, height: 4, marginRight: 8, background: "rgba(240,232,216,0.09)" }}>
              <div style={{ display: "flex", width: `${row.opponent}%`, height: 4, background: bInk, opacity: bWon ? 1 : 0.55 }} />
            </div>
            <div style={{ display: "flex", width: 42, alignItems: "center", fontFamily: "JBMono", fontSize: 11, fontWeight: 800, color: bInk, opacity: aWon ? 0.7 : 1 }}>
              {row.opponent}
              {bWon && <div style={{ display: "flex", width: 3, height: 3, marginLeft: 4, borderRadius: 999, background: bInk }} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export async function renderBattleImage(a: Card, b: Card, teaser = false): Promise<Response> {
  const duel = computeDuel(a, b);
  const { score, winner, onCountback, testSession } = duel;
  const winnerCard = winner === "challenger" ? a : winner === "opponent" ? b : null;
  const sub = testSession
    ? "SAME DRIVER, BOTH CARS"
    : winner
      ? `${score.challenger}-${score.opponent} ON SECTORS${onCountback ? " · RTG COUNTBACK" : ""}`
      : `${score.challenger}-${score.opponent} ON SECTORS · LEVEL ON RTG`;

  const pa = pickPlate(a);
  const pb = pickPlate(b);
  const [fonts, aAvatar, bAvatar, aPlate, bPlate] = await Promise.all([
    loadPosterFonts(),
    // lean: the poster paints only the avatar (~118px) — fetch it at s=160
    // instead of the s=960 full-card source, and skip the flag/logo entirely.
    // Avatar decode was the single biggest CPU item in a cold composite.
    fetchDataUri(a.avatarUrl.replace(/([?&])s=\d+/, "$1s=160")),
    fetchDataUri(b.avatarUrl.replace(/([?&])s=\d+/, "$1s=160")),
    publicAssetDataUri(pa.bg.replace(/^\/cards\//, "cards/og280/").replace(/\.webp$/, ".png")),
    publicAssetDataUri(pb.bg.replace(/^\/cards\//, "cards/og280/").replace(/\.webp$/, ".png")),
  ]);

  const sideW = 270;
  const leftX = 36;
  const rightX = W - leftX - sideW;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#101014",
          backgroundImage:
            "radial-gradient(120% 90% at 16% -12%, rgba(193,18,31,0.17), transparent 54%), radial-gradient(80% 60% at 90% 16%, rgba(246,241,232,0.06), transparent 62%), linear-gradient(180deg, #181820, #101014 72%)",
          position: "relative",
          fontFamily: "Titillium",
        }}
      >
        <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: "linear-gradient(180deg, #181820, #101014)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: "radial-gradient(ellipse 80% 70% at 16% 100%, rgba(193,18,31,0.42), transparent 72%)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: "radial-gradient(ellipse 70% 60% at 90% 100%, rgba(246,241,232,0.34), transparent 72%)" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 630, display: "flex", backgroundImage: "linear-gradient(rgba(246,241,232,0.10) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 630, display: "flex", backgroundImage: "linear-gradient(90deg, rgba(246,241,232,0.10) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <div style={{ position: "absolute", left: 0, top: 440, width: W, height: 190, display: "flex", backgroundImage: "linear-gradient(180deg, transparent, rgba(193,18,31,0.14) 70%, rgba(0,0,0,0.42))" }} />
        <div style={{ position: "absolute", left: 0, top: H - 18, width: W, height: 1, display: "flex", backgroundImage: "linear-gradient(90deg, transparent, rgba(246,241,232,0.16), transparent)" }} />
        {teaser && (
          <div style={{ position: "absolute", left: 120, top: 250, width: 960, height: 2, display: "flex", backgroundImage: "linear-gradient(90deg, transparent, rgba(193,18,31,0.4), transparent)" }} />
        )}
        <div style={{ position: "absolute", left: 0, top: 44, width: W, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: "flex", width: 7, height: 7, borderRadius: 999, background: teaser ? "#c1121f" : "#d6854a" }} />
          ))}
          <div style={{ display: "flex", marginLeft: 14, fontFamily: "JBMono", fontSize: 17, fontWeight: 700, letterSpacing: 7, color: "#f0e8d8" }}>
            GITONE · HEAD TO HEAD
          </div>
        </div>

        <DriverSide card={a} plateSrc={aPlate} avatar={aAvatar} left={teaser ? 290 : leftX} winner={winnerCard === a} angle={teaser ? 10 : 0} />
        <DriverSide card={b} plateSrc={bPlate} avatar={bAvatar} left={teaser ? W - 290 - sideW : rightX} winner={winnerCard === b} angle={teaser ? -10 : 0} />
        {!teaser && <SectorBoard duel={duel} aColor={a.constructor.color} bColor={b.constructor.color} teaser={false} />}

        {/* the VS is the single focal object, like the reference broadcast graphic */}
        <div style={{ position: "absolute", left: W / 2 - 180, top: teaser ? 280 : 132, width: 360, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {teaser && (
            <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} style={{ display: "flex", width: 10, height: 10, borderRadius: 999, background: "#c1121f", boxShadow: "0 0 12px rgba(193,18,31,0.6)" }} />
              ))}
            </div>
          )}
          <div style={{ display: "flex", position: "relative", width: 360, height: 150, alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", left: 140, top: 14, display: "flex", fontSize: 150, fontWeight: 900, fontStyle: "italic", color: "rgba(214,133,74,0.24)" }}>VS</div>
            <div style={{ position: "absolute", left: 132, top: 7, display: "flex", fontSize: 150, fontWeight: 900, fontStyle: "italic", color: "rgba(240,232,216,0.38)" }}>VS</div>
            <div style={{ position: "absolute", left: 124, top: 0, display: "flex", fontSize: 150, fontWeight: 900, fontStyle: "italic", color: "#f0e8d8", textShadow: "0 18px 48px rgba(0,0,0,0.65)" }}>VS</div>
          </div>
          {!teaser && (
            <div style={{ display: "flex", marginTop: 4, padding: "5px 18px", borderRadius: 999, border: "1px solid rgba(240,232,216,0.16)", background: "rgba(240,232,216,0.05)", alignItems: "center" }}>
              <span style={{ display: "flex", fontFamily: "JBMono", fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#9aa39c" }}>SECTORS</span>
              <span style={{ display: "flex", marginLeft: 12, fontFamily: "JBMono", fontSize: 18, fontWeight: 800, color: "#d6854a" }}>{score.challenger} - {score.opponent}</span>
            </div>
          )}
        </div>

        <div style={{ position: "absolute", left: 0, bottom: 24, width: W, display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <span style={{ display: "flex", fontFamily: "JBMono", fontSize: 15, letterSpacing: 3, color: "#9aa39c" }}>
              {teaser ? "RACE AT THE GRID" : sub}
            </span>
            <span style={{ display: "flex", fontFamily: "JBMono", fontSize: 15, letterSpacing: 2, color: "#d6854a" }}>
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
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0e1417", color: "#f0e8d8", fontFamily: "Titillium" }}>
        <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 26, letterSpacing: 8, color: "#9aa39c" }}>GITONE · RACE RESULT</div>
        <div style={{ display: "flex", fontWeight: 800, fontSize: 72, marginTop: 24 }}>@{a} vs @{b}</div>
        <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 28, color: "#d6854a", marginTop: 20 }}>scout this battle at the grid</div>
      </div>
    ),
    { width: W, height: H, fonts, headers: CACHE },
  );
}

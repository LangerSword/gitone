import { ImageResponse } from "next/og";
import { loadPosterFonts, publicAssetDataUri } from "./card";
import { fetchDataUri } from "./renderCard";
import { pickPlate } from "./renderCard26";
import { computeDuel, type Duel } from "@/lib/duel";
import { cardDisplayName } from "@/lib/text";
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
function DriverSide({ card, plateSrc, avatar, left, winner }: { card: Card; plateSrc: string | null; avatar: string | null; left: number; winner: boolean }) {
  const CW = 224;
  const CH = Math.round(CW * (820 / 540));
  const name = cardDisplayName(card.name).toUpperCase();
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
    <div style={{ position: "absolute", left, top: 54, width: CW, height: CH, display: "flex" }}>
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
      {winner && (
        <div style={{ position: "absolute", left: 30, top: -12, width: CW - 60, display: "flex", justifyContent: "center", padding: "4px 0", background: "#d6854a", color: "#f0e8d8", fontFamily: "JBMono", fontSize: 9, fontWeight: 800, letterSpacing: 2 }}>
          WINNER
        </div>
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
        <div style={{ display: "flex", fontFamily: "Titillium", fontWeight: 800, fontSize: 42, lineHeight: 1, color: ink }}>{card.rtg}</div>
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
        <div style={{ display: "flex", fontFamily: "Titillium", fontWeight: 800, fontSize: name.length > 12 ? 16 : 19, lineHeight: 1, color: ink, textAlign: "center", maxWidth: CW - 20 }}>{name}</div>
        <div style={{ display: "flex", marginTop: 4, fontFamily: "JBMono", fontSize: 8, fontWeight: 700, letterSpacing: 2, color: withAlpha(ink, 0.72) }}>{card.constructor.name.toUpperCase()}</div>
      </div>
      {/* the full six-stat rail, 3x2 — the poster no longer drops four stats */}
      <div style={{ position: "absolute", left: "10%", width: "80%", top: "70%", display: "flex", flexDirection: "column" }}>
        {[STATS.slice(0, 3), STATS.slice(3)].map((row, r) => (
          <div key={r} style={{ display: "flex", height: 28, borderTop: r === 0 ? "none" : `1px solid ${withAlpha(ink, 0.3)}` }}>
            {row.map((k, i) => (
              <div key={k} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderLeft: i === 0 ? "none" : `1px solid ${withAlpha(ink, 0.3)}` }}>
                <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 7, fontWeight: 700, letterSpacing: 1, color: withAlpha(ink, 0.7) }}>{STAT_LABELS[k]}</div>
                <div style={{ display: "flex", fontFamily: "Titillium", fontWeight: 800, fontSize: 16, lineHeight: 1, color: ink }}>{card.stats[k]}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, width: CW, top: "88%", display: "flex", justifyContent: "center", fontFamily: "JBMono", fontSize: 7, fontWeight: 700, letterSpacing: 2, color: withAlpha(ink, 0.75) }}>GITONE · @{card.login}</div>
    </div>
  );
}

// The sector table carries the site's butterfly bars into the shared poster:
// six rows, each value in its own side's livery, winner marked by a dot and a
// brighter bar. Shared 0-99 scale, label fixed in the middle.
function SectorTable({ duel, aColor, bColor }: { duel: Duel; aColor: string; bColor: string }) {
  return (
    <div style={{ position: "absolute", left: 90, top: 404, width: 1020, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", width: "100%", height: 16, alignItems: "center", justifyContent: "center", fontFamily: "JBMono", fontSize: 9, fontWeight: 700, letterSpacing: 4, color: "#9aa39c" }}>
        SECTOR WINNERS
      </div>
      {duel.rows.map((row) => {
        const aWon = row.winner === "challenger";
        const bWon = row.winner === "opponent";
        const aInk = row.challenger >= 90 ? "#b46bff" : aColor;
        const bInk = row.opponent >= 90 ? "#b46bff" : bColor;
        return (
          <div key={row.key} style={{ display: "flex", width: "100%", height: 20, alignItems: "center", borderBottom: "1px solid rgba(240,232,216,0.07)", background: aWon ? withAlpha(aColor, 0.05) : bWon ? withAlpha(bColor, 0.05) : "transparent" }}>
            <div style={{ display: "flex", width: 44, alignItems: "center", justifyContent: "flex-end", fontFamily: "JBMono", fontSize: 12, fontWeight: 800, color: aInk, opacity: bWon ? 0.72 : 1 }}>
              {aWon && <div style={{ display: "flex", width: 4, height: 4, marginRight: 4, borderRadius: 999, background: aInk }} />}
              {row.challenger}
            </div>
            <div style={{ display: "flex", flex: 1, height: 5, marginLeft: 8, justifyContent: "flex-end", background: "rgba(240,232,216,0.09)" }}>
              <div style={{ display: "flex", width: `${row.challenger}%`, height: 5, background: aInk, opacity: aWon ? 1 : 0.85 }} />
            </div>
            <div style={{ display: "flex", width: 74, justifyContent: "center", fontFamily: "JBMono", fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "#d6d0c2" }}>{row.label}</div>
            <div style={{ display: "flex", flex: 1, height: 5, marginRight: 8, background: "rgba(240,232,216,0.09)" }}>
              <div style={{ display: "flex", width: `${row.opponent}%`, height: 5, background: bInk, opacity: bWon ? 1 : 0.85 }} />
            </div>
            <div style={{ display: "flex", width: 44, alignItems: "center", fontFamily: "JBMono", fontSize: 12, fontWeight: 800, color: bInk, opacity: aWon ? 0.72 : 1 }}>
              {row.opponent}
              {bWon && <div style={{ display: "flex", width: 4, height: 4, marginLeft: 4, borderRadius: 999, background: bInk }} />}
            </div>
          </div>
        );
      })}
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

  const sideW = 224;
  const leftX = 48;
  const rightX = W - leftX - sideW;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0d0f12",
          backgroundImage:
            `radial-gradient(420px 340px at 14% 44%, ${withAlpha(a.constructor.color, 0.16)}, transparent 72%), ` +
            `radial-gradient(420px 340px at 86% 44%, ${withAlpha(b.constructor.color, 0.16)}, transparent 72%), ` +
            "linear-gradient(115deg, rgba(240,232,216,0.02) 1px, transparent 1px), radial-gradient(760px 360px at 50% -12%, rgba(214,133,74,0.14), transparent 62%)",
          backgroundSize: "auto, auto, 28px 28px, auto",
          position: "relative",
          fontFamily: "Titillium",
        }}
      >
        <Checkers y={0} />
        <Checkers y={H - 16} />

        <div style={{ position: "absolute", left: 0, top: 14, width: W, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: "flex", width: 7, height: 7, borderRadius: 999, background: "#d6854a" }} />
          ))}
          <div style={{ display: "flex", marginLeft: 14, fontFamily: "JBMono", fontSize: 17, fontWeight: 700, letterSpacing: 7, color: "#f0e8d8" }}>
            GITONE · HEAD TO HEAD
          </div>
        </div>

        <DriverSide card={a} plateSrc={aPlate} avatar={aAvatar} left={leftX} winner={winnerCard === a} />
        <DriverSide card={b} plateSrc={bPlate} avatar={bAvatar} left={rightX} winner={winnerCard === b} />

        {/* the scoreline between the two full cards */}
        <div style={{ position: "absolute", left: W / 2 - 110, top: 112, width: 220, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", fontFamily: "JBMono", fontSize: 15, fontWeight: 700, letterSpacing: 5, color: "#9aa39c" }}>SECTORS WON</div>
          <div style={{ display: "flex", marginTop: 4, fontSize: 62, fontWeight: 900, lineHeight: 1, color: "#d6854a" }}>{score.challenger}-{score.opponent}</div>
          <div style={{ display: "flex", position: "relative", marginTop: 30, height: 130, alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", left: 8, top: 10, display: "flex", fontSize: 96, fontWeight: 900, fontStyle: "italic", color: "rgba(179,32,44,0.28)" }}>VS</div>
            <div style={{ position: "absolute", left: 4, top: 5, display: "flex", fontSize: 96, fontWeight: 900, fontStyle: "italic", color: "rgba(240,232,216,0.45)" }}>VS</div>
            <div style={{ position: "absolute", left: 0, top: 0, display: "flex", fontSize: 96, fontWeight: 900, fontStyle: "italic", color: "#f0e8d8", textShadow: "0 10px 30px rgba(0,0,0,0.55)" }}>VS</div>
          </div>
        </div>

        <SectorTable duel={duel} aColor={a.constructor.color} bColor={b.constructor.color} />

        <div style={{ position: "absolute", left: 0, bottom: 18, width: W, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Titillium",
              fontWeight: 800,
              fontSize: 42,
              lineHeight: 1,
              letterSpacing: 1,
              color: "#f0e8d8",
              textShadow: "0 6px 24px rgba(0,0,0,0.6)",
            }}
          >
            {headline}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 8 }}>
            <span style={{ display: "flex", fontFamily: "JBMono", fontSize: 16, letterSpacing: 3, color: "#9aa39c" }}>
              {sub}
            </span>
            <span style={{ display: "flex", fontFamily: "JBMono", fontSize: 16, letterSpacing: 2, color: "#d6854a" }}>
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

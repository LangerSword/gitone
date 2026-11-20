"use client";

import Link from "next/link";
import { dominanceShare, tallyRows, type Duel, type DuelRow, type DuelSide } from "@/lib/duel";
import type { Card } from "@/lib/racing/types";
import { formatCount } from "@/lib/format";
import { cardDisplayName } from "@/lib/text";
import { resolvedRows } from "@/lib/reveal";
import { useDuelReveal } from "@/hooks/useDuelReveal";
import { DriverCard26 } from "@/components/DriverCard26";
import { BattleActions } from "@/components/BattleActions";
import { rgba } from "@/components/finishTheme";

/* The versus broadcast, gitfut-style: a phased reveal driven by the pure
   sequencer in lib/reveal. Walkout (both cars enter from their sides) →
   live shootout (sector rows resolve one by one, scoreline + stadium lights
   ticking with them) → chequered flag (the winner banner lands) → settled
   (receipts + share rise). Tap anywhere to skip; reduced motion goes straight
   to settled. One ease vocabulary: cubic-bezier(.16,1,.3,1).

   Layout: one shared max-width container gives the page a single vertical
   spine — fixture, card row, sector table and receipts all share the same
   left/right edges. The two cars hug a real centre column that carries the
   live scoreline (no dead gutter), and every butterfly sector row grows from
   a FIXED centre label on a shared 0–99 scale with identical tracks. */

// A scoreboard digit that pops as a sector goes to one side.
function ScoreDigit({ value, accent }: { value: number; accent: string }) {
  return (
    <span
      key={value}
      className="display inline-block text-[clamp(30px,4.4vw,46px)] leading-none"
      style={{
        color: accent,
        animation: "score-tick .38s cubic-bezier(.16,1,.3,1) both",
      }}
    >
      {value}
    </span>
  );
}

// The live scoreline + dominance split bar. Lives in the centre column between
// the two cars on desktop, above them on mobile. Ticks with resolved rows only.
function Scoreline({
  scoreA,
  scoreB,
  pctA,
  aColor,
  bColor,
}: {
  scoreA: number;
  scoreB: number;
  pctA: number;
  aColor: string;
  bColor: string;
}) {
  return (
    <div className="w-full max-w-[440px]" data-duel-scoreline>
      <div className="flex items-end justify-between">
        <ScoreDigit value={scoreA} accent={aColor} />
        <span className="mono pb-1 text-[10.5px] font-bold tracking-[0.16em]" style={{ color: "var(--dim)" }}>
          SECTORS WON
        </span>
        <ScoreDigit value={scoreB} accent={bColor} />
      </div>
      <div className="mt-1.5 flex h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full"
          style={{ width: `${pctA}%`, background: aColor, transition: "width .7s cubic-bezier(.16,1,.3,1)" }}
        />
        {/* both halves wear their own livery at (near) full strength — the
            split reads by width, never by one side going grey */}
        <div className="h-full flex-1" style={{ background: rgba(bColor, 0.9) }} />
      </div>
    </div>
  );
}

// One sector row as a butterfly bar on a shared 0–99 scale. The centre label
// sits in a FIXED-width column so every row shares one origin; the two tracks
// are flex-1 inside equal 1fr columns, so they are pixel-identical in width and
// grow outward from the centre (left fill right-aligned, right fill left-aligned).
// Values live in fixed-width slots with the winner-dot space reserved in BOTH
// the masked and resolved states, so geometry never shifts as sectors resolve.
const VALUE_SLOT = "flex w-[42px] shrink-0 items-center gap-[6px]";

function SectorRow({
  row,
  resolved,
  aColor,
  bColor,
}: {
  row: DuelRow;
  resolved: boolean;
  aColor: string;
  bColor: string;
}) {
  const delta = row.challenger - row.opponent;

  // Colour rule: a value ALWAYS wears its own side's livery — purple only
  // when it rides the 90+ fastest sector. Winning is shown by the glow + dot,
  // losing by a slight recession, never by switching to a different hue.
  const value = (side: DuelSide) => {
    const won = row.winner === side;
    const lost = row.winner !== null && !won;
    const accent = side === "challenger" ? aColor : bColor;
    const hot = row[side] >= 90;
    const ink = hot ? "var(--purple)" : accent;
    return (
      <span className={`${VALUE_SLOT} ${side === "challenger" ? "" : "flex-row-reverse"}`}>
        <span
          className="mono w-8 text-[15px] font-extrabold"
          style={{
            color: ink,
            opacity: lost ? 0.72 : 1,
            textAlign: side === "challenger" ? "right" : "left",
            textShadow: won ? `0 0 14px ${rgba(hot ? "#b36bff" : accent, 0.65)}` : undefined,
          }}
        >
          {row[side]}
        </span>
        {/* the winner's dot is a non-colour cue too; its space is reserved on
            every row so the bars stay column-aligned as sectors resolve */}
        <span
          aria-hidden
          className="h-[4px] w-[4px] shrink-0 rounded-full"
          style={{
            opacity: won ? 1 : 0,
            background: hot ? "var(--purple)" : accent,
            boxShadow: won ? `0 0 7px ${rgba(hot ? "#b36bff" : accent, 0.55)}` : undefined,
          }}
        />
      </span>
    );
  };

  const masked = (side: DuelSide) => (
    <span className={`${VALUE_SLOT} ${side === "challenger" ? "" : "flex-row-reverse"}`}>
      <span
        aria-hidden
        className="mono w-8 text-[15px] font-extrabold"
        style={{ color: "var(--faint)", textAlign: side === "challenger" ? "right" : "left" }}
      >
        ··
      </span>
      {/* same reserved dot slot as the resolved value, so tracks never shift */}
      <span aria-hidden className="h-[4px] w-[4px] shrink-0 rounded-full" style={{ opacity: 0 }} />
    </span>
  );

  const bar = (side: DuelSide) => {
    const won = row.winner === side;
    const lost = row.winner !== null && !won;
    const accent = side === "challenger" ? aColor : bColor;
    return (
      <div
        data-track={side}
        className="h-[5px] min-w-0 flex-1 overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.07)" }}
      >
        <div
          className="h-full"
          style={{
            width: `${resolved ? row[side] : 0}%`,
            marginLeft: side === "challenger" ? "auto" : undefined,
            // every resolved bar wears its side's livery: full strength for
            // the winner, dimmed for the loser, mid for a level sector.
            background: won ? accent : rgba(accent, lost ? 0.45 : 0.7),
            boxShadow: won ? `0 0 16px ${rgba(accent, 0.7)}, 0 0 5px ${rgba(accent, 0.5)}` : undefined,
            transition: "width .6s cubic-bezier(.16,1,.3,1), background .3s ease",
          }}
        />
      </div>
    );
  };

  return (
    <div
      data-sector-row={row.key}
      className="grid grid-cols-[1fr_92px_1fr] items-center gap-2 border-b py-3 sm:grid-cols-[1fr_128px_1fr] sm:gap-4"
      style={{
        borderColor: "var(--line)",
        background: resolved
          ? row.winner === "challenger"
            ? `${aColor}08`
            : row.winner === "opponent"
              ? `${bColor}08`
              : "transparent"
          : "transparent",
        ...(resolved
          ? { animation: "sector-resolve .45s cubic-bezier(.16,1,.3,1) both" }
          : { opacity: 0.3 }),
      }}
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {resolved ? value("challenger") : masked("challenger")}
        {bar("challenger")}
      </div>
      <div data-sector-centre className="flex flex-col items-center gap-0.5">
        <span className="mono text-[11.5px] font-bold leading-[1.25] tracking-[0.18em]" style={{ color: "var(--dim)" }}>
          {row.label}
        </span>
        <span
          className="mono text-[11px] font-bold leading-[1.25] tracking-[0.08em]"
          style={{
            opacity: resolved ? 1 : 0,
            transition: "opacity .3s ease",
            // one neutral treatment for the whole centre column: green when
            // the challenger takes the sector, faint otherwise — it never
            // competes with the two livery colours.
            color: delta > 0 ? "var(--green)" : "var(--faint)",
          }}
        >
          {delta === 0 ? "LEVEL" : `${delta > 0 ? "+" : ""}${delta}`}
        </span>
      </div>
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {bar("opponent")}
        {resolved ? value("opponent") : masked("opponent")}
      </div>
    </div>
  );
}

// One corner: role label, the car (walkout from its own side), the handle.
// After the flag the winner's car scales up and the loser's corner recedes.
function Corner({
  card,
  role,
  side,
  focus,
  stamped,
}: {
  card: Card;
  role: string;
  side: DuelSide;
  focus: DuelSide | null;
  stamped: boolean;
}) {
  const won = focus === side;
  const lost = focus !== null && !won;
  return (
    <div
      data-corner={side}
      className="flex flex-col items-center gap-3"
      style={{
        opacity: lost ? 0.72 : 1,
        filter: lost ? "saturate(.85)" : undefined,
        transition: "opacity .7s ease, filter .7s ease",
      }}
    >
      <span className="mono text-[11.5px] font-bold tracking-[0.18em]" style={{ color: "var(--faint)" }}>
        {role}
      </span>
      <div
        className="relative w-full max-w-[200px]"
        style={{
          // The walkout owns the transform until the flag (CSS animations
          // out-prioritise inline transforms); it ends at identity, so
          // dropping it at the flag hands over seamlessly to the focus scale.
          animation: stamped
            ? undefined
            : `${side === "challenger" ? "walkout-left" : "walkout-right"} 1s cubic-bezier(.16,1,.3,1) both`,
          transform: won ? "scale(1.06)" : lost ? "scale(0.97)" : undefined,
          transition: "transform .7s cubic-bezier(.16,1,.3,1), filter .7s ease",
          filter: won ? `drop-shadow(0 16px 40px ${card.constructor.color}55)` : undefined,
        }}
      >
        <Link
          href={`/${card.login}`}
          className="block transition-transform duration-300 hover:-translate-y-2"
          aria-label={`${card.name} report`}
        >
          <DriverCard26 card={card} />
        </Link>
        {stamped && (won || lost) && (
          <span
            className="mono absolute -top-2 right-2 z-10 px-1.5 py-0.5 text-[10px] font-extrabold tracking-[0.14em]"
            // P1 wears the winner's own livery (with its contrast ink), so the
            // badge reinforces the side colour instead of adding a new one.
            style={won ? { background: card.constructor.color, color: card.constructor.ink, boxShadow: "0 4px 12px rgba(0,0,0,.5)" } : { background: "rgba(255,255,255,0.12)", color: "var(--dim)", border: "1px solid var(--line)" }}
          >
            {won ? "P1" : "P2"}
          </span>
        )}
      </div>
      <div className="text-center">
        <div className="text-[14px] font-bold leading-tight" style={{ color: "var(--ink)" }}>
          {cardDisplayName(card.name)}
        </div>
        <div className="mono mt-1 text-[11.5px] tracking-[0.12em]" style={{ color: "var(--faint)" }}>
          #{String(card.number).padStart(2, "0")} · RTG <span style={{ color: card.constructor.color }}>{card.rtg}</span>
        </div>
      </div>
    </div>
  );
}

export function DuelView({ duel }: { duel: Duel }) {
  const { challenger, opponent, rows, score, winner, onCountback, testSession } = duel;
  const aColor = challenger.constructor.color;
  const bColor = opponent.constructor.color;

  const { phase, skip } = useDuelReveal(rows.length);
  const settled = phase.kind === "settled";
  const stamped = phase.kind === "result" || settled;
  const shown = resolvedRows(phase, rows.length);

  // Scoreline as currently visible: only rows the shootout has resolved count,
  // so the scoreboard and the stadium lights always agree with what's on screen.
  const visible = rows.slice(0, shown);
  const { a: scoreA, b: scoreB } = tallyRows(visible);
  const pctA = dominanceShare(visible);

  const focus: DuelSide | null = stamped ? winner : null;
  const winnerCard: Card | null =
    winner === "challenger" ? challenger : winner === "opponent" ? opponent : null;
  const resultAccent = winnerCard ? winnerCard.constructor.color : "var(--f1-red)";
  const headlineHex = winnerCard ? winnerCard.constructor.color : "#f5f5f7";

  // The fixture eyebrow names the broadcast, never the result — only the flag
  // banner below says CHEQUERED FLAG, so the headline is never duplicated.
  const status = stamped ? "SCOUT DUEL" : shown === 0 ? "LIGHTS OUT" : "LIVE";

  const shareText = winnerCard
    ? `${cardDisplayName(winnerCard.name)} takes the gitone battle ${score.challenger}-${score.opponent} on sectors. GitHub, rated like a driver.`
    : `Dead heat on the gitone grid: ${score.challenger}-${score.opponent} on sectors. GitHub, rated like a driver.`;

  // Both fixture names share one size — the longer login sets it, shrinking
  // smoothly for long handles so neither side shoves the VS badge off centre.
  const nameLen = Math.max(challenger.login.length, opponent.login.length);
  const nameSize = `clamp(13px, ${Math.min(3.4, 34 / nameLen)}vw, ${Math.min(36, 340 / nameLen)}px)`;

  return (
    <div
      className="stage relative flex-1"
      // Tap-anywhere-to-skip, but never hijack a real control — links and
      // buttons keep their own click.
      onClick={
        settled
          ? undefined
          : (e) => {
              if ((e.target as HTMLElement).closest('a,button,[role="button"]')) return;
              skip();
            }
      }
    >
      {/* Stadium lighting: each corner's livery floods its half and brightens
          as that side takes sectors — then flares for the winner at the flag.
          Draws keep the house lights even. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-y-0 left-0 w-[62%] transition-opacity duration-700"
          style={{
            background: `radial-gradient(85% 70% at 18% 30%, ${rgba(aColor, 0.5)}, transparent 70%)`,
            opacity: 0.28 + scoreA * 0.11 + (focus === "challenger" ? 0.16 : 0),
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-[62%] transition-opacity duration-700"
          style={{
            background: `radial-gradient(85% 70% at 82% 30%, ${rgba(bColor, 0.5)}, transparent 70%)`,
            opacity: 0.28 + scoreB * 0.11 + (focus === "opponent" ? 0.16 : 0),
          }}
        />
      </div>

      {/* ONE shared container: fixture, card row, sector table and receipts all
          span this width, so the page has a single clean vertical spine. */}
      <div data-duel-container className="mx-auto w-full max-w-[960px] px-5 py-7 sm:px-8">
        <header className="relative text-center">
          {/* the start gantry: five lights ignite in sequence during the
              walkout, then go out as the race goes live. The slot height is
              reserved so the header never jumps. */}
          <div className="mb-3 flex h-4 items-center justify-center" aria-hidden>
            {phase.kind === "walkout" && (
              <div className="lights">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="lamp on"
                    style={{ opacity: 0, animation: `light-on .14s ease-out ${0.12 + i * 0.16}s both` }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mb-3 flex items-center justify-center gap-2.5">
            <span aria-hidden className="inline-block h-[3px] w-7" style={{ background: "var(--f1-red)" }} />
            {status === "LIVE" && (
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: "var(--f1-red)" }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--f1-red)" }} />
              </span>
            )}
            <p role="status" aria-live="polite" className="mono text-[11.5px] font-bold tracking-[0.22em]" style={{ color: "var(--dim)" }}>
              {status}
            </p>
            <span aria-hidden className="inline-block h-[3px] w-7" style={{ background: "var(--f1-red)" }} />
          </div>

          {/* the fixture: both handles squaring up around the VS badge */}
          <h1 className="display grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-right leading-[0.95]" style={{ color: aColor, fontSize: nameSize }}>
              {challenger.login.toUpperCase()}
            </span>
            <span
              className="flex h-[clamp(58px,7vw,78px)] w-[clamp(58px,7vw,78px)] items-center justify-center rounded-full"
              style={{
                background: "radial-gradient(circle at 40% 30%, rgba(255,248,234,0.22), rgba(193, 18, 31,0.12) 46%, transparent 72%)",
                border: "1px solid rgba(193, 18, 31,0.38)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 0 34px rgba(193, 18, 31,0.18)",
              }}
            >
              <span className="display text-[clamp(24px,3.4vw,40px)] leading-none" style={{ color: "var(--f1-red)" }}>
                VS
              </span>
            </span>
            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left leading-[0.95]" style={{ color: bColor, fontSize: nameSize }}>
              {opponent.login.toUpperCase()}
            </span>
          </h1>

          {/* the flag banner — its box is reserved from lights out so nothing
              jumps when the result lands. Before the flag it holds the skip hint. */}
          <div role="status" aria-live="polite" className="mt-4 flex min-h-[128px] w-full items-center justify-center">
            {stamped ? (
              <div className="flex w-full flex-col items-center text-center" style={{ animation: "rise-soft .55s cubic-bezier(.16,1,.3,1) both" }}>
                <div className="flex items-center justify-center gap-2.5">
                  <span aria-hidden className="h-px w-[clamp(20px,4vw,40px)]" style={{ background: `linear-gradient(90deg, transparent, ${resultAccent})` }} />
                  <span className="mono text-[11px] font-bold tracking-[0.3em]" style={{ color: resultAccent }}>
                    {testSession ? "TEST SESSION" : onCountback ? "RTG COUNTBACK" : "CHEQUERED FLAG"}
                  </span>
                  <span aria-hidden className="h-px w-[clamp(20px,4vw,40px)]" style={{ background: `linear-gradient(90deg, ${resultAccent}, transparent)` }} />
                </div>

                <div className="relative mt-2">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[150%] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[38px]"
                    style={{ background: `radial-gradient(closest-side, ${rgba(headlineHex, 0.3)}, transparent 72%)` }}
                  />
                  {winnerCard ? (
                    <div
                      className="display text-[clamp(28px,4.6vw,52px)] leading-[0.95]"
                      style={{
                        backgroundImage: `linear-gradient(100deg, ${headlineHex} 0%, ${headlineHex} 42%, #ffffff 50%, ${headlineHex} 58%, ${headlineHex} 100%)`,
                        backgroundSize: "220% 100%",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                        filter: `drop-shadow(0 2px 16px ${rgba(headlineHex, 0.32)})`,
                        animation: "name-shimmer 3s ease-in-out .25s both",
                      }}
                    >
                      {cardDisplayName(winnerCard.name).toUpperCase()} TAKES IT
                    </div>
                  ) : (
                    <div className="display text-[clamp(28px,4.6vw,52px)] leading-[0.95]" style={{ color: "var(--ink)" }}>
                      DEAD HEAT
                    </div>
                  )}
                </div>

                <span
                  className="mt-2 block h-[2.5px] w-[90px] rounded-full"
                  style={{ background: resultAccent, transformOrigin: "center", animation: "underline-draw .55s .18s cubic-bezier(.16,1,.3,1) both" }}
                />

                <p className="mono mt-2 text-[12px] tracking-[0.14em]" style={{ color: "var(--dim)" }}>
                  {testSession
                    ? "SAME DRIVER, BOTH CARS. ALWAYS A DRAW"
                    : winner
                      ? `${score.challenger}-${score.opponent} ON SECTORS${onCountback ? " · RTG COUNTBACK" : ""}`
                      : `${score.challenger}-${score.opponent} ON SECTORS · LEVEL ON RTG`}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={skip}
                className="mono text-[11px] font-bold tracking-[0.18em] transition-colors hover:text-[var(--dim)]"
                style={{ color: "var(--faint)" }}
              >
                TAP ANYWHERE TO SKIP
              </button>
            )}
          </div>
        </header>

        {/* the two cars around a real centre column. On desktop the live
            scoreline sits BETWEEN the cars (no dead gutter); on mobile it
            rises above them and the cars share a tight two-up row. */}
        <div
          data-duel-cards
          className="mt-6 grid grid-cols-2 items-center gap-3 md:grid-cols-[minmax(0,200px)_minmax(0,1fr)_minmax(0,200px)] md:gap-6"
        >
          <Corner card={challenger} role="CHALLENGER" side="challenger" focus={focus} stamped={stamped} />
          <div
            data-duel-centre
            className="order-first col-span-2 flex flex-col items-center gap-3 md:order-none md:col-span-1 md:gap-4"
          >
            <span className="mono text-[11px] font-bold tracking-[0.2em]" style={{ color: "var(--faint)" }}>
              HEAD TO HEAD
            </span>
            <Scoreline scoreA={scoreA} scoreB={scoreB} pctA={pctA} aColor={aColor} bColor={bColor} />
          </div>
          <Corner card={opponent} role="RIVAL" side="opponent" focus={focus} stamped={stamped} />
        </div>

        {/* sector shootout — spans the shared container so its edges line up
            with the fixture and the card row above. */}
        <div data-duel-sectors className="mt-8 w-full border-t" style={{ borderColor: "var(--line)" }}>
          {rows.map((r, i) => (
            <SectorRow key={r.key} row={r} resolved={i < shown} aColor={aColor} bColor={bColor} />
          ))}
        </div>

        {/* receipts + sharing — revealed once the duel settles. visibility
            (not just opacity) keeps the hidden section out of the tab order
            and the a11y tree during the broadcast. */}
        <div
          className="transition-opacity duration-700"
          style={{
            opacity: settled ? 1 : 0,
            visibility: settled ? "visible" : "hidden",
            animation: settled ? "rise-soft .55s cubic-bezier(.16,1,.3,1) both" : undefined,
          }}
        >
          <div data-duel-receipts className="mt-8 w-full border-t pt-4" style={{ borderColor: "var(--line)" }}>
            <div className="flex items-baseline justify-between">
              <p className="mono text-[11.5px] font-bold tracking-[0.2em]" style={{ color: "var(--dim)" }}>
                RACE RECEIPTS · REAL COUNTS
              </p>
            </div>
            {/* one fixed centre column for the header and every row, so the
                left numbers, centre labels and right numbers never drift. */}
            <div className="mt-3 grid grid-cols-[1fr_150px_1fr] items-center border-b pb-2 sm:grid-cols-[1fr_190px_1fr]" style={{ borderColor: "var(--line)" }}>
              <span className="mono justify-self-start text-[11.5px] font-bold tracking-[0.1em]" style={{ color: aColor }}>
                {challenger.constructor.code} · {cardDisplayName(challenger.name).toUpperCase()}
              </span>
              <span className="mono justify-self-center text-[11px] tracking-[0.12em]" style={{ color: "var(--dim)" }}>
                METRIC
              </span>
              <span className="mono justify-self-end text-right text-[11.5px] font-bold tracking-[0.1em]" style={{ color: bColor }}>
                {opponent.constructor.code} · {cardDisplayName(opponent.name).toUpperCase()}
              </span>
            </div>
            <div className="mt-2.5 space-y-2.5">
              {duel.receipts.map((r) => (
                <div key={r.label} className="grid grid-cols-[1fr_150px_1fr] items-baseline sm:grid-cols-[1fr_190px_1fr]">
                  <span className="mono justify-self-start text-[13.5px]" style={{ color: r.challenger >= r.opponent ? "var(--ink)" : "var(--faint)" }} title={challenger.name}>
                    {formatCount(r.challenger)}
                  </span>
                  <span className="mono justify-self-center text-center text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--dim)" }}>
                    {r.label}
                  </span>
                  <span className="mono justify-self-end text-right text-[13.5px]" style={{ color: r.opponent >= r.challenger ? "var(--ink)" : "var(--faint)" }} title={opponent.name}>
                    {formatCount(r.opponent)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-8 w-full max-w-[440px]">
            <BattleActions username={challenger.login} opponent={opponent.login} text={shareText} />
          </div>

          <p className="mono mt-6 text-center text-[11.5px] leading-relaxed tracking-[0.08em]" style={{ color: "var(--dim)" }}>
            EXP EXPERIENCE · RAC RACECRAFT · AWA AWARENESS · PAC PACE · BOTH 90+ READS PURPLE · RTG BREAKS A LEVEL SCORELINE
          </p>
          <p className="mono mt-1.5 text-center text-[11px] leading-relaxed tracking-[0.08em]" style={{ color: "var(--faint)" }}>
            EACH SIDE KEEPS ITS LIVERY COLOUR · <span style={{ color: "var(--green)" }}>GREEN +N</span> = CHALLENGER TAKES THE SECTOR
          </p>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { computeDuel } from "@/lib/duel";
import { loadCard } from "@/lib/scout";
import type { GithubError } from "@/lib/github/client";
import { formatCount } from "@/lib/format";
import { cardDisplayName } from "@/lib/text";
import { SiteHeader } from "@/components/SiteHeader";
import { DriverCard26 } from "@/components/DriverCard26";
import type { Card } from "@/lib/racing/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; opponent: string }>;
}): Promise<Metadata> {
  const { username, opponent } = await params;
  return {
    title: `${username} vs ${opponent}`,
    description: `Head-to-head on the github grid: ${username} against ${opponent}, sector by sector.`,
  };
}

function RedFlag({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-xl px-5 py-28 text-center">
      <div className="lights justify-center" aria-hidden="true">
        <span className="lamp on" />
      </div>
      <h1 className="mono mt-6 text-[13px] font-bold tracking-[0.22em]" style={{ color: "var(--ink)" }}>
        RED FLAG
      </h1>
      <p className="mt-3 text-[14px]" style={{ color: "var(--dim)" }}>
        {message}
      </p>
      <Link
        href="/"
        className="mono mt-8 inline-block px-5 py-3 text-[10px] font-bold tracking-[0.16em]"
        style={{ background: "var(--f1-red)", color: "#fff" }}
      >
        BACK TO THE GRID
      </Link>
    </main>
  );
}

function DuelSide({ card, role, won, href }: { card: Card; role: string; won: boolean; href: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="mono text-[9px] font-bold tracking-[0.2em]" style={{ color: "var(--faint)" }}>
        {role}
      </span>
      <div
        className="relative w-full max-w-[190px]"
        style={won ? { filter: `drop-shadow(0 16px 40px ${card.constructor.color}55)` } : undefined}
      >
        <Link href={href} className="block transition-transform duration-300 hover:-translate-y-2" aria-label={`${card.name} report`}>
          <DriverCard26 card={card} />
        </Link>
        {won && (
          <span className="mono absolute -top-2 right-2 z-10 px-1.5 py-0.5 text-[8.5px] font-extrabold tracking-[0.14em]" style={{ background: "var(--green)", color: "#06180d", boxShadow: "0 4px 12px rgba(0,0,0,.5)" }}>
            P1
          </span>
        )}
      </div>
      <div className="text-center">
        <div className="text-[14px] font-bold leading-tight" style={{ color: "var(--ink)" }}>
          {cardDisplayName(card.name)}
        </div>
        <div className="mono mt-1 text-[9px] tracking-[0.14em]" style={{ color: "var(--faint)" }}>
          #{String(card.number).padStart(2, "0")} · RTG <span style={{ color: card.constructor.color }}>{card.rtg}</span>
        </div>
      </div>
    </div>
  );
}

export default async function VsPage({
  params,
}: {
  params: Promise<{ username: string; opponent: string }>;
}) {
  const { username, opponent } = await params;
  const a = await loadCard(username);
  const b = await loadCard(opponent);

  if ("error" in a || "error" in b) {
    const errRes = "error" in a ? a : (b as { error: GithubError });
    const err = errRes.error;
    if (err.type === "notfound" || err.type === "invalid") notFound();
    return <RedFlag message={err.message} />;
  }

  const duel = computeDuel(a.card, b.card);
  const { rows, score, winner, onCountback, testSession } = duel;
  const challenger = duel.challenger;
  const opp = duel.opponent;
  const winnerCard = winner === "challenger" ? challenger : winner === "opponent" ? opp : null;

  return (
    <main className="min-h-screen">
      <SiteHeader back backHref={`/${challenger.login}`} backLabel="← BACK TO THE REPORT" />

      <div className="stage">
        <div className="mx-auto max-w-[1020px] px-5 py-7 sm:px-8">
          <header className="relative text-center">
            <div className="mb-3 flex items-center justify-center gap-2.5">
              <span aria-hidden className="inline-block h-[3px] w-7" style={{ background: "var(--f1-red)" }} />
              <p className="mono text-[9.5px] font-bold tracking-[0.24em]" style={{ color: "var(--dim)" }}>
                LIGHTS OUT AND AWAY WE GO
              </p>
              <span aria-hidden className="inline-block h-[3px] w-7" style={{ background: "var(--f1-red)" }} />
            </div>
            <h1 className="display text-[clamp(34px,5.2vw,58px)] leading-[0.9]" style={{ color: "var(--ink)" }}>
              {testSession ? (
                "TEST SESSION"
              ) : winner ? (
                <>
                  {cardDisplayName(winnerCard!.name).toUpperCase()}{" "}
                  <span style={{ color: "var(--f1-red)" }}>TAKES IT</span>
                </>
              ) : (
                "DEAD HEAT"
              )}
            </h1>
            <p className="mono mt-3 text-[11px] tracking-[0.14em]" style={{ color: "var(--dim)" }}>
              {testSession
                ? "SAME DRIVER, BOTH CARS — ALWAYS A DRAW"
                : winner
                  ? `${score.challenger}–${score.opponent} ON SECTORS${onCountback ? " · RTG COUNTBACK" : ""}`
                  : `${score.challenger}–${score.opponent} ON SECTORS · LEVEL ON RTG`}
            </p>
          </header>

          {/* the two cars */}
          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-start gap-3 sm:gap-8">
            <DuelSide card={challenger} role="CHALLENGER" won={winner === "challenger"} href={`/${challenger.login}`} />
            <div className="flex h-full flex-col items-center justify-center pt-8">
              <span className="display text-[clamp(24px,3.6vw,42px)] leading-none" style={{ color: "var(--f1-red)" }}>
                VS
              </span>
            </div>
            <DuelSide card={opp} role="RIVAL" won={winner === "opponent"} href={`/${opp.login}`} />
          </div>

          {/* sector shootout */}
          <div className="mx-auto mt-8 w-full max-w-[860px] border-t" style={{ borderColor: "var(--line)" }}>
            {rows.map((r, i) => {
              const aWins = r.challenger > r.opponent;
              const bWins = r.opponent > r.challenger;
              const hotA = r.challenger >= 90;
              const hotB = r.opponent >= 90;
              const delta = r.challenger - r.opponent;
              return (
                <div
                  key={r.key}
                  className="duel-row grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b py-3 sm:gap-6"
                  style={{
                    borderColor: "var(--line)",
                    animationDelay: `${0.15 + i * 0.1}s`,
                    background: aWins ? `${challenger.constructor.color}08` : bWins ? `${opp.constructor.color}08` : "transparent",
                  }}
                >
                  <div className="flex items-center justify-self-start gap-3">
                    <span className="mono w-8 text-right text-[15px] font-extrabold" style={{ color: aWins ? challenger.constructor.color : hotA ? "var(--purple)" : "var(--faint)" }}>
                      {r.challenger}
                    </span>
                    <div className="hidden h-[4px] w-28 overflow-hidden sm:block" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <div className="bar-fill h-full" style={{ width: `${r.challenger}%`, background: aWins ? challenger.constructor.color : "rgba(255,255,255,0.2)" }} />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="mono text-[9px] font-bold tracking-[0.2em]" style={{ color: "var(--dim)" }}>
                      {r.label}
                    </span>
                    <span
                      className="mono text-[8.5px] font-bold tracking-[0.08em]"
                      style={{ color: delta === 0 ? "var(--faint)" : delta > 0 ? "var(--green)" : "var(--faint)" }}
                    >
                      {delta === 0 ? "LEVEL" : `${delta > 0 ? "+" : ""}${delta}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-self-end gap-3">
                    <div className="hidden h-[4px] w-28 overflow-hidden sm:block" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <div className="bar-fill h-full" style={{ width: `${r.opponent}%`, background: bWins ? opp.constructor.color : "rgba(255,255,255,0.2)", marginLeft: "auto" }} />
                    </div>
                    <span className="mono w-8 text-left text-[15px] font-extrabold" style={{ color: bWins ? opp.constructor.color : hotB ? "var(--purple)" : "var(--faint)" }}>
                      {r.opponent}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* receipts */}
          <div className="mx-auto mt-8 w-full max-w-[760px] border-t pt-4" style={{ borderColor: "var(--line)" }}>
            <div className="flex items-baseline justify-between">
              <p className="mono text-[9px] font-bold tracking-[0.22em]" style={{ color: "var(--dim)" }}>
                RACE RECEIPTS · REAL COUNTS
              </p>
              <span className="mono text-[9px] tracking-[0.12em]" style={{ color: "var(--faint)" }}>
                REAL COUNTS
              </span>
            </div>
            <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center border-b pb-2" style={{ borderColor: "var(--line)" }}>
              <span className="mono justify-self-start text-[9px] font-bold tracking-[0.1em]" style={{ color: challenger.constructor.color }}>
                {challenger.constructor.code} · {cardDisplayName(challenger.name).toUpperCase()}
              </span>
              <span className="mono text-[8px] tracking-[0.14em]" style={{ color: "var(--faint)" }}>
                METRIC
              </span>
              <span className="mono justify-self-end text-[9px] font-bold tracking-[0.1em]" style={{ color: opp.constructor.color }}>
                {opp.constructor.code} · {cardDisplayName(opp.name).toUpperCase()}
              </span>
            </div>
            <div className="mt-2 space-y-2">
              {duel.receipts.map((r, i) => (
                <div
                  key={r.label}
                  className="duel-row grid grid-cols-[1fr_auto_1fr] items-baseline"
                  style={{ animationDelay: `${0.8 + i * 0.08}s` }}
                >
                  <span className="mono justify-self-start text-[11.5px]" style={{ color: r.challenger >= r.opponent ? "var(--ink)" : "var(--faint)" }} title={challenger.name}>
                    {formatCount(r.challenger)}
                  </span>
                  <span className="mono text-[8.5px] uppercase tracking-[0.16em]" style={{ color: "var(--faint)" }}>
                    {r.label}
                  </span>
                  <span className="mono justify-self-end text-[11.5px]" style={{ color: r.opponent >= r.challenger ? "var(--ink)" : "var(--faint)" }} title={opp.name}>
                    {formatCount(r.opponent)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="mono mt-8 text-center text-[8.5px] leading-relaxed tracking-[0.12em]" style={{ color: "var(--faint)" }}>
            EXP EXPERIENCE · RAC RACECRAFT · AWA AWARENESS · PAC PACE · BOTH 90+ READS PURPLE · RTG BREAKS A LEVEL SCORELINE
          </p>
        </div>
      </div>
    </main>
  );
}

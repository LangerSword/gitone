import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { computeDuel } from "@/lib/duel";
import { loadCard } from "@/lib/scout";
import type { GithubError } from "@/lib/github/client";
import { formatCount } from "@/lib/format";
import { cardDisplayName } from "@/lib/text";

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
        <span className="on" style={{ background: "radial-gradient(circle at 35% 30%, #ff4a41, #b30400 68%)" }} />
      </div>
      <h1 className="mt-6 mono text-[15px] tracking-[0.2em]" style={{ color: "var(--ink)" }}>
        RED FLAG
      </h1>
      <p className="mt-3 text-[14px]" style={{ color: "var(--dim)" }}>
        {message}
      </p>
      <Link
        href="/"
        className="mono inline-block mt-8 rounded-md px-5 py-3 text-[12px] font-bold tracking-[0.12em]"
        style={{ background: "var(--f1-red)", color: "#fff" }}
      >
        BACK TO THE GRID
      </Link>
    </main>
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
      <header className="border-b" style={{ borderColor: "var(--line)" }}>
        <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-block w-5 h-5 rounded-[3px]" style={{ background: "var(--f1-red)" }} aria-hidden="true" />
            <span className="mono font-extrabold tracking-[0.24em] text-[15px]">GITONE</span>
          </Link>
          <span className="mono text-[11px] tracking-[0.18em]" style={{ color: "var(--faint)" }}>
            RACE CONTROL
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 sm:px-8 py-12">
        {/* result banner */}
        <div className="text-center">
          <p className="eyebrow eyebrow-red">LIGHTS OUT AND AWAY WE GO</p>
          <h1 className="mt-3 font-black leading-none" style={{ fontSize: "clamp(38px, 6vw, 64px)" }}>
            {testSession ? (
              <>test session</>
            ) : winner ? (
              <>
                {cardDisplayName(winnerCard!.name).toUpperCase()}{" "}
                <span style={{ color: "var(--f1-red)" }}>takes it</span>
              </>
            ) : (
              <>dead heat</>
            )}
          </h1>
          <p className="mono mt-4 text-[13px]" style={{ color: "var(--dim)" }}>
            {testSession
              ? "same driver, both cars — always a draw"
              : winner
                ? `${score.challenger}–${score.opponent} on sectors${onCountback ? " · RTG countback" : ""}`
                : `${score.challenger}–${score.opponent} on sectors · level on RTG`}
          </p>
        </div>

        {/* the two cars */}
        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          {[challenger, opp].map((c, i) => {
            const won = winner === (i === 0 ? "challenger" : "opponent");
            return (
              <div
                key={c.login}
                className="duel-row panel rounded-lg overflow-hidden relative"
                style={{ animationDelay: `${0.2 + i * 0.15}s` }}
              >
                <div className="checker h-2" aria-hidden="true" />
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="mono text-[10px] tracking-[0.2em]" style={{ color: "var(--faint)" }}>
                      {i === 0 ? "CHALLENGER" : "RIVAL"}
                    </span>
                    {won && (
                      <span
                        className="mono text-[10px] font-bold tracking-[0.14em] rounded px-2 py-0.5"
                        style={{ background: "var(--green)", color: "#08210f" }}
                      >
                        P1
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <span
                      className="mono font-extrabold text-[26px] w-12 text-center rounded-md"
                      style={{ background: c.constructor.color, color: c.constructor.ink }}
                    >
                      {c.rtg}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/${c.login}`}
                        className="block truncate font-bold text-[17px]"
                        style={{ color: "var(--ink)" }}
                      >
                        {c.name}
                      </Link>
                      <span className="mono text-[11px]" style={{ color: "var(--faint)" }}>
                        #{c.number} · {c.constructor.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* sector shootout */}
        <div className="mt-8 panel rounded-lg overflow-hidden divide-y" style={{ borderColor: "var(--line)" }}>
          {rows.map((r, i) => {
            const aWins = r.winner === "challenger";
            const bWins = r.winner === "opponent";
            const bothHot = r.challenger >= 90 && r.opponent >= 90;
            return (
              <div
                key={r.key}
                className="duel-row grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6 px-4 sm:px-6 py-4"
                style={{ borderColor: "var(--line)", animationDelay: `${0.5 + i * 0.16}s` }}
              >
                <div className="flex items-center gap-3 justify-self-start">
                  <span
                    className="mono w-8 text-right text-[15px] font-extrabold"
                    style={{ color: aWins ? "var(--green)" : bothHot && r.challenger >= 90 ? "var(--purple)" : "var(--faint)" }}
                  >
                    {r.challenger}
                  </span>
                  <div className="hidden sm:block w-24 rounded-full overflow-hidden" style={{ height: 5, background: "rgba(255,255,255,0.07)" }}>
                    <div style={{ width: `${r.challenger}%`, height: "100%", background: aWins ? "var(--green)" : challenger.constructor.color }} />
                  </div>
                </div>
                <span className="mono text-[11px] font-bold tracking-[0.2em]" style={{ color: "var(--dim)" }}>
                  {r.label}
                </span>
                <div className="flex items-center gap-3 justify-self-end">
                  <div className="hidden sm:block w-24 rounded-full overflow-hidden" style={{ height: 5, background: "rgba(255,255,255,0.07)" }}>
                    <div style={{ width: `${r.opponent}%`, height: "100%", background: bWins ? "var(--green)" : opp.constructor.color, marginLeft: "auto" }} />
                  </div>
                  <span
                    className="mono w-8 text-left text-[15px] font-extrabold"
                    style={{ color: bWins ? "var(--green)" : bothHot && r.opponent >= 90 ? "var(--purple)" : "var(--faint)" }}
                  >
                    {r.opponent}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* receipts */}
        <div className="mt-8 panel rounded-lg p-6">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">RACE RECEIPTS · REAL COUNTS</p>
            <span className="mono text-[10px]" style={{ color: "var(--faint)" }}>
              CHALLENGER ◀ ▶ RIVAL
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {duel.receipts.map((r, i) => (
              <div
                key={r.label}
                className="duel-row grid grid-cols-[1fr_auto_1fr] items-baseline mono text-[12.5px]"
                style={{ animationDelay: `${1.2 + i * 0.1}s` }}
              >
                <span
                  className="justify-self-start"
                  style={{ color: r.challenger >= r.opponent ? "var(--ink)" : "var(--faint)" }}
                  title={challenger.name}
                >
                  {formatCount(r.challenger)}
                </span>
                <span className="text-[10px] tracking-[0.16em] uppercase" style={{ color: "var(--faint)" }}>
                  {r.label}
                </span>
                <span
                  className="justify-self-end"
                  style={{ color: r.opponent >= r.challenger ? "var(--ink)" : "var(--faint)" }}
                  title={opp.name}
                >
                  {formatCount(r.opponent)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="mono mt-8 text-center text-[11px]" style={{ color: "var(--faint)" }}>
          HIGHER VALUE TAKES THE SECTOR · BOTH 90+ READS PURPLE · RTG BREAKS A LEVEL SCORELINE
        </p>
      </div>
    </main>
  );
}

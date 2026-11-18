import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DriverCard } from "@/components/DriverCard";
import { TiltCard } from "@/components/TiltCard";
import { Confetti } from "@/components/Confetti";
import { StatRadar } from "@/components/StatRadar";
import { CardActions } from "@/components/CardActions";
import { Reveal } from "@/components/Reveal";
import { loadCard } from "@/lib/scout";
import { pickFlag } from "@/lib/flagPriority";
import { STATS, STAT_LABELS, STAT_NAMES, STAT_COPY } from "@/lib/racing/constants";
import { confettiPalette, resolveCardTheme, statColor } from "@/components/finishTheme";
import { TrophyCabinet } from "@/components/TrophyCabinet";
import { CountryPicker } from "@/components/CountryPicker";
import { formatCount } from "@/lib/format";
import { deEmDash } from "@/lib/text";
import type { Card } from "@/lib/racing/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const res = await loadCard(username);
  if ("error" in res) return { title: username };
  const { card } = res;
  const s = card.stats;
  return {
    title: `${card.name} · RTG ${card.rtg}`,
    description: `${card.name} on the github grid: EXP ${s.exp} · RAC ${s.rac} · AWA ${s.awa} · PAC ${s.pac} — ${card.constructor.name}, ${card.finishLabel.toLowerCase()}.`,
    alternates: { canonical: `/${card.login}` },
  };
}

function ScoutError({ username, message }: { username: string; message: string }) {
  return (
    <main className="mx-auto max-w-xl px-5 py-28 text-center">
      <div className="lights justify-center" aria-hidden="true">
        <span className="on" style={{ background: "radial-gradient(circle at 35% 30%, #ff4a41, #b30400 68%)" }} />
      </div>
      <h1 className="mt-6 mono text-[15px] tracking-[0.2em]" style={{ color: "var(--ink)" }}>
        RED FLAG · @{username}
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

// Laps per week, oldest first — the contribution calendar as lap times,
// with the fastest lap flagged in the timing purple.
function LapChart({ card }: { card: Card }) {
  const weeks = card.recent_calendar ?? [];
  const max = Math.max(1, ...weeks);
  const maxIdx = weeks.indexOf(max);
  const livery = card.constructor.color;
  return (
    <div>
      <div className="flex items-end gap-[3px] h-24" role="img" aria-label="Laps per week over the last season">
        {weeks.map((v, i) => {
          const h = v === 0 ? 8 : Math.max(14, (v / max) * 100);
          const isFL = v > 0 && i === maxIdx;
          return (
            <span
              key={i}
              className="flex-1 rounded-[1px]"
              style={{
                height: `${h}%`,
                background: isFL ? "var(--purple)" : v === 0 ? "rgba(255,255,255,0.06)" : livery,
                opacity: v === 0 || isFL ? 1 : 0.42 + (0.58 * v) / max,
                boxShadow: isFL ? "0 0 10px var(--purple)" : "none",
              }}
            />
          );
        })}
      </div>
      <div className="mono mt-3 flex justify-between text-[10px]" style={{ color: "var(--faint)" }}>
        <span>52 WEEKS AGO</span>
        <span style={{ color: "var(--purple)" }}>FL {max}</span>
        <span>{formatCount(weeks.reduce((s, v) => s + v, 0))} LAPS</span>
        <span>NOW</span>
      </div>
    </div>
  );
}

const POPS = ["podium", "winner", "champion", "founder"] as const;

export default async function DriverPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { username } = await params;
  const sp = await searchParams;
  const res = await loadCard(username);
  if ("error" in res) {
    if (res.error.type === "notfound" || res.error.type === "invalid") notFound();
    return <ScoutError username={username} message={res.error.message} />;
  }
  const { card } = res;
  const theme = resolveCardTheme(card);
  const statColorFor = (v: number) => statColor(v, theme);
  const champagne = POPS.includes(card.finish as (typeof POPS)[number]);
  // The flag a card shows: a manual pick (picker / shared-link ?country=)
  // wins over the GitHub-derived country.
  const override = typeof sp.country === "string" ? sp.country : null;
  const displayFlag = pickFlag(override, card.country);
  const flagged: Card = { ...card, country: displayFlag };

  return (
    <main className="min-h-screen">
      <header className="border-b" style={{ borderColor: "var(--line)" }}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-block w-5 h-5 rounded-[3px]" style={{ background: "var(--f1-red)" }} aria-hidden="true" />
            <span className="mono font-extrabold tracking-[0.24em] text-[15px]">GITONE</span>
          </Link>
          <span className="mono text-[11px] tracking-[0.18em]" style={{ color: "var(--faint)" }}>
            SCOUT REPORT
          </span>
        </div>
      </header>

      <div className="stage">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-12 lg:grid lg:grid-cols-[270px_minmax(0,1fr)_330px] lg:gap-10">
          {/* ── left rail: race craft ──────────────────────────────────── */}
          <aside className="order-2 lg:order-1 space-y-6">
            <Reveal className="glass rounded-xl p-6">
              <p className="eyebrow">RACE NOTES</p>
              <div className="mt-5 space-y-4 text-[13px]" style={{ color: "var(--dim)" }}>
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Wet pace</span>
                    <span className="mono font-bold" style={{ color: "var(--purple)" }}>
                      {card.report.wetPace}/5
                    </span>
                  </div>
                  <div className="mt-2 rounded-full overflow-hidden" style={{ height: 4, background: "rgba(255,255,255,0.07)" }}>
                    <div
                      className="bar-fill"
                      style={{ width: `${card.report.wetPace * 20}%`, height: "100%", background: "var(--purple)" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Tyre management</span>
                    <span className="mono font-bold" style={{ color: "var(--green)" }}>
                      {card.report.tyre}/5
                    </span>
                  </div>
                  <div className="mt-2 rounded-full overflow-hidden" style={{ height: 4, background: "rgba(255,255,255,0.07)" }}>
                    <div
                      className="bar-fill"
                      style={{ width: `${card.report.tyre * 20}%`, height: "100%", background: "var(--green)" }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 pt-1">
                  <span>DRS flap</span>
                  <span
                    className="mono font-bold rounded px-2 py-0.5 text-[11px]"
                    style={{
                      background: card.report.drsOpen ? "rgba(44,198,107,0.14)" : "rgba(255,255,255,0.05)",
                      color: card.report.drsOpen ? "var(--green)" : "var(--faint)",
                    }}
                  >
                    {card.report.drsOpen ? "OPEN" : "CLOSED"}
                  </span>
                </div>
              </div>
              <div className="mt-5 space-y-1.5">
                {(["wetPace", "tyre", "drs"] as const).map((k) => (
                  <p key={k} className="mono text-[11.5px] leading-relaxed" style={{ color: "var(--dim)" }}>
                    {card.report.reasons[k]}
                  </p>
                ))}
              </div>
            </Reveal>

            {card.years && card.years.length > 0 && (
              <Reveal delay={120} className="glass rounded-xl p-6">
                <p className="eyebrow">SEASONS RACED · LAPS BY YEAR</p>
                <div className="mt-4 space-y-3">
                  {card.years
                    .filter((y) => y.commits + y.prs + y.reviews + y.issues + y.restricted > 0)
                    .slice(-7)
                    .map((y) => {
                      const total = y.commits + y.prs + y.reviews + y.issues + y.restricted;
                      const years = card.years!;
                      const max = Math.max(...years.map((yy) => yy.commits + yy.prs + yy.reviews + yy.issues + yy.restricted));
                      const bestYear = years.reduce((a, b) =>
                        (b.commits + b.prs + b.reviews + b.issues + b.restricted) > (a.commits + a.prs + a.reviews + a.issues + a.restricted) ? b : a,
                      );
                      const isBest = y.year === bestYear.year;
                      return (
                        <div key={y.year} className="flex items-center gap-3">
                          <span className="mono text-[11px]" style={{ color: isBest ? "var(--green)" : "var(--faint)", width: 30 }}>
                            {String(y.year).slice(2)}
                          </span>
                          <div
                            className="flex-1 rounded-full overflow-hidden"
                            style={{ height: 8, background: "rgba(255,255,255,0.06)" }}
                          >
                            <div
                              className="bar-fill"
                              style={{
                                width: `${Math.max(3, (total / Math.max(max, 1)) * 100)}%`,
                                height: "100%",
                                background: isBest
                                  ? "linear-gradient(90deg, var(--green), rgba(255,255,255,0.5))"
                                  : `linear-gradient(90deg, ${card.constructor.color}, rgba(255,255,255,0.4))`,
                                boxShadow: isBest ? "0 0 10px rgba(44,198,107,0.45)" : "none",
                              }}
                            />
                          </div>
                          <span className="mono text-[11px]" style={{ color: isBest ? "var(--green)" : "var(--dim)" }}>
                            {formatCount(total)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </Reveal>
            )}

            <Reveal delay={80} className="glass rounded-xl p-6">
              <p className="eyebrow">DRIVER PROFILE</p>
              <div
                className="mt-4 font-bold text-[19px] leading-tight"
                style={{ color: "var(--ink)", textShadow: `0 0 18px ${theme.glow}` }}
              >
                {card.archetype}
              </div>
              <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: "var(--dim)" }}>
                {deEmDash(card.archetypeBlurb)}
              </p>
              <div className="mono mt-5 text-[11px] leading-relaxed" style={{ color: "var(--dim)" }}>
                SCORED LIVE FROM GITHUB&apos;S GRAPHQL API · RE-SCOUTED EVERY 2H ·{" "}
                <a
                  href={`https://github.com/${card.login}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--dim)", textDecoration: "underline", textUnderlineOffset: 3 }}
                >
                  GITHUB PROFILE
                </a>
              </div>
            </Reveal>

            <Reveal delay={100} className="glass rounded-xl p-6">
              <p className="eyebrow">TROPHY CABINET</p>
              <TrophyCabinet awards={card.awards ?? []} />
            </Reveal>
          </aside>

          {/* ── center stage: the card is the light source ─────────────── */}
          <div className="order-1 lg:order-2">
            <div className="relative" style={{ maxWidth: 620, margin: "0 auto" }}>
              {champagne && <Confetti colors={confettiPalette(card, theme)} />}
              <TiltCard>
                <Reveal>
                  <DriverCard card={flagged} />
                </Reveal>
              </TiltCard>
              {/* the flag's editor rides over the card's own flag slot — a
                  sibling of the tilt, so it stays level while the card leans */}
              <CountryPicker login={card.login} value={displayFlag} />
            </div>
            <Reveal delay={120} className="mt-7">
              <div style={{ maxWidth: 620, margin: "0 auto" }}>
                <CardActions login={card.login} />
              </div>
            </Reveal>
          </div>

          {/* ── right rail: the numbers ────────────────────────────────── */}
          <aside className="order-3 mt-10 lg:mt-0 space-y-6">
            <Reveal className="glass rounded-xl p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="eyebrow">TELEMETRY RADAR</p>
                <span className="mono text-[11px]" style={{ color: "var(--faint)" }}>
                  PAC · RAC · EXP · AWA
                </span>
              </div>
              <div className="mt-3 flex justify-center">
                <StatRadar card={card} size={230} />
              </div>
            </Reveal>

            <Reveal delay={60} className="glass rounded-xl p-6">
              <div className="flex items-baseline justify-between">
                <p className="eyebrow">DRIVER RATINGS</p>
                <span className="mono text-[11px]" style={{ color: "var(--faint)" }}>
                  EA-F1 CATEGORIES
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {STATS.map((k) => (
                  <div key={k}>
                    <div className="flex items-baseline justify-between">
                      <span className="mono text-[12px] font-bold" style={{ color: "var(--dim)" }}>
                        {STAT_LABELS[k]} <span style={{ color: "var(--faint)" }}>{STAT_NAMES[k]}</span>
                      </span>
                      <span
                        className="mono text-[15px] font-extrabold"
                        style={{ color: statColorFor(card.stats[k]), textShadow: card.stats[k] >= 90 ? `0 0 12px ${theme.hot}` : "none" }}
                      >
                        {card.stats[k]}
                      </span>
                    </div>
                    <div className="mt-1.5 rounded-full overflow-hidden" style={{ height: 6, background: "rgba(255,255,255,0.07)" }}>
                      <div
                        className="bar-fill"
                        style={{
                          width: `${card.stats[k]}%`,
                          height: "100%",
                          background: `linear-gradient(90deg, ${statColorFor(card.stats[k])}, ${card.constructor.color})`,
                        }}
                      />
                    </div>
                    <p className="mt-1.5 text-[12px]" style={{ color: "var(--dim)" }}>
                      ← {STAT_COPY[k].scouted}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>

            {card.recent_calendar && card.recent_calendar.length > 0 && (
              <Reveal delay={100} className="glass rounded-xl p-6">
                <p className="eyebrow">TELEMETRY · LAPS PER WEEK</p>
                <div className="mt-5">
                  <LapChart card={card} />
                </div>
              </Reveal>
            )}

            <Reveal delay={140} className="glass rounded-xl p-6">
              <div className="flex items-baseline justify-between">
                <p className="eyebrow">CAR SPEC · {card.constructor.name.toUpperCase()}</p>
                <span className="mono text-[15px] font-extrabold" style={{ color: "var(--ink)" }}>
                  CHASSIS {card.car.rating}
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4">
                {(["cor", "top", "aero", "rel"] as const).map((k) => (
                  <div key={k}>
                    <div className="flex items-baseline justify-between">
                      <span className="mono text-[11.5px] font-bold tracking-[0.14em]" style={{ color: "var(--dim)" }}>
                        {k.toUpperCase()}
                      </span>
                      <span className="mono text-[14px] font-bold" style={{ color: "var(--ink)" }}>
                        {card.car[k]}
                      </span>
                    </div>
                    <div className="mt-1.5 rounded-full overflow-hidden" style={{ height: 8, background: "rgba(255,255,255,0.07)" }}>
                      <div
                        className="bar-fill"
                        style={{
                          width: `${Math.max(3, card.car[k])}%`,
                          height: "100%",
                          background: `linear-gradient(90deg, ${card.constructor.color}, ${card.constructor.color}dd 60%, rgba(255,255,255,0.55))`,
                          boxShadow: `0 0 10px ${card.constructor.color}66`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mono mt-5 text-[11px] leading-relaxed" style={{ color: "var(--faint)" }}>
                COR languages · TOP biggest repo · AERO stars owned · REL seasons raced
              </p>
            </Reveal>

            <Reveal delay={180} className="glass rounded-xl p-6">
              <p className="eyebrow">RAW SIGNALS · REAL GITHUB COUNTS</p>
              <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-5">
                {card.report.metrics.map((m) => (
                  <div key={m.label} className="flex items-baseline justify-between gap-3">
                    <span className="text-[13.5px]" style={{ color: "var(--dim)" }}>
                      {m.label}
                    </span>
                    <span className="mono text-[15px] font-bold" style={{ color: "var(--ink)" }}>
                      {formatCount(m.value)}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          </aside>
        </div>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DriverCard } from "@/components/DriverCard";
import { CardActions } from "@/components/CardActions";
import { Reveal } from "@/components/Reveal";
import { loadCard } from "@/lib/scout";
import { STATS, STAT_LABELS, STAT_NAMES, STAT_COPY } from "@/lib/racing/constants";
import { resolveCardTheme, statColor } from "@/components/finishTheme";
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

// Laps per week, oldest first — the contribution calendar as lap times.
function LapChart({ card }: { card: Card }) {
  const weeks = card.recent_calendar ?? [];
  const max = Math.max(1, ...weeks);
  const livery = card.constructor.color;
  return (
    <div>
      <div className="flex items-end gap-[3px] h-20" role="img" aria-label="Laps per week over the last season">
        {weeks.map((v, i) => {
          const h = v === 0 ? 8 : Math.max(14, (v / max) * 100);
          return (
            <span
              key={i}
              className="flex-1 rounded-[1px]"
              style={{
                height: `${h}%`,
                background: v === 0 ? "rgba(255,255,255,0.06)" : livery,
                opacity: v === 0 ? 1 : 0.42 + (0.58 * v) / max,
              }}
            />
          );
        })}
      </div>
      <div className="mono mt-3 flex justify-between text-[10px]" style={{ color: "var(--faint)" }}>
        <span>52 WEEKS AGO</span>
        <span>{formatCount(weeks.reduce((s, v) => s + v, 0))} LAPS</span>
        <span>NOW</span>
      </div>
    </div>
  );
}

export default async function DriverPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const res = await loadCard(username);
  if ("error" in res) {
    if (res.error.type === "notfound" || res.error.type === "invalid") notFound();
    return <ScoutError username={username} message={res.error.message} />;
  }
  const { card } = res;
  const theme = resolveCardTheme(card);
  const statColorFor = (v: number) => statColor(v, theme);

  return (
    <main className="min-h-screen">
      <header className="border-b" style={{ borderColor: "var(--line)" }}>
        <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-block w-5 h-5 rounded-[3px]" style={{ background: "var(--f1-red)" }} aria-hidden="true" />
            <span className="mono font-extrabold tracking-[0.24em] text-[15px]">GITONE</span>
          </Link>
          <span className="mono text-[11px] tracking-[0.18em]" style={{ color: "var(--faint)" }}>
            SCOUT REPORT
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:gap-12">
        {/* ── left: the card ─────────────────────────────────────────── */}
        <div>
          <Reveal>
            <DriverCard card={card} />
          </Reveal>
          <Reveal delay={120} className="mt-6">
            <CardActions login={card.login} />
          </Reveal>
          <Reveal delay={180} className="mt-6 panel rounded-lg p-5">
            <p className="text-[14.5px] leading-relaxed" style={{ color: "var(--dim)" }}>
              <span style={{ color: "var(--ink)" }}>{card.archetype}</span>
              {" — "}
              {deEmDash(card.archetypeBlurb)}
            </p>
            <p className="mono mt-4 text-[11px] leading-relaxed" style={{ color: "var(--faint)" }}>
              SCORED LIVE FROM GITHUB&apos;S GRAPHQL API · RE-SCOUTED EVERY 2H ·
              {" "}
              <a
                href={`https://github.com/${card.login}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--dim)", textDecoration: "underline", textUnderlineOffset: 3 }}
              >
                GITHUB PROFILE
              </a>
            </p>
          </Reveal>
        </div>

        {/* ── right: the numbers ─────────────────────────────────────── */}
        <div className="mt-10 lg:mt-0 space-y-6">
          {/* driver ratings */}
          <Reveal className="panel rounded-lg p-6">
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
                    <span className="mono text-[15px] font-extrabold" style={{ color: statColorFor(card.stats[k]) }}>
                      {card.stats[k]}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 rounded-full overflow-hidden"
                    style={{ height: 6, background: "rgba(255,255,255,0.07)" }}
                  >
                    <div
                      className="bar-fill"
                      style={{ width: `${card.stats[k]}%`, height: "100%", background: statColorFor(card.stats[k]) }}
                    />
                  </div>
                  <p className="mt-1.5 text-[12px]" style={{ color: "var(--faint)" }}>
                    ← {STAT_COPY[k].scouted}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* telemetry */}
          {card.recent_calendar && card.recent_calendar.length > 0 && (
            <Reveal className="panel rounded-lg p-6">
              <p className="eyebrow">TELEMETRY · LAPS PER WEEK</p>
              <div className="mt-5">
                <LapChart card={card} />
              </div>
            </Reveal>
          )}

          {/* the car */}
          <Reveal className="panel rounded-lg p-6">
            <div className="flex items-baseline justify-between">
              <p className="eyebrow">CAR SPEC · {card.constructor.name.toUpperCase()}</p>
              <span className="mono text-[15px] font-extrabold" style={{ color: "var(--ink)" }}>
                CAR {card.car.rating}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4">
              {(["cor", "top", "aero", "rel"] as const).map((k) => (
                <div key={k}>
                  <div className="flex items-baseline justify-between">
                    <span className="mono text-[11px] font-bold tracking-[0.14em]" style={{ color: "var(--dim)" }}>
                      {k.toUpperCase()}
                    </span>
                    <span className="mono text-[13px] font-bold" style={{ color: "var(--ink)" }}>
                      {card.car[k]}
                    </span>
                  </div>
                  <div className="mt-1.5 rounded-full overflow-hidden" style={{ height: 5, background: "rgba(255,255,255,0.07)" }}>
                    <div
                      className="bar-fill"
                      style={{ width: `${card.car[k]}%`, height: "100%", background: card.constructor.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mono mt-5 text-[11px] leading-relaxed" style={{ color: "var(--faint)" }}>
              COR languages · TOP biggest repo · AERO stars owned · REL seasons raced
            </p>
          </Reveal>

          {/* race craft extras */}
          <Reveal className="panel rounded-lg p-6">
            <p className="eyebrow">RACE NOTES</p>
            <div className="mt-4 space-y-3 text-[13px]" style={{ color: "var(--dim)" }}>
              <div className="flex items-center justify-between gap-4">
                <span>Wet pace (language range)</span>
                <span className="mono font-bold" style={{ color: "var(--purple)" }}>
                  {card.report.wetPace}/5
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Tyre management (presence)</span>
                <span className="mono font-bold" style={{ color: "var(--green)" }}>
                  {card.report.tyre}/5
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>DRS</span>
                <span className="mono font-bold" style={{ color: card.report.drsOpen ? "var(--green)" : "var(--faint)" }}>
                  {card.report.drsOpen ? "OPEN" : "CLOSED"}
                </span>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              {(["wetPace", "tyre", "drs"] as const).map((k) => (
                <p key={k} className="mono text-[10.5px] leading-relaxed" style={{ color: "var(--faint)" }}>
                  {card.report.reasons[k]}
                </p>
              ))}
            </div>
          </Reveal>

          {/* raw signals */}
          <Reveal className="panel rounded-lg p-6">
            <p className="eyebrow">RAW SIGNALS · REAL GITHUB COUNTS</p>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
              {card.report.metrics.map((m) => (
                <div key={m.label} className="flex items-baseline justify-between gap-3">
                  <span className="text-[12.5px]" style={{ color: "var(--dim)" }}>
                    {m.label}
                  </span>
                  <span className="mono text-[12.5px] font-bold" style={{ color: "var(--ink)" }}>
                    {formatCount(m.value)}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </main>
  );
}

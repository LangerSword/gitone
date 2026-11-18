import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DriverCard } from "@/components/DriverCard";
import { TiltCard } from "@/components/TiltCard";
import { Confetti } from "@/components/Confetti";
import { ReportHeader, Section, AttributeRow, Tip } from "@/components/dossier";
import { ReportTabs } from "@/components/ReportTabs";
import { CardActions } from "@/components/CardActions";
import { Reveal } from "@/components/Reveal";
import { loadCard } from "@/lib/scout";
import { pickFlag } from "@/lib/flagPriority";
import { confettiPalette, resolveCardTheme } from "@/components/finishTheme";
import { TrophyCabinet } from "@/components/TrophyCabinet";
import { CountryPicker } from "@/components/CountryPicker";
import { formatCount } from "@/lib/format";
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
    description: `${card.name} on the github grid: EXP ${s.exp} · RAC ${s.rac} · AWA ${s.awa} · PAC ${s.pac}. ${card.constructor.name}, ${card.finishLabel.toLowerCase()}.`,
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
  const accent = theme.ink;
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
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-12 lg:grid lg:grid-cols-[280px_minmax(0,1fr)_340px] lg:gap-10">
          {/* ── left rail: race craft ──────────────────────────────────── */}
          <aside className="order-2 lg:order-1 space-y-[14px]">
            <Reveal>
              <Section title="RACE NOTES" accent={accent}>
                <AttributeRow label="Wet pace">
                  <Tip text={card.report.reasons.wetPace} align="right">
                    <span className="mono font-bold" style={{ color: "var(--purple)" }}>
                      {card.report.wetPace}/5
                    </span>
                  </Tip>
                </AttributeRow>
                <AttributeRow label="Tyre management">
                  <Tip text={card.report.reasons.tyre} align="right">
                    <span className="mono font-bold" style={{ color: "var(--green)" }}>
                      {card.report.tyre}/5
                    </span>
                  </Tip>
                </AttributeRow>
                <AttributeRow label="DRS flap">
                  <Tip text={card.report.reasons.drs} align="right">
                    <span
                      className="mono font-bold"
                      style={{ color: card.report.drsOpen ? "var(--green)" : "var(--faint)" }}
                    >
                      {card.report.drsOpen ? "OPEN" : "CLOSED"}
                    </span>
                  </Tip>
                </AttributeRow>
              </Section>
            </Reveal>

            <Reveal delay={60}>
              <Section title="TROPHY CABINET" accent={accent}>
                <TrophyCabinet awards={card.awards ?? []} />
              </Section>
            </Reveal>

            {card.years && card.years.filter((y) => y.commits + y.prs + y.reviews + y.issues + y.restricted > 0).length > 0 && (
              <Reveal delay={110}>
                <Section title="SEASONS RACED" accent={accent}>
                  <div className="space-y-[11px] pt-1">
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
                            <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, background: "rgba(255,255,255,0.06)" }}>
                              <div
                                className="bar-fill"
                                style={{
                                  width: `${Math.max(3, (total / Math.max(max, 1)) * 100)}%`,
                                  height: "100%",
                                  background: isBest
                                    ? "linear-gradient(90deg, var(--green), rgba(255,255,255,0.5))"
                                    : `linear-gradient(90deg, ${card.constructor.color}, rgba(255,255,255,0.4))`,
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
                </Section>
              </Reveal>
            )}
          </aside>

          {/* ── center: the dossier. header, then the card as the light ── */}
          <div className="order-1 lg:order-2">
            <div className="mb-8">
              <ReportHeader card={card} accent={accent} />
            </div>
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
                <p className="mono mt-5 text-center text-[10.5px] tracking-[0.06em]" style={{ color: "var(--faint)" }}>
                  SCORED LIVE FROM GITHUB&apos;S GRAPHQL API · RE-SCOUTED EVERY 2H
                </p>
              </div>
            </Reveal>
          </div>

          {/* ── right rail: one tabbed readout, no long scroll ─────────── */}
          <aside className="order-3 mt-10 lg:mt-0">
            <Reveal delay={60}>
              <ReportTabs card={card} accent={accent} />
            </Reveal>
          </aside>
        </div>
      </div>
    </main>
  );
}

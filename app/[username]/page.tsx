import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { DriverCard26 as DriverCard } from "@/components/DriverCard26";
import { LapTelemetry } from "@/components/LapTelemetry";
import { TiltCard } from "@/components/TiltCard";
import { Confetti } from "@/components/Confetti";
import { ReportHeader, Section, AttributeRow, Tip, TraitChips } from "@/components/dossier";
import { ReportTabs } from "@/components/ReportTabs";
import { CardActions } from "@/components/CardActions";
import { CountryPicker } from "@/components/CountryPicker";
import { TeamPicker } from "@/components/TeamPicker";
import { HowItWorks } from "@/components/HowItWorks";
import { Reveal } from "@/components/Reveal";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SupportPills } from "@/components/SupportPills";
import { GitStrip } from "@/components/GitStrip";
import { WarmOnView } from "@/components/WarmOnView";
import { PersistPrefs } from "@/components/PersistPrefs";
import { loadCard } from "@/lib/scout";
import { pickFlag } from "@/lib/flagPriority";
import { pickTeam } from "@/lib/teams";
import { confettiPalette, resolveCardTheme } from "@/components/finishTheme";
import { TrophyCabinet } from "@/components/TrophyCabinet";
import { formatCount } from "@/lib/format";
import { mergeAwards, overrideAwards } from "@/lib/awards";
import { prefCookie, canWarmQueryVariant } from "@/lib/prefs";
import type { Card } from "@/lib/racing/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const res = await loadCard(username);
  if ("error" in res) {
    const img = `/${username.toLowerCase()}/opengraph-image?ogv=11`;
    return {
      title: username,
      openGraph: { title: `${username} · gitone`, images: [img] },
      twitter: { card: "summary_large_image", title: `${username} · gitone`, images: [img] },
    };
  }
  const { card } = res;
  const s = card.stats;
  const description = `🏎️ ${card.name} is rated ${card.rtg}/99 on gitone — ${card.finishLabel.toLowerCase()} of the GitHub grid. PAC ${s.pac} · RAC ${s.rac} · AWA ${s.awa} · EXP ${s.exp}. Scout yours →`;
  return {
    title: `${card.name} · RTG ${card.rtg}`,
    description,
    alternates: { canonical: `/${card.login}` },
    openGraph: { title: `${card.name} · RTG ${card.rtg} · gitone`, description, images: [`/${card.login}/opengraph-image?ogv=11`] },
    twitter: { card: "summary_large_image", title: `${card.name} · RTG ${card.rtg} · gitone`, description, images: [`/${card.login}/opengraph-image?ogv=11`] },
  };
}

function ScoutError({ username, message }: { username: string; message: string }) {
  return (
    <main className="mx-auto max-w-xl px-5 py-28 text-center">
      <div className="lights justify-center" aria-hidden="true">
        <span className="lamp on" />
      </div>
      <h1 className="mono mt-6 text-[13px] font-bold tracking-[0.22em]" style={{ color: "var(--ink)" }}>
        RED FLAG · @{username}
      </h1>
      <p className="mt-3 text-[14px] leading-relaxed" style={{ color: "var(--dim)" }}>
        {message}
      </p>
      <Link
        href="/"
        className="mono mt-8 inline-block px-5 py-3 text-[11px] font-bold tracking-[0.16em]"
        style={{ background: "var(--f1-red)", color: "#ffffff" }}
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
  const champagne = POPS.includes(card.finish as (typeof POPS)[number]);
  // The query string wins for shared links; otherwise the per-login cookie
  // is the persisted choice, so a returning reader sees their livery and flag
  // on the very first paint (no redirect flash, no account).
  const jar = await cookies();
  const prefCountry = jar.get(prefCookie("country", card.login))?.value ?? null;
  const prefTeam = jar.get(prefCookie("team", card.login))?.value ?? null;
  const override = typeof sp.country === "string" ? sp.country : prefCountry;
  const displayFlag = pickFlag(override, card.country);
  const teamOverride = typeof sp.team === "string" ? sp.team : prefTeam;
  const team = pickTeam(teamOverride);
  const canWarm = canWarmQueryVariant({
    countryQuery: typeof sp.country === "string",
    teamQuery: typeof sp.team === "string",
    cookieCountry: prefCountry,
    cookieTeam: prefTeam,
  });
  const accent = team ? team.color : card.constructor.color;
  const flagged: Card = {
    ...card,
    country: displayFlag,
    ...(team
      ? {
          constructor: {
            language: null,
            name: team.name,
            code: team.code,
            color: team.color,
            ink: team.ink,
          },
        }
      : {}),
  };
  const cabinet = mergeAwards(card.awards ?? [], overrideAwards(team?.code ?? null, displayFlag));
  const raced = (card.years ?? []).filter((y) => y.commits + y.prs + y.reviews + y.issues + y.restricted > 0);
  const maxYear = Math.max(1, ...raced.map((y) => y.commits + y.prs + y.reviews + y.issues + y.restricted));
  const bestYear = raced.reduce(
    (a, b) => (b.commits + b.prs + b.reviews + b.issues + b.restricted > a.commits + a.prs + a.reviews + a.issues + a.restricted ? b : a),
    raced[0] ?? { year: 0, commits: 0, prs: 0, reviews: 0, issues: 0, restricted: 0 },
  );

  return (
    <main className="flex min-h-screen flex-col" style={{ "--livery": accent } as React.CSSProperties}>
      <SiteHeader back />
      {(typeof sp.team === "string" || typeof sp.country === "string") && (
        <PersistPrefs
          login={card.login}
          team={typeof sp.team === "string" ? (team?.code ?? null) : null}
          country={typeof sp.country === "string" ? displayFlag : null}
        />
      )}

      <div className="stage flex-1">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-5 py-8 sm:px-8 lg:grid lg:grid-cols-[248px_minmax(0,1fr)_340px] lg:gap-10 lg:py-3">
          {/* ── left rail: race craft, traits, silverware, seasons ─────── */}
          <aside className="order-2 space-y-6 lg:order-1">
            <Reveal>
              <Section title="RACE CRAFT" accent={accent}>
                <AttributeRow label="Wet pace">
                  <Tip text={card.report.reasons.wetPace} align="right">
                    <span className="mono font-bold" style={{ color: "var(--purple)" }}>{card.report.wetPace}/5</span>
                  </Tip>
                </AttributeRow>
                <AttributeRow label="Tyre management">
                  <Tip text={card.report.reasons.tyre} align="right">
                    <span className="mono font-bold" style={{ color: "var(--green)" }}>{card.report.tyre}/5</span>
                  </Tip>
                </AttributeRow>
                <AttributeRow label="DRS flap">
                  <Tip text={card.report.reasons.drs} align="right">
                    <span className="mono font-bold" style={{ color: card.report.drsOpen ? "var(--green)" : "var(--faint)" }}>
                      {card.report.drsOpen ? "OPEN" : "CLOSED"}
                    </span>
                  </Tip>
                </AttributeRow>
              </Section>
            </Reveal>

            <Reveal delay={50}>
              <Section title="DRIVER TRAITS" accent={accent}>
                <TraitChips card={flagged} accent={accent} />
              </Section>
            </Reveal>

            <Reveal delay={100}>
              <Section
                title="TROPHY CABINET"
                accent={accent}
                aside={<span className="mono text-[11px] tracking-[0.1em]" style={{ color: "var(--faint)" }}>{cabinet.length} HELD</span>}
              >
                <TrophyCabinet awards={cabinet} />
              </Section>
            </Reveal>

            {raced.length > 0 && (
              <Reveal delay={150}>
                <Section title="SEASONS RACED" accent={accent}>
                  <div className="space-y-2 pt-0.5">
                    {raced.slice(-6).map((y) => {
                      const total = y.commits + y.prs + y.reviews + y.issues + y.restricted;
                      const isBest = y.year === bestYear.year;
                      return (
                        <div key={y.year} className="flex items-center gap-2.5">
                          <span className="mono w-7 text-[11px]" style={{ color: isBest ? "var(--green)" : "var(--faint)" }}>
                            {String(y.year).slice(2)}
                          </span>
                          <div className="h-[3px] flex-1 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <div
                              className="bar-fill h-full"
                              style={{
                                width: `${Math.max(3, (total / maxYear) * 100)}%`,
                                background: isBest ? "var(--green)" : accent,
                              }}
                            />
                          </div>
                          <span className="mono w-9 text-right text-[11px]" style={{ color: isBest ? "var(--green)" : "var(--dim)" }}>
                            {formatCount(total)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              </Reveal>
            )}

            <Reveal delay={200}>
              <Section title="CAREER TOTALS" accent={accent}>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {(["laps", "silverware", "grandstand", "mileage"] as const).map((key) => {
                    const metric = card.report.metrics.find((m) => m.label.startsWith(key === "laps" ? "laps" : key));
                    if (!metric) return null;
                    return (
                      <div key={key}>
                        <div className="mono text-[18px] font-extrabold leading-none" style={{ color: "var(--ink)" }}>
                          {formatCount(metric.value)}
                        </div>
                        <div className="mono mt-1 text-[11px] tracking-[0.12em]" style={{ color: "var(--faint)" }}>
                          {metric.label.toUpperCase()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            </Reveal>
          </aside>

          {/* ── centre: the report, then the card as the light ─────────── */}
          <div className="order-1 lg:order-2">
            <div className="mb-3">
              <ReportHeader card={flagged} accent={accent} />
            </div>

            {card.founder?.edition && (
              <div
                className="mx-auto mb-3 flex max-w-[340px] flex-nowrap items-center justify-center gap-2 rounded-[12px] border px-3 py-2"
                style={{ borderColor: "rgba(245,214,123,0.4)", background: "linear-gradient(180deg, rgba(245,214,123,0.12), rgba(245,214,123,0.04))" }}
              >
                <span className="mono whitespace-nowrap text-[12px] font-extrabold tracking-[0.14em]" style={{ color: "#f5d67b" }}>
                  {card.founder.edition}
                </span>
                <span aria-hidden className="h-3 w-px flex-none" style={{ background: "rgba(245,214,123,0.4)" }} />
                <span className="mono whitespace-nowrap text-[9px] tracking-[0.08em]" style={{ color: "var(--dim)" }}>
                  FOUNDERS EDITION · {card.founder.legend?.toUpperCase()}
                </span>
              </div>
            )}

            <div className="relative mx-auto" style={{ width: "clamp(292px, 22vw, 312px)", maxWidth: "100%" }}>
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: "7% 2%",
                  borderRadius: 30,
                  background: `radial-gradient(closest-side, ${accent}30, transparent 72%)`,
                  filter: "blur(30px)",
                  zIndex: 0,
                }}
              />
              {champagne && <Confetti colors={confettiPalette(card, theme)} />}
              <div style={{ position: "relative", zIndex: 1 }}>
                <TiltCard>
                  <Reveal>
                    <DriverCard card={flagged} eager />
                  </Reveal>
                </TiltCard>
              </div>
              <CountryPicker login={card.login} value={displayFlag} />
            </div>

            <div className="mx-auto mt-3 flex max-w-[340px] items-center justify-between gap-2">
              <TeamPicker login={card.login} current={team?.code ?? null} />
              <HowItWorks
                label="HOW IT WORKS ↗"
                className="link-quiet inline-flex min-h-11 items-center"
              />
            </div>

            <Reveal delay={100} className="mt-4">
              <div style={{ maxWidth: 340, margin: "0 auto" }}>
                <CardActions login={card.login} name={card.name} rtg={card.rtg} finishLabel={card.finishLabel} />
                <p className="mono mt-4 text-center text-[10.5px] tracking-[0.14em]" style={{ color: "var(--faint)" }}>
                  SCORED LIVE FROM GITHUB&apos;S GRAPHQL API · RE-SCOUTED EVERY 2H
                </p>
              </div>
            </Reveal>
          </div>

          {/* ── right rail: one tabbed readout, no long scroll ─────────── */}
          <aside className="order-3">
            <Reveal delay={60}>
              <ReportTabs card={flagged} accent={accent} />
            </Reveal>
            <Reveal delay={120}>
              <LapTelemetry a={flagged} accentA={accent} />
            </Reveal>
          </aside>
        </div>
      </div>
      {canWarm && (
        <WarmOnView
          kind="card"
          login={card.login}
          country={typeof sp.country === "string" ? sp.country : null}
          team={typeof sp.team === "string" ? (team?.code ?? null) : null}
          selector='[data-card="f1-26"]'
        />
      )}
      <GitStrip />
      <SiteFooter />
      <SupportPills />
    </main>
  );
}

import type { Metadata } from "next";
import { ScoutForm } from "@/components/ScoutForm";
import { FanCards } from "@/components/FanCards";
import { GitStrip } from "@/components/GitStrip";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SupportPills } from "@/components/SupportPills";
import { TrackBackdrop } from "@/components/TrackBackdrop";
import { MiniCard } from "@/components/MiniCard";
import Mascot from "@/components/Mascot";
import { SAMPLE_CARDS } from "@/lib/racing/samples";
import { getRepoStars } from "@/lib/github/stars";
import { getScoutCount } from "@/lib/analytics";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Static shell, revalidated; the two counts are the only server data and both
// degrade to null. No client fetch on first paint.
export const revalidate = 120;

export default async function Home() {
  const [stars, scoutCount] = await Promise.all([getRepoStars(), getScoutCount()]);

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      <TrackBackdrop />
      <SiteHeader stars={stars} />

      <section className="relative z-10 mx-auto grid w-full max-w-[1240px] flex-1 items-center gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-10 lg:py-2">
        <div className="min-w-0">
          <div className="hero-mascot rise -ml-1 mb-1.5" style={{ "--i": 0 } as React.CSSProperties}>
            <Mascot size={116} />
          </div>
          <div className="rise flex items-center gap-2.5" style={{ "--i": 0 } as React.CSSProperties}>
            <span aria-hidden className="inline-block h-[2px] w-7" style={{ background: "var(--f1-red)" }} />
            <span className="mono text-[10.5px] font-bold tracking-[0.26em]" style={{ color: "var(--dim)" }}>
              GITHUB SCOUT <span style={{ color: "var(--faint)" }}>·</span> SEASON 26
            </span>
          </div>

          <h1
            className="hero-title display rise mt-3 text-[clamp(64px,9vw,118px)] uppercase"
            style={{ "--i": 1, color: "var(--ink)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 0.82 } as React.CSSProperties}
          >
            GET
            <span className="block" style={{ textTransform: "none", fontStyle: "italic", fontWeight: 600, letterSpacing: "0em", color: "var(--f1-red)" }}>
              rated<span style={{ color: "var(--ink)", fontStyle: "normal" }}>.</span>
            </span>
          </h1>

          <p
            className="hero-sub rise mt-5 max-w-[400px] text-[16.5px] leading-[1.5]"
            style={{ "--i": 2, color: "var(--dim)" } as React.CSSProperties}
          >
            Your GitHub, rated out of 99.
          </p>

          <div className="hero-form rise mt-6 max-w-[520px]" style={{ "--i": 3 } as React.CSSProperties}>
            <ScoutForm scoutCount={scoutCount} />
          </div>
        </div>

        <div className="hidden justify-center lg:flex">
          <FanCards />
        </div>

        {/* mobile: one real card, no copy under it */}
        <div className="flex justify-center lg:hidden">
          <MiniCard card={SAMPLE_CARDS.find((c) => c.login === "torvalds")!} label="GOAT" width={228} priority />
        </div>
      </section>

      {/* the scout spec — crawlable, server-rendered. The modal keeps the
          editorial presentation; this band gives search + answer engines the
          actual definitions to quote. No new aesthetic: one quiet band. */}
      <section className="relative z-10 mx-auto w-full max-w-[1240px] flex-none px-5 pb-14 pt-10 sm:px-8">
        <div className="mx-auto max-w-[860px] border-t pt-8" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="inline-block h-[2px] w-7" style={{ background: "var(--f1-red)" }} />
            <h2 className="mono text-[10.5px] font-bold tracking-[0.26em]" style={{ color: "var(--dim)" }}>
              HOW THE SCOUTING WORKS
            </h2>
          </div>
          <p className="mt-4 max-w-[560px] text-[15px] leading-[1.55]" style={{ color: "var(--dim)" }}>
            Every gitone driver card is rated the way the official F1 games rate their grid — four numbers plus a pace-weighted overall, read live from GitHub&apos;s GraphQL API. No surveys, no self-reporting: commits are laps, pull requests are wheel-to-wheel battles, code reviews are racecraft.
          </p>

          <div className="mt-7 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {(
              [
                ["PAC · pace", "Commit velocity — the laps a driver turned this season."],
                ["RAC · racecraft", "Pull requests worked through other fields, battles judged in review."],
                ["AWA · awareness", "Hazards flagged and race-by-race presence across the season."],
                ["EXP · experience", "Seasons on the grid and career mileage."],
              ] as const
            ).map(([label, line]) => (
              <div key={label}>
                <div className="mono text-[11px] font-bold tracking-[0.18em]" style={{ color: "var(--ink)" }}>
                  {label}
                </div>
                <p className="mt-1.5 max-w-[380px] text-[13.5px] leading-[1.5]" style={{ color: "var(--dim)" }}>
                  {line}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-7 max-w-[560px] text-[13.5px] leading-[1.55]" style={{ color: "var(--faint)" }}>
            RTG is the pace-weighted headline out of 99; raw stats cap at 88 and the 90s are a legacy gate bought with years and influence. Every card is embeddable as a live PNG — <span className="mono" style={{ color: "var(--dim)" }}>gitone.langersword.in/&lt;login&gt;.png</span> re-scouts itself every two hours.
          </p>
        </div>
      </section>

      <div aria-hidden className="checker relative z-10 h-[10px] w-full opacity-40" />
      <div className="relative z-10 flex-none">
        <GitStrip />
      </div>

      <SiteFooter />
      <SupportPills />

      {/* structured data — SoftwareApplication so search engines and answer
          engines both resolve what this is, who makes it, and where it lives */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "GitOne",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Web",
            description:
              "Turn any GitHub profile into an F1 26 driver card. EXP, RAC, AWA and PAC scored live from real commits, PRs and reviews, then raced head-to-head.",
            url: "https://gitone.langersword.in",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            sameAs: ["https://github.com/LangerSword/gitone", "https://x.com/langersword"],
            author: { "@type": "Person", name: "Lakshaya Sharma", url: "https://langersword.in" },
          }),
        }}
      />
    </main>
  );
}

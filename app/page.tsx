import type { Metadata } from "next";
import { ScoutForm } from "@/components/ScoutForm";
import { FanCards } from "@/components/FanCards";
import { DriverTicker } from "@/components/DriverTicker";
import { SiteHeader } from "@/components/SiteHeader";
import { TrackBackdrop } from "@/components/TrackBackdrop";
import { MiniCard } from "@/components/MiniCard";
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
          <div className="rise flex items-center gap-2.5" style={{ "--i": 0 } as React.CSSProperties}>
            <span aria-hidden className="inline-block h-[2px] w-7" style={{ background: "var(--f1-red)" }} />
            <span className="mono text-[9.5px] font-bold tracking-[0.26em]" style={{ color: "var(--dim)" }}>
              GITHUB SCOUT <span style={{ color: "var(--faint)" }}>·</span> SEASON 26
            </span>
          </div>

          <h1
            className="rise mt-3 text-[clamp(64px,9vw,118px)] uppercase"
            style={{ "--i": 1, color: "var(--ink)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.78 } as React.CSSProperties}
          >
            GET
            <span className="block" style={{ textTransform: "none", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.03em", color: "var(--amber)" }}>
              rated<span style={{ color: "var(--f1-red)", fontStyle: "normal" }}>.</span>
            </span>
          </h1>

          <p
            className="rise mt-5 max-w-[400px] text-[16.5px] leading-[1.5]"
            style={{ "--i": 2, color: "var(--dim)" } as React.CSSProperties}
          >
            Your GitHub, rated out of 99.
          </p>

          <div className="rise mt-6 max-w-[520px]" style={{ "--i": 3 } as React.CSSProperties}>
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

      <div className="relative z-10 flex-none">
        <DriverTicker />
      </div>

      <footer className="relative z-10 flex-none">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-2 px-5 py-3.5 sm:px-8">
          <span className="mono text-[9.5px] tracking-[0.16em]" style={{ color: "var(--faint)" }}>
            NOT AFFILIATED WITH EA SPORTS, FORMULA 1, OR GITHUB
          </span>
          <span className="mono text-[9.5px] tracking-[0.16em]" style={{ color: "var(--faint)" }}>
            BUILT BY <span style={{ color: "var(--dim)" }}>LAKSHAYA SHARMA</span>
          </span>
        </div>
      </footer>
    </main>
  );
}

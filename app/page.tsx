import Link from "next/link";
import type { Metadata } from "next";
import { ScoutForm } from "@/components/ScoutForm";
import { StartGrid } from "@/components/StartGrid";
import { HeroCard } from "@/components/HeroCard";
import { HowItWorks } from "@/components/HowItWorks";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// A hand-drawn brush stroke, not a CSS border — the one organic accent on
// the page, under the line that matters.
function BrushUnderline() {
  return (
    <svg
      viewBox="0 0 240 14"
      aria-hidden="true"
      style={{ position: "absolute", left: 0, bottom: "-0.12em", width: "100%", height: "0.22em" }}
      preserveAspectRatio="none"
    >
      <path
        d="M3 9.2C43 4.9 98 2.8 150 4.1c24 .6 47 2.2 87 5.4"
        stroke="var(--f1-red)"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="min-h-[100dvh] flex flex-col">
      <header className="border-b flex-none" style={{ borderColor: "var(--line)" }}>
        <nav className="mx-auto max-w-7xl px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-block w-5 h-5 rounded-[3px]" style={{ background: "var(--f1-red)" }} aria-hidden="true" />
            <span className="mono font-extrabold tracking-[0.24em] text-[15px]">GITONE</span>
          </Link>
          <span className="mono text-[11px] tracking-[0.18em]" style={{ color: "var(--faint)" }}>
            THE GITHUB GRID
          </span>
        </nav>
      </header>

      {/* one viewport on desktop: no scroll sections on the landing page */}
      <section className="mx-auto w-full max-w-7xl px-5 sm:px-8 flex-1 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] gap-10 lg:gap-14 items-center py-10">
        <div>
          <p className="eyebrow eyebrow-red">GITHUB IN, DRIVER CARD OUT</p>
          <h1
            className="mt-4 font-black leading-[0.95]"
            style={{ fontSize: "clamp(46px, 6.6vw, 80px)", letterSpacing: "-0.015em" }}
          >
            your github,
            <br />
            <span className="relative inline-block">
              rated like f1.
              <BrushUnderline />
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed" style={{ color: "var(--dim)" }}>
            Any GitHub profile, scored like the F1 games score their grid. Four ratings from real
            commits, PRs and reviews. One card you can embed anywhere.
          </p>
          <div className="mt-7 max-w-xl">
            <ScoutForm />
            <HowItWorks />
          </div>
        </div>
        <div className="hidden lg:block">
          {/* the founder's card belongs on the Product Hunt page, not here.
              The GOAT of the grid gets the hero slot instead. */}
          <HeroCard login="torvalds" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 sm:px-8 flex-none pb-5">
        <StartGrid />
      </section>

      <footer className="flex-none border-t" style={{ borderColor: "var(--line)" }}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-3 flex items-center justify-between">
          <span className="mono text-[10px] tracking-[0.16em]" style={{ color: "var(--faint)" }}>
            NOT AFFILIATED WITH EA SPORTS, FORMULA 1, OR GITHUB
          </span>
          <span className="text-[12px]" style={{ color: "var(--dim)" }}>
            Lakshaya Sharma
          </span>
        </div>
      </footer>
    </main>
  );
}

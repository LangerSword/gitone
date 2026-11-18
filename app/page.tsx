import Link from "next/link";
import type { Metadata } from "next";
import { Flag } from "lucide-react";
import { ScoutForm } from "@/components/ScoutForm";
import { StartGrid } from "@/components/StartGrid";
import { FanCards } from "@/components/FanCards";
import { HowItWorks } from "@/components/HowItWorks";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// A lit-square grid, gitfut's signature bottom texture in F1 red/yellow.
// Fixed decoration: it never adds scroll height.
function TimingGrid() {
  const lit: [number, string][] = [
    [7, "var(--f1-red)"], [23, "var(--f1-yellow)"], [38, "var(--f1-red)"], [54, "var(--purple)"],
    [69, "var(--f1-red)"], [85, "var(--f1-yellow)"], [102, "var(--f1-red)"], [118, "var(--purple)"],
    [133, "var(--f1-red)"], [149, "var(--f1-yellow)"], [166, "var(--f1-red)"], [181, "var(--purple)"],
  ];
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: "auto 0 0 0",
        height: 220,
        opacity: 0.22,
        backgroundImage:
          "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
        backgroundSize: "36px 36px",
        maskImage: "linear-gradient(to bottom, transparent, #000 70%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 70%)",
        pointerEvents: "none",
      }}
    >
      {lit.map(([i, color]) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${(i % 24) * 4.16}%`,
            top: `${Math.floor(i / 24) * 25}%`,
            width: 18,
            height: 18,
            background: color,
            filter: "blur(1px)",
          }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      <TimingGrid />
      <header className="relative z-10 border-b flex-none" style={{ borderColor: "var(--line)" }}>
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

      <section className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8 flex-1 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] gap-8 items-center py-8">
        <div>
          {/* a geometric mark, not an illustration */}
          <div
            className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "rgba(225,6,0,0.12)", border: "1px solid rgba(225,6,0,0.35)" }}
            aria-hidden="true"
          >
            <Flag size={18} style={{ color: "var(--f1-red)" }} strokeWidth={1.8} />
          </div>

          <span
            className="mono inline-block rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.16em]"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--line)", color: "var(--dim)" }}
          >
            GITHUB × F1 26
          </span>

          <h1
            className="mt-4 font-black uppercase leading-[0.9]"
            style={{ fontSize: "clamp(52px, 7vw, 88px)", letterSpacing: "-0.03em" }}
          >
            get rated<span style={{ color: "var(--f1-red)" }}>.</span>
          </h1>
          <p className="mt-4 max-w-lg text-[16px] leading-relaxed" style={{ color: "var(--dim)" }}>
            Your GitHub stats, turned into an F1 26 driver card rated out of 99. Scored live from
            real commits, PRs and reviews.
          </p>

          <div className="mt-6 max-w-lg">
            <ScoutForm />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="mono text-[11px]" style={{ color: "var(--faint)" }}>
              try <span style={{ color: "var(--dim)" }}>torvalds</span> ·{" "}
              <span style={{ color: "var(--dim)" }}>pewdiepie</span> · or your own
            </span>
            <HowItWorks />
          </div>
        </div>
        <div className="hidden lg:flex items-center justify-center">
          {/* no founder card here: the GOAT and the legends own the fan */}
          <FanCards />
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8 flex-none pb-4">
        <StartGrid />
      </section>

      <footer className="relative z-10 flex-none border-t" style={{ borderColor: "var(--line)" }}>
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

import Link from "next/link";
import type { Metadata } from "next";
import { ScoutForm } from "@/components/ScoutForm";
import { StartGrid } from "@/components/StartGrid";
import { Reveal } from "@/components/Reveal";
import { STATS, STAT_COPY, STAT_LABELS, STAT_NAMES, FINISH_LABELS } from "@/lib/racing/constants";
import type { Finish } from "@/lib/racing/types";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const FINISH_FINISHES: { key: Finish; note: string }[] = [
  { key: "rookie", note: "≤64" },
  { key: "points", note: "65–74" },
  { key: "podium", note: "75–84" },
  { key: "winner", note: "85+" },
  { key: "in_form", note: "hot streak" },
  { key: "champion", note: "90+, legacy-gated" },
  { key: "founder", note: "the builder" },
];

const CAR_SPEC: { k: "cor" | "top" | "aero" | "rel"; name: string; from: string }[] = [
  { k: "cor", name: "Cornering", from: "languages on the books" },
  { k: "top", name: "Top speed", from: "biggest repo's stars" },
  { k: "aero", name: "Downforce", from: "total stars owned" },
  { k: "rel", name: "Reliability", from: "seasons without breakdowns" },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* ── hero ─────────────────────────────────────────────────────── */}
      <header className="border-b" style={{ borderColor: "var(--line)" }}>
        <nav className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-block w-5 h-5 rounded-[3px]" style={{ background: "var(--f1-red)" }} aria-hidden="true" />
            <span className="mono font-extrabold tracking-[0.24em] text-[15px]">GITONE</span>
          </Link>
          <span className="mono text-[11px] tracking-[0.18em]" style={{ color: "var(--faint)" }}>
            THE GITHUB GRID
          </span>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 sm:px-8 pt-16 sm:pt-24 pb-14">
        <Reveal>
          <p className="eyebrow eyebrow-red">GITHUB IN, DRIVER CARD OUT</p>
          <h1
            className="mt-4 font-black leading-[0.95]"
            style={{ fontSize: "clamp(46px, 7.2vw, 88px)", letterSpacing: "-0.015em" }}
          >
            your github,
            <br />
            rated like f1.
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed" style={{ color: "var(--dim)" }}>
            Every GitHub profile, scored the way the official F1 games score their grid:
            four ratings read from real commits, PRs and reviews, a livery built from your
            headline language, and a card that embeds anywhere and re-scouts itself.
          </p>
        </Reveal>
        <Reveal delay={120} className="mt-8 max-w-xl">
          <ScoutForm autoFocus />
        </Reveal>
        <Reveal delay={220} className="mt-10">
          <div className="flex items-center gap-6 text-[13px] mono" style={{ color: "var(--faint)" }}>
            <span>EXP · RAC · AWA · PAC</span>
            <span className="hidden sm:inline">— four stats, pace-weighted</span>
          </div>
        </Reveal>
      </section>

      {/* ── the starting grid ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 py-16" id="grid">
        <Reveal>
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="eyebrow">LIVE FROM THE JSON API</p>
              <h2 className="mt-2 font-black text-[34px] sm:text-[40px] leading-none">the starting grid</h2>
            </div>
            <span className="mono text-[11px] hidden sm:block" style={{ color: "var(--faint)" }}>
              SCOUTED ON VIEW · CACHED 2H
            </span>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <StartGrid />
        </Reveal>
      </section>

      {/* ── how the scouting works ───────────────────────────────────── */}
      <section className="border-y" style={{ borderColor: "var(--line)", background: "var(--bg-1)" }}>
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-16">
          <Reveal>
            <p className="eyebrow">HOW THE SCOUTING WORKS</p>
            <h2 className="mt-2 font-black text-[34px] sm:text-[40px] leading-none">
              the four stats, ea&apos;s own definitions
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed" style={{ color: "var(--dim)" }}>
              The F1 games rate every driver on the same four numbers. Here, those numbers are
              read straight from GitHub&apos;s GraphQL API — no surveys, no self-reporting. Just the laps.
            </p>
          </Reveal>
          <Reveal delay={100} className="mt-8">
            <div className="panel rounded-lg overflow-hidden divide-y" style={{ borderColor: "var(--line)" }}>
              {STATS.map((k, i) => (
                <div
                  key={k}
                  className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 px-5 sm:px-7 py-5"
                  style={{ borderColor: "var(--line)" }}
                >
                  <div className="flex md:w-44 items-center gap-4 shrink-0">
                    <span
                      className="mono font-extrabold text-[20px]"
                      style={{ color: k === "pac" ? "var(--purple)" : "var(--ink)" }}
                    >
                      {STAT_LABELS[k]}
                    </span>
                    <span className="mono text-[11px] tracking-[0.1em]" style={{ color: "var(--faint)" }}>
                      {STAT_NAMES[k].toUpperCase()}
                    </span>
                  </div>
                  <p className="flex-1 text-[14.5px] leading-snug" style={{ color: "var(--dim)" }}>
                    {STAT_COPY[k].what}
                  </p>
                  <p className="mono md:w-64 text-[11.5px] md:text-right" style={{ color: "var(--faint)" }}>
                    ← {STAT_COPY[k].scouted}
                  </p>
                  <span className="mono hidden sm:block w-8 text-right text-[11px]" style={{ color: "var(--faint)" }}>
                    {i === 0 ? "×35" : k === "rac" ? "×25" : "×20"}
                  </span>
                </div>
              ))}
            </div>
            <p className="mono mt-4 text-[12px]" style={{ color: "var(--faint)" }}>
              RTG = pace-weighted combination · pace carries the greater weight, like the game · raw
              stats cap at 88 — the 90s are a legacy gate bought with years and influence
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── the car ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 py-16">
        <Reveal>
          <p className="eyebrow">YOUR FOOTPRINT, AS A CHASSIS</p>
          <h2 className="mt-2 font-black text-[34px] sm:text-[40px] leading-none">
            the car gets rated too
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed" style={{ color: "var(--dim)" }}>
            The F1 games rate constructors as well as drivers. Your constructor is your headline
            language — the livery band, the name on the card — and its spec sheet is built from
            the same live GitHub signals.
          </p>
        </Reveal>
        <Reveal delay={100} className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {CAR_SPEC.map(({ k, name, from }) => (
            <div key={k} className="panel rounded-lg p-5">
              <div className="flex items-baseline justify-between">
                <span className="mono text-[11px] font-bold tracking-[0.2em]" style={{ color: "var(--dim)" }}>
                  {k.toUpperCase()}
                </span>
                <span className="mono text-[11px]" style={{ color: "var(--faint)" }}>
                  /99
                </span>
              </div>
              <div className="mt-3 font-bold text-[17px]">{name}</div>
              <div className="mt-1 text-[12.5px]" style={{ color: "var(--faint)" }}>
                {from}
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* ── finishes ─────────────────────────────────────────────────── */}
      <section className="border-y" style={{ borderColor: "var(--line)", background: "var(--bg-1)" }}>
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-14">
          <Reveal>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <p className="eyebrow shrink-0">EVERY CARD WALKS OUT IN A FINISH</p>
              <div className="flex flex-wrap gap-2.5">
                {FINISH_FINISHES.map(({ key, note }) => (
                  <span
                    key={key}
                    className="mono rounded px-2.5 py-1.5 text-[11px] font-bold tracking-[0.14em]"
                    style={{
                      background:
                        key === "in_form" ? "var(--purple)" :
                        key === "champion" ? "#f5d67b" :
                        key === "founder" ? "var(--f1-red)" :
                        key === "winner" ? "#f0a52c" :
                        key === "podium" ? "#e6c35c" :
                        key === "points" ? "#c9ccd4" : "#8e9099",
                      color: key === "points" || key === "rookie" ? "#0c0c0f" : "#0c0c0f",
                    }}
                  >
                    {FINISH_LABELS[key]}
                    <span className="ml-2 opacity-60">{note}</span>
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── embed ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 py-16">
        <Reveal>
          <p className="eyebrow">THE CARD LIVES AT A URL</p>
          <h2 className="mt-2 font-black text-[34px] sm:text-[40px] leading-none">embed it anywhere</h2>
        </Reveal>
        <Reveal delay={100} className="mt-7 grid lg:grid-cols-[1.2fr_1fr] gap-4">
          <div className="panel rounded-lg overflow-hidden">
            <div className="checker h-2" aria-hidden="true" />
            <pre
              className="mono p-5 sm:p-6 text-[12.5px] leading-relaxed overflow-x-auto"
              style={{ color: "var(--dim)" }}
            >
{`[![My gitone card](https://YOUR-HOST/<login>.png)](https://YOUR-HOST/<login>)`}
            </pre>
          </div>
          <div className="panel rounded-lg p-5 sm:p-6">
            <ul className="text-[13px] leading-relaxed space-y-3 mono" style={{ color: "var(--dim)" }}>
              <li>
                <span style={{ color: "var(--ink)" }}>{"<login>.png"}</span> — the card, as a live image
              </li>
              <li>
                <span style={{ color: "var(--ink)" }}>{"<login>"}</span> — the full scout report
              </li>
              <li>
                <span style={{ color: "var(--ink)" }}>{"<login>/vs/<other>"}</span> — head-to-head, lights out
              </li>
              <li>
                <span style={{ color: "var(--ink)" }}>{"/api/card/<login>"}</span> — the raw JSON
              </li>
            </ul>
            <p className="mt-4 text-[12.5px]" style={{ color: "var(--faint)" }}>
              Drop it in a README, a portfolio, anywhere — it re-scouts itself as the stats change.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── footer ───────────────────────────────────────────────────── */}
      <footer className="border-t" style={{ borderColor: "var(--line)" }}>
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="checker inline-block w-6 h-4 rounded-[2px]" aria-hidden="true" />
            <span className="mono text-[11px] tracking-[0.2em]" style={{ color: "var(--faint)" }}>
              GITONE · BUILT BY LANGERSWORD · INSPIRED BY GITFUT
            </span>
          </div>
          <span className="mono text-[10.5px]" style={{ color: "var(--faint)" }}>
            NOT AFFILIATED WITH EA SPORTS, FORMULA 1, OR GITHUB
          </span>
        </div>
      </footer>
    </main>
  );
}

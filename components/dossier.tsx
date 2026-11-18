"use client";

import { useEffect, useState } from "react";
import type { Card, Finish } from "@/lib/racing/types";

// The dossier vocabulary — gitfut's editorial language, translated to the
// paddock: quiet sections (hairline border, barely-there fill, accent dash +
// tracked label — never a boxy dashboard card), a grade-stamp header, metric
// rows that draw themselves, hover tips that explain every value.

// The scout's one-line verdict, the signature of the report.
export const VERDICTS: Record<Finish, string> = {
  champion: "Generational talent",
  winner: "Front-runner",
  in_form: "In form, in demand",
  podium: "Regular points scorer",
  points: "Points on the board",
  rookie: "One to watch",
  founder: "The architect",
};

// A child that fades + lifts into place on mount, staggered by `step`. Honors
// reduced motion (appears instantly).
export function Stagger({ step, children, className }: { step: number; children: React.ReactNode; className?: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const t = setTimeout(() => setShown(true), reduced ? 0 : 90 + step * 110);
    return () => clearTimeout(t);
  }, [step]);
  return (
    <div
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0) scale(1)" : "translateY(10px) scale(.98)",
        transition: "opacity .55s ease, transform .55s cubic-bezier(.16,1,.3,1)",
      }}
    >
      {children}
    </div>
  );
}

// Lightweight hover popup explaining why a value was given.
export function Tip({
  text,
  align = "center",
  children,
}: {
  text: string;
  align?: "left" | "right" | "center";
  children: React.ReactNode;
}) {
  const pos = align === "left" ? "left-0" : align === "right" ? "right-0" : "left-1/2 -translate-x-1/2";
  return (
    <span className="group/tip relative inline-flex cursor-help items-center">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full ${pos} z-30 mb-2 hidden w-max max-w-[220px] whitespace-normal rounded-lg border px-3 py-2 text-left text-[12px] font-normal leading-snug shadow-[0_10px_30px_rgba(0,0,0,.55)] group-hover/tip:block`}
        style={{ borderColor: "rgba(255,255,255,0.1)", background: "#171a20", color: "var(--dim)" }}
      >
        {text}
      </span>
    </span>
  );
}

// Editorial section: an accent dash + tracked label, then content. Reads as a
// page of the dossier rather than a dashboard card.
export function Section({
  title,
  accent,
  className,
  children,
}: {
  title: string;
  accent: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border p-[16px] ${className ?? ""}`}
      style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
    >
      <div className="mb-[8px] flex items-center gap-[9px]">
        <span className="h-[2px] w-[16px] rounded-full" style={{ background: accent }} />
        <h3 className="mono text-[11px] font-bold tracking-[0.22em]" style={{ color: "var(--dim)" }}>
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

// Hairline-divided attribute row — the dossier's list voice.
export function AttributeRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b py-[11px] last:border-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <span className="text-[13.5px]" style={{ color: "var(--dim)" }}>
        {label}
      </span>
      <span className="mono text-[14px] font-bold" style={{ color: "var(--ink)" }}>
        {children}
      </span>
    </div>
  );
}

// A metric row that draws itself: value small + score big in the accent, and
// a bar sweeping to its score on mount, staggered down the list like a live
// telemetry readout.
export function MetricBar({
  label,
  value,
  score,
  accent,
  unit,
  tip,
  index = 0,
}: {
  label: string;
  value: number;
  score: number;
  accent: string;
  unit?: string;
  tip?: string;
  index?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const t = setTimeout(() => setMounted(true), reduced ? 0 : 120 + index * 55);
    return () => clearTimeout(t);
  }, [index]);

  const head = (
    <>
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[13px]" style={{ color: "var(--dim)" }}>
          {label}
        </span>
        <span className="flex items-baseline gap-[6px]">
          <span className="mono text-[12px] tabular-nums" style={{ color: "var(--dim)" }}>
            {value.toLocaleString()}
            {unit ? ` ${unit}` : ""}
          </span>
          <span
            className="mono rounded-md px-2 py-0.5 text-[15px] font-bold leading-none tabular-nums"
            style={{ color: accent, background: `${accent}18`, border: `1px solid ${accent}33` }}
          >
            {score}
          </span>
        </span>
      </span>
      <div className="mt-[7px] h-[3px] overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: mounted ? `${Math.max(score, 4)}%` : "0%",
            background: `linear-gradient(90deg, ${accent}99, ${accent})`,
            transition: "width 900ms ease-out",
          }}
        />
      </div>
    </>
  );

  return (
    <div
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(6px)",
        transition: "opacity .5s ease, transform .5s cubic-bezier(.16,1,.3,1)",
      }}
    >
      {tip ? (
        <Tip text={tip} align="right">
          <div className="flex w-full flex-col">{head}</div>
        </Tip>
      ) : (
        head
      )}
    </div>
  );
}

// Dossier header: a left "grade stamp" (RTG + tier, the verdict-at-a-glance)
// anchors the row; the name paints through a gradient text mask with a slow
// shimmer; the verdict line speaks underneath. No centered stack.
export function ReportHeader({ card, accent }: { card: Card; accent: string }) {
  return (
    <header className="relative mx-auto flex max-w-[620px] items-start gap-[clamp(16px,3vw,28px)]">
      <Stagger step={0} className="shrink-0">
        <div
          className="relative flex h-[clamp(78px,13vw,98px)] w-[clamp(78px,13vw,98px)] flex-col items-center justify-center rounded-2xl border"
          style={{
            borderColor: `${accent}40`,
            background: `linear-gradient(160deg, ${accent}1a, transparent 70%), #0b0c10`,
            boxShadow: `0 0 30px ${accent}1f, inset 0 1px 0 ${accent}26`,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-titillium), sans-serif",
              fontSize: "clamp(34px,6vw,46px)",
              fontWeight: 900,
              lineHeight: 0.82,
              color: accent,
              filter: `drop-shadow(0 1px 8px ${accent}55)`,
            }}
          >
            {card.rtg}
          </span>
          <span className="mono mt-[4px] text-[10px] font-bold tracking-[0.22em]" style={{ color: "var(--dim)" }}>
            {card.finishLabel}
          </span>
        </div>
      </Stagger>

      <div className="min-w-0 flex-1 text-left">
        <Stagger step={1} className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-[6%] top-1/2 -z-10 h-[160%] w-[70%] -translate-y-1/2 rounded-full blur-[42px]"
            style={{ background: `radial-gradient(closest-side, ${accent}26, transparent 72%)` }}
          />
          <h2
            className="truncate"
            style={{
              fontFamily: "var(--font-titillium), sans-serif",
              fontWeight: 900,
              fontSize: "clamp(32px,5.4vw,52px)",
              lineHeight: 0.92,
              backgroundImage: `linear-gradient(100deg, #edeef2 0%, #edeef2 38%, ${accent} 50%, #fff 54%, #edeef2 64%, #edeef2 100%)`,
              backgroundSize: "220% 100%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter: `drop-shadow(0 2px 14px ${accent}38)`,
              animation: "gitone-name-shimmer 4.5s ease-in-out 0.6s both",
            }}
          >
            {card.name}
          </h2>
        </Stagger>

        <Stagger step={2}>
          <div className="mt-[8px] flex flex-wrap items-center gap-x-[10px] gap-y-[6px]">
            <span
              className="mono inline-flex items-center rounded-[6px] border px-[9px] py-[3px] text-[12px] font-bold leading-none tracking-[0.14em]"
              style={{ color: accent, borderColor: `${accent}55`, background: `${accent}14` }}
            >
              #{card.number} · {card.constructor.name.toUpperCase()}
            </span>
            <span className="text-[14px] font-medium" style={{ color: "var(--dim)" }}>
              {card.archetype}
            </span>
            <span className="inline-flex flex-wrap items-center gap-x-[10px] gap-y-[6px]">
              <a
                href={`https://github.com/${card.login}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mono text-[13px] underline-offset-2 transition-colors hover:underline"
                style={{ color: "var(--faint)" }}
              >
                @{card.login}
              </a>
              {card.topLanguage && (
                <span className="inline-flex items-center gap-[6px] text-[13px]" style={{ color: "var(--dim)" }}>
                  <span aria-hidden className="h-[11px] w-px" style={{ background: "rgba(255,255,255,0.15)" }} />
                  {card.topLanguage}
                </span>
              )}
            </span>
          </div>
        </Stagger>

        <Stagger step={3}>
          <p className="mt-[9px] line-clamp-3 text-[13.5px] leading-[1.5]" style={{ color: "var(--dim)" }}>
            <span className="mono mr-[7px] text-[11px] font-bold tracking-[0.18em]" style={{ color: accent }}>
              {VERDICTS[card.finish].toUpperCase()}
            </span>
            {card.archetypeBlurb}.
          </p>
        </Stagger>
      </div>
    </header>
  );
}

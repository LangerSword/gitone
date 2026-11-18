"use client";

import { useEffect, useState } from "react";
import type { Card, Finish } from "@/lib/racing/types";

// The dossier vocabulary — a scouting report, not a dashboard. Sections are
// hairline rules with a tracked label, never boxes; values carry a tip that
// explains the number; the header is a rating stamp plus the driver's name.

export const VERDICTS: Record<Finish, string> = {
  champion: "Generational talent",
  winner: "Front-runner",
  in_form: "In form, in demand",
  podium: "Regular points scorer",
  points: "Points on the board",
  rookie: "One to watch",
  founder: "The architect",
};

export function Stagger({ step, children, className }: { step: number; children: React.ReactNode; className?: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const t = setTimeout(() => setShown(true), reduced ? 0 : 60 + step * 80);
    return () => clearTimeout(t);
  }, [step]);
  return (
    <div
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(10px)",
        transition: "opacity .5s ease, transform .5s cubic-bezier(.16,1,.3,1)",
      }}
    >
      {children}
    </div>
  );
}

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
        className={`pointer-events-none absolute bottom-full ${pos} z-30 mb-2 hidden w-max max-w-[230px] whitespace-normal border px-3 py-2 text-left text-[12px] font-normal leading-snug group-hover/tip:block`}
        style={{ borderColor: "var(--line-bright)", background: "#14171c", color: "var(--dim)", boxShadow: "0 16px 40px rgba(0,0,0,.55)" }}
      >
        {text}
      </span>
    </span>
  );
}

// A rule, a tracked label, then content. No panel, no radius.
export function Section({
  title,
  accent,
  className,
  children,
  aside,
}: {
  title: string;
  accent: string;
  className?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className={`border-t pt-3.5 ${className ?? ""}`} style={{ borderColor: "var(--line)" }}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-[2px] w-4" style={{ background: accent }} />
          <h3 className="mono text-[10px] font-bold tracking-[0.22em]" style={{ color: "var(--dim)" }}>
            {title}
          </h3>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function AttributeRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b py-[10px] last:border-0" style={{ borderColor: "var(--line)" }}>
      <span className="text-[13px]" style={{ color: "var(--dim)" }}>
        {label}
      </span>
      <span className="mono text-[13.5px] font-bold" style={{ color: "var(--ink)" }}>
        {children}
      </span>
    </div>
  );
}

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
    const t = setTimeout(() => setMounted(true), reduced ? 0 : 100 + index * 50);
    return () => clearTimeout(t);
  }, [index]);

  const head = (
    <>
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[12.5px]" style={{ color: "var(--dim)" }}>
          {label}
        </span>
        <span className="flex items-baseline gap-2">
          <span className="mono text-[11px] tabular-nums" style={{ color: "var(--faint)" }}>
            {value.toLocaleString()}
            {unit ? ` ${unit}` : ""}
          </span>
          <span className="mono text-[15px] font-extrabold leading-none tabular-nums" style={{ color: score >= 90 ? "var(--purple)" : accent }}>
            {score}
          </span>
        </span>
      </span>
      <div className="mt-[6px] h-[2px] overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div
          className="h-full"
          style={{
            width: mounted ? `${Math.max(score, 3)}%` : "0%",
            background: score >= 90 ? "var(--purple)" : accent,
            transition: "width 800ms cubic-bezier(.22,.9,.2,1)",
          }}
        />
      </div>
    </>
  );

  return (
    <div
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "none" : "translateY(5px)",
        transition: "opacity .45s ease, transform .45s cubic-bezier(.16,1,.3,1)",
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

// Driver traits, read off the card's own data. These are the paddock's
// playstyles: each one is a condition on a real rating, never decoration.
export function TraitChips({ card, accent }: { card: Card; accent: string }) {
  const traits: string[] = [];
  if (card.stats.pac >= 90) traits.push("QUALI MONSTER");
  if (card.stats.rac >= 85) traits.push("LATE BRAKER");
  if (card.stats.awa >= 85) traits.push("CLEAN AIR");
  if (card.report.wetPace >= 4) traits.push("WET WEATHER");
  if (card.report.tyre >= 4) traits.push("TYRE WHISPERER");
  if (card.report.drsOpen) traits.push("DRS OPEN");
  if (card.car.rel >= 85) traits.push("IRONMAN");
  if (traits.length === 0) traits.push("FINDING THE LIMIT");

  return (
    <div className="flex flex-wrap gap-1.5">
      {traits.map((t) => (
        <span
          key={t}
          className="mono inline-flex items-center gap-1.5 border px-2 py-1 text-[8.5px] font-bold tracking-[0.14em]"
          style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--dim)", background: "rgba(255,255,255,0.025)" }}
        >
          <span aria-hidden className="h-[4px] w-[4px] rounded-full" style={{ background: accent }} />
          {t}
        </span>
      ))}
    </div>
  );
}

// The report header: a rating stamp in the livery, the name at full weight,
// then the tags and the verdict. No shimmer, no centred stack.
export function ReportHeader({ card, accent }: { card: Card; accent: string }) {
  return (
    <header className="relative mx-auto flex max-w-[680px] items-start gap-[clamp(14px,2.6vw,24px)]">
      <Stagger step={0} className="shrink-0">
        <div
          className="relative flex h-[clamp(80px,12vw,100px)] w-[clamp(80px,12vw,100px)] flex-col items-center justify-center"
          style={{
            border: `1px solid ${accent}55`,
            background: `linear-gradient(150deg, ${accent}22, transparent 68%), #0c0e11`,
            boxShadow: `0 0 34px ${accent}18, inset 0 1px 0 ${accent}2e`,
            borderRadius: 18,
          }}
        >
          <span className="display" style={{ fontSize: "clamp(36px,6vw,50px)", lineHeight: 0.78, color: "#fff", textShadow: `0 0 18px ${accent}55` }}>
            {card.rtg}
          </span>
          <span className="mono mt-1.5 text-[9px] font-bold tracking-[0.2em]" style={{ color: accent }}>
            {card.finishLabel}
          </span>
        </div>
      </Stagger>

      <div className="min-w-0 flex-1">
        <Stagger step={1}>
          <div className="mono flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold tracking-[0.16em]" style={{ color: "var(--faint)" }}>
            <span style={{ color: accent }}>#{String(card.number).padStart(2, "0")}</span>
            <span aria-hidden>·</span>
            <span>{card.constructor.name.toUpperCase()}</span>
            <span aria-hidden>·</span>
            <a
              href={`https://github.com/${card.login}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[var(--ink)]"
            >
              @{card.login}
            </a>
          </div>
        </Stagger>

        <Stagger step={2}>
          <h2 className="display mt-1.5 text-[clamp(30px,4.2vw,44px)] leading-[0.9]" style={{ color: "var(--ink)", textWrap: "balance" }}>
            {card.name}
          </h2>
        </Stagger>

        <Stagger step={3}>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="text-[13.5px] font-semibold" style={{ color: accent }}>
              {card.archetype}
            </span>
            <span aria-hidden className="h-[11px] w-px" style={{ background: "var(--line-bright)" }} />
            <p className="line-clamp-2 max-w-[440px] text-[12.5px] leading-snug" style={{ color: "var(--dim)" }}>
              <span className="mono mr-1.5 text-[9.5px] font-bold tracking-[0.16em]" style={{ color: "var(--faint)" }}>
                {VERDICTS[card.finish].toUpperCase()}
              </span>
              {card.archetypeBlurb}.
            </p>
          </div>
        </Stagger>
      </div>
    </header>
  );
}

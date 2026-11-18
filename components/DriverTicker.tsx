import Link from "next/link";
import { SAMPLE_CARDS } from "@/lib/racing/samples";

// A broadcast lower-third instead of a wall of cards: every driver, their
// rating and their pace, running in one slow loop. Real snapshot data.
export function DriverTicker() {
  const row = [...SAMPLE_CARDS, ...SAMPLE_CARDS];

  return (
    <section aria-label="Rated drivers" className="ticker relative overflow-hidden border-y" style={{ borderColor: "var(--line)" }}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16" style={{ background: "linear-gradient(90deg, var(--bg-0), transparent)" }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16" style={{ background: "linear-gradient(270deg, var(--bg-0), transparent)" }} />
      <div className="ticker-track flex w-max items-center">
        {row.map((card, i) => (
          <Link
            key={`${card.login}-${i}`}
            href={`/${card.login}`}
            className="group flex flex-none items-center gap-2.5 px-5 py-3.5"
            aria-hidden={i >= SAMPLE_CARDS.length}
            tabIndex={i >= SAMPLE_CARDS.length ? -1 : 0}
          >
            <span aria-hidden className="h-[6px] w-[6px] rounded-full" style={{ background: card.constructor.color }} />
            <span className="mono text-[10px] font-bold tracking-[0.14em] transition-colors group-hover:text-[var(--ink)]" style={{ color: "var(--dim)" }}>
              {card.login.toUpperCase()}
            </span>
            <span className="mono text-[12px] font-extrabold" style={{ color: card.constructor.color }}>
              {card.rtg}
            </span>
            <span className="mono text-[8.5px] tracking-[0.12em]" style={{ color: "var(--faint)" }}>
              {card.stats.pac} PAC
            </span>
            <span aria-hidden className="ml-1 text-[10px]" style={{ color: "var(--line-bright)" }}>
              /
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Card } from "@/lib/racing/types";

// The starting grid: famous devs scouted live through the JSON API, ranked
// by RTG like a timing tower. Each row lands as its scout returns, then the
// grid re-sorts; P1 takes the inside line.
const DRIVERS = [
  "torvalds",
  "yyx990803",
  "gaearon",
  "sindresorhus",
  "antfu",
  "tj",
  "ThePrimeagen",
  "kentcdodds",
  "ry",
  "langersword",
];

export function StartGrid() {
  const [cards, setCards] = useState<Card[]>([]);
  const [failed, setFailed] = useState(0);

  useEffect(() => {
    let alive = true;
    // Staggered: don't stampede the API with ten parallel scouts.
    DRIVERS.forEach((login, i) => {
      setTimeout(async () => {
        try {
          const res = await fetch(`/api/card/${login}`);
          if (!res.ok) throw new Error(String(res.status));
          const card = (await res.json()) as Card;
          if (!alive) return;
          setCards((prev) => [...prev, card]);
        } catch {
          if (alive) setFailed((n) => n + 1);
        }
      }, i * 260);
    });
    return () => {
      alive = false;
    };
  }, []);

  const grid = [...cards].sort((a, b) => b.rtg - a.rtg);
  const done = cards.length + failed === DRIVERS.length;

  return (
    <div className="panel rounded-lg overflow-hidden">
      <div className="checker h-2" aria-hidden="true" />
      {grid.map((c, i) => (
        <Link
          key={c.login}
          href={`/${c.login}`}
          className="duel-row flex items-center gap-3 sm:gap-5 px-4 sm:px-6 transition-colors hover:bg-white/[0.03]"
          style={{
            minHeight: 52,
            borderBottom: "1px solid var(--line)",
            animationDelay: `${Math.min(i * 0.05, 0.4)}s`,
          }}
        >
          <span
            className="mono w-9 shrink-0 text-right text-[13px] font-bold"
            style={{ color: i === 0 ? "var(--f1-red)" : "var(--dim)" }}
          >
            P{i + 1}
          </span>
          <span
            className="shrink-0 w-1.5 self-stretch min-h-10"
            style={{ background: c.constructor.color, marginTop: 6, marginBottom: 6 }}
            aria-hidden="true"
          />
          <span className="mono hidden sm:block w-10 shrink-0 text-[11px]" style={{ color: "var(--faint)" }}>
            {c.constructor.code}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block truncate text-[15px] font-bold" style={{ color: "var(--ink)" }}>
              {c.name}
            </span>
            <span className="mono block text-[11px] truncate" style={{ color: "var(--faint)" }}>
              @{c.login} · {c.constructor.name}
            </span>
          </span>
          <span
            className="mono hidden md:block w-28 text-right text-[10px] font-bold tracking-[0.14em]"
            style={{ color: "var(--dim)" }}
          >
            {c.finishLabel}
          </span>
          <span
            className="mono shrink-0 text-[13px] font-extrabold"
            style={{ color: c.rtg >= 90 ? "var(--purple)" : "var(--ink)" }}
          >
            {c.rtg}
          </span>
        </Link>
      ))}
      {!done && (
        <div className="flex items-center gap-3 px-6 min-h-12">
          <div className="lights" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="on"
                style={{
                  animation: `light-on 0.9s ease-in-out ${i * 0.3}s infinite alternate`,
                  background: "radial-gradient(circle at 35% 30%, #55565e, #232429 68%)",
                  boxShadow: "none",
                }}
              />
            ))}
          </div>
          <span className="mono text-[12px]" style={{ color: "var(--faint)" }}>
            scouts returning… {cards.length}/{DRIVERS.length}
          </span>
        </div>
      )}
      {done && failed > 0 && (
        <div className="mono px-6 py-3 text-[11px]" style={{ color: "var(--faint)" }}>
          {failed} scout{failed > 1 ? "s" : ""} failed — the grid shows the ones that returned.
        </div>
      )}
      {done && cards.length === 0 && (
        <div className="mono px-6 py-8 text-[12px]" style={{ color: "var(--dim)" }}>
          No scouts returned. The API may be rate-limited — try again shortly.
        </div>
      )}
    </div>
  );
}

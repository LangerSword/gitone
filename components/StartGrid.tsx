"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, Sparkles } from "lucide-react";
import type { Card } from "@/lib/racing/types";
import { FINISH_LABELS } from "@/lib/racing/constants";

// The grid legends: popular accounts scouted live. No founder cards here.
// Linus is pinned P1 as the GOAT; PewDiePie wears the legend marker — the man
// who put half of us on Linux.
const LEGENDS = [
  "torvalds",
  "pewdiepie-archdaemon",
  "sindresorhus",
  "gaearon",
  "yyx990803",
  "antfu",
  "ThePrimeagen",
  "t3dotgg",
  "kentcdodds",
  "ry",
];

export function StartGrid() {
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    let alive = true;
    LEGENDS.forEach((login, i) => {
      setTimeout(async () => {
        try {
          const res = await fetch(`/api/card/${login}`);
          if (!res.ok) return;
          const card = (await res.json()) as Card;
          if (alive) setCards((prev) => [...prev, card]);
        } catch {}
      }, i * 180);
    });
    return () => {
      alive = false;
    };
  }, []);

  const sorted = [...cards].sort((a, b) => b.rtg - a.rtg);
  // Pinned chips exist from the first paint: the GOAT and Felix must never
  // be absent while ten live scouts are still in flight.
  const cardFor = (login: string) => sorted.find((c) => c.login.toLowerCase() === login.toLowerCase());
  const goatCard = cardFor("torvalds");
  const ordered = ["torvalds", ...LEGENDS.filter((l) => l !== "torvalds")].map((login) => ({
    login,
    card: cardFor(login),
  }));

  return (
    <div>
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="font-black text-[19px] leading-none">the grid legends</h2>
        <span className="mono text-[10px]" style={{ color: "var(--faint)" }}>
          SCOUTED LIVE
        </span>
      </div>
      <div
        className="flex gap-2.5 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "thin", scrollSnapType: "x proximity" }}
      >
        {ordered.map(({ login, card: c }, i) => {
          const isGoat = login.toLowerCase() === "torvalds";
          const isFelix = login.toLowerCase() === "pewdiepie-archdaemon";
          const name = c?.name ?? (isFelix ? "PewDiePie" : login);
          return (
            <Link
              key={login}
              href={`/${login}`}
              title={`${name}${c ? ` · RTG ${c.rtg} · ${FINISH_LABELS[c.finish]}` : " · scouting…"}`}
              className="group flex min-w-[170px] flex-none flex-col gap-2 rounded-xl border p-3 transition-transform hover:-translate-y-0.5"
              style={{
                background: "var(--panel)",
                borderColor: isGoat ? "rgba(255,209,0,0.5)" : "var(--line)",
                boxShadow: isGoat
                  ? "inset 0 0 0 1px rgba(255,209,0,0.12), 0 0 26px -12px rgba(255,209,0,0.4)"
                  : "none",
                scrollSnapAlign: "start",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="mono text-[10px] font-bold"
                  style={{ color: isGoat ? "var(--f1-yellow)" : isFelix ? "var(--purple)" : "var(--faint)" }}
                >
                  {isGoat ? "P1 · GOAT" : isFelix ? "LEGEND" : `P${i + 1}`}
                </span>
                {isGoat ? (
                  <Crown size={14} style={{ color: "var(--f1-yellow)", fill: "rgba(255,209,0,0.3)" }} />
                ) : isFelix ? (
                  <Sparkles size={13} style={{ color: "var(--purple)" }} />
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-1 self-stretch rounded-full"
                  style={{ background: c?.constructor.color ?? "var(--f1-red)", minHeight: 24 }}
                />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold" style={{ color: "var(--ink)" }}>
                    {name}
                  </span>
                  <span className="mono block truncate text-[10px]" style={{ color: "var(--faint)" }}>
                    @{login}
                  </span>
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="mono text-[10px]" style={{ color: "var(--faint)" }}>
                  {c?.finishLabel ?? "SCOUTING"}
                </span>
                <span
                  className="mono text-[17px] font-extrabold"
                  style={{ color: (c?.rtg ?? 0) >= 90 ? "var(--f1-yellow)" : "var(--ink)" }}
                >
                  {c?.rtg ?? "—"}
                </span>
              </div>
            </Link>
          );
        })}
        {cards.length === 0 && (
          <div className="mono py-6 text-[11px]" style={{ color: "var(--faint)" }}>
            SCOUTING THE LEGENDS…
          </div>
        )}
      </div>
    </div>
  );
}

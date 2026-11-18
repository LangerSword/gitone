"use client";

import { useEffect, useState } from "react";
import type { Card } from "@/lib/racing/types";
import { MiniCard } from "./MiniCard";

// The official-ratings-style showcase: the accounts gitfut puts on its wall,
// plus Felix. Linus is pinned P1 as the GOAT; PewDiePie wears LEGEND.
const LEGENDS = [
  { login: "torvalds", label: "GOAT" as const },
  { login: "pewdiepie-archdaemon", label: "LEGEND" as const },
  { login: "sindresorhus" },
  { login: "gaearon" },
  { login: "yyx990803" },
  { login: "antfu" },
  { login: "ThePrimeagen" },
  { login: "t3dotgg" },
  { login: "kentcdodds" },
  { login: "ry" },
];

export function StartGrid() {
  const [cards, setCards] = useState<Record<string, Card>>({});

  useEffect(() => {
    let alive = true;
    LEGENDS.forEach(({ login }, i) => {
      setTimeout(async () => {
        try {
          const res = await fetch(`/api/card/${login}`);
          if (!res.ok) return;
          const card = (await res.json()) as Card;
          if (alive) setCards((prev) => ({ ...prev, [login]: card }));
        } catch {}
      }, i * 150);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div>
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="font-black text-[18px] leading-none">official driver ratings</h2>
        <span className="mono text-[10px]" style={{ color: "var(--faint)" }}>
          SCOUTED LIVE · HOVER TO OPEN
        </span>
      </div>
      <div
        className="flex gap-4 overflow-x-auto px-3 pb-4 pt-2"
        style={{ scrollbarWidth: "thin", scrollSnapType: "x proximity" }}
      >
        {LEGENDS.map(({ login, label }) => (
          <MiniCard key={login} login={login} label={label} card={cards[login] ?? null} />
        ))}
      </div>
    </div>
  );
}

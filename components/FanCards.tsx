"use client";

import { useEffect, useState } from "react";
import type { Card } from "@/lib/racing/types";
import { MiniCard } from "./MiniCard";

// The gitfut fan, in paddock colours: four real cards, rotated and overlapping,
// with the GOAT at the front. Cards scout live and land in place.
const FEATURED = ["torvalds", "pewdiepie-archdaemon", "yyx990803", "sindresorhus"];

export function FanCards() {
  const [cards, setCards] = useState<Record<string, Card>>({});

  useEffect(() => {
    let alive = true;
    FEATURED.forEach((login, i) => {
      setTimeout(async () => {
        try {
          const res = await fetch(`/api/card/${login}`);
          if (!res.ok) return;
          const card = (await res.json()) as Card;
          if (alive) setCards((prev) => ({ ...prev, [login]: card }));
        } catch {}
      }, i * 140);
    });
    return () => {
      alive = false;
    };
  }, []);

  const layout = [
    { login: "sindresorhus", rotate: -13, x: -105, z: 1 },
    { login: "yyx990803", rotate: -5, x: -35, z: 2 },
    { login: "pewdiepie-archdaemon", rotate: 5, x: 35, z: 3, label: "LEGEND" as const },
    { login: "torvalds", rotate: 13, x: 105, z: 4, label: "GOAT" as const },
  ];

  return (
    <div className="relative flex items-center justify-center" style={{ height: 400, minWidth: 420 }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: 330,
          height: 330,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(225,6,0,0.16), rgba(255,209,0,0.05) 55%, transparent 72%)",
          filter: "blur(12px)",
        }}
      />
      {layout.map((item) => (
        <div
          key={item.login}
          className="absolute transition-all duration-500 hover:!z-20 hover:-translate-y-4"
          style={{
            transform: `translateX(${item.x}px) rotate(${item.rotate}deg) scale(1.35)`,
            zIndex: item.z,
            animation: "row-in .5s ease-out both",
          }}
        >
          <MiniCard
            login={item.login}
            card={cards[item.login] ?? null}
            label={"label" in item ? item.label : undefined}
          />
        </div>
      ))}
    </div>
  );
}

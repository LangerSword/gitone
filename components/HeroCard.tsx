"use client";

import { useEffect, useState } from "react";
import type { Card } from "@/lib/racing/types";
import { DriverCard } from "./DriverCard";
import { TiltCard } from "./TiltCard";

// The hero's featured car — the founder's card, scouted live. Falls back to
// the light bank so the hero never shows a hole.
export function HeroCard({ login }: { login: string }) {
  const [card, setCard] = useState<Card | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/card/${login}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((c: Card) => alive && setCard(c))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [login]);

  if (!card) {
    return (
      <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center min-h-56" aria-hidden="true">
        <div className="lights">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="on"
              style={{
                animation: `light-on 0.9s ease-in-out ${i * 0.25}s infinite alternate`,
                background: "radial-gradient(circle at 35% 30%, #55565e, #232429 68%)",
                boxShadow: "none",
              }}
            />
          ))}
        </div>
        <span className="mono mt-4 text-[11px] tracking-[0.18em]" style={{ color: "var(--faint)" }}>
          SCOUTING THE FOUNDER…
        </span>
      </div>
    );
  }

  return (
    <div>
      <TiltCard max={5}>
        <DriverCard card={card} />
      </TiltCard>
      <p className="mono mt-4 text-center text-[10.5px] tracking-[0.18em]" style={{ color: "var(--faint)" }}>
        @{card.login} · RTG {card.rtg} · SCOUTED LIVE
      </p>
    </div>
  );
}

"use client";

import type { AwardKey } from "@/lib/racing/types";

// Every honour has its own bespoke 3D-rendered metal piece (public/awards/
// <key>.webp, backgrounds keyed out) — no two trophies share art. The float,
// shine sweep and pedestal glow live on the wrapper in TrophyCabinet.
export function TrophyArt({ award, size = 64 }: { award: AwardKey; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/awards/${award}.webp`}
      alt=""
      width={size}
      height={size}
      draggable={false}
      style={{ width: size, height: size, objectFit: "contain", display: "block" }}
    />
  );
}

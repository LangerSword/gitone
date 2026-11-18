"use client";

import type { AwardKey } from "@/lib/racing/types";

// Premium 3D-rendered metal trophy art (public/awards/*.webp, backgrounds keyed
// out): a gold cup, a crown on laurels, a chronometer and a star medal. The
// float, shine sweep and pedestal glow live on the wrapper in TrophyCabinet.
type Kind = "cup" | "crown" | "stopwatch" | "medal" | "founders_edition";

const KIND: Record<AwardKey, Kind> = {
  wdc: "cup",
  wcc26: "cup",
  wdc26: "cup",
  grand_slam: "crown",
  fastest_lap: "stopwatch",
  ironman: "medal",
  pole: "stopwatch",
  hat_trick: "crown",
  podium: "medal",
  century: "cup",
  founders_edition: "founders_edition",
};

export function TrophyArt({ award, size = 64 }: { award: AwardKey; size?: number }) {
  const kind = KIND[award];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/awards/${kind}.webp`}
      alt=""
      width={size}
      height={size}
      draggable={false}
      style={{ width: size, height: size, objectFit: "contain", display: "block" }}
    />
  );
}

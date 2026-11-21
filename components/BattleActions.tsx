"use client";

import { useEffect } from "react";
import { SplitDownload } from "./SplitDownload";
import { ShareRow } from "./ShareRow";

// Share the battle: X carries the message, plus the split button that
// downloads the COMPOSED result poster — the same graphic the route's
// unfurl serves (api/battle-image), so the downloaded PNG and the X
// preview are one designed frame, not a page dump.
export function BattleActions({ username, opponent, text }: { username: string; opponent: string; text: string }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/${username}/vs/${opponent}`;
  const posterUrl = `${origin}/api/battle-image/${encodeURIComponent(username)}/${encodeURIComponent(opponent)}`;
  const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  // Warm the poster the moment the duel settles (this row only mounts then):
  // a cold composite can bust the Workers free plan's ~10ms CPU cap, but the
  // user spends several seconds reading the result — enough for a quiet
  // background fetch (with retries) to land the render and KV-cache it. By
  // the time they tap Download, the poster is ~0.2s.
  useEffect(() => {
    let cancelled = false;
    const warm = async (n: number) => {
      const r = await fetch(posterUrl).catch(() => null);
      if (cancelled) return;
      if ((!r || !r.ok) && n < 4) {
        setTimeout(() => warm(n + 1), 2500);
      }
      // a success here is cached forever server-side
    };
    warm(0);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posterUrl]);

  return (
    <div className="flex flex-wrap items-start gap-2">
      <ShareRow url={url} text={text} />
      <SplitDownload
        label="Download result"
        posterUrl={posterUrl}
        filename={`${username}-vs-${opponent}-gitone.png`}
        linkUrl={url}
        shareText={text}
        shareTitle={`${username} vs ${opponent} · gitone`}
        intentUrl={intentUrl}
      />
    </div>
  );
}

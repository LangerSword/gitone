"use client";

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

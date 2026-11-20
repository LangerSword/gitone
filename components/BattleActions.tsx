"use client";

import { SplitDownload } from "./SplitDownload";
import { ShareRow } from "./ShareRow";

// Share the battle: direct share to X / LinkedIn / Reddit, plus the split
// button that downloads the race-result PNG (busy → done) with Copy image /
// Copy link in its caret menu. LinkedIn reads the route's OG title/description.
export function BattleActions({ username, opponent, text }: { username: string; opponent: string; text: string }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/${username}/vs/${opponent}`;
  const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-wrap items-start gap-2">
      <ShareRow url={url} text={text} />
      <SplitDownload
        label="Download result"
        getCaptureNode={() => document.querySelector<HTMLElement>("[data-duel-container]")}
        captureBackgroundColor="#15151e"
        captureExclude="[data-export-exclude]"
        filename={`${username}-vs-${opponent}-gitone.png`}
        linkUrl={url}
        shareText={text}
        shareTitle={`${username} vs ${opponent} · gitone`}
        intentUrl={intentUrl}
      />
    </div>
  );
}

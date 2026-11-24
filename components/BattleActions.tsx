"use client";

import { SplitDownload } from "./SplitDownload";
import { ShareRow } from "./ShareRow";
import { buildVersusStage, type VersusStageDuel } from "@/lib/versusCapture";

// Share the battle: X carries the message, plus the split button that
// downloads the same 1200×630 broadcast stage the live preview uses — two
// warmed card PNGs plugged into one template, plus the full sector table.
export function BattleActions({
  username,
  opponent,
  text,
  duel,
}: {
  username: string;
  opponent: string;
  text: string;
  duel: VersusStageDuel;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/${username}/vs/${opponent}`;
  const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-wrap items-start gap-2">
      <ShareRow url={url} text={text} />
      <SplitDownload
        label="Download result"
        getCaptureNode={() => buildVersusStage(username, opponent, duel)}
        capturePixelRatio={1}
        filename={`${username}-vs-${opponent}-gitone.png`}
        linkUrl={url}
        shareText={text}
        shareTitle={`${username} vs ${opponent} · gitone`}
        intentUrl={intentUrl}
      />
    </div>
  );
}

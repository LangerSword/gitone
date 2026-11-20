"use client";

import { SplitDownload } from "./SplitDownload";

function XMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// Share the battle: the split button downloads the race-result PNG (busy →
// done states) with Copy image / Copy link in its caret menu; X is a single
// icon target. Same control grammar as the card actions.
export function BattleActions({ username, opponent, text }: { username: string; opponent: string; text: string }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/${username}/vs/${opponent}`;
  const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  const shareX = () => window.open(intentUrl, "_blank", "noopener,noreferrer");

  return (
    <div className="flex items-start gap-2">
      <button
        type="button"
        onClick={shareX}
        aria-label="Share battle on X"
        title="Share on X"
        className="btn btn-icon h-[50px] w-[50px] flex-none"
      >
        <XMark />
      </button>
      <SplitDownload
        label="Download result"
        imageUrl={`/${username}/vs/${opponent}.png`}
        filename={`${username}-vs-${opponent}-gitone.png`}
        linkUrl={url}
        shareText={text}
        shareTitle={`${username} vs ${opponent} · gitone`}
        intentUrl={intentUrl}
      />
    </div>
  );
}

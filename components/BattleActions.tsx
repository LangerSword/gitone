"use client";

import { useState } from "react";
import { Check, Download, Link2 } from "lucide-react";

function XMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// Share the battle: download the race-result PNG, post it to X, or copy the
// fixture link. Same control grammar as the card actions.
export function BattleActions({ username, opponent, text }: { username: string; opponent: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/${username}/vs/${opponent}`;

  const shareX = () =>
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );

  const copyLink = () => {
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="flex items-stretch gap-2">
      <a
        href={`/${username}/vs/${opponent}.png?dl=1`}
        download={`${username}-vs-${opponent}-gitone.png`}
        className="btn btn-primary flex-1"
      >
        <Download size={18} strokeWidth={2.4} aria-hidden />
        Download result
      </a>
      <button type="button" onClick={shareX} aria-label="Share battle on X" title="Share on X" className="btn btn-icon h-[50px] w-[50px]">
        <XMark />
      </button>
      <button type="button" onClick={copyLink} aria-label="Copy battle link" title="Copy link" className="btn btn-icon h-[50px] w-[50px]">
        {copied ? <Check size={17} aria-hidden /> : <Link2 size={17} aria-hidden />}
      </button>
    </div>
  );
}

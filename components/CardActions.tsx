"use client";

import { useState } from "react";
import { Check, Code2, Copy, ExternalLink } from "lucide-react";
import { DuelPlate } from "./DuelPlate";
import { SplitDownload } from "./SplitDownload";

function copy(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

function XMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// One primary split button carries the whole "get the image" family: the main
// zone downloads with busy/done states, the caret menu adds Copy image, Copy
// link, open/embed/JSON. Sharing is a single icon button; the duel is a
// rolling fixture plate below. Three tiers, one radius.
export function CardActions({ login, name, rtg }: { login: string; name?: string; rtg?: number }) {
  const [copied, setCopied] = useState<string | null>(null);

  const flash = (k: string) => {
    setCopied(k);
    setTimeout(() => setCopied((c) => (c === k ? null : c)), 1400);
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const pngUrl = `${origin}/${login}.png`;
  const linkUrl = typeof window !== "undefined" ? window.location.href : `${origin}/${login}`;
  const shareText = `${name ?? login} scored ${rtg ?? "a card"} on gitone. GitHub, rated like a driver.`;
  const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(linkUrl)}`;
  const shareX = () => window.open(intentUrl, "_blank", "noopener,noreferrer");

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={shareX}
          aria-label="Share on X"
          title="Share on X"
          className="btn btn-icon h-[50px] w-[50px] flex-none"
        >
          <XMark />
        </button>

        <SplitDownload
          label="Download card"
          imageUrl={`/${login}.png`}
          filename={`${login}-gitone.png`}
          linkUrl={linkUrl}
          shareText={shareText}
          shareTitle={`${name ?? login} · gitone`}
          intentUrl={intentUrl}
          extraItems={(close) => (
            <>
              <a
                href={pngUrl}
                target="_blank"
                rel="noreferrer"
                role="menuitem"
                className="menu-item"
                onClick={close}
              >
                <ExternalLink size={15} aria-hidden /> Open PNG in a tab
              </a>
              <button
                type="button"
                role="menuitem"
                className="menu-item"
                onClick={() => {
                  copy(`[![My gitone card](${pngUrl})](${origin}/${login})`);
                  flash("embed");
                  setTimeout(close, 650);
                }}
              >
                {copied === "embed" ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
                {copied === "embed" ? "Copied" : "Copy embed Markdown"}
              </button>
              <button
                type="button"
                role="menuitem"
                className="menu-item"
                onClick={() => {
                  copy(`${origin}/api/card/${login}`);
                  flash("json");
                  setTimeout(close, 650);
                }}
              >
                {copied === "json" ? <Check size={15} aria-hidden /> : <Code2 size={15} aria-hidden />}
                {copied === "json" ? "Copied" : "Copy JSON API URL"}
              </button>
            </>
          )}
        />
      </div>

      <DuelPlate login={login} />
    </div>
  );
}

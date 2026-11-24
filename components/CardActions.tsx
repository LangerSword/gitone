"use client";

import { useState } from "react";
import { Check, Code2, Copy, ExternalLink } from "lucide-react";
import { DuelPlate } from "./DuelPlate";
import { SplitDownload } from "./SplitDownload";
import { ShareRow } from "./ShareRow";

function copy(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

// One primary split button carries the whole "get the image" family: the main
// zone downloads with busy/done states, the caret menu adds Copy image, Copy
// link, open/embed/JSON. Sharing is a single icon button; the duel is a
// rolling fixture plate below. Three tiers, one radius.
export function CardActions({ login, name, rtg, finishLabel }: { login: string; name?: string; rtg?: number; finishLabel?: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  const flash = (k: string) => {
    setCopied(k);
    setTimeout(() => setCopied((c) => (c === k ? null : c)), 1400);
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const pngUrl = `${origin}/${login}.png`;
  const linkUrl = typeof window !== "undefined" ? window.location.href : `${origin}/${login}`;
  const who = name ?? login;
  // X copy: concrete numbers first (his RTG, his grade), then what the numbers
  // are made of, then the CTA. The flag is the only emoji that earns its slot.
  const shareText = rtg
    ? `🏁 ${who} rates ${rtg}/99 on gitone${finishLabel ? ` — ${finishLabel.toLowerCase()} of the github grid` : ""}. real commits, PRs and reviews, scored like an F1 season. scout yours →`
    : `🏁 ${who} on gitone — a whole GitHub history, scored like an F1 season. scout yours →`;
  const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(linkUrl)}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start gap-2">
        <ShareRow url={linkUrl} text={shareText} />

        <SplitDownload
          label="Download card"
          getCaptureNode={() => document.querySelector<HTMLElement>('[data-card="f1-26"]')}
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
                aria-label="Copy embed Markdown"
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
                aria-label="Copy JSON API URL"
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

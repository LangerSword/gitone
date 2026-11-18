"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Code2, Copy, Download, ExternalLink } from "lucide-react";
import { DuelPlate } from "./DuelPlate";

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

// One primary split button carries the whole "get the image" family
// (download / open / embed / JSON); sharing is a single icon button; the
// duel is a rolling fixture plate below. Three tiers, one radius.
export function CardActions({ login, name, rtg }: { login: string; name?: string; rtg?: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const flash = (k: string) => {
    setCopied(k);
    setTimeout(() => setCopied((c) => (c === k ? null : c)), 1400);
    setTimeout(() => setMenuOpen(false), 650);
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareText = `${name ?? login} scored ${rtg ?? "a card"} on gitone. GitHub, rated like a driver.`;
  const shareX = () => {
    const url = typeof window !== "undefined" ? window.location.href : `${origin}/${login}`;
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-stretch gap-2">
        <button type="button" onClick={shareX} aria-label="Share on X" title="Share on X" className="btn btn-icon h-[50px] w-[50px]">
          <XMark />
        </button>

        <div ref={root} className="relative flex flex-1">
          <a
            href={`/${login}.png?dl=1`}
            download={`${login}-gitone.png`}
            className="btn btn-primary flex-1 rounded-r-none"
          >
            <Download size={18} strokeWidth={2.4} aria-hidden />
            Download card
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="More card formats"
            className="btn btn-primary w-[46px] flex-none rounded-l-none px-0"
            style={{ boxShadow: "inset 1px 0 0 rgba(0, 0, 0,.3), 0 8px 22px -8px rgba(193, 18, 31,.45)" }}
          >
            <ChevronDown size={18} strokeWidth={2.6} aria-hidden />
          </button>

          {menuOpen && (
            <div role="menu" className="menu-pop absolute right-0 top-full z-30 mt-2 w-[236px] p-1.5">
              <a href={`/${login}.png`} target="_blank" rel="noreferrer" role="menuitem" className="menu-item" onClick={() => setMenuOpen(false)}>
                <ExternalLink size={15} aria-hidden /> Open PNG in a tab
              </a>
              <button
                type="button"
                role="menuitem"
                className="menu-item"
                onClick={() => {
                  copy(`[![My gitone card](${origin}/${login}.png)](${origin}/${login})`);
                  flash("embed");
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
                }}
              >
                {copied === "json" ? <Check size={15} aria-hidden /> : <Code2 size={15} aria-hidden />}
                {copied === "json" ? "Copied" : "Copy JSON API URL"}
              </button>
            </div>
          )}
        </div>
      </div>

      <DuelPlate login={login} />
    </div>
  );
}

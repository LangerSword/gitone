"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Code2, Copy, Download, ExternalLink } from "lucide-react";

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
// duel is a secondary ghost. Three tiers, one radius, no wall of boxes.
export function CardActions({ login, name, rtg }: { login: string; name?: string; rtg?: number }) {
  const router = useRouter();
  const [opp, setOpp] = useState("");
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
            style={{ boxShadow: "inset 1px 0 0 rgba(26,18,11,.3), 0 8px 22px -8px rgba(214,133,74,.45)" }}
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const clean = opp.trim().replace(/^@/, "");
          if (clean) router.push(`/${login}/vs/${encodeURIComponent(clean)}`);
        }}
        className="flex items-center gap-2"
      >
        <input
          value={opp}
          onChange={(e) => setOpp(e.target.value)}
          placeholder="rival login"
          spellCheck={false}
          autoCapitalize="none"
          aria-label="Rival GitHub login"
          className="field field-sm h-[46px] flex-1"
        />
        <button type="submit" disabled={!opp.trim()} className="btn btn-ghost flex-none">
          Race
          <span className="mono rounded-full px-1.5 py-0.5 text-[10px] font-bold tracking-[0.08em]" style={{ background: "rgba(180,150,221,.16)", color: "var(--purple)" }} aria-hidden>
            VS
          </span>
        </button>
      </form>
    </div>
  );
}

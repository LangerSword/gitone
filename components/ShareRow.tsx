"use client";

// The direct share target beside the download: X only. Every extra icon
// shrank the primary download button on phones, and the composed poster
// (the battle unfurl / card PNG) carries the message better than any
// intent-URL preview — so one share target, done well.
function XMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const BTN = "btn btn-icon h-[50px] w-[50px] flex-none";

export function ShareRow({ url, text }: { url: string; text: string }) {
  const open = (u: string) => window.open(u, "_blank", "noopener,noreferrer");
  const enc = encodeURIComponent;
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => open(`https://x.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`)} aria-label="Share on X" title="Share on X" className={BTN}>
        <XMark />
      </button>
    </div>
  );
}

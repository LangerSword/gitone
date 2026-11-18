"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function copy(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

// Share actions + the head-to-head launcher for the report page.
export function CardActions({ login }: { login: string }) {
  const router = useRouter();
  const [opp, setOpp] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const flash = (k: string) => {
    setCopied(k);
    setTimeout(() => setCopied((c) => (c === k ? null : c)), 1400);
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "https://YOUR-HOST";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => {
            copy(`[![My gitone card](${origin}/${login}.png)](${origin}/${login})`);
            flash("embed");
          }}
          className="mono rounded-full px-4 py-2.5 text-[12px] font-bold tracking-[0.1em] transition-colors"
          style={{ background: "var(--f1-red)", color: "#fff" }}
        >
          {copied === "embed" ? "COPIED" : "COPY EMBED MD"}
        </button>
        <a
          href={`/${login}.png`}
          target="_blank"
          rel="noreferrer"
          className="mono rounded-full px-4 py-2.5 text-[12px] font-bold tracking-[0.1em] panel"
          style={{ color: "var(--ink)" }}
        >
          OPEN .PNG
        </a>
        <a
          href={`/${login}.png?dl=1`}
          download={`${login}-gitone.png`}
          className="mono rounded-full px-4 py-2.5 text-[12px] font-bold tracking-[0.1em] panel"
          style={{ color: "var(--ink)" }}
        >
          DOWNLOAD
        </a>
        <button
          onClick={() => {
            copy(`${origin}/api/card/${login}`);
            flash("json");
          }}
          className="mono rounded-full px-4 py-2.5 text-[12px] font-bold tracking-[0.1em] panel"
          style={{ color: "var(--ink)" }}
        >
          {copied === "json" ? "COPIED" : "JSON API"}
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const clean = opp.trim().replace(/^@/, "");
          if (clean) router.push(`/${login}/vs/${encodeURIComponent(clean)}`);
        }}
        className="flex gap-2.5"
      >
        <input
          value={opp}
          onChange={(e) => setOpp(e.target.value)}
          placeholder="rival login for a head-to-head"
          spellCheck={false}
          autoCapitalize="none"
          className="scout-input flex-1 rounded-full px-4 py-2.5 text-[13px]"
          aria-label="Rival GitHub login"
        />
        <button
          type="submit"
          disabled={!opp.trim()}
          className="mono rounded-full px-4 py-2.5 text-[12px] font-bold tracking-[0.1em] transition-opacity disabled:opacity-40"
          style={{ background: "var(--f1-red)", color: "#fff" }}
        >
          RACE
        </button>
      </form>
    </div>
  );
}

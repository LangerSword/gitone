"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function copy(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

// Share actions + the head-to-head launcher. Square controls, one red
// primary, everything else a hairline ghost — no pill soup.
export function CardActions({ login }: { login: string }) {
  const router = useRouter();
  const [opp, setOpp] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const flash = (k: string) => {
    setCopied(k);
    setTimeout(() => setCopied((c) => (c === k ? null : c)), 1400);
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const primary = "mono flex h-9 items-center justify-center px-3.5 text-[9.5px] font-bold tracking-[0.14em] transition-colors";
  const ghost = "mono flex h-9 items-center justify-center border px-3.5 text-[9.5px] font-bold tracking-[0.14em] transition-colors hover:border-white/30 hover:text-[var(--ink)]";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            copy(`[![My gitone card](${origin}/${login}.png)](${origin}/${login})`);
            flash("embed");
          }}
          className={primary}
          style={{ background: "var(--f1-red)", color: "#fff" }}
        >
          {copied === "embed" ? "COPIED" : "COPY EMBED MD"}
        </button>
        <a
          href={`/${login}.png`}
          target="_blank"
          rel="noreferrer"
          className={ghost}
          style={{ borderColor: "var(--line-bright)", color: "var(--dim)" }}
        >
          OPEN .PNG
        </a>
        <a
          href={`/${login}.png?dl=1`}
          download={`${login}-gitone.png`}
          className={ghost}
          style={{ borderColor: "var(--line-bright)", color: "var(--dim)" }}
        >
          DOWNLOAD
        </a>
        <button
          type="button"
          onClick={() => {
            copy(`${origin}/api/card/${login}`);
            flash("json");
          }}
          className={ghost}
          style={{ borderColor: "var(--line-bright)", color: "var(--dim)" }}
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
        className="flex flex-col gap-2 sm:flex-row"
      >
        <div className="flex items-center gap-2 border-b pb-1.5" style={{ borderColor: "var(--line)" }}>
          <span className="mono text-[8.5px] font-bold tracking-[0.16em]" style={{ color: "var(--faint)" }}>
            HEAD-TO-HEAD
          </span>
          <input
            value={opp}
            onChange={(e) => setOpp(e.target.value)}
            placeholder="rival login"
            spellCheck={false}
            autoCapitalize="none"
            aria-label="Rival GitHub login"
            className="scout-input h-8 flex-1 border-0 bg-transparent px-2 text-[12px]"
            style={{ borderBottom: "none" }}
          />
        </div>
        <button
          type="submit"
          disabled={!opp.trim()}
          className={ghost}
          style={{ borderColor: "rgba(255,30,0,.5)", color: "var(--f1-red)", background: "rgba(255,30,0,.06)" }}
        >
          RACE →
        </button>
      </form>
    </div>
  );
}

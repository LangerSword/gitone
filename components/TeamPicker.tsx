"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Palette } from "lucide-react";
import { TEAMS } from "@/lib/teams";
import { clearPref, localPrefKey, writePref } from "@/lib/prefs";

// Team livery picker for the driver card. Sits beside the card as a sibling of
// the tilt; choosing a team persists per-login and drives ?team=<code>, which
// the report and the embeddable .png both honour.
const KEY = (login: string) => localPrefKey("team", login);

export function TeamPicker({ login, current }: { login: string; current: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (current) return;
    try {
      const stored = localStorage.getItem(KEY(login));
      if (stored && TEAMS.some((t) => t.code === stored)) {
        const params = new URLSearchParams(window.location.search);
        params.set("team", stored);
        router.replace(`/${login}?${params.toString()}`);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const choose = (code: string) => {
    setOpen(false);
    const params = new URLSearchParams(window.location.search);
    if (code) {
      params.set("team", code);
      try {
        localStorage.setItem(KEY(login), code);
      } catch {}
      writePref("team", login, code);
    } else {
      params.delete("team");
      try {
        localStorage.removeItem(KEY(login));
      } catch {}
      clearPref("team", login);
    }
    const qs = params.toString();
    router.replace(`/${login}${qs ? `?${qs}` : ""}`);
  };

  return (
    <div ref={root} className="relative z-20">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Choose team livery"
        title="Choose team livery"
        className="mono flex h-9 items-center gap-2 border px-3 text-[10.5px] font-bold tracking-[0.14em] transition-colors hover:text-[var(--ink)]"
        style={{
          background: "rgba(21,21,30,0.85)",
          borderColor: "var(--line-bright)",
          color: "var(--dim)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Palette size={13} /> LIVERY
      </button>
      {open && (
        <div
          className="glass absolute bottom-full right-0 mb-2 w-[290px] p-3"
          style={{ maxHeight: 340, overflowY: "auto" }}
        >
          <div className="mono mb-2 px-1 text-[11px] tracking-[0.16em]" style={{ color: "var(--faint)" }}>
            CHOOSE YOUR CONSTRUCTOR
          </div>
          <button
            type="button"
            onClick={() => choose("")}
            className="flex w-full items-center gap-2 px-2 py-2 text-left text-[12px] transition-colors hover:bg-white/5"
            style={{ color: "var(--dim)" }}
          >
            <span className="h-4 w-4 rounded" style={{ background: "linear-gradient(135deg,#71717d,#24242f)" }} />
            Default (language livery)
          </button>
          {TEAMS.map((t) => (
            <button
              key={t.code}
              type="button"
              onClick={() => choose(t.code)}
              className="flex w-full items-center gap-2 px-2 py-2 text-left text-[12px] transition-colors hover:bg-white/5"
              style={{ color: current === t.code ? "var(--ink)" : "var(--dim)" }}
            >
              <span className="h-4 w-4 rounded" style={{ background: t.color, boxShadow: `0 0 10px ${t.color}55` }} />
              <span className="flex-1 truncate">{t.name}</span>
              <span className="mono text-[10.5px]" style={{ color: "var(--faint)" }}>
                {t.code}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

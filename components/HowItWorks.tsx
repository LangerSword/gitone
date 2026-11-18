"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FINISH_LABELS } from "@/lib/racing/constants";
import type { Finish } from "@/lib/racing/types";

const ROWS: { key: string; name: string; from: string }[] = [
  { key: "PAC", name: "Pace", from: "commit velocity, laps this season" },
  { key: "RAC", name: "Racecraft", from: "PRs worked through other fields" },
  { key: "AWA", name: "Awareness", from: "hazards flagged, clean racing" },
  { key: "EXP", name: "Experience", from: "seasons on the grid, mileage" },
];

const TIERS: Finish[] = ["rookie", "points", "podium", "winner", "champion", "in_form", "founder"];

// A single disclosure at the top of the hero — no scroll section. The full
// how-it-works lives one click away, not in six panels down the page.
export function HowItWorks() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-5 max-w-xl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mono flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] transition-colors hover:text-[var(--ink)]"
        style={{ color: "var(--dim)" }}
      >
        HOW IT WORKS
        <ChevronDown
          size={13}
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s ease" }}
        />
      </button>
      {open && (
        <div
          className="glass mt-3 rounded-xl p-5"
          style={{ animation: "row-in .3s ease-out both", maxHeight: 330, overflowY: "auto" }}
        >
          {ROWS.map((r) => (
            <div key={r.key} className="flex items-baseline gap-3 border-b py-2 last:border-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <span className="mono w-9 text-[12px] font-extrabold" style={{ color: "var(--f1-red)" }}>
                {r.key}
              </span>
              <span className="text-[13px] font-bold" style={{ color: "var(--ink)" }}>
                {r.name}
              </span>
              <span className="text-[12px]" style={{ color: "var(--dim)" }}>
                {r.from}
              </span>
            </div>
          ))}
          <p className="mono mt-3 text-[11px] leading-relaxed" style={{ color: "var(--dim)" }}>
            RTG = pace-weighted combination. Raw stats cap at 88; the 90s are earned with years
            and influence. Every card lives at {"<login>.png"}, so it re-scouts itself wherever
            you embed it.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {TIERS.map((t) => (
              <span
                key={t}
                className="mono rounded px-1.5 py-1 text-[9px] font-bold tracking-[0.1em]"
                style={{ background: "rgba(255,255,255,0.06)", color: "var(--dim)" }}
              >
                {FINISH_LABELS[t]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

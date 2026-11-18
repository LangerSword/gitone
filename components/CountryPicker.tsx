"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search, X } from "lucide-react";
import { COUNTRIES, normalizeCountry } from "@/lib/countries";
import { flagUrl } from "@/lib/flagUrl";

// The report-page flag editor. Renders a transparent hotspot exactly over
// the card's flag slot — clicking it opens a searchable country popover.
// Designed as a SIBLING of the card (not a child), so it stays level while
// the card tilts and never serializes into exports.
// Choosing a country re-navigates with ?country=<code> (the same override
// the embeddable .png honours) and stores the pick per-login, so returning
// visitors keep their flag.
const SLOT = { left: "1.6%", top: "1.5%", width: "6%", height: "8%" } as const;
const STORAGE_KEY = (login: string) => `gitone:flag:${login.toLowerCase()}`;

interface Props {
  login: string;
  /** The flag currently shown (override already applied), or null. */
  value: string | null;
}

export function CountryPicker({ login, value }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Carry a previously stored pick forward when the URL has no override yet.
  useEffect(() => {
    if (value) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY(login));
      if (stored && normalizeCountry(stored) && stored !== value) {
        router.replace(`/${login}?country=${stored}`);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (open && active >= 0) {
      listRef.current
        ?.querySelector(`#cp-opt-${active}`)
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [active, open]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code === q);
  }, [query]);

  const choose = (code: string) => {
    setOpen(false);
    if (!code) {
      try {
        localStorage.removeItem(STORAGE_KEY(login));
      } catch {}
      router.replace(`/${login}`);
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY(login), code);
    } catch {}
    router.replace(`/${login}?country=${code}`);
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      setActive(0);
    }
  };

  const onSearchKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => Math.min(a + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
        break;
      case "Enter": {
        e.preventDefault();
        const pick = results[active] ?? (results.length === 1 ? results[0] : undefined);
        if (pick) choose(pick.code);
        break;
      }
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-20">
      {/* hotspot — overlays the flag slot; pointer-events re-enabled just here */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={value ? "Change country flag" : "Add a country flag"}
        title={value ? "Change flag" : "Add flag"}
        style={SLOT}
        className="group pointer-events-auto absolute flex items-center justify-center rounded outline-none"
      >
        {value ? (
          <span
            className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100 group-aria-expanded:opacity-100"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <Pencil className="h-[42%] w-[42%] text-white drop-shadow" />
          </span>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-white/80 bg-black/45 text-white transition group-hover:border-white">
            <Plus className="h-[46%] w-[46%]" strokeWidth={2.5} />
          </span>
        )}
      </button>

      {open && (
        <div
          role="presentation"
          className="glass pointer-events-auto absolute z-30 flex w-[280px] max-w-[80vw] flex-col overflow-hidden rounded-2xl"
          style={{ left: SLOT.left, top: `calc(${SLOT.top} + ${SLOT.height} + 2%)`, maxHeight: 360 }}
        >
          <div className="relative shrink-0 border-b p-[10px]" style={{ borderColor: "var(--line)" }}>
            <Search
              size={15}
              className="pointer-events-none absolute left-[20px] top-1/2 -translate-y-1/2"
              style={{ color: "var(--faint)" }}
            />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onSearchKeyDown}
              placeholder="Search country…"
              autoComplete="off"
              spellCheck={false}
              role="combobox"
              aria-expanded
              aria-controls="cp-options"
              aria-autocomplete="list"
              aria-label="Search country"
              className="scout-input h-10 w-full rounded-[9px] pl-[30px] pr-3 text-[14px]"
            />
          </div>
          <ul
            ref={listRef}
            id="cp-options"
            role="listbox"
            aria-label="Countries"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5"
          >
            {value && !query && (
              <li role="presentation" className="mb-[2px] border-b pb-[6px]" style={{ borderColor: "var(--line)" }}>
                <button
                  type="button"
                  onClick={() => choose("")}
                  className="flex w-full items-center gap-[11px] rounded-[9px] px-[10px] py-2 text-[14px] transition-colors hover:bg-white/[0.04]"
                  style={{ color: "var(--faint)" }}
                >
                  <span className="flex h-[18px] w-[24px] flex-none items-center justify-center">
                    <X size={15} />
                  </span>
                  <span className="min-w-0 flex-1 text-left">Remove flag</span>
                </button>
              </li>
            )}
            {results.length === 0 && (
              <li role="presentation" className="px-3 py-6 text-center text-[13px]" style={{ color: "var(--dim)" }}>
                No country matches &quot;{query}&quot;.
              </li>
            )}
            {results.map((c, i) => {
              const selected = c.code === value;
              const highlighted = i === active;
              const url = flagUrl(c.code, 80);
              return (
                <Fragment key={c.code}>
                  <li
                    id={`cp-opt-${i}`}
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(c.code)}
                    className={`flex cursor-pointer items-center gap-[11px] rounded-[9px] px-[10px] py-2 text-[14px] transition-colors ${
                      highlighted ? "bg-white/[0.07]" : ""
                    }`}
                    style={{ color: highlighted ? "var(--ink)" : "var(--dim)" }}
                  >
                    {url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt=""
                        width={24}
                        height={18}
                        loading="lazy"
                        className="h-[18px] w-[24px] flex-none rounded-[2px] object-cover"
                        style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.12)" }}
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                    <span className="mono text-[11px] uppercase" style={{ color: "var(--faint)" }}>
                      {c.code}
                    </span>
                    {selected && (
                      <span className="h-[6px] w-[6px] flex-none rounded-full" style={{ background: "var(--f1-red)" }} />
                    )}
                  </li>
                </Fragment>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// The duel entry — a "fixture plate" in the neutral chrome the icon buttons
// wear, so it sits on any livery-tinted report without clashing. On hover the
// label rolls up like a pit-wall scoreboard (@you VS ???); clicking slides the
// rival input open BELOW the plate — the button never morphs into a form.
// F1 chrome: a faint grid-slot line, a checkered flag block and a start-light
// dot that pulses on hover, plus a slow red floodlight sheen.
const LABEL = "text-[19px] font-bold uppercase tracking-[0.08em]";
const MARK = "text-[15px] font-bold uppercase tracking-[0.08em]";
const display = { fontFamily: "var(--font-display)" } as const;

export function DuelPlate({ login }: { login: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [opponent, setOpponent] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const plateRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.select();
  }, [open]);

  // pointerdown-outside (not blur) so a Safari tap mid-submit can't swallow it.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const away = opponent.trim().replace(/^@/, "");
    if (!away || isPending) return;
    startTransition(() =>
      router.push(`/${encodeURIComponent(login)}/vs/${encodeURIComponent(away)}`),
    );
  };

  const onBlurAway = () => {
    if (isPending) return;
    setTimeout(() => {
      const ae = document.activeElement;
      if (ae && ae !== document.body && !wrapRef.current?.contains(ae)) setOpen(false);
    }, 0);
  };

  const line =
    "flex h-[44px] items-center justify-center gap-[10px] px-[36px] transition-transform duration-[350ms] ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none";
  const rolled = (o: boolean) =>
    o ? "-translate-y-full" : "group-hover:-translate-y-full group-focus-visible:-translate-y-full";

  return (
    <div ref={wrapRef} onBlur={onBlurAway} className="flex w-full flex-col gap-2">
      <button
        ref={plateRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={open ? "duel-lightsout" : undefined}
        title="Race a rival"
        className="group relative h-[46px] w-full overflow-hidden rounded-[14px] border bg-white/[0.03] transition-all duration-200 ease-out hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 active:translate-y-0 active:scale-[.985]"
        style={{ borderColor: "var(--line-bright)" }}
      >
        <svg aria-hidden viewBox="0 0 200 46" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.13]">
          <defs>
            <pattern id="duel-check" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill="#ffffff" />
              <rect width="3" height="3" fill="#15151e" />
              <rect x="3" y="3" width="3" height="3" fill="#15151e" />
            </pattern>
          </defs>
          <line x1="0" y1="23" x2="200" y2="23" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2 7" />
          <rect x="152" y="9" width="40" height="28" fill="url(#duel-check)" />
          <circle cx="98" cy="23" r="2.5" fill="#c1121f" className="motion-safe:group-hover:animate-[light-pulse_.9s_ease-in-out_infinite]" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
        </svg>
        <span aria-hidden className="duel-sheen pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(193, 18, 31,0.12)] to-transparent motion-safe:animate-[duel-sweep_7s_ease-in-out_infinite]" />
        <span className="relative block h-full overflow-hidden">
          <span className={`${line} ${rolled(open)}`}>
            <span className={LABEL} style={{ ...display, color: "var(--ink)" }}>Race a rival</span>
            <span className={MARK} style={{ ...display, color: "var(--f1-red)" }}>VS</span>
          </span>
          <span aria-hidden className={`${line} ${rolled(open)}`}>
            <span className={`${LABEL} min-w-0 truncate`} style={{ ...display, color: "var(--ink)" }}>@{login.toUpperCase()}</span>
            <span className={`${MARK} shrink-0`} style={{ ...display, color: "var(--f1-red)" }}>VS</span>
            <span className={`${LABEL} shrink-0`} style={{ ...display, color: "var(--f1-red)" }}>???</span>
          </span>
        </span>
      </button>

      {open && (
        <form
          id="duel-lightsout"
          onSubmit={submit}
          aria-busy={isPending}
          className="flex h-[46px] w-full items-center gap-2 rounded-[14px] border bg-white/[0.03] px-1.5"
          style={{ borderColor: "var(--line-bright)", animation: "pop-in .16s cubic-bezier(.16,1,.3,1) both" }}
        >
          <input
            ref={inputRef}
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && !isPending) {
                setOpen(false);
                plateRef.current?.focus();
              }
            }}
            placeholder="their username"
            autoComplete="off"
            spellCheck={false}
            readOnly={isPending}
            aria-label="Rival GitHub username"
            className="field field-sm h-[34px] flex-1"
          />
          <button type="submit" disabled={isPending || !opponent.trim()} aria-label="Lights out, start the race" className="btn btn-ghost h-[34px] min-w-[108px] flex-none text-[13px]">
            {isPending ? (
              <span className="h-[13px] w-[13px] animate-spin rounded-full border-[1.5px] border-[rgba(193, 18, 31,0.3)] border-t-[var(--f1-red)]" />
            ) : (
              <>Lights out <span aria-hidden>→</span></>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

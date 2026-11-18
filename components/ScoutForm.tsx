"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// The scout input, with the formation sequence: five red lights on submit,
// a hold, lights out, and we're racing to the report.
export function ScoutForm({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [login, setLogin] = useState("");
  const [lit, setLit] = useState(0); // 0 = idle, 1..5 lights on, 6 = out → navigate
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
    const pending = timers.current; // capture: the ref mutates after submit
    return () => pending.forEach(clearTimeout);
  }, [autoFocus]);

  const start = (raw: string) => {
    const clean = raw.trim().replace(/^@/, "");
    if (!clean || lit !== 0) return;
    setLogin(clean);
    setLit(1);
    for (let i = 2; i <= 5; i++) {
      timers.current.push(setTimeout(() => setLit(i), (i - 1) * 200));
    }
    // hold, then lights out
    timers.current.push(setTimeout(() => setLit(6), 5 * 200 + 500));
    timers.current.push(setTimeout(() => router.push(`/${encodeURIComponent(clean)}`), 5 * 200 + 660));
  };

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          start(login);
        }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <span
            className="mono absolute left-4 top-1/2 -translate-y-1/2 text-[13px]"
            style={{ color: "var(--faint)" }}
          >
            @
          </span>
          <input
            ref={inputRef}
            value={login}
            onChange={(e) => {
              if (lit === 0) setLogin(e.target.value);
            }}
            disabled={lit !== 0}
            placeholder="github login"
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            className="scout-input w-full rounded-md pl-9 pr-4 py-3.5 text-[15px]"
            aria-label="GitHub login"
          />
        </div>
        <button
          type="submit"
          disabled={lit !== 0 || !login.trim()}
          className="mono rounded-md px-6 py-3.5 text-[14px] font-bold tracking-[0.18em] transition-opacity disabled:opacity-40"
          style={{ background: "var(--f1-red)", color: "#fff" }}
        >
          {lit === 0 ? "SCOUT" : "LIGHTS OUT"}
        </button>
      </form>
      {/* the light bank lives here always — dim at rest, lit on the
          formation sequence, so a still frame reads F1 too */}
      <div className="lights mt-4 h-[18px]" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={lit >= 1 && lit <= 5 && i < lit ? "on" : ""} />
        ))}
        <span
          className="mono ml-3 text-[11px] tracking-[0.22em]"
          style={{ color: lit === 6 ? "var(--green)" : "var(--faint)" }}
        >
          {lit === 0 ? "AWAITING LIGHTS" : lit < 5 ? "FORMATION" : lit === 5 ? "HOLD" : "AND AWAY WE GO"}
        </span>
      </div>
    </div>
  );
}

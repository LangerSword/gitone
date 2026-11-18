import Link from "next/link";

function StarMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 .9l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L.8 6.1l5-.7L8 .9z" />
    </svg>
  );
}

function Mark() {
  return (
    <span
      aria-hidden
      className="inline-flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px]"
      style={{
        background: "linear-gradient(145deg, #ff5a3a, var(--f1-red) 55%, var(--red-deep))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.35), 0 6px 16px -6px rgba(255,61,31,.8)",
      }}
    >
      <span className="mono text-[11px] font-extrabold leading-none" style={{ color: "#fff" }}>
        G
      </span>
    </span>
  );
}

export function SiteHeader({
  stars = null,
  back = false,
  backHref = "/",
  backLabel = "← BACK TO THE GRID",
  right,
}: {
  stars?: number | null;
  back?: boolean;
  backHref?: string;
  backLabel?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="relative z-20 flex-none border-b" style={{ borderColor: "var(--line)" }}>
      <nav className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-3" aria-label="gitone home">
            <Mark />
            <span className="mono text-[15px] font-extrabold tracking-[0.26em]" style={{ color: "var(--ink)" }}>
              GITONE
            </span>
          </Link>
          {back && (
            <Link
              href={backHref}
              className="mono hidden text-[10px] font-bold tracking-[0.16em] transition-colors hover:text-[var(--ink)] sm:inline"
              style={{ color: "var(--faint)" }}
            >
              {backLabel}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {right ?? (
            <span className="mono hidden text-[10px] tracking-[0.2em] md:inline" style={{ color: "var(--faint)" }}>
              THE GITHUB GRID
            </span>
          )}
          <a
            href="https://github.com/LangerSword/gitone"
            target="_blank"
            rel="noopener noreferrer"
            className="mono inline-flex h-8 items-center gap-2 border px-3 text-[9.5px] font-bold tracking-[0.14em] transition-colors hover:border-white/30 hover:text-[var(--ink)]"
            style={{ borderColor: "var(--line-bright)", color: "var(--dim)", background: "rgba(255,255,255,0.03)" }}
          >
            <StarMark />
            {stars != null ? stars.toLocaleString("en-US") : "STAR"}
            <span className="hidden sm:inline">ON GITHUB</span>
          </a>
        </div>
      </nav>
    </header>
  );
}

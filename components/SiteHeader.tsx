import Link from "next/link";

function StarMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden className="transition-transform duration-200 group-hover:scale-110">
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
        background: "linear-gradient(145deg, #e2a36a, var(--f1-red) 55%, var(--red-deep))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.35), 0 6px 16px -6px rgba(201,121,69,.55)",
      }}
    >
      <span className="mono text-[12px] font-extrabold leading-none" style={{ color: "#1a120b" }}>
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
    <header className="relative z-20 flex-none border-b" style={{ borderColor: "var(--line)", boxShadow: "inset 0 2px 0 rgba(214,133,74,0.55)" }}>
      <nav className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex min-h-11 items-center gap-3" aria-label="gitone home">
            <Mark />
            <span className="mono text-[15px] font-extrabold tracking-[0.26em]" style={{ color: "var(--ink)" }}>
              GITONE
            </span>
          </Link>
          {back && (
            <Link href={backHref} className="link-quiet hidden sm:inline-flex sm:min-h-11 sm:items-center">
              {backLabel}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {right ?? (
            <span className="mono hidden text-[12px] tracking-[0.16em] md:inline" style={{ color: "var(--faint)" }}>
              THE GITHUB GRID
            </span>
          )}
          <a
            href="https://github.com/LangerSword/gitone"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Star gitone on GitHub"
            className="btn btn-ghost btn-pill group h-[42px] gap-2 pl-4 pr-2 text-[13px]"
          >
            <StarMark />
            <span className="hidden sm:inline">Star</span>
            <span className="mono rounded-full px-2 py-1 text-[12px] font-bold leading-none tabular-nums transition-colors group-hover:bg-white/10" style={{ background: "rgba(240,232,216,.07)", color: "var(--ink)" }}>
              {stars != null ? stars.toLocaleString("en-US") : "★"}
            </span>
          </a>
        </div>
      </nav>
    </header>
  );
}

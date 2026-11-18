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
    <span aria-hidden className="inline-flex h-[24px] w-[24px] flex-none items-center justify-center">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <defs>
          <pattern id="gitone-check" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#f5f5f7" />
            <rect width="3" height="3" fill="#15151e" />
            <rect x="3" y="3" width="3" height="3" fill="#15151e" />
          </pattern>
        </defs>
        <path d="M5.2 3.4C9 1.8 13 5 19 3.4v10.2c-6 1.6-10-1.6-13.8 0Z" fill="url(#gitone-check)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
        <rect x="4" y="2.6" width="1.7" height="19" rx="0.85" fill="#c1121f" />
      </svg>
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
    <header className="relative z-20 flex-none border-b" style={{ borderColor: "var(--line)", boxShadow: "inset 0 2px 0 color-mix(in srgb, var(--livery, var(--f1-red)) 60%, transparent)" }}>
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
            <span className="mono rounded-full px-2 py-1 text-[12px] font-bold leading-none tabular-nums transition-colors group-hover:bg-white/10" style={{ background: "rgba(255, 255, 255,.07)", color: "var(--ink)" }}>
              {stars != null ? stars.toLocaleString("en-US") : "★"}
            </span>
          </a>
        </div>
      </nav>
    </header>
  );
}

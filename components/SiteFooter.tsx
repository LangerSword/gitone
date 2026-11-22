// The shared footer credit — shown on every page.
export function SiteFooter() {
  return (
    <footer className="relative z-10 flex-none border-t" style={{ borderColor: "var(--line)" }}>
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-2 px-5 py-3.5 sm:px-8">
        <span className="mono text-[11px] tracking-[0.12em]" style={{ color: "var(--faint)" }}>
          NOT AFFILIATED WITH EA SPORTS, FORMULA 1, OR GITHUB
        </span>
        <a
          href="https://github.com/LangerSword"
          target="_blank"
          rel="noopener noreferrer"
          className="link-quiet mono text-[11px] tracking-[0.12em]"
        >
          MADE BY LANGERSWORD
        </a>
        <span
          dangerouslySetInnerHTML={{
            __html: '<a href="https://toolindex.net/?ref=badge" target="_blank" rel="nofollow noopener"><img src="https://toolindex.net/badges/listed-on-toolindex.svg" alt="Listed on Tool Index" width="200" height="54"></a>',
          }}
        />
      </div>
    </footer>
  );
}

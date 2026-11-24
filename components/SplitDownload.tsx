"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Copy, Download, Link2, Share2 } from "lucide-react";
import { useImageActions } from "@/hooks/useImageActions";

// Layout effect on the client so the menu flip lands BEFORE paint; plain
// effect on the server, where useLayoutEffect only warns and does nothing.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// The split Download button, gitfut-style: the main zone downloads instantly
// (busy "Saving…" → done "Saved"), the caret opens an export menu. Both halves
// wear the site's racing-red primary; the menu uses the shared menu-pop
// grammar. Standard items are Copy image + Copy link; callers can append
// their own rows via extraItems(close).
export function SplitDownload({
  label,
  getCaptureNode,
  posterUrl,
  captureBackgroundColor,
  captureExclude,
  capturePixelRatio,
  filename,
  linkUrl,
  shareText,
  shareTitle,
  intentUrl,
  extraItems,
}: {
  /** Idle main-zone label, e.g. "Download result" / "Download card". */
  label: string;
  /** Finds the live DOM node to capture for the PNG (card / duel graphic). */
  getCaptureNode?: () => HTMLElement | null;
  /** Composed share graphic URL; when set, the export is that poster. */
  posterUrl?: string;
  /** Background painted behind the capture (the duel graphic). */
  captureBackgroundColor?: string;
  /** Selector stripped from the capture clone (e.g. the action row itself). */
  captureExclude?: string;
  capturePixelRatio?: number;
  filename: string;
  linkUrl: string;
  shareText?: string;
  shareTitle?: string;
  intentUrl?: string;
  /** Extra menu rows; call close() to dismiss the menu after a custom pick. */
  extraItems?: (close: () => void) => ReactNode;
}) {
  const {
    busy,
    done,
    error,
    menuOpen,
    setMenuOpen,
    download,
    copyImage,
    copyLink,
    canNativeShare,
    nativeShare,
    mainLabel,
  } = useImageActions({ getCaptureNode, posterUrl, captureBackgroundColor, captureExclude, capturePixelRatio, filename, linkUrl, shareText, shareTitle, intentUrl, idleLabel: label });

  const menuRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLButtonElement>(null);
  // Flip the menu above the button when there isn't room below (the card
  // page's action row can sit near the fold) — measured before paint.
  const [dropUp, setDropUp] = useState(false);
  // Whether the current open came from the keyboard (click detail === 0), so
  // only keyboard users get focus moved into the menu — mouse users keep it
  // where they clicked.
  const openedByKey = useRef(false);

  useIsomorphicLayoutEffect(() => {
    if (!menuOpen) return;
    const menu = menuRef.current?.querySelector('[role="menu"]');
    const anchor = caretRef.current;
    if (!menu || !anchor) return;
    const r = anchor.getBoundingClientRect();
    const mh = menu.getBoundingClientRect().height;
    const spaceBelow = window.innerHeight - r.bottom;
    setDropUp(spaceBelow < mh + 12 && r.top > spaceBelow);
  }, [menuOpen]);

  // Escape closes the menu (returning focus to the caret that opened it); a
  // pointerdown outside menuRef is the click-away. Not onBlur with
  // relatedTarget: WebKit fires blur with a null relatedTarget before a menu
  // item's click, which would unmount the menu and swallow the click.
  useEffect(() => {
    if (!menuOpen) return;
    if (openedByKey.current) {
      menuRef.current?.querySelector<HTMLButtonElement>("[role='menuitem']")?.focus();
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        caretRef.current?.focus();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen, setMenuOpen]);

  // Minimal ARIA-menu keyboard support: ArrowDown/ArrowUp rove focus through
  // the items, wrapping at the ends (entry focus + Escape live in the effect).
  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>("[role='menuitem']") ?? [],
    );
    if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    items[e.key === "ArrowDown" ? (i + 1) % items.length : i <= 0 ? items.length - 1 : i - 1]?.focus();
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      {/* native share sheet — only where the platform has one (revealed
          post-hydration, never flashed on desktop) */}
      {canNativeShare && shareText && (
        <button type="button" onClick={nativeShare} className="btn btn-primary w-full">
          <Share2 size={18} strokeWidth={2.4} aria-hidden />
          Share
        </button>
      )}

      <div ref={menuRef} className="relative flex min-w-0 items-stretch">
        <button
          type="button"
          onClick={download}
          disabled={!!busy}
          title={`${label} as a PNG`}
          aria-label={`${label} as a PNG`}
          className="btn btn-primary min-w-0 flex-1 rounded-r-none px-4"
        >
          {busy ? (
            <span
              aria-hidden
              className="h-[16px] w-[16px] shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
            />
          ) : done ? (
            <Check size={18} strokeWidth={2.6} aria-hidden className="shrink-0" />
          ) : (
            <Download size={18} strokeWidth={2.4} aria-hidden className="shrink-0" />
          )}
          <span className="truncate">{mainLabel}</span>
        </button>
        <button
          ref={caretRef}
          type="button"
          onClick={(e) => {
            openedByKey.current = e.detail === 0; // Enter/Space clicks carry detail 0
            setMenuOpen((o) => !o);
          }}
          disabled={!!busy}
          title="More export options"
          aria-label="More export options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="btn btn-primary w-[46px] flex-none rounded-l-none px-0"
          style={{ boxShadow: "inset 1px 0 0 rgba(0, 0, 0,.3), 0 8px 22px -8px rgba(193, 18, 31,.45)" }}
        >
          <ChevronDown
            size={18}
            strokeWidth={2.6}
            aria-hidden
            className={`transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
          />
        </button>

        {menuOpen && (
          <div
            role="menu"
            aria-label="Export options"
            onKeyDown={onMenuKeyDown}
            className={`menu-pop absolute right-0 z-30 w-[236px] p-1.5 ${dropUp ? "bottom-full mb-2" : "top-full mt-2"}`}
          >
            <button type="button" role="menuitem" onClick={copyImage} className="menu-item">
              <Copy size={15} aria-hidden /> Copy image
            </button>
            <button type="button" role="menuitem" onClick={copyLink} className="menu-item">
              <Link2 size={15} aria-hidden /> Copy link
            </button>
            {extraItems?.(() => setMenuOpen(false))}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mono text-[11px] leading-snug" style={{ color: "#ff9d96" }}>
          {error}
        </p>
      )}
    </div>
  );
}

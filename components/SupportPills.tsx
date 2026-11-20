"use client";

import type { CSSProperties } from "react";
import { Coffee } from "lucide-react";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { BMC_URL, PH_URL } from "@/lib/support";

// The Product Hunt "P" — lucide carries no brand marks.
function ProductHuntLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.604 8.4h-3.405V12h3.405c.995 0 1.801-.806 1.801-1.801 0-.993-.805-1.799-1.801-1.799zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4h-3.405V18H7.801V6h5.804c2.319 0 4.2 1.88 4.2 4.199 0 2.321-1.881 4.201-4.201 4.201z" />
    </svg>
  );
}

// The floating support pair, fixed bottom-right: Buy Me a Coffee above,
// Product Hunt below — the same treatment gitfut uses, in gitone's chrome.
// Gold is the championship/support accent (never the racing red, which stays
// a semantic action colour); PH keeps its own orange, imported as a brand
// identity the way each constructor keeps its livery. Collapses to icon-only
// 44px circles on small screens and auto-hides on scroll-down there. Mounted
// per-screen (landing, report, duel) as a sibling of the page content —
// never in the root layout, so loading/404/error screens stay clear.
//
// One ease vocabulary with the rest of the site: rise-soft in, hover lift
// out. rise-soft's 0% frame is invisible, so the delay doubles as a
// "let the page settle first" gate; delay + backwards fill live in `style`
// because the keyframe's `both` fill would pin the 100% transform after the
// entrance and eat the hover lift.
const PILL =
  "fixed right-[clamp(14px,3vw,22px)] z-40 flex h-[44px] items-center gap-[8px] rounded-full border bg-[rgba(21,21,30,0.92)] px-[16px] backdrop-blur-[6px] mono text-[11.5px] font-bold tracking-[0.14em] leading-none shadow-[0_8px_24px_-8px_rgba(0,0,0,.7)] transition-all duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[.98] max-[560px]:w-[44px] max-[560px]:justify-center max-[560px]:gap-0 max-[560px]:px-0";

export function SupportPills() {
  const hidden = useHideOnScroll();
  const gate: CSSProperties = {
    animation: "rise-soft .55s cubic-bezier(.16,1,.3,1) 1.2s backwards",
    // Slide fully off-screen when auto-hidden on mobile scroll-down; leave
    // transform unset when visible so the hover/active lifts still work.
    transform: hidden ? "translateY(160%)" : undefined,
    opacity: hidden ? 0 : undefined,
    pointerEvents: hidden ? "none" : undefined,
  };

  return (
    <>
      <a
        href={BMC_URL}
        target="_blank"
        rel="noopener"
        aria-label="Buy me a coffee"
        title="Buy me a coffee"
        className={`${PILL} bottom-[calc(clamp(14px,3vh,22px)_+_54px)] hover:border-[rgba(245,214,123,0.5)]`}
        style={{ ...gate, borderColor: "var(--line)", color: "var(--dim)" }}
      >
        <Coffee size={17} color="#f5d67b" aria-hidden className="shrink-0" />
        <span className="max-[560px]:hidden">BUY ME A COFFEE</span>
      </a>
      <a
        href={PH_URL}
        target="_blank"
        rel="noopener"
        aria-label="Support gitone on Product Hunt"
        title="Support gitone on Product Hunt"
        className={`${PILL} bottom-[clamp(14px,3vh,22px)] hover:border-[rgba(218,85,47,0.5)]`}
        style={{ ...gate, transform: hidden ? "translateY(260%)" : undefined, borderColor: "var(--line)", color: "var(--dim)" }}
      >
        <span className="shrink-0" style={{ color: "#da552f" }}>
          <ProductHuntLogo size={17} />
        </span>
        <span className="max-[560px]:hidden">SUPPORT ON PRODUCT HUNT</span>
      </a>
    </>
  );
}

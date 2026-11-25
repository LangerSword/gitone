"use client";

import { useEffect } from "react";
import { toBlob } from "html-to-image";
import { captureNode } from "@/lib/capture";
import { captureVersusPoster } from "@/lib/versusCapture";

// Warm the share image from the live DOM after a quiet moment. The browser
// does the rasterisation; the Worker only stores the bytes. This makes the
// normal view-then-share flow show real artwork on the first unfurl.
export function WarmOnView({
  kind,
  login,
  a,
  b,
  selector,
  exclude = "[data-export-exclude]",
  delay = 1800,
}: {
  kind: "card" | "teaser";
  login?: string;
  a?: string;
  b?: string;
  selector: string;
  exclude?: string;
  delay?: number;
}) {
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const run = async () => {
      let node: HTMLElement | null = null;
      for (let i = 0; i < 20 && !node && alive; i += 1) {
        node = document.querySelector<HTMLElement>(selector);
        if (!node) await new Promise((r) => setTimeout(r, 350));
      }
      if (!node || !alive) return;
      try {
        // Repeat visits reuse a locally cached composed PNG: no image decode,
        // no canvas work. This only speeds the client warm — chat crawlers
        // still get their bytes from R2, which is the authoritative store.
        const cacheKey = kind === "teaser" ? `/__preview/teaser/${a}/${b}` : null;
        const store = cacheKey && typeof caches !== "undefined"
          ? await caches.open("gitone-previews-v1").catch(() => null)
          : null;
        let blob: Blob | null = null;
        if (store && cacheKey) {
          const hit = await store.match(cacheKey).catch(() => null);
          if (hit) blob = await hit.blob();
        }
        if (!blob) {
          blob = kind === "teaser"
            ? await captureVersusPoster(a ?? "", b ?? "")
            : await captureNode(node, (clone) =>
                toBlob(clone, { pixelRatio: 2, cacheBust: true, backgroundColor: undefined }),
                { exclude },
              );
          if (blob && store && cacheKey) {
            await store.put(cacheKey, new Response(blob, { headers: { "Content-Type": "image/png" } })).catch(() => {});
          }
        }
        if (!blob || !alive) return;
        const qs =
          kind === "card"
            ? `kind=card&login=${encodeURIComponent(login ?? "")}`
            : `kind=teaser&a=${encodeURIComponent(a ?? "")}&b=${encodeURIComponent(b ?? "")}`;
        await fetch(`/api/cache-image?${qs}`, {
          method: "POST",
          headers: { "Content-Type": "image/png" },
          body: blob,
        });
      } catch (e) {
        // warming is best-effort — never touch the visible UI, but leave a
        // reason in the console so a broken warm is not indistinguishable
        // from "nobody visited yet".
        console.error("[warm] client capture failed:", e);
      }
    };

    timer = setTimeout(() => {
      const idle = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
      if (idle) idle(run, { timeout: 4000 });
      else run();
    }, delay);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [kind, login, a, b, selector, exclude, delay]);

  return null;
}

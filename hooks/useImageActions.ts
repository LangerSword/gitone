"use client";

import { useEffect, useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { captureNode } from "@/lib/capture";

// The export gestures behind the split Download button, shared by the card
// and battle actions. gitfut-style: the PNG is rendered IN THE BROWSER from
// the live DOM (html-to-image at 3× on an off-screen clone), so downloads work
// on Cloudflare Workers — no server image route involved. The busy state
// covers the capture, and the done state confirms the save/copy landed.
export type ExportAction = "download" | "copy" | "link";

// Feedback copy per action — shown on the split button itself (the menu
// closes as soon as an item is picked, so the button carries the whole
// "Saving… → Saved" story for everything in it).
export const EXPORT_COPY: Record<ExportAction, { name: string; busy: string; done: string }> = {
  download: { name: "Download", busy: "Saving…", done: "Saved" },
  copy: { name: "Copy image", busy: "Copying…", done: "Copied" },
  link: { name: "Copy link", busy: "…", done: "Link copied" },
};

export function useImageActions({
  getCaptureNode,
  posterUrl,
  captureBackgroundColor,
  captureExclude,
  capturePixelRatio = 3,
  filename,
  linkUrl,
  shareText,
  shareTitle,
  intentUrl,
  idleLabel,
}: {
  /** Finds the live DOM node to capture (the card / the duel result graphic). */
  getCaptureNode?: () => HTMLElement | null;
  /** Composed share graphic served by the app (e.g. /api/battle-image/…).
   *  When set, download/copy/share use that poster instead of a DOM capture —
   *  the export IS the unfurl, not a page dump. */
  posterUrl?: string;
  /** Background painted behind the capture (the duel graphic sits on the page ground). */
  captureBackgroundColor?: string;
  /** Selector stripped from the capture clone (e.g. the action row itself). */
  captureExclude?: string;
  capturePixelRatio?: number;
  filename: string;
  /** Absolute page URL written by Copy link / handed to the share sheet. */
  linkUrl: string;
  shareText?: string;
  shareTitle?: string;
  /** X intent opened when a native share fails or is dismissed by the OS. */
  intentUrl?: string;
  idleLabel: string;
}) {
  const [busy, setBusy] = useState<ExportAction | null>(null);
  const [done, setDone] = useState<ExportAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // Default FALSE: desktop (no Web Share) must never flash the CTA — the SSR
  // HTML and first paint simply don't contain it. Supported platforms reveal
  // it right after hydration (same trick as gitfut's useShareActions).
  const [canNativeShare, setCanNativeShare] = useState(false);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") return;
    const t = setTimeout(() => setCanNativeShare(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => () => {
    if (doneTimer.current) clearTimeout(doneTimer.current);
  }, []);

  // The export blob: the composed poster when one is wired (the battle result
  // is a designed graphic, same one the unfurls serve), else the live card at
  // 3x via html-to-image. Both are real PNG blobs the browser can save/copy.
  // Poster fetches retry on 503: a cold composite on the Workers free plan
  // can bust the ~10ms CPU cap, and the retry often lands once the isolate is
  // warm — the successful attempt KV-caches the result forever.
  const captureImage = (): Promise<Blob> => {
    if (posterUrl) {
      const attempt = async (n: number): Promise<Blob> => {
        const r = await fetch(posterUrl).catch(() => null);
        if (!r || !r.ok) {
          // 404 means "not warmed yet" — there is no fallback to wait for.
          // Only a transient 5xx/network error is worth retrying.
          const retryable = !r || r.status >= 500;
          if (retryable && n < 3) {
            await new Promise((res) => setTimeout(res, 2200));
            return attempt(n + 1);
          }
          throw new Error(`poster not ready (${r ? r.status : "network"})`);
        }
        return r.blob();
      };
      return attempt(0);
    }
    const node = getCaptureNode?.();
    if (!node) return Promise.reject(new Error("no card found on the page"));
    return captureNode(
      node,
      async (n) => {
        const blob = await toBlob(n, {
          pixelRatio: capturePixelRatio,
          cacheBust: true,
          backgroundColor: captureBackgroundColor,
        });
        if (!blob) throw new Error("capture returned no image");
        return blob;
      },
      { exclude: captureExclude },
    );
  };

  const track = async (id: ExportAction, run: () => Promise<void>) => {
    if (busy) return;
    setBusy(id);
    setError(null);
    setMenuOpen(false);
    try {
      await run();
      setDone(id);
      if (doneTimer.current) clearTimeout(doneTimer.current);
      doneTimer.current = setTimeout(() => setDone(null), 1600);
    } catch (e) {
      console.error(`[gitone] ${id} failed:`, e);
      setError(`${EXPORT_COPY[id].name} failed — ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const download = () =>
    track("download", async () => {
      const blob = await captureImage();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      // give the download a beat to start before the blob URL is released
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    });

  const copyImage = () =>
    track("copy", async () => {
      if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
        throw new Error("this browser can't copy images");
      }
      // Hand clipboard.write a Promise<Blob> synchronously inside the click's
      // user activation — awaiting the slow 3× capture first would let the
      // activation lapse (NotAllowedError). The browser awaits the blob itself.
      await navigator.clipboard.write([new ClipboardItem({ "image/png": captureImage() })]);
    });

  const copyLink = () =>
    track("link", async () => {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(linkUrl);
    });

  // Native share sheet (mobile): attach the captured PNG when the platform
  // can share files, otherwise fall back to text+url. A failed share opens
  // the X intent; a user dismissal (AbortError) does nothing.
  const nativeShare = async () => {
    try {
      const payload: ShareData = { title: shareTitle ?? "gitone", text: shareText, url: linkUrl };
      if (typeof navigator.canShare === "function") {
        try {
          const blob = await captureImage();
          const file = new File([blob], filename, { type: "image/png" });
          if (navigator.canShare({ files: [file] })) payload.files = [file];
        } catch {
          // share text+url without the image
        }
      }
      await navigator.share(payload);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      if (intentUrl) window.open(intentUrl, "_blank", "noopener,noreferrer");
    }
  };

  const mainLabel = busy ? EXPORT_COPY[busy].busy : done ? EXPORT_COPY[done].done : idleLabel;

  return {
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
  };
}

import { toBlob } from "html-to-image";
import type { DuelRow, DuelSide } from "@/lib/duel";

// A 1200×630 versus stage assembled from the already-warmed solo card PNGs.
// No Satori, no server render, no page dump: the two card images are plugged
// into one fixed broadcast template in the browser, so every pair looks the
// same and the export is cheap enough to run on any device.
export interface VersusStageDuel {
  rows: DuelRow[];
  score: Record<DuelSide, number>;
  aColor: string;
  bColor: string;
  subtitle: string;
}

const CARD_W = 270;
const CARD_H = 410;
const LEFT_X = 36;
const RIGHT_X = 1200 - LEFT_X - CARD_W;

function node<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  css: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.style.cssText = css;
  if (text !== undefined) el.textContent = text;
  return el;
}

// Compact butterfly table: value / bar / label / bar / value, the same
// encoding as the server result poster and the live sector rows.
function sectorBoard(duel: VersusStageDuel): HTMLElement {
  const board = node(
    "div",
    "position:absolute;left:330px;top:284px;width:540px;display:flex;flex-direction:column",
  );
  duel.rows.forEach((row, i) => {
    const aWon = row.winner === "challenger";
    const bWon = row.winner === "opponent";
    const aInk = row.challenger >= 90 ? "#b46bff" : duel.aColor;
    const bInk = row.opponent >= 90 ? "#b46bff" : duel.bColor;
    const line = node(
      "div",
      `display:flex;width:100%;height:23px;align-items:center;border-bottom:${i === duel.rows.length - 1 ? "none" : "1px solid rgba(240,232,216,.08)"};background:${aWon ? `${duel.aColor}0d` : bWon ? `${duel.bColor}0d` : "transparent"}`,
    );
    const aVal = node(
      "span",
      `display:flex;width:44px;justify-content:flex-end;font:800 11px JBMono,monospace;color:${aInk};opacity:${bWon ? 0.72 : 1}`,
      `${aWon ? "● " : ""}${row.challenger}`,
    );
    const aTrack = node("div", "display:flex;flex:1;height:4px;margin:0 8px;background:rgba(240,232,216,.09)");
    const aFill = node("div", "height:4px;margin-left:auto", "");
    aFill.style.width = `${row.challenger}%`;
    aFill.style.background = aInk;
    aFill.style.opacity = aWon ? "1" : "0.6";
    aTrack.appendChild(aFill);
    const label = node(
      "span",
      "display:flex;width:58px;justify-content:center;font:700 9px JBMono,monospace;letter-spacing:1px;color:#9aa39c",
      row.label.toUpperCase(),
    );
    const bTrack = node("div", "display:flex;flex:1;height:4px;margin:0 8px;background:rgba(240,232,216,.09)");
    const bFill = node("div", "height:4px", "");
    bFill.style.width = `${row.opponent}%`;
    bFill.style.background = bInk;
    bFill.style.opacity = bWon ? "1" : "0.6";
    bTrack.appendChild(bFill);
    const bVal = node(
      "span",
      `display:flex;width:44px;justify-content:flex-start;font:800 11px JBMono,monospace;color:${bInk};opacity:${aWon ? 0.72 : 1}`,
      `${row.opponent}${bWon ? " ●" : ""}`,
    );
    line.append(aVal, aTrack, label, bTrack, bVal);
    board.appendChild(line);
  });
  return board;
}

export function buildVersusStage(a: string, b: string, duel?: VersusStageDuel): HTMLElement | null {
  const stage = node(
    "div",
    [
      "position:fixed",
      "left:0",
      "top:0",
      "width:1200px",
      "height:630px",
      "z-index:-1",
      "pointer-events:none",
      "overflow:hidden",
      "background:radial-gradient(120% 90% at 16% -12%, rgba(193,18,31,.28), transparent 55%), radial-gradient(90% 70% at 92% 112%, rgba(214,133,74,.20), transparent 62%), linear-gradient(180deg,#181820 0%,#101014 72%)",
    ].join(";"),
  );

  stage.appendChild(
    node(
      "div",
      "position:absolute;inset:0;background-image:linear-gradient(rgba(240,232,216,.10) 1px,transparent 1px),linear-gradient(90deg,rgba(240,232,216,.10) 1px,transparent 1px);background-size:30px 30px;opacity:.6",
    ),
  );
  stage.appendChild(
    node(
      "div",
      "position:absolute;left:0;top:0;width:1200px;height:1px;background:linear-gradient(90deg,transparent,rgba(240,232,216,.18),transparent)",
    ),
  );
  stage.appendChild(
    node(
      "div",
      "position:absolute;left:80px;top:38px;font:800 15px JBMono,monospace;letter-spacing:5px;color:#9aa39c",
      "GITONE / HEAD TO HEAD",
    ),
  );
  stage.appendChild(
    node(
      "div",
      "position:absolute;left:0;top:44px;width:1200px;text-align:center;font:800 13px JBMono,monospace;letter-spacing:3px;color:#d6854a",
      duel?.subtitle ?? "RACE AT THE GRID",
    ),
  );

  // The warmed solo PNGs ARE the cards — same artwork the profile pages and
  // embeds use, so the preview never drifts from the card it represents.
  [a, b].forEach((login, i) => {
    const img = node("img", "");
    img.src = `/${encodeURIComponent(login)}.png`;
    img.width = CARD_W;
    img.height = CARD_H;
    img.alt = "";
    img.style.cssText = `position:absolute;left:${i === 0 ? LEFT_X : RIGHT_X}px;top:108px;width:${CARD_W}px;height:${CARD_H}px;object-fit:fill`;
    stage.appendChild(img);
    stage.appendChild(
      node(
        "div",
        `position:absolute;left:${i === 0 ? LEFT_X : RIGHT_X}px;top:520px;width:${CARD_W}px;text-align:center;font:800 13px JBMono,monospace;letter-spacing:2px;color:${i === 0 ? (duel?.aColor ?? "#f0e8d8") : (duel?.bColor ?? "#f0e8d8")}`,
        `@${login}`,
      ),
    );
  });

  stage.appendChild(
    node(
      "div",
      "position:absolute;left:0;top:150px;width:1200px;text-align:center;font:900 italic 118px DIN,sans-serif;color:#f0e8d8;text-shadow:0 18px 44px rgba(0,0,0,.65)",
      "VS",
    ),
  );

  if (duel) stage.appendChild(sectorBoard(duel));

  stage.appendChild(
    node(
      "div",
      "position:absolute;left:0;bottom:22px;width:1200px;text-align:center;font:500 12px JBMono,monospace;letter-spacing:3px;color:#9aa39c",
      "gitone.langersword.in · season 26",
    ),
  );

  document.body.appendChild(stage);
  setTimeout(() => stage.remove(), 15000);
  return stage;
}

export async function captureVersusPoster(a: string, b: string, duel?: VersusStageDuel): Promise<Blob | null> {
  await document.fonts.ready;
  const stage = buildVersusStage(a, b, duel);
  if (!stage) return null;
  await Promise.all(
    Array.from(stage.querySelectorAll("img")).map((img) =>
      img.decode ? img.decode().catch(() => {}) : Promise.resolve(),
    ),
  );
  return toBlob(stage, { pixelRatio: 1, cacheBust: true, backgroundColor: "#101014" });
}

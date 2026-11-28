import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Menu items are closed on first paint; open the menu so its actions are in
// the rendered DOM we assert on. useRouter is a Next context hook.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }));
vi.mock("@/hooks/useImageActions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/useImageActions")>();
  return {
    ...actual,
    useImageActions: (args: Parameters<typeof actual.useImageActions>[0]) => ({
      ...actual.useImageActions(args),
      menuOpen: true,
    }),
  };
});

import { BattleActions } from "../components/BattleActions";
import { CardActions } from "../components/CardActions";

type Action = { tag: string; attrs: string; body: string };

function actions(html: string): Action[] {
  return Array.from(html.matchAll(/<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/g), (m) => ({
    tag: m[1],
    attrs: m[2],
    body: m[3],
  }));
}

function ariaLabel(a: Action): string | null {
  return a.attrs.match(/aria-label="([^"]*)"/)?.[1] ?? null;
}

function visibleText(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "").trim();
}

const cardHtml = renderToStaticMarkup(
  createElement(CardActions, { login: "testdriver", name: "Test Driver", rtg: 91 }),
);
const battleHtml = renderToStaticMarkup(
  createElement(BattleActions, {
    username: "testdriver",
    opponent: "rival",
    text: "race",
    duel: { rows: [], score: { challenger: 0, opponent: 0 }, aColor: "#fff", bColor: "#000", subtitle: "" },
  }),
);

describe("card and battle action labels", () => {
  it("names every icon-only action in the rendered DOM", () => {
    for (const html of [cardHtml, battleHtml]) {
      const iconOnly = actions(html).filter((a) => a.body.includes("<svg") && !visibleText(a.body));
      expect(iconOnly.length).toBeGreaterThan(0);
      for (const a of iconOnly) {
        expect(ariaLabel(a), `${a.tag}: ${a.attrs}`).toBeTruthy();
      }
    }
    expect(cardHtml).toContain('aria-label="Share on X"');
    expect(cardHtml).toContain('aria-label="Download card as a PNG"');
    expect(battleHtml).toContain('aria-label="Download result as a PNG"');
  });

  it("keeps a stable name for copy, link and embed items when their text flashes to Copied", () => {
    const menuLabels = actions(cardHtml)
      .filter((a) => a.attrs.includes('role="menuitem"'))
      .map(ariaLabel);
    expect(menuLabels).toEqual(
      expect.arrayContaining(["Copy image", "Copy link", "Copy embed Markdown", "Copy JSON API URL"]),
    );
  });

  it("keeps the visible copy unchanged", () => {
    expect(cardHtml).toContain("Copy embed Markdown");
    expect(cardHtml).toContain("Copy JSON API URL");
    expect(cardHtml).toContain("Download card");
    expect(battleHtml).toContain("Download result");
  });
});

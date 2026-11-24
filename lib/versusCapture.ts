import { toBlob } from "html-to-image";

// A real 1200x630 versus stage built from the two live cards. The duel page's
// own DOM is a tall scroll layout, so capturing it produces a page dump. This
// stage is the same composition grammar as the server poster: landing field,
// grid, two cards, giant VS, footer.
export function buildVersusStage(a: string, b: string): HTMLElement | null {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-card="f1-26"]')).slice(0, 2);
  if (cards.length < 2) return null;

  const stage = document.createElement("div");
  stage.style.cssText = [
    "position:fixed", "left:0", "top:0", "width:1200px", "height:630px",
    "z-index:-1", "pointer-events:none", "overflow:hidden",
    "background:radial-gradient(120% 90% at 16% -12%, rgba(193,18,31,.28), transparent 55%), radial-gradient(90% 70% at 92% 112%, rgba(214,133,74,.20), transparent 62%), linear-gradient(180deg,#181820 0%,#101014 72%)",
  ].join(";");

  const grid = document.createElement("div");
  grid.style.cssText = "position:absolute;inset:0;background-image:linear-gradient(rgba(240,232,216,.10) 1px,transparent 1px),linear-gradient(90deg,rgba(240,232,216,.10) 1px,transparent 1px);background-size:30px 30px;opacity:.6";
  stage.appendChild(grid);

  const head = document.createElement("div");
  head.style.cssText = "position:absolute;left:80px;top:52px;font:800 15px JBMono,monospace;letter-spacing:5px;color:#9aa39c";
  head.textContent = "GITONE / HEAD TO HEAD";
  stage.appendChild(head);

  const slots = [90, 1200 - 90 - 360];
  cards.forEach((card, i) => {
    const slot = document.createElement("div");
    slot.style.cssText = `position:absolute;left:${slots[i]}px;top:60px;width:360px`;
    const clone = card.cloneNode(true) as HTMLElement;
    clone.style.width = "360px";
    slot.appendChild(clone);
    stage.appendChild(slot);
  });

  const vs = document.createElement("div");
  vs.style.cssText = "position:absolute;left:0;top:230px;width:1200px;text-align:center;font:900 132px DIN,sans-serif;color:#d6854a;letter-spacing:-3px";
  vs.textContent = "VS";
  stage.appendChild(vs);

  const names = document.createElement("div");
  names.style.cssText = "position:absolute;left:0;top:390px;width:1200px;display:flex;justify-content:space-between;padding:0 110px;font:800 18px JBMono,monospace;color:#f0e8d8";
  for (const [name, align] of [[`@${a}`, "left"], [`@${b}`, "right"]] as const) {
    const span = document.createElement("span");
    span.textContent = name;
    span.style.textAlign = align;
    names.appendChild(span);
  }
  stage.appendChild(names);

  const foot = document.createElement("div");
  foot.style.cssText = "position:absolute;left:0;bottom:24px;width:1200px;text-align:center;font:500 12px JBMono,monospace;letter-spacing:3px;color:#9aa39c";
  foot.textContent = "gitone.langersword.in · season 26";
  stage.appendChild(foot);

  document.body.appendChild(stage);
  setTimeout(() => stage.remove(), 15000);
  return stage;
}

export async function captureVersusPoster(a: string, b: string): Promise<Blob | null> {
  await document.fonts.ready;
  const stage = buildVersusStage(a, b);
  if (!stage) return null;
  await Promise.all(
    Array.from(stage.querySelectorAll("img")).map((img) =>
      img.decode ? img.decode().catch(() => {}) : Promise.resolve(),
    ),
  );
  return toBlob(stage, { pixelRatio: 1, cacheBust: true, backgroundColor: "#101014" });
}

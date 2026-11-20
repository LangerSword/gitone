// Client-side image capture, gitfut-style. The download/copy/share gestures
// render the LIVE DOM in the browser — html-to-image clones the node, embeds
// fonts + images and rasterises at 3× — so exports work on Cloudflare Workers,
// where the server PNG routes can't run native sharp.
//
// html-to-image only renders content the browser actually paints/decodes, so
// the clone CANNOT be parked off-screen (left:-99999px) or display:none'd —
// both yield a blank export. Instead we anchor the clone at the viewport
// origin so it paints (and its images decode), wrapped in a 0×0
// overflow-hidden holder so the user never sees it.

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

export async function captureNode<T>(
  node: HTMLElement,
  capture: (target: HTMLElement) => Promise<T>,
  opts: { exclude?: string } = {},
): Promise<T> {
  const clone = node.cloneNode(true) as HTMLElement;
  // Pin the clone to the live node's laid-out width: the card sizes its type
  // in container-query units (cqw), which need a real inline-size to resolve.
  clone.style.width = `${node.offsetWidth}px`;
  clone.style.margin = "0";
  // Export-only exclusions (e.g. the duel's own action row) never appear in
  // the shared image.
  if (opts.exclude) clone.querySelectorAll(opts.exclude).forEach((el) => el.remove());

  const holder = document.createElement("div");
  holder.style.cssText =
    "position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;z-index:-1;pointer-events:none;";
  holder.appendChild(clone);
  document.body.appendChild(holder);

  try {
    await document.fonts.ready; // the card's faces must embed before capture
    // Wait for the clone's images to decode + let the browser paint, so the
    // export comes out fully rendered rather than blank.
    await Promise.all(
      Array.from(clone.querySelectorAll("img")).map((img) =>
        img.decode ? img.decode().catch(() => {}) : Promise.resolve(),
      ),
    );
    await nextFrame();
    await nextFrame();
    return await capture(clone);
  } finally {
    holder.remove();
  }
}

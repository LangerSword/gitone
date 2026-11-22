import type { Card, Finish } from "./types";
import { GOAT_LOGIN, GOAT_LOGINS } from "./constants";

// The portrait aperture is NOT one fixed rectangle: every struck-metal plate
// cuts a slightly different crest and inner frame. A single 26%/6.5%/68%/50%
// window crosses the silhouette on gold, iridescent, platinum, sector and the
// founder plate (measured: gold 164/782 boundary samples outside a 3% safe
// margin). On the DOM card the plate mask clips those pixels; on the Satori
// preview there is no plate mask, so they spill into the transparent gutter.
// Keep one window per plate, with >=3% clearance from the plate silhouette.
export interface PortraitWindow {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const PORTRAIT: Record<Finish | "goat", PortraitWindow> = {
  rookie: { left: 28, top: 9, width: 62, height: 46 },
  points: { left: 28, top: 9, width: 62, height: 46 },
  podium: { left: 28, top: 9, width: 62, height: 46 },
  winner: { left: 30, top: 16, width: 52, height: 39 },
  in_form: { left: 29, top: 11, width: 60, height: 42 },
  champion: { left: 29, top: 15, width: 55, height: 40 },
  founder: { left: 29, top: 12, width: 58, height: 44 },
  goat: { left: 29, top: 11, width: 58, height: 44 },
};

export function portraitFor(finish: Finish, opts?: { founder?: boolean; goat?: boolean }): PortraitWindow {
  if (opts?.founder || finish === "founder") return PORTRAIT.founder;
  if (opts?.goat) return PORTRAIT.goat;
  return PORTRAIT[finish] ?? PORTRAIT.podium;
}

// Same founder/GOAT resolution the DOM card and pickPlate() use, so all three
// renderers pick the aperture belonging to the plate they actually paint.
export function portraitForCard(card: Pick<Card, "finish" | "founder" | "login" | "number" | "rtg">): PortraitWindow {
  const founder = card.finish === "founder" || !!card.founder;
  const login = card.login.toLowerCase();
  const goat = !founder && (GOAT_LOGINS.includes(login) || login === GOAT_LOGIN || (card.number === 1 && card.rtg >= 97));
  return portraitFor(card.finish, { founder, goat });
}

export function cssBox(b: PortraitWindow) {
  return { left: `${b.left}%`, top: `${b.top}%`, width: `${b.width}%`, height: `${b.height}%` };
}

// The old ellipse (72% x 80% at 50% 42%, transparent at 84%) still had visible
// alpha past the box edges — its centre + radius exceeded 100% — which is the
// rectangle ghost that reads as the photo spilling over the frame. These
// gradients reach zero inside the box on all four sides.
export const FEATHER = "radial-gradient(ellipse 50% 50% at 50% 50%, #000 78%, transparent 100%)";
export const FADE_TOP = "linear-gradient(to bottom, transparent 0%, #000 8%)";
export const FADE_BOTTOM = "linear-gradient(to bottom, #000 82%, transparent 100%)";

// SVG twins used by the sharp composite (linear/radial stops mirror the CSS).
export function featherSvg(w: number, h: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="78%" stop-color="#fff" stop-opacity="1"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`;
}
export function fadeTopSvg(w: number, h: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fff" stop-opacity="0"/><stop offset="8%" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#t)"/></svg>`;
}
export function fadeBottomSvg(w: number, h: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="82%" stop-color="#fff" stop-opacity="1"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#b)"/></svg>`;
}

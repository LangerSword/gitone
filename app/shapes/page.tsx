import type { CardPreview } from "@/lib/racing/types";
import { DriverCard26 } from "@/components/DriverCard26";

/* A showcase of the full card range — one cut per rank, so the silhouette
   grammar is legible at a glance. Dev-facing reference, linked from nowhere
   in the product nav. */

const A = (f: string) => `/drivers/${f}.webp`;
const stats = (e: number, r: number, a: number, p: number) => ({ exp: e, rac: r, awa: a, pac: p });
const ctor = (name: string, code: string, color: string, ink: string) => ({ language: null, name, code, color, ink });

const RANGE: { tier: string; note: string; card: CardPreview }[] = [
  {
    tier: "FOUNDER · 1/1", note: "the gitone founder alone — struck-metal GOAT crest",
    card: { login: "LangerSword", name: "Lakshaya Sharma", avatarUrl: "https://avatars.githubusercontent.com/u/136903929?s=640", country: "IN", stats: stats(67, 70, 53, 91), rtg: 95, number: 18, finish: "founder", finishLabel: "1 OF 1", constructor: ctor("Python GP", "PY", "#4b8bbe", "#15161a"), founder: { accent: "#f5d67b", label: "1 OF 1", tagline: "Founder of gitone", edition: "1 OF 1", legend: "The Hamilton Legacy" } },
  },
  {
    tier: "THE GOAT", note: "the measuring stick — crested shield",
    card: { login: "torvalds", name: "Linus Torvalds", avatarUrl: A("torvalds"), country: "US", stats: stats(89, 67, 76, 96), rtg: 98, number: 1, finish: "champion", finishLabel: "CHAMPION", constructor: ctor("C GP", "C", "#a8b9cc", "#15161a") },
  },
  {
    tier: "CHAMPION", note: "notch-crest shield — iridescent gold",
    card: { login: "gaearon", name: "Dan Abramov", avatarUrl: A("gaearon"), country: "GB", stats: stats(90, 90, 88, 89), rtg: 93, number: 3, finish: "champion", finishLabel: "CHAMPION", constructor: ctor("JavaScript GP", "JS", "#f7df1e", "#15161a") },
  },
  {
    tier: "IN FORM", note: "chamfer-shoulder shield + team racing stripes",
    card: { login: "yyx990803", name: "Evan You", avatarUrl: A("yyx990803"), country: "CN", stats: stats(84, 86, 80, 88), rtg: 88, number: 11, finish: "in_form", finishLabel: "IN FORM", constructor: ctor("TypeScript GP", "TS", "#3178c6", "#ffffff") },
  },
  {
    tier: "WINNER", note: "asymmetric nose shield + team racing stripes",
    card: { login: "t3dotgg", name: "Theo Browne", avatarUrl: A("t3dotgg"), country: "US", stats: stats(80, 84, 78, 85), rtg: 85, number: 7, finish: "winner", finishLabel: "WINNER", constructor: ctor("TypeScript GP", "TS", "#3178c6", "#ffffff") },
  },
  {
    tier: "PODIUM", note: "twin-scallop shield + team racing stripes",
    card: { login: "kentcdodds", name: "Kent C. Dodds", avatarUrl: A("kentcdodds"), country: "US", stats: stats(76, 78, 74, 80), rtg: 80, number: 23, finish: "podium", finishLabel: "PODIUM", constructor: ctor("JavaScript GP", "JS", "#f7df1e", "#15161a") },
  },
  {
    tier: "POINTS", note: "single-notch shield",
    card: { login: "antirez", name: "Salvatore Sanfilippo", avatarUrl: A("torvalds"), country: "IT", stats: stats(70, 72, 66, 74), rtg: 72, number: 44, finish: "points", finishLabel: "POINTS", constructor: ctor("Ruby GP", "RB", "#e0115f", "#ffffff") },
  },
  {
    tier: "ROOKIE", note: "clean rounded-shoulder shield",
    card: { login: "mojombo", name: "Tom Preston-Werner", avatarUrl: A("gaearon"), country: "US", stats: stats(60, 64, 58, 68), rtg: 65, number: 99, finish: "rookie", finishLabel: "ROOKIE", constructor: ctor("Go GP", "GO", "#00add8", "#15161a") },
  },
];

export default function ShapesPage() {
  return (
    <main className="min-h-screen bg-[#15151e] px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="mono text-xs tracking-[0.3em] text-white/50">GITONE · CARD GRAMMAR</p>
        <h1 className="display mt-2 text-4xl uppercase">The card range</h1>
        <p className="mt-3 max-w-2xl text-white/60">
          Eight silhouettes cut from the collectible-crest grammar — straight sides, a refined
          top edge, a heel tapering to a point. The founder 1/1 crest is reserved for the founder
          of gitone alone; the GOAT crest is the measuring stick; every other rank wears its own
          cut, livery and stripes.
        </p>
        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
          {RANGE.map(({ tier, note, card }) => (
            <figure key={tier} className="flex flex-col items-center">
              <div className="w-full max-w-[240px]">
                <DriverCard26 card={card} />
              </div>
              <figcaption className="mt-5 text-center">
                <div className="mono text-sm font-bold tracking-[0.18em] text-white">{tier}</div>
                <div className="mt-1 text-xs text-white/50">{note}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </main>
  );
}

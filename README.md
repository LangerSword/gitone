<div align="center">

# GitOne

**your github, rated like f1** 🏁

Turn any GitHub profile into an F1 driver card. Scored the way the official
F1 games score their grid — EXP, RAC, AWA, PAC — read live from real commits,
PRs and reviews. Embed it anywhere; it re-scouts itself.

</div>

<br/>

## 🏁 &nbsp;Embed your card

```md
[![My gitone card](https://YOUR-HOST/<login>.png)](https://YOUR-HOST/<login>)
```

| | |
|---|---|
| **`<host>/<login>.png`** | your card, as a live image |
| **`<host>/<login>`** | the full scout report |
| **`<host>/<login>/vs/<other>`** | head-to-head, lights out |
| **`/api/card/<login>`** | the raw JSON |

## ⚙️ &nbsp;How the scouting works

The EA F1 games rate every driver on four numbers, with an overall where
**pace carries the greater weight**. Same system here, read straight from
GitHub's GraphQL API — no surveys, no self-reporting.

| | Stat | Scouted from |
|:--:|:--|:--|
| **PAC** | Pace | commit velocity — laps turned this season |
| **RAC** | Racecraft | PRs worked through other fields, battles judged in review |
| **AWA** | Awareness | hazards flagged, race-by-race presence |
| **EXP** | Experience | seasons on the grid, career mileage |

Your **RTG** is the pace-weighted headline. Raw stats cap at **88** — the 90s
are a legacy gate bought with years and influence. Your **constructor** is
your headline language with its own livery and a car spec
(COR / TOP / AERO / REL) built from your repos, and your **driver number** is
permanent — #1 is earned at 97+, and #17 is retired, as in the real sport.

Every card walks out in a finish: **ROOKIE** → **POINTS** → **PODIUM** →
**WINNER** → **CHAMPION** (legacy-gated), with **IN FORM** on a hot streak
and the founder in their own accent.

## 🧱 &nbsp;Stack

- Next.js 16 App Router + React 19 + Tailwind v4, all TypeScript
- GitHub GraphQL with a hash-sharded token pool, failover, and a windowed
  fallback for hyperactive profiles
- Redis read-through cache with single-flight coalescing (optional — falls
  back to live scouts when unset)
- The embed is Satori (`next/og`) rendering the same layout as the in-app
  card — one tree, two renderers

## 🔧 &nbsp;Run it

```bash
npm install
echo "GITHUB_TOKEN=ghp_…" > .env.local   # a classic PAT; GraphQL needs auth
npm run dev                              # :3001
npm test                                 # engine + duel suites
npm run build
```

## ⚠️ &nbsp;Notes

- Not affiliated with EA SPORTS, Formula 1, or GitHub.
- Inspired by [gitfut](https://github.com/mawsis/gitfut) — the football card
  original. gitone is the paddock next door.

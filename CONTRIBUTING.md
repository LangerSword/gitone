# Contributing to Gitone

Gitone is a Next.js app on Cloudflare Workers. The card is a live image that re-scouts a GitHub
profile every two hours, so changes to the render path affect every README embed.

## Local setup

```bash
git clone https://github.com/LangerSword/gitone.git
cd gitone
npm install --include=dev
npm run dev
```

The dev server runs on `http://localhost:3001`. If `NODE_ENV=production` is set in your shell,
`npm install` prunes dev dependencies — always pass `--include=dev`.

## Before opening a PR

Run all three, in order:

```bash
npm test
npm run lint
npm run build
```

CI must be green locally before you push. After pushing, check `gh run list -L1`; a flag is a
report of an outcome, not the outcome itself.

## What to work on

Issues labelled `good first issue` are self-contained. Comment before starting so two people do
not do the same work. Keep `public/demo/` out of feature commits unless the demo itself is the
change.

## Deploy notes

Production is Cloudflare Workers via OpenNext. `NEXT_PUBLIC_SITE_URL` must point at the live
origin; a stale local API token overrides Worker OAuth, so unset it before deploying with OAuth.

## Be careful with

- Card routes (`app/api/card-image/[username]/route.tsx`): embeds are cached by login and render
  version. Bump the render version when a visual treatment changes.
- Share images: a deleted OG URL breaks previously cached cards on X and Slack. Keep a route at
  the old path serving the new bytes.
- Never commit tokens. Secrets go in environment variables or the platform secret store.

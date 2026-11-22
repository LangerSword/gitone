# Gitone cold outreach system

Purpose: get Gitone into the hands of people who would actually embed its card, then let the
embed do the selling. Not a mass mail merge. Ten real people beat a hundred generic notes.

## Rules (from the guide, made specific)

1. **Relevance over template.** Every message needs one line that only makes sense for that
   person. If the first line would work on anyone, it does not go out.
2. **Four parts, in order:** why them → who you are → why you → one ask. Under 80 words, fits a
   phone screen with no scrolling.
3. **One link, no attachment.** Link goes to the live Gitone card or repo, not a PDF.
4. **One number if true.** e.g. "22 tests green", "5 stars" — never invent one.
5. **One ask, phone-answerable.** "Worth a look?" not "would love to connect."
6. **Write both follow-ups before sending email one.** A large share of replies come from
   follow-ups. Work the next target while you wait.
7. **Cut the slop:** "hope you're doing well", "respected sir/ma'am", "huge fan", life story,
   resume in the first email, several questions, decorative em dashes.
8. **No sponsorship / Buy Me a Coffee mention** in any promotional copy. It converts passively.

## Warm list measured now (5 Gitone stargazers)

| GitHub | Contact surface | Note |
|---|---|---|
| `wckdnya` | X `anykswha`, blog `wckdnya.me` | real person, plausible audience — verify blog contact before sending |
| `PTejasKr` | none on profile | research task, not a send target |
| `msmamtasharma542-spec` | none on profile | research task, not a send target |
| `vikashsharma242-star` | none on profile | research task, not a send target |
| `LangerSword` | self | exclude |

Only one warm entry has a usable contact surface. Build the rest from comparable-project
contributors and from people who actually embed GitHub cards — do not pad this list with guesses.

## Gate: do not send until the artifact is reliable for strangers

Gitone has returned intermittent Cloudflare 1102/503 responses on cold fetches. A broken card
in a first impression is worse than no outreach, and social crawlers cache the failure. Before
sending: fetch the card URL anonymously in a cold browser profile, confirm `image/*` for the OG
image, and confirm the profile-card route renders for handles that have never been visited.
Fix the cold-render path first; outreach is step two.

## Build the list from adjacency (verify every address)

Small list, real humans, verified contact surface:

```bash
# warmest first: people who already starred Gitone
gh api repos/LangerSword/gitone/stargazers --jq '.[].login'
# contributors to the closest comparable project (example: GitHub profile-card tooling)
gh api repos/anuraghazra/github-readme-stats/contributors --jq '.[].login'
# forks with real activity
gh api repos/LangerSword/gitone/forks --jq '.[] | [.full_name,.stargazers_count] | @tsv'
```

For each candidate:
```bash
gh api users/<login> --jq '{login,name,followers,public_repos,blog,email,twitter_username,bio}'
```
Keep only entries that resolve to a person plausibly interested in GitHub tooling or data viz.
Record the **verified** address (profile email, mailto on their blog, or X handle). A public
profile is not a verified address — if none is found, leave it in a research column, not the
send list. Never guess or bulk-buy addresses.

## Message shape

```
Subject: [plain, specific, no clickbait]

[Why them — one detail only they would recognise, ideally why now]
[Who you are — one line, the version relevant to them]
[Why you — one link to the card, plus a true number if you have one]
[One ask — answerable in one phone reply]
```

## Draft A — tool maintainer (replace bracketed research before use)

**Subject:** your profile card + Gitone

> Your [SPECIFIC DETAIL from their repo/release/post] caught my eye.
> I'm Lakshaya, building Gitone — it rates GitHub profiles like F1 drivers and renders a shareable card.
> [YOUR REAL NUMBER, e.g. tests green / stars], live at https://gitone.langersword.in
> Worth a look?

## Draft B — developer who starred Gitone

**Subject:** thanks for the star

> You starred Gitone after [SPECIFIC DETAIL about their own work].
> I'm Lakshaya, the builder. The card on the versus page exports both drivers' plates.
> https://gitone.langersword.in
> Want me to generate yours and send it back?

## Draft C — data-viz / F1 community creator

**Subject:** your [SPECIFIC POST] and our livery plates

> Your [SPECIFIC POST / design choice] is why I'm writing.
> I built Gitone: F1-style ratings for GitHub profiles, with livery-coloured plates.
> https://gitone.langersword.in
> Want me to make one for your profile?

## Follow-ups (write now, send later)

- **Day 3:** "Sent this earlier — figured the [SPECIFIC DETAIL] angle might've been buried. Still worth a look?"
- **Day 7:** "Closing the loop: I'll stop here. The card is at https://gitone.langersword.in if you ever want it."

One follow-up each, then stop. No guilt, no fifth nudge.

## Sending and tracking

- Gmail here is **draft-only**: I stage the copies, you review and send. Nothing is marked sent
  unless you actually sent it.
- Track per target: handle, verified address, why-them detail, date sent, follow-up dates,
  reply, embed created, star. Count replies by hand; don't infer success from a draft.
- Batch size: 10. After each batch, rewrite the first line of anything that got no reply —
  usually the research was too thin, not the product.

## Non-negotiables

No vote rings, bot stars, fake personas, bought lists, or invented metrics. No sponsorship ask
in copy. If a first line could be sent to someone else, delete it and do the boring research.

# Rook PR reviewer

Rook is GitOne's automated code review role. It reviews same-repository pull
requests and routes the owner review when another author opens a PR.

Hermes Agent is the runtime. Rook is the named role.

## Name and GitHub identity

GitHub records actions from a workflow token as `github-actions[bot]`. A
workflow cannot impersonate a custom user or rename that bot account. Rook is
the role name shown in the workflow, job, review comment and this document.

The review itself is non-blocking. Only the `test` check gates merge.

## Review routing

Rook requests review from `ROOK_REVIEWER`, a repository variable. If the
variable is unset, the repository owner is used.

- A PR authored by someone else gets a review request to `ROOK_REVIEWER`.
- When `ROOK_REVIEWER` is the owner, an owner-authored PR uses
  `ROOK_SECOND_REVIEWER`; without a fallback it skips.
- When `ROOK_REVIEWER` is another collaborator, an owner-authored PR routes to
  that collaborator.
- If `ROOK_SECOND_REVIEWER` is set, it covers the self-review case where the
  primary reviewer is the PR author.
- Draft PRs, fork PRs and PRs from outside this repository are skipped.
- The request runs on `opened`, `synchronize`, `reopened` and
  `ready_for_review`.

The current repository has one collaborator, `LangerSword`. Owner-authored PRs
therefore skip routing until a second collaborator exists or
`ROOK_SECOND_REVIEWER` names one. The request is a notification, not an
approval and not a merge gate.

## What is enabled

- `.github/workflows/rook-review.yml` posts one Markdown review comment per
  reviewable PR update.
- The reviewer uses a free Nous Portal model selected at PR time by
  `scripts/select_free_model.py`.
- Every run requests `--reasoning max`. Hermes clamps that request to the
  nearest level a model actually supports.
- The reviewer has no tools (`--toolsets ''`), no project rules
  (`--ignore-rules`), and runs with `--safe-mode`. PR text is written to files
  and treated as untrusted data.
- `scripts/build_review_prompt.py` injects `docs/REVIEW_RULES.md` into every
  review prompt. Edit that file to change review voice, severity labels, or
  evidence rules.
- Fork PRs are skipped; `pull_request` does not expose write-capable secrets to
  them.

## Repository secret

The workflow skips with a summary note until this secret is set:

```text
NOUS_API_KEY = sk-nous-...
```

Create the key in Nous Portal, then set it with:

```fish
gh secret set NOUS_API_KEY -R LangerSword/gitone
```

## Review routing variables

Set a different reviewer:

```fish
gh variable set ROOK_REVIEWER -R LangerSword/gitone -b another-login
```

Set a fallback for owner-authored PRs:

```fish
gh variable set ROOK_SECOND_REVIEWER -R LangerSword/gitone -b another-login
```

Leave either variable unset to use the repository owner or skip accordingly.

## Free-model selection

`scripts/select_free_model.py` reads the public catalog at
<https://portal.nousresearch.com/models>, keeps slugs labelled `FREE`, and probes
each candidate with a one-token inference request. The first slug that both
appears in the catalog and answers is selected.

Preference order: LongCat when it is actually served, then Solar Mini 4, Hy4
Flash, Step 3.7 Flash, then remaining free catalog entries. A stale catalog card
is never enough on its own. The probe filters it out.

Locally, the Hermes cron job `free-model-selector` runs the same selector every
six hours and updates `model.default` when the live free set changes. It backs
up `config.yaml` before each change and verifies the new value after writing it.

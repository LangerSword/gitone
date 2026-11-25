# Hermes PR reviewer

GitOne runs a non-blocking Hermes review on same-repository pull requests.

## What is enabled

- `.github/workflows/hermes-review.yml` posts one Markdown review comment per PR
  update. It is informational; only `test` gates merge.
- The reviewer uses a free Nous Portal model selected at PR time by
  `scripts/select_free_model.py`.
- Every run requests `--reasoning max`. Hermes clamps that request to the
  nearest level a model actually supports.
- The reviewer has no tools (`--toolsets ''`), no project rules
  (`--ignore-rules`), and runs with `--safe-mode`. PR text is written to files
  and treated as untrusted data.
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

## Free-model selection

`scripts/select_free_model.py` reads the public catalog at
<https://portal.nousresearch.com/models>, keeps slugs labelled `FREE`, and probes
each candidate with a one-token inference request. The first slug that both
appears in the catalog and answers is selected.

Preference order: LongCat when it is actually served, then Solar Mini 4, Hy4
Flash, Step 3.7 Flash, then remaining free catalog entries. A stale catalog card
is never enough on its own — the probe filters it out.

Locally, the Hermes cron job `free-model-selector` runs the same selector every
six hours and updates `model.default` when the live free set changes. It backs
up `config.yaml` before each change and verifies the new value after writing it.

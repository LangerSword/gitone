#!/usr/bin/env python3
"""Pick a currently-free Nous Portal model, preferring LongCat when it serves.

The public catalog is the source of truth for which slugs are labelled FREE;
a tiny inference probe is the source of truth for which slugs actually answer.
A catalog entry can be stale (LongCat 2.5 was listed while the inference route
returned 404), so probe before selecting whenever a token is available.

No dependencies, no secrets printed, no model cached between runs.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request

CATALOG_URL = "https://portal.nousresearch.com/models"
INFERENCE_URL = "https://inference-api.nousresearch.com/v1/chat/completions"
PREFERRED = (
    "meituan/longcat-2.5:free",
    "upstage/solar-mini4:free",
    "tencent/hy4-flash:free",
    "stepfun/step-3.7-flash:free",
)
SLUG_RE = re.compile(r"\b([a-z0-9][a-z0-9._-]*/[a-z0-9][a-z0-9._-]*(?::free)?)\b")


def fetch_catalog(timeout: int = 60) -> list[str]:
    request = urllib.request.Request(
        CATALOG_URL,
        headers={
            "User-Agent": "gitone-hermes-review/1.0",
            "Accept-Encoding": "identity",
        },
    )
    last_error: Exception | None = None
    text = ""
    for _ in range(3):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                text = response.read().decode("utf-8", "replace")
            break
        except (urllib.error.URLError, TimeoutError) as exc:
            last_error = exc
    else:
        raise RuntimeError(f"failed to fetch catalog: {last_error}")

    # The rendered page streams the free cards across several Next.js chunks,
    # so scan the whole document rather than a single markdown-like section.
    found: list[str] = []
    for raw in SLUG_RE.findall(text):
        if not raw.endswith(":free"):
            continue
        if raw not in found:
            found.append(raw)
    if not found:
        raise RuntimeError("catalog contained no free model slugs")
    return found


def local_token() -> str:
    """Only used by the local cron; never echoed."""
    env_token = os.environ.get("NOUS_API_KEY", "").strip()
    if env_token:
        return env_token
    path = os.path.expanduser("~/.hermes/auth.json")
    try:
        with open(path, encoding="utf-8") as handle:
            auth = json.load(handle)
        nous = (auth.get("providers") or {}).get("nous") or {}
    except (OSError, ValueError):
        return ""
    return str(nous.get("access_token") or nous.get("agent_key") or "").strip()


def probe(model: str, token: str, timeout: int = 20) -> tuple[bool, str]:
    body = json.dumps(
        {
            "model": model,
            "messages": [{"role": "user", "content": "ping"}],
            "max_tokens": 1,
            "stream": False,
        }
    ).encode()
    req = urllib.request.Request(
        INFERENCE_URL,
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "gitone-hermes-review/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            response.read()
            return True, "ok"
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:180].replace("\n", " ")
        return False, f"HTTP {exc.code}: {detail}"
    except (urllib.error.URLError, TimeoutError) as exc:
        return False, f"network: {exc}"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--format", choices=("text", "json"), default="text")
    parser.add_argument("--no-probe", action="store_true", help="trust catalog labels without an inference probe")
    args = parser.parse_args()

    free = fetch_catalog()
    order = [m for m in PREFERRED if m in free] + [m for m in free if m not in PREFERRED]
    token = "" if args.no_probe else local_token()

    checks: dict[str, str] = {}
    selected = ""
    for model in order:
        if not token:
            selected = model
            checks[model] = "not probed (no token)"
            break
        ok, reason = probe(model, token)
        checks[model] = reason
        if ok:
            selected = model
            break

    if not selected:
        print("No free Nous Portal model passed the availability probe.", file=sys.stderr)
        for model, reason in checks.items():
            print(f"  {model}: {reason}", file=sys.stderr)
        return 1

    payload = {
        "selected": selected,
        "free_models": free,
        "checked": checks,
        "source": CATALOG_URL,
        "probed": bool(token),
    }
    if args.format == "json":
        print(json.dumps(payload, indent=2))
    else:
        print(selected)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

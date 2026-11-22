#!/bin/sh
# Cron entry point for the off-path card PNG warmer.
# Cold renders are impossible on the Workers free plan (10ms CPU vs ~2s for a
# Satori composite), so the live route serves a branded fallback and this fills
# in the real card from a machine with no CPU cap.
set -e
cd /home/lakshaya/projects/gitone
exec node scripts/warm.mjs "${WARM_BATCH:-25}"

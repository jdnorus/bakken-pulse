#!/usr/bin/env bash
# Local hourly ingest — add to crontab with: crontab -e
# 0 * * * * /Users/jordannorus/Oil\ Consultant/bakken-pulse/scripts/cron-ingest-hourly.sh >> /tmp/bakken-pulse-ingest.log 2>&1

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

echo "[$(date -Iseconds)] Starting scheduled ND ingest"
npm run ingest:nd
echo "[$(date -Iseconds)] Done"

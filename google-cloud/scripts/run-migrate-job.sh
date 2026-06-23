#!/usr/bin/env bash
# Execute the Terraform-managed Cloud Run Job (Prisma migrate deploy).
# Optional: pass job name as first arg, or set MIGRATE_JOB_NAME / REGION / TAG.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=/dev/null
source "${ROOT}/google-cloud/scripts/load-env.sh"

REGION="${REGION:-${GCP_REGION:-asia-northeast1}}"
TAG="${TAG:-dev}"
PROJECT_ID="${PROJECT_ID:-${GCP_PROJECT_ID}}"
JOB="${MIGRATE_JOB_NAME:-${GCP_PROJECT_ID}-migrate-${TAG}}"

if [[ "${1:-}" != "" ]]; then
  JOB="$1"
fi

if [[ -z "${PROJECT_ID}" ]]; then
  echo "Set PROJECT_ID or: gcloud config set project YOUR_APP_PROJECT" >&2
  exit 1
fi

exec gcloud run jobs execute "${JOB}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --wait

#!/usr/bin/env bash
# Deploy API Cloud Run using an image that already exists in Artifact Registry.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=/dev/null
source "${ROOT}/google-cloud/scripts/load-env.sh"

REGION="${REGION:-${GCP_REGION:-asia-northeast1}}"
REPO="${REPO:-${GCP_PROJECT_ID}-docker}"
TAG="${TAG:-dev}"
AR_PID="${AR_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
DEPLOY_PID="${DEPLOY_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
SERVICE="${CLOUD_RUN_API_SERVICE:-${GCP_PROJECT_ID}-api-${TAG}}"

if [[ -z "${AR_PID}" ]] || [[ -z "${DEPLOY_PID}" ]]; then
  echo "Set AR_PROJECT_ID / DEPLOY_PROJECT_ID or gcloud config set project" >&2
  exit 1
fi

IMAGE="${REGION}-docker.pkg.dev/${AR_PID}/${REPO}/safar-app:${TAG}"

exec gcloud run deploy "${SERVICE}" \
  --project="${DEPLOY_PID}" \
  --image="${IMAGE}" \
  --region="${REGION}" \
  --no-allow-unauthenticated

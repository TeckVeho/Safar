#!/usr/bin/env bash
# Submit Cloud Build from repo root (Next.js monolith — single safar-app image).
# See google-cloud/scripts/README.md and google-cloud/cloudbuild/README.md.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=/dev/null
source "${ROOT}/google-cloud/scripts/load-env.sh"

CONFIG="${1:-google-cloud/cloudbuild/cloudbuild.dev.yaml}"
CONFIG_BASE=$(basename "$CONFIG")

if [[ ! -f "${CONFIG}" ]]; then
  echo "Cloud Build config not found: ${CONFIG}" >&2
  exit 1
fi

# Default tag from config filename when TAG is unset (prod yaml → prod; dev yaml → dev).
if [[ -z "${TAG:-}" ]]; then
  if [[ "${CONFIG_BASE}" == *.prod.yaml ]]; then
    TAG=prod
  else
    TAG=dev
  fi
fi

# Cloud Build rejects --substitutions keys that are not declared in the config's substitutions: block.
CORE_SUBS="_TAG=${TAG},_AR_PROJECT_ID=${GCP_PROJECT_ID},_DEPLOY_PROJECT_ID=${GCP_PROJECT_ID},_REPO=${GCP_PROJECT_ID}-docker"

exec gcloud builds submit --project="${GCP_PROJECT_ID}" --config="${CONFIG}" \
  --substitutions="${CORE_SUBS},_API_SERVICE=${GCP_PROJECT_ID}-api-${TAG},_MIGRATE_JOB=${GCP_PROJECT_ID}-migrate-${TAG}" .

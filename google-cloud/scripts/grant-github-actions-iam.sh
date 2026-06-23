#!/usr/bin/env bash
# Grant IAM for GitHub Actions + Cloud Build (single GCP project).
# Implements Step 5–6 of google-cloud/cloudbuild/GITHUB_ACTIONS_WIF.md
#
# Prerequisites: WIF pool/provider (Steps 1–2) and federated SA (Step 4) must exist,
# unless CREATE_SA=1 or you run with --setup-wif (Steps 1–5 only, no project IAM).
#
# Usage (from repo root):
#   bash google-cloud/scripts/grant-github-actions-iam.sh
#   CREATE_SA=1 bash google-cloud/scripts/grant-github-actions-iam.sh
#   DRY_RUN=1 bash google-cloud/scripts/grant-github-actions-iam.sh
#   bash google-cloud/scripts/grant-github-actions-iam.sh --setup-wif   # pool + provider + SA + WIF bind
#
# Overrides (env):
#   SA_ID=github-actions-safar
#   GITHUB_REPO=TeckVeho/safar
#   POOL_ID=github-pool  PROVIDER_ID=github-provider
#   CLOUDBUILD_SA=...    (auto-detected from latest build, else compute default SA)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=/dev/null
source "${ROOT}/google-cloud/scripts/load-env.sh"

SETUP_WIF=0
SKIP_APIS=0
SKIP_WIF_BINDING=0
for arg in "$@"; do
  case "$arg" in
    --setup-wif) SETUP_WIF=1 ;;
    --skip-apis) SKIP_APIS=1 ;;
    --iam-only) SKIP_WIF_BINDING=1 ;;
    -h|--help)
      sed -n '2,20p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *)
      echo "Unknown option: $arg (try --help)" >&2
      exit 1
      ;;
  esac
done

PROJECT_ID="${GCP_PROJECT_ID}"
SA_ID="${SA_ID:-github-actions-safar}"
SA_EMAIL="${SA_EMAIL:-${SA_ID}@${PROJECT_ID}.iam.gserviceaccount.com}"
POOL_ID="${POOL_ID:-github-pool}"
PROVIDER_ID="${PROVIDER_ID:-github-provider}"
GITHUB_REPO="${GITHUB_REPO:-TeckVeho/safar}"
DRY_RUN="${DRY_RUN:-0}"

run() {
  if [[ "$DRY_RUN" == 1 ]]; then
    echo "[dry-run] $*"
  else
    echo "+ $*"
    "$@"
  fi
}

bind_project_role() {
  local member="$1"
  local role="$2"
  run gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="${member}" \
    --role="${role}" \
    --quiet
}

# gcloud builds describe may return full resource name or email only
normalize_sa_email() {
  local sa="$1"
  if [[ "${sa}" == projects/*/serviceAccounts/* ]]; then
    sa="${sa##*/}"
  fi
  printf '%s' "${sa}"
}

PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
WIF_PROVIDER="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}"
WIF_MEMBER="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.repository/${GITHUB_REPO}"

echo "Project:        ${PROJECT_ID} (${PROJECT_NUMBER})"
echo "Federated SA:   ${SA_EMAIL}"
echo "GitHub repo:    ${GITHUB_REPO}"

if [[ "$SKIP_APIS" != 1 ]]; then
  echo "Enabling APIs..."
  run gcloud services enable \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    storage.googleapis.com \
    serviceusage.googleapis.com \
    cloudresourcemanager.googleapis.com \
    run.googleapis.com \
    iamcredentials.googleapis.com \
    sts.googleapis.com \
    --project="${PROJECT_ID}"
fi

if [[ "${CREATE_SA:-0}" == 1 ]]; then
  if gcloud iam service-accounts describe "${SA_EMAIL}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
    echo "Service account already exists: ${SA_EMAIL}"
  else
    echo "Creating service account ${SA_ID}..."
    run gcloud iam service-accounts create "${SA_ID}" \
      --project="${PROJECT_ID}" \
      --display-name="GitHub Actions Safar"
  fi
fi

if [[ "$SETUP_WIF" == 1 ]]; then
  if ! gcloud iam workload-identity-pools describe "${POOL_ID}" \
    --project="${PROJECT_ID}" --location=global >/dev/null 2>&1; then
    echo "Creating workload identity pool ${POOL_ID}..."
    run gcloud iam workload-identity-pools create "${POOL_ID}" \
      --project="${PROJECT_ID}" \
      --location=global \
      --display-name="GitHub Actions"
  else
    echo "Workload identity pool exists: ${POOL_ID}"
  fi

  if ! gcloud iam workload-identity-pools providers describe "${PROVIDER_ID}" \
    --project="${PROJECT_ID}" --location=global \
    --workload-identity-pool="${POOL_ID}" >/dev/null 2>&1; then
    echo "Creating OIDC provider ${PROVIDER_ID}..."
    run gcloud iam workload-identity-pools providers create-oidc "${PROVIDER_ID}" \
      --project="${PROJECT_ID}" \
      --location=global \
      --workload-identity-pool="${POOL_ID}" \
      --display-name="GitHub OIDC" \
      --issuer-uri="https://token.actions.githubusercontent.com" \
      --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
      --attribute-condition="assertion.repository == '${GITHUB_REPO}'"
  else
    echo "OIDC provider exists: ${PROVIDER_ID}"
  fi

  if [[ "${CREATE_SA:-0}" != 1 ]] && ! gcloud iam service-accounts describe "${SA_EMAIL}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
    echo "Federated SA not found: ${SA_EMAIL}. Set CREATE_SA=1 or create manually (Step 4 in GITHUB_ACTIONS_WIF.md)." >&2
    exit 1
  fi
fi

if ! gcloud iam service-accounts describe "${SA_EMAIL}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  echo "Federated SA not found: ${SA_EMAIL}" >&2
  echo "Create it (Step 4) or re-run with CREATE_SA=1." >&2
  exit 1
fi

if [[ "$SKIP_WIF_BINDING" != 1 ]]; then
  echo "Binding WIF principal to ${SA_EMAIL} (Step 5)..."
  run gcloud iam service-accounts add-iam-policy-binding "${SA_EMAIL}" \
    --project="${PROJECT_ID}" \
    --role="roles/iam.workloadIdentityUser" \
    --member="${WIF_MEMBER}"
fi

if [[ "$SETUP_WIF" == 1 ]]; then
  echo ""
  echo "WIF setup complete. GitHub secrets:"
  echo "  GCP_WORKLOAD_IDENTITY_PROVIDER=${WIF_PROVIDER}"
  echo "  GCP_SERVICE_ACCOUNT=${SA_EMAIL}"
  echo "  GCP_PROJECT_ID=${PROJECT_ID}"
  echo ""
  echo "Re-run without --setup-wif to grant Cloud Build IAM (Step 6), or run:"
  echo "  bash google-cloud/scripts/grant-github-actions-iam.sh --iam-only"
  exit 0
fi

echo "Granting project IAM for federated SA (Step 6)..."
FEDERATED_MEMBER="serviceAccount:${SA_EMAIL}"
for role in \
  roles/serviceusage.serviceUsageConsumer \
  roles/cloudbuild.builds.editor \
  roles/iam.serviceAccountUser \
  roles/artifactregistry.writer \
  roles/storage.admin; do
  bind_project_role "${FEDERATED_MEMBER}" "${role}"
done

CLOUDBUILD_SA="${CLOUDBUILD_SA:-}"
if [[ -z "${CLOUDBUILD_SA}" ]]; then
  latest_build_id="$(gcloud builds list --project="${PROJECT_ID}" --limit=1 --format='value(id)' 2>/dev/null || true)"
  if [[ -n "${latest_build_id}" ]]; then
    CLOUDBUILD_SA="$(gcloud builds describe "${latest_build_id}" \
      --project="${PROJECT_ID}" --format='value(serviceAccount)' 2>/dev/null || true)"
    CLOUDBUILD_SA="$(normalize_sa_email "${CLOUDBUILD_SA}")"
  fi
fi
if [[ -z "${CLOUDBUILD_SA}" ]]; then
  CLOUDBUILD_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
  echo "Cloud Build execution SA not detected from recent builds; using default: ${CLOUDBUILD_SA}"
  echo "Override with CLOUDBUILD_SA=... if your project uses ${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
else
  echo "Cloud Build execution SA: ${CLOUDBUILD_SA}"
fi
CLOUDBUILD_SA="$(normalize_sa_email "${CLOUDBUILD_SA}")"

echo "Granting project IAM for Cloud Build execution SA..."
CB_MEMBER="serviceAccount:${CLOUDBUILD_SA}"
for role in \
  roles/storage.objectAdmin \
  roles/artifactregistry.writer \
  roles/logging.logWriter \
  roles/run.admin \
  roles/iam.serviceAccountUser; do
  bind_project_role "${CB_MEMBER}" "${role}"
done

echo ""
echo "Done. GitHub Environment secrets (develop / staging / production):"
echo "  GCP_WORKLOAD_IDENTITY_PROVIDER=${WIF_PROVIDER}"
echo "  GCP_SERVICE_ACCOUNT=${SA_EMAIL}"
echo "  GCP_PROJECT_ID=${PROJECT_ID}"
echo ""
echo "See google-cloud/cloudbuild/GITHUB_ACTIONS_WIF.md Step 7 for optional Variable GCP_IMAGE_TAG."

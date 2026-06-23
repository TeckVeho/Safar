#!/usr/bin/env bash
# Verify terraform.tfvars project_id matches GCP_PROJECT_ID in load-env.sh.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=/dev/null
source "${ROOT}/google-cloud/scripts/load-env.sh"

fail=0
check_tfvars() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  local pid
  pid="$(grep -E '^\s*project_id\s*=' "$f" | head -1 | sed -E 's/.*=\s*"([^"]+)".*/\1/')"
  if [[ -n "$pid" && "$pid" != "$GCP_PROJECT_ID" ]]; then
    echo "MISMATCH $f: project_id=$pid (expected $GCP_PROJECT_ID)" >&2
    fail=1
  fi
}

for f in "${ROOT}"/google-cloud/terraform/environments/*/*/terraform.tfvars; do
  check_tfvars "$f"
done
check_tfvars "${ROOT}/google-cloud/terraform/environments/bootstrap/terraform.tfvars"

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi
echo "OK: tfvars project_id matches GCP_PROJECT_ID (${GCP_PROJECT_ID})"

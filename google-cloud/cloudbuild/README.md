# Cloud Build configs

YAML files in this directory build Docker images and (for `cloudbuild.*.yaml` without `-api`/`-web` suffix) deploy to Cloud Run.

**Single-project layout (current):** All steps use **`dx-safar`** — `_AR_PROJECT_ID` and `_DEPLOY_PROJECT_ID` are set to the same project ID. Artifact Registry repo: `dx-safar-docker`. Cloud Run monolith service: `dx-safar-api-{tag}`; migrate job: `dx-safar-migrate-{tag}` where `{tag}` is `dev`, `stage`, or `prod`.

[`.github/workflows/cd-gcp.yml`](../../.github/workflows/cd-gcp.yml) and [`scripts/cloud-build-submit.sh`](../scripts/cloud-build-submit.sh) pass substitutions from **`GCP_PROJECT_ID`** only (no separate AR or deploy project variables).

## Branch triggers (example)

Create one trigger per branch (or use GitHub Actions) in **`dx-safar`**. Set substitutions per environment:

| Branch | Config file | Typical substitutions |
|--------|-------------|-------------------------|
| `develop` | `cloudbuild.dev.yaml` | `_AR_PROJECT_ID=dx-safar`, `_DEPLOY_PROJECT_ID=dx-safar`, `_TAG=dev`, `_REPO=dx-safar-docker` |
| `staging` | `cloudbuild.dev.yaml` | Same project; `_TAG=stage` |
| `production` | `cloudbuild.prod.yaml` | Same project; `_TAG=prod` |

**IAM — Cloud Build execution SA**

GCP uses either the legacy Cloud Build SA (`PROJECT_NUMBER@cloudbuild.gserviceaccount.com`) or the Compute Engine default SA (`PROJECT_NUMBER-compute@developer.gserviceaccount.com`) to **execute** builds. On **`dx-safar`**, this SA needs:

- **`roles/storage.objectAdmin`** — read source from `gs://dx-safar_cloudbuild`
- **`roles/artifactregistry.writer`** — push to `dx-safar-docker`
- **`roles/logging.logWriter`** — full step logs (recommended)
- **`roles/run.admin`** + **`roles/iam.serviceAccountUser`** — `gcloud run jobs update` / `gcloud run deploy` in the same project

**Staging bucket cleanup** — Terraform **bootstrap** ([`terraform/environments/bootstrap`](../terraform/environments/bootstrap)) sets a GCS lifecycle rule on `gs://dx-safar_cloudbuild/source/` (default: delete after **7 days**). Import the bucket once before apply; see [`terraform/modules/cloudbuild_bucket/README.md`](../terraform/modules/cloudbuild_bucket/README.md).

**Artifact Registry** — Created in bootstrap (`dx-safar-docker`). Grant **`roles/artifactregistry.writer`** to the Cloud Build SA via `additional_artifact_registry_writer_members` in bootstrap `terraform.tfvars`.

**Migrate job (`dx-safar-migrate-*`)** — Cloud SQL volume, `DATABASE_URL` secret, and VPC are defined in [`terraform/modules/cloud_run/migrate_job.tf`](../terraform/modules/cloud_run/migrate_job.tf). Full deploy configs use `gcloud run jobs update --image` only (not `jobs deploy`), so CI does not wipe that config. If the job was broken (`describe` shows no volumes/env), run once: `terraform apply -replace='google_cloud_run_v2_job.migrate[0]'`.

Check which SA your project uses: **Cloud Build → Settings** in Console. See [`GITHUB_ACTIONS_WIF.md`](GITHUB_ACTIONS_WIF.md) Step 6 for full commands.

**GitHub Actions** — [`cd-gcp.yml`](../../.github/workflows/cd-gcp.yml) sets `_AR_PROJECT_ID`, `_DEPLOY_PROJECT_ID`, `_REPO`, and service names from Environment secret **`GCP_PROJECT_ID`**. See [`GITHUB_ACTIONS_WIF.md`](GITHUB_ACTIONS_WIF.md) Step 7.

See also [`scripts/README.md`](../scripts/README.md).

## Cloud Build substitution syntax

All YAML files use only Cloud Build user-defined substitutions (`${_TAG}`, `${_AR_PROJECT_ID}`, etc.) — **no bash local variables** inside step scripts. This avoids `INVALID_ARGUMENT: key in the template "…" is not a valid built-in substitution` errors, since Cloud Build scans all `$IDENT` / `${IDENT}` patterns in the YAML and rejects anything that is not a built-in or `_`-prefixed user substitution.

Manual submit from repo root (single project):

```bash
gcloud builds submit --project=dx-safar --config=google-cloud/cloudbuild/cloudbuild.dev.yaml \
  --substitutions=_AR_PROJECT_ID=dx-safar,_DEPLOY_PROJECT_ID=dx-safar,_REPO=dx-safar-docker,_TAG=dev .
```

Or use [`scripts/cloud-build-submit.sh`](../scripts/cloud-build-submit.sh) with `GCP_PROJECT_ID=dx-safar`.

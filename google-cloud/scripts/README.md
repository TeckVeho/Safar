# GCP helper scripts

Thin wrappers around `gcloud builds submit` and `gcloud run` for local use. Prefer [GitHub Actions `cd-gcp.yml`](../../.github/workflows/cd-gcp.yml) for CI.

**IAM** (see [cloudbuild/README.md](../cloudbuild/README.md)): the Cloud Build execution SA needs `artifactregistry.writer` on the registry project and `run.admin` + `iam.serviceAccountUser` on the deploy project.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `PROJECT_ID` | Project where `gcloud builds submit` runs (defaults to `gcloud config get-value project`) |
| `AR_PROJECT_ID` | Artifact Registry (common) project; defaults to `PROJECT_ID` |
| `DEPLOY_PROJECT_ID` | Cloud Run target app project; defaults to `PROJECT_ID` |
| `TAG` | Image tag (`dev`, `stage`, `prod`); default `dev` |
| `REGION` | Default `asia-northeast1` |
| `MIGRATE_JOB_NAME` | Override for `run-migrate-job.sh` (default `{GCP_PROJECT_ID}-migrate-{TAG}`) |
| `CLOUD_RUN_API_SERVICE` | Override deploy target (default `{GCP_PROJECT_ID}-api-{TAG}`) |

## Scripts

| Script | Description |
|--------|-------------|
| [`grant-github-actions-iam.sh`](grant-github-actions-iam.sh) | Step 5–6 from [`GITHUB_ACTIONS_WIF.md`](../cloudbuild/GITHUB_ACTIONS_WIF.md): WIF SA bind + IAM for GitHub federated SA and Cloud Build execution SA (single project) |
| [`cloud-build-submit.sh`](cloud-build-submit.sh) | `gcloud builds submit` from repo root with substitutions (mirrors the GitHub workflow) |
| [`deploy-api.sh`](deploy-api.sh) | Deploy API Cloud Run from an existing image (build-only workflows) |
| [`deploy-web.sh`](deploy-web.sh) | Deploy web Cloud Run from an existing image |
| [`run-migrate-job.sh`](run-migrate-job.sh) | `gcloud run jobs execute` for the Prisma migrate job ([`migrate_job.tf`](../terraform/modules/cloud_run/migrate_job.tf)) |
| [`verify-project-id.sh`](verify-project-id.sh) | Verify `terraform.tfvars` `project_id` matches `GCP_PROJECT_ID` in `load-env.sh` |

### GitHub Actions IAM (WIF)

After WIF pool/provider and federated SA exist ([`GITHUB_ACTIONS_WIF.md`](../cloudbuild/GITHUB_ACTIONS_WIF.md) Steps 1–4):

```bash
# From repo root
bash google-cloud/scripts/grant-github-actions-iam.sh
```

First-time setup (creates pool, provider, SA, WIF binding; then grant IAM):

```bash
CREATE_SA=1 bash google-cloud/scripts/grant-github-actions-iam.sh --setup-wif
bash google-cloud/scripts/grant-github-actions-iam.sh
```

### Cloud Build submit

```bash
# From repository root — dev build + deploy (Next.js monolith)
bash google-cloud/scripts/cloud-build-submit.sh google-cloud/cloudbuild/cloudbuild.dev.yaml
```

```bash
# Run DB migrations after a new API image exists (job name from terraform output)
export MIGRATE_JOB_NAME="$(cd google-cloud/terraform/live/dev/app && terragrunt output -raw cloud_run_migrate_job_name)"
export PROJECT_ID='your-dev-project'
bash google-cloud/scripts/run-migrate-job.sh
```

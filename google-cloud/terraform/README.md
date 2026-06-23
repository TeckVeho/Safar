# Terraform (GCP)

Infrastructure as code for Safar. Layout: **`modules/`** + **`environments/`** + **`live/`** (Terragrunt).

## Layout

```
google-cloud/terraform/
├── modules/                 # Reusable modules (see modules/README.md)
│   ├── app_compose, naming, cloud_run, cloud_sql, gcs, secrets, iam, network
│   ├── artifact_registry, cloudbuild_bucket
│   └── sql_schedule, app_cron
├── environments/
│   ├── bootstrap/           # State bucket + AR + Cloud Build cleanup (local state)
│   ├── dev|stg|prod/
│   │   ├── network/
│   │   └── app/
├── live/                    # Terragrunt entrypoints
└── wiki.md
```

## Prerequisites

- Terraform `>= 1.5`, Terragrunt
- GCP project `dx-safar` (see `google-cloud/scripts/load-env.sh`)
- `gcloud auth login` and `gcloud auth application-default login`

## Apply order

1. **`live/bootstrap`** — state bucket, Artifact Registry, Cloud Build lifecycle
2. **`live/{env}/network`** — per env (unique CIDR in same project)
3. **`live/{env}/app`**

```bash
cd google-cloud/terraform/live
terragrunt run-all plan
```

See [DEPLOY_GUIDE.md](../DEPLOY_GUIDE.md) and [live/README.md](live/README.md).

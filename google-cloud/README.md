# Google Cloud (Safar)

Một điểm vào cho mọi thứ liên quan GCP: Terraform, Cloud Build, và script vận hành.

```
google-cloud/
├── DEPLOY_GUIDE.md     # Hướng dẫn deploy đầy đủ
├── terraform/          # IaC (Terragrunt + modules)
├── cloudbuild/         # Cloud Build YAML (dev/prod monolith)
└── scripts/            # gcloud wrappers (build, deploy, migrate)
```

## Quick start

**1. Terraform (Terragrunt)**

```bash
cd google-cloud/terraform/live/bootstrap && terragrunt apply
cd ../dev/network && terragrunt apply
cd ../app && terragrunt apply
```

**2. Build & deploy**

```bash
bash google-cloud/scripts/cloud-build-submit.sh google-cloud/cloudbuild/cloudbuild.dev.yaml
```

**3. DB migrate (Cloud Run Job)**

```bash
export MIGRATE_JOB_NAME="$(cd google-cloud/terraform/live/dev/app && terragrunt output -raw cloud_run_migrate_job_name)"
bash google-cloud/scripts/run-migrate-job.sh
```

## Tài liệu

| Doc | Mô tả |
|-----|--------|
| [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) | Luồng deploy GCP từ đầu đến cuối |
| [terraform/README.md](terraform/README.md) | Layout Terraform / Terragrunt |
| [terraform/wiki.md](terraform/wiki.md) | Chính sách naming, tier, IAM |
| [cloudbuild/README.md](cloudbuild/README.md) | Cloud Build configs & IAM |
| [cloudbuild/GITHUB_ACTIONS_WIF.md](cloudbuild/GITHUB_ACTIONS_WIF.md) | GitHub Actions + WIF |
| [scripts/README.md](scripts/README.md) | Script local |

## Sau khi pull / merge thay đổi layout

1. **Local `terraform.tfvars`** (gitignored): nếu còn ở path cũ `infra/environments/`, copy sang `google-cloud/terraform/environments/`.
2. **Terragrunt cache:** xóa `google-cloud/terraform/live/**/.terragrunt-cache/` rồi `terragrunt init`.
3. **Terraform state trên GCS** không cần migrate — prefix giữ nguyên.

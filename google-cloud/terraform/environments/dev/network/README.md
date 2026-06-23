# Dev — network stack

VPC + Private Service Access for Cloud SQL. Apply **before** `../app/` when `enable_cloud_sql = true`.

State prefix: `network/dev`.

```bash
cd google-cloud/terraform/live/dev/network
source ../../../../scripts/load-env.sh   # GCP_REGION, GCP_PROJECT_ID
terragrunt apply
```

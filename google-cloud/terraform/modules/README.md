# Terraform modules (template-aligned)

| Module | Safar usage |
|--------|------------|
| [naming](naming/) | `{project}-{service}-{component}-{env}` name helpers |
| [app_compose](app_compose/) | **App stack** — composes child modules |
| [artifact_registry](artifact_registry/) | Docker registry + cleanup policies (`environments/bootstrap`) |
| [cloudbuild_bucket](cloudbuild_bucket/) | Lifecycle on `gs://{project_id}_cloudbuild/source/` (`bootstrap`) |
| [network](network/) | VPC + PSA per env |
| [cloud_sql](cloud_sql/) | MySQL + `DATABASE_URL` secret |
| [gcs](gcs/) | Uploads bucket |
| [secrets](secrets/) | Secret Manager accessor for Cloud Run SA |
| [iam](iam/) | Project labels + optional IAM members |
| [cloud_run](cloud_run/) | API/Web Cloud Run, domain mapping, migrate job, Vertex |
| [app_cron](app_cron/) | Cloud Scheduler → Cloud Run API OIDC cron jobs |
| [sql_schedule](sql_schedule/) | Dev SQL night/weekend schedule (JST) |
| [armor](armor/) | Scaffold — `enabled = false` |
| [dns](dns/) | Scaffold — `enabled = false` |
| [lb](lb/) | Scaffold — `enabled = false` |
| [monitoring](monitoring/) | Scaffold — `enabled = false` |

Composed via [`app_compose`](app_compose/) from [`environments/_shared/app`](../environments/_shared/app/).

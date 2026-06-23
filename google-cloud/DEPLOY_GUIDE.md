# GCP Deployment Guide (Safar)

This document describes the **infrastructure deployment workflow** on Google Cloud Platform for the Safar project: creating GCP projects, CLI authentication, running Terraform/Terragrunt stacks in order, and deploying the application once infra is ready.

Internal policy (naming, tiers, IAM): [google-cloud/terraform/wiki.md](terraform/wiki.md).  
Infra code layout: [google-cloud/terraform/README.md](terraform/README.md).

---

## Table of contents

1. [Architecture overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Create GCP projects (manual)](#3-create-gcp-projects-manual)
4. [Local login and permissions](#4-local-login-and-permissions)
5. [Terraform apply order](#5-terraform-apply-order)
6. [Configure `terraform.tfvars`](#6-configure-terraformtfvars)
   - [6.5 Dev / Stg: SQL schedule & API cron (on by default)](#65-dev--stg-sql-schedule--api-cron-on-by-default)
   - [6.6 Secrets — Secret Manager (required)](#66-secrets--secret-manager-required)
   - [6.7 Production: Cloud SQL backup & deletion protection (required)](#67-production-cloud-sql-backup--deletion-protection-required)
7. [Terragrunt commands (recommended)](#7-terragrunt-commands-recommended)
8. [Plain Terraform (per stack)](#8-plain-terraform-per-stack)
9. [After infra apply](#9-after-infra-apply)
10. [CI/CD and GitHub Actions](#10-cicd-and-github-actions)
11. [Common troubleshooting](#11-common-troubleshooting)

---

## 1. Architecture overview

### Single-project model

All environments run in **one GCP project** (`dx-safar` by default), separated by `env_suffix` (dev / stg / prod) and resource naming `{project}-{component}-{env}`.

| Stack | Role |
|-------|------|
| `bootstrap` | Terraform state bucket, Artifact Registry (`dx-safar-docker`), Cloud Build `source/` lifecycle cleanup |
| `network/{env}` | VPC per env (distinct CIDR) |
| `app/{env}` | Cloud Run, Cloud SQL, GCS, secrets, cron |

Default GCP project: **`dx-safar`** (see `google-cloud/scripts/load-env.sh`). State bucket: **`dx-safar-terraform-state`** (in `live/*/terragrunt.hcl`).

### Stack order and state

```mermaid
flowchart TD
  A[bootstrap<br/>state + AR + Cloud Build cleanup<br/>state: local] --> C[network / env<br/>VPC + PSA<br/>prefix: network/dev|stg|prod]
  C --> D[app / env<br/>Cloud Run, SQL, GCS...<br/>prefix: app/dev|stg|prod]
```

| Terragrunt unit | Terraform source | State prefix (GCS) |
|-----------------|------------------|---------------------|
| `google-cloud/terraform/live/bootstrap` | `google-cloud/terraform/environments/bootstrap` | *(local in bootstrap dir)* |
| `google-cloud/terraform/live/dev/network` | `_shared/network` + `dev/network/terraform.tfvars` | `network/dev` |
| `google-cloud/terraform/live/dev/app` | `_shared/app` + `dev/app/terraform.tfvars` | `app/dev` |
| `google-cloud/terraform/live/stg/...` | same pattern | `network/stg`, `app/stg` |
| `google-cloud/terraform/live/prod/...` | same pattern | `network/prod`, `app/prod` |

Default state bucket: **`dx-safar-terraform-state`** (in `live/*/terragrunt.hcl`).

> **Note:** Terraform **does not create GCP projects**. Create `dx-safar` in Console first, then match `project_id` in `terraform.tfvars`.

### Runtime flow (after infra)

```
Cloud Build → Artifact Registry (bootstrap) → Cloud Run → Cloud SQL (private IP via network stack)
```

---

## 2. Prerequisites

### Tools

| Tool | Version / notes |
|------|-----------------|
| [Terraform](https://developer.hashicorp.com/terraform/downloads) | `>= 1.5` |
| [Terragrunt](https://terragrunt.gruntwork.io/docs/getting-started/install/) | Recommended when running multiple stacks (dependency order) |
| [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) | `gcloud` |

### Minimum IAM (user running first apply)

On **`dx-safar`** (single project):

- Create GCS state bucket, Artifact Registry, Cloud Build lifecycle (bootstrap)
- Cloud Run, Cloud SQL, VPC per env, Secret Manager, IAM bindings

Prod: apply via PR + review when policy requires it.

---

## 3. Create GCP project (manual)

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **Create Project**.
2. **Project ID:** `dx-safar` (must match `project_id` in `terraform.tfvars` and `load-env.sh`).
3. Attach **billing**.

Cloud Build SA for image push (grant writer in bootstrap tfvars):

```bash
gcloud projects describe dx-safar --format='value(projectNumber)'
# serviceAccount:NUMBER@cloudbuild.gserviceaccount.com
```

See [bootstrap/terraform.tfvars.example](terraform/environments/bootstrap/terraform.tfvars.example).

### (Optional) Project `tier` label

Mỗi lần `app/{env}` apply sẽ **ghi đè** label `tier` trên project từ `resource_tier` của env đó (ví dụ `tier3` → `labels.tier=tier3`). Cùng `resource_tier` ở mọi env thì label không đổi dù apply env nào.

Lần đầu, import vào **từng** stack app đã apply (dev/stg/prod):

```bash
cd google-cloud/terraform/live/dev/app   # lặp lại cho stg/prod nếu cần
terragrunt import 'module.app_compose.module.iam.google_project.wiki_labels' dx-safar
```

---

## 4. Local login and permissions

The Terraform `google` provider uses **Application Default Credentials (ADC)**. You need **two** login steps:

### 4.1 CLI login (`gcloud`, manual build/deploy)

```bash
gcloud auth login
```

- Opens a browser; pick a Google account with access to the projects.
- Used for: `gcloud builds submit`, `gcloud run deploy`, logs, etc.

### 4.2 ADC for Terraform

```bash
gcloud auth application-default login
```

- Credentials stored at `~/.config/gcloud/application_default_credentials.json`.
- **Required** for `terraform plan/apply` and `terragrunt`.

### 4.3 Default project (optional, for `gcloud` only)

```bash
# Example when working on dev
gcloud config set project dx-safar-dev
gcloud config get-value project
```

Terraform does **not** use `gcloud config project` as the source of truth; `project_id` comes from `terraform.tfvars`. Set config only for convenience when running `gcloud` manually.

### 4.4 Verify login

```bash
gcloud auth list
gcloud auth application-default print-access-token >/dev/null && echo "ADC OK"
```

ADC tokens expire — if Terraform reports credential errors, run `gcloud auth application-default login` again.

### 4.5 (Advanced) Impersonate a service account

If your org disallows direct user apply and only allows SA impersonation:

```bash
export GOOGLE_IMPERSONATE_SERVICE_ACCOUNT=terraform@dx-safar-common.iam.gserviceaccount.com
gcloud auth application-default login --impersonate-service-account="$GOOGLE_IMPERSONATE_SERVICE_ACCOUNT"
```

Only when the platform team has granted `roles/iam.serviceAccountTokenCreator`.

---

## 5. Terraform apply order

Run **once per new org/environment**, then only `plan/apply` when code or tfvars change.

| Step | Stack | Purpose | Depends on |
|------|-------|---------|------------|
| 1 | **bootstrap** | State bucket, Artifact Registry, Cloud Build `source/` cleanup | Project exists |
| 2 | **`<env>/network`** | VPC per env (unique CIDR) | State bucket |
| 3 | **`<env>/app`** | Cloud Run, SQL, GCS, secrets, cron | Network applied |
| 4 | **Deploy app** | Build images + deploy Cloud Run / migrate job | Bootstrap AR + app stack |

**Important:** If `enable_cloud_sql = true` in the app stack, you must set `network_remote_state_bucket` and `network_remote_state_prefix` to that env’s network state, and **apply network before app**.

---

## 6. Configure `terraform.tfvars`

`terraform.tfvars` files are **not committed** (gitignored). Copy from `*.example`:

```bash
cp google-cloud/terraform/environments/bootstrap/terraform.tfvars.example google-cloud/terraform/environments/bootstrap/terraform.tfvars
cp google-cloud/terraform/environments/dev/network/terraform.tfvars.example google-cloud/terraform/environments/dev/network/terraform.tfvars
cp google-cloud/terraform/environments/dev/app/terraform.tfvars.example google-cloud/terraform/environments/dev/app/terraform.tfvars
```

### 6.1 Bootstrap (`environments/bootstrap/terraform.tfvars`)

| Variable | Meaning |
|----------|---------|
| `project_id` | `dx-safar` (match `.env`) |
| `state_bucket_name` | e.g. `dx-safar-terraform-state` |
| `artifact_cleanup_*` | AR image cleanup policies |
| `additional_artifact_registry_writer_members` | Cloud Build SA for push |

Import existing Cloud Build bucket once: see [bootstrap/README.md](terraform/environments/bootstrap/README.md).

### 6.2 Network (per env)

| Variable | Meaning |
|----------|---------|
| `project_id` | Same as bootstrap / `.env` |
| `env_suffix` | `dev` / `stg` / `prod` |
| `connector_subnet_cidr`, `private_service_peering_cidr` | **Must differ per env** in one project |

### 6.3 App (per env)

Minimum required:

- `project_id`, `env_suffix`
- `container_image` — `asia-northeast1-docker.pkg.dev/dx-safar/dx-safar-docker/safar-app:{tag}`
- With SQL: `network_remote_state_bucket` = `dx-safar-terraform-state`, `network_remote_state_prefix` = `network/dev`
- Per-env Cloud Run runtime SA (`{project}-run-{env}`) is created automatically on each app apply
- `resource_tier` — sizing **và** GCP label `tier` (ghi đè mỗi apply)
- **All secret values** must live in **Secret Manager** (never in `terraform.tfvars`, git, or plain `env_vars`) — see [§6.6](#66-secrets--secret-manager-required)
- `resource_tier` — `tier1` … `tier4` (Cloud Run / SQL sizing — see wiki)
- **Dev / Stg:** enable `enable_sql_night_weekend_schedule` and `enable_cron_cloud_scheduler` by default — see [§6.5](#65-dev--stg-sql-schedule--api-cron-on-by-default)
- **Prod:** with Cloud SQL, **backups on** and **deletion protection on** — see [§6.7](#67-production-cloud-sql-backup--deletion-protection-required)

Full sample: [google-cloud/terraform/environments/dev/app/terraform.tfvars.example](terraform/environments/dev/app/terraform.tfvars.example).

### 6.5 Dev / Stg: SQL schedule & API cron (on by default)

On **dev** and **stg**, when deploying the app stack with Cloud SQL, the project convention is to **enable** both features in `terraform.tfvars` (`.example` files reflect this). **Prod** keeps both off unless operations decides otherwise.

| Terraform variable | Dev / Stg (recommended) | Prod |
|--------------------|-------------------------|------|
| `enable_sql_night_weekend_schedule` | `true` | `false` |
| `enable_cron_cloud_scheduler` | `true` | `false` |

> In the Terraform module, both variables default to `false` (all envs if omitted). Dev/stg **must set `true` explicitly** in tfvars — do not rely on module defaults.

#### Cloud SQL: start/stop schedule (`enable_sql_night_weekend_schedule`)

- **Purpose:** Reduce dev/stg cost — stop Cloud SQL at night and on weekends (JST).
- **Requires:** `enable_cloud_sql = true`.
- **Extra infra:** Cloud Scheduler (start/stop) + Cloud Functions Gen2 ([`google-cloud/terraform/functions/sql-activation/`](terraform/functions/sql-activation/)) toggling `activation_policy` NEVER/ALWAYS.
- **Default schedule** (overridable):

| Variable | Default | Meaning |
|----------|---------|---------|
| `sql_schedule_timezone` | `Asia/Tokyo` | Scheduler timezone |
| `sql_schedule_start_cron` | `0 8 * * 1-5` | Start SQL 08:00 Mon–Fri |
| `sql_schedule_stop_cron` | `0 22 * * 1-5` | Stop SQL 22:00 Mon–Fri (Fri 22:00 → Mon 08:00 stays off) |

Example in `dev/app/terraform.tfvars` / `stg/app/terraform.tfvars`:

```hcl
enable_cloud_sql                    = true
enable_sql_night_weekend_schedule   = true
# sql_schedule_timezone   = "Asia/Tokyo"   # optional
# sql_schedule_start_cron = "0 8 * * 1-5"
# sql_schedule_stop_cron  = "0 22 * * 1-5"
```

After apply, check job names: `terragrunt output` in `google-cloud/terraform/live/dev/app` (or stg) — `sql_schedule_stop_job_name`, `sql_schedule_start_job_name`.

**Operations note:** API requests while SQL is STOPPED will fail DB connections until the start job runs (or you start the instance manually in the Console). Stg uses the same schedule — start SQL manually or adjust cron for off-hours testing.

#### API cron: Cloud Scheduler required (`enable_cron_cloud_scheduler`)

Dev/stg **must not** run cron inside the Node process (`node-cron`). Cron **must** go through **Cloud Scheduler → OIDC → POST** to `/internal/cron/*` on the API Cloud Run service.

| Component | Behavior when `enable_cron_cloud_scheduler = true` |
|-----------|------------------------------------------------------|
| Terraform | Creates SA `dx-safar-cron-api-{env_suffix}@...`, Scheduler jobs (token cleanup, TBS batch, recommendations) |
| Cloud Run API env | `DISABLE_IN_PROCESS_CRON=1`, `CRON_SCHEDULER_SERVICE_ACCOUNT=<SA email>` |
| Backend | `cron.service` does **not** register in-process jobs; work runs only when Scheduler hits `/internal/cron/...` (OIDC middleware) |

Default job schedules (`cron_timezone`, default `Asia/Tokyo` — align with `TIMEZONE` in `env_vars`):

| Job | Cron variable | Default |
|-----|---------------|---------|
| Refresh token cleanup | `cron_schedule_cleanup_tokens` | `0 2 * * *` (02:00 daily) |
| TBS batch | `cron_schedule_tbs_batch` | `0 2 * * 6` (Sat 02:00; API skips unless `RUN_TBS_CRON=1`) |
| AI recommendations | `cron_schedule_recommendations` | `0 3 * * 0` (Sun 03:00) |

Example tfvars (dev/stg):

```hcl
enable_cron_cloud_scheduler = true
# cron_timezone = "Asia/Tokyo"
```

**Before apply:**

1. Prisma migration `cron_invocations` applied on the DB (migrate job / `prisma migrate deploy`).
2. After apply, confirm API Cloud Run env: `DISABLE_IN_PROCESS_CRON=1` and `CRON_SCHEDULER_SERVICE_ACCOUNT` matches output `cron_scheduler_service_account_email`.

**Prod:** keep `enable_cron_cloud_scheduler = false` until Scheduler is ready; when enabling prod cron, use the same Scheduler mechanism (no in-process cron on Cloud Run).

Code references: [google-cloud/terraform/modules/app_cron/](terraform/modules/app_cron/), [google-cloud/terraform/modules/sql_schedule/](terraform/modules/sql_schedule/), [backend/src/cron/cron.service.ts](../../backend/src/cron/cron.service.ts).

### 6.6 Secrets — Secret Manager (required)

On GCP (dev / stg / prod), **every API key, password, token, and connection string must be stored in [Secret Manager](https://cloud.google.com/secret-manager)** on the **app project** for that environment. Do **not**:

- Put secrets in `terraform.tfvars`, `env_vars`, or `web_env_vars`
- Commit them to git (including `.env` with real values)
- Pass them as plain Cloud Build substitutions in CI

Non-sensitive configuration (URLs, `NODE_ENV`, `LOG_LEVEL`, `TIMEZONE`, feature flags without secrets) belongs in `env_vars` / `web_env_vars` in tfvars or Terraform.

#### How secrets reach Cloud Run

| Mechanism | What it does |
|-----------|----------------|
| **Terraform `cloud_sql` module** | When `enable_cloud_sql = true`, creates secret `dx-safar-database-url-{env_suffix}`, stores the MySQL URL, grants the Cloud Run runtime SA `secretAccessor`, and mounts `DATABASE_URL` on the API service and migrate job |
| **`api_secret_env_from_sm` / `web_secret_env_from_sm`** | Maps additional Secret Manager secrets to env var names on API / web Cloud Run; Terraform grants `secretAccessor` per `secret_id` ([`google-cloud/terraform/modules/secrets/`](terraform/modules/secrets/)) |

Wire extra secrets in `terraform.tfvars`:

```hcl
api_secret_env_from_sm = [
  { env_name = "JWT_SECRET", secret_id = "safar-jwt-secret-dev", version = "latest" },
  # { env_name = "STRIPE_SECRET_KEY", secret_id = "safar-stripe-secret-dev", version = "latest" },
]
# web_secret_env_from_sm = []   # only if the web service needs secrets from SM
```

Create the secret **in GCP first** (Console or `gcloud`), add a **version** with the payload, then reference `secret_id` in tfvars and re-apply the app stack.

#### Required secrets (API must start)

Aligned with [`backend/src/config/env.ts`](../../backend/src/config/env.ts) (Zod validation on boot):

| Env var | Secret Manager | Notes |
|---------|----------------|-------|
| `DATABASE_URL` | `dx-safar-database-url-{env_suffix}` | **Created by Terraform** when `enable_cloud_sql = true`; do not duplicate manually unless you manage SQL outside this module |
| `JWT_SECRET` | e.g. `safar-jwt-secret-{env_suffix}` | **You must create** and add to `api_secret_env_from_sm` (min 10 characters) |

If either is missing or the runtime SA cannot read the secret, the API container exits on startup or fails DB/auth.

#### Optional secrets (enable when the feature is used)

Create in Secret Manager and map via `api_secret_env_from_sm` when needed:

| Env var | Typical use |
|---------|-------------|
| `GEMINI_API_KEY` | AI features via AI Studio — **omit when** `enable_vertex_ai = true` (use Vertex; do not add `GEMINI_API_KEY` to Secret Manager per tfvars.example) |
| `OPENAI_API_KEY` | TBS fallback when Gemini is unavailable |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Billing (read at runtime; not in Zod schema but required for checkout/webhooks) |
| `STRIPE_BASIC_PRICE_ID`, `STRIPE_PRO_PRICE_ID` | Can be non-secret env vars in `env_vars` if you prefer, or secrets if treated as sensitive |
| `CONNECTOR_TOKEN_ENCRYPTION_KEY` | Encrypt connector tokens at rest (`openssl rand -base64 32`) |
| `CONNECTOR_OAUTH_STATE_SECRET` | OAuth state HMAC (optional; falls back to `JWT_SECRET`) |
| `GOOGLE_OAUTH_CLIENT_SECRET`, `SLACK_OAUTH_CLIENT_SECRET` | Optional server fallbacks; connectors are often configured per team in the DB |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Only if `STORAGE_BACKEND=s3` instead of GCS |

Web (Next.js): only put values in `web_secret_env_from_sm` if the **web** Cloud Run service needs them. Do not use `NEXT_PUBLIC_*` for secrets — those are exposed to the browser.

#### Create or update a secret (CLI example)

```bash
export PROJECT_ID='dx-safar-dev'
export SECRET_ID='safar-jwt-secret-dev'

# Create secret resource (once)
gcloud secrets create "${SECRET_ID}" \
  --project="${PROJECT_ID}" \
  --replication-policy=automatic

# Add a new version (rotate by adding versions; Cloud Run uses "latest" if configured)
echo -n 'your-long-random-jwt-secret' | gcloud secrets versions add "${SECRET_ID}" \
  --project="${PROJECT_ID}" \
  --data-file=-
```

After rotation, a new version is enough if tfvars use `version = "latest"`; otherwise pin a version number and re-deploy.

#### IAM

- Cloud Run **runtime** SA (project default compute SA): `roles/secretmanager.secretAccessor` on each referenced secret — Terraform applies this for `api_secret_env_from_sm` / `web_secret_env_from_sm` and for the Terraform-managed `DATABASE_URL` secret.
- Humans: use Console or `gcloud secrets` with org-approved roles; never paste production secrets into chat or tickets.

#### Order of operations

1. Apply app stack with `enable_cloud_sql = true` → `DATABASE_URL` secret exists and is wired.
2. Create remaining secrets in Secret Manager (at minimum `JWT_SECRET`).
3. Update `api_secret_env_from_sm` in tfvars → `terragrunt apply` on `live/<env>/app`.
4. Run migrate job, then verify API health.

Ops handoff checklist: [docs/issues/gcp-dev-environment/infra-213-secrets-ops-handoff.md](docs/issues/gcp-dev-environment/infra-213-secrets-ops-handoff.md). Local reference only: [backend/.env.example](../../backend/.env.example) (not used on Cloud Run).

### 6.7 Production: Cloud SQL backup & deletion protection (required)

**Production must not run Cloud SQL without automated backups or without deletion protection.** This matches the org wiki (prod: daily backup + PITR where tier allows).

| Terraform variable | Prod (required when `enable_cloud_sql = true`) | Dev (typical) |
|--------------------|-----------------------------------------------|---------------|
| `sql_deletion_protection` | `true` — **do not set `false`** | `false` allowed for disposable stacks |
| `sql_backup_enabled` | `true` — module default is `false`; **must set in prod tfvars** | `false` OK |
| `sql_point_in_time_recovery_enabled` | `true` recommended (needs `sql_backup_enabled = true`) | usually `false` |
| `sql_backup_start_time` | e.g. `"17:00"` UTC (≈ 02:00 JST next day) | same if backups enabled |
| `enable_sql_night_weekend_schedule` | `false` — prod SQL stays running | `true` in dev/stg (§6.5) |

**What deletion protection does**

- **GCP API:** `deletion_protection_enabled` on the instance — Console/gcloud cannot delete until disabled deliberately.
- **Terraform:** root `deletion_protection` on `google_sql_database_instance` — `terraform destroy` fails until you set `sql_deletion_protection = false` and apply (two-step process; avoids accidental wipe).

**Backups**

- Daily automated backup window when `sql_backup_enabled = true`.
- With `sql_point_in_time_recovery_enabled = true`, transaction log retention enables point-in-time restore (extra cost; standard for prod per wiki).

Example `prod/app/terraform.tfvars`:

```hcl
env_suffix = "prod"
enable_cloud_sql = true

sql_deletion_protection            = true
sql_backup_enabled                 = true
sql_backup_start_time              = "17:00"
sql_point_in_time_recovery_enabled = true
```

**Enforcement:** `terraform plan` / `apply` for `env_suffix = "prod"` fails the check in [`google-cloud/terraform/modules/app_compose/checks.tf`](terraform/modules/app_compose/checks.tf) if Cloud SQL is enabled but either flag is wrong.

**To decommission prod SQL (exception only):** disable API protection and Terraform protection in a controlled change (tfvars → apply → destroy), with backups verified and ops approval — never leave prod with `sql_deletion_protection = false` in steady state.

Sample: [google-cloud/terraform/environments/prod/app/terraform.tfvars.example](terraform/environments/prod/app/terraform.tfvars.example).

---

## 7. Terragrunt commands (recommended)

Entry point: [google-cloud/terraform/live/](terraform/live/). Terragrunt loads tfvars, generates `backend.tf`, and orders dependencies (`app` after `network`).

### 7.1 Plan everything (no GCP changes)

```bash
cd google-cloud/terraform/live
terragrunt run-all plan
```

| Part | Explanation |
|------|-------------|
| `run-all` | Runs `plan` on child units in dependency order |
| `plan` | Compares code + tfvars to state; **does not** create or change resources |

When infra is stable, expect: `Plan: 0 to add, 0 to change, 0 to destroy` (or `No changes`).

### 7.2 Staged apply (first time — safer)

```bash
cd google-cloud/terraform/live/bootstrap
terragrunt init      # Download providers, local backend
terragrunt plan      # Preview GCS bucket
terragrunt apply     # State bucket + AR + Cloud Build lifecycle

cd ../dev/network
terragrunt init -reconfigure
terragrunt plan
terragrunt apply

cd ../app
terragrunt plan
terragrunt apply
```

Repeat for `stg` and `prod` when projects and tfvars exist.

### 7.3 Single stack

```bash
cd google-cloud/terraform/live/dev/network
terragrunt plan
terragrunt apply
```

### 7.4 Terraform command meanings (via Terragrunt)

| Command | Purpose |
|---------|---------|
| `init` | Download providers, configure backend (GCS), create `.terraform` |
| `init -reconfigure` | Required when changing backend bucket/prefix or first switch from local to GCS |
| `plan` | Dry-run: show add/change/destroy |
| `apply` | Apply changes on GCP; update state |
| `destroy` | Remove resources in the stack (careful, especially prod) |
| `output` | Print outputs (service URLs, migrate job name, …) |
| `state list` | List resources in state |
| `import` | Import existing GCP resources into state (project labels, etc.) |

Terragrunt cache: `google-cloud/terraform/live/**/.terragrunt-cache/` (gitignored) — delete if init behaves oddly.

Lock: [google-cloud/terraform/live/root.hcl](terraform/live/root.hcl) sets `-lock-timeout=20m` for locking commands.

---

## 8. Plain Terraform (per stack)

Use when Terragrunt is not installed or when debugging a single `environments/*` directory.

### Bootstrap (local state)

```bash
cd google-cloud/terraform/environments/bootstrap
cp terraform.tfvars.example terraform.tfvars   # edit project_id, state_bucket_name
terraform init
terraform plan
terraform apply
```

### Common (GCS remote state)

Ensure `backend.tf` exists and `bucket` matches bootstrap.

```bash
cd google-cloud/terraform/environments/common
cp terraform.tfvars.example terraform.tfvars
terraform init -reconfigure
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

### Dev network / app

With Terragrunt layout, logic lives in `_shared`; tfvars stay under `environments/dev/...`:

```bash
# Network — needs backend.tf (Terragrunt-generated, or copy pattern from live/dev/network)
cd google-cloud/terraform/environments/_shared/network
terraform init -reconfigure
terraform plan -var-file=../../dev/network/terraform.tfvars
terraform apply -var-file=../../dev/network/terraform.tfvars
```

In practice, prefer **Terragrunt** at `google-cloud/terraform/live/dev/network` so you do not wire the backend by hand.

---

## 9. After infra apply

### 9.1 Secret Manager

**Policy:** All keys and secrets required on GCP must be in **Secret Manager** on the app project — see [§6.6](#66-secrets--secret-manager-required).

Quick steps:

1. Confirm Terraform created `dx-safar-database-url-{env_suffix}` after app apply (`enable_cloud_sql = true`).
2. Create `safar-jwt-secret-{env_suffix}` (and any optional secrets your env needs).
3. List them in `api_secret_env_from_sm`, apply app stack, run migrate job, smoke-test API.

Never commit secret values to git or `terraform.tfvars`.

### 9.2 Build and push Docker images

Images live in **common** (example):

```text
asia-northeast1-docker.pkg.dev/dx-safar-common/dx-safar-docker/safar-app:dev
```

Local / scripts ([google-cloud/scripts/README.md](scripts/README.md)):

```bash
export AR_PROJECT_ID='dx-safar-common'
export DEPLOY_PROJECT_ID='dx-safar-dev'
export NEXT_PUBLIC_API_URL='https://YOUR-API.run.app/api/v1'
export NEXT_PUBLIC_BASE_URL='https://YOUR-WEB.run.app'
bash google-cloud/scripts/cloud-build-submit.sh google-cloud/cloudbuild/cloudbuild.dev.yaml
```

Docker registry login (once / when expired):

```bash
gcloud auth configure-docker asia-northeast1-docker.pkg.dev
```

### 9.3 Update `container_image` and re-apply app (if needed)

After build, update the tag in `terraform.tfvars` or deploy via Cloud Build (configs call `gcloud run deploy`).

### 9.4 Run database migrations

```bash
export PROJECT_ID='dx-safar-dev'
export MIGRATE_JOB_NAME="$(cd google-cloud/terraform/live/dev/app && terragrunt output -raw cloud_run_migrate_job_name)"
bash google-cloud/scripts/run-migrate-job.sh
```

The migrate job is defined in the Cloud Run module; default name `dx-safar-migrate-{env_suffix}`.

### 9.5 Custom domains & env URLs

After apply, get URLs:

```bash
cd google-cloud/terraform/live/dev/app
terragrunt output
```

Set `CORS_ORIGINS`, `API_URL`, `NEXT_PUBLIC_*` in tfvars or Console; optional `api_custom_domain` / `web_custom_domain` in Terraform (see tfvars.example comments).

---

## 10. CI/CD and GitHub Actions

| Workflow / doc | Purpose |
|----------------|---------|
| [.github/workflows/terraform-plan.yml](../../.github/workflows/terraform-plan.yml) | `terraform plan` on PRs that touch `google-cloud/terraform/**` |
| [google-cloud/cloudbuild/GITHUB_ACTIONS_WIF.md](cloudbuild/GITHUB_ACTIONS_WIF.md) | WIF + SA for deploy without JSON keys |
| [google-cloud/cloudbuild/README.md](cloudbuild/README.md) | Cloud Build triggers, IAM writer/reader |
| `.github/workflows/cd-gcp.yml` | Build + deploy via GitHub Environments |

CI uses **Workload Identity Federation**, not `gcloud auth login` on runners — secrets: `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT`.

---

## 11. Common troubleshooting

| Symptom | What to do |
|---------|------------|
| `Error 403` / `Requested entity was not found` on plan/apply | Re-run ADC; verify `project_id` and IAM on the correct project |
| `storage.googleapis.com` / API not enabled | User needs permission to enable APIs; or enable in Console and re-apply |
| App plan fails: network remote state | Apply `network` first; set `network_remote_state_bucket` + `network_remote_state_prefix` |
| Cloud Run deploy: image not found | Build and push to Artifact Registry first |
| Cross-project image pull denied | Add project to `reader_project_ids` and Cloud Run service agent to `additional_artifact_registry_reader_members` (common stack) |
| `terraform init` backend error | Confirm bootstrap bucket exists; `init -reconfigure` |
| State lock | Wait for other CI job; or `terraform force-unlock` only if sure nothing is applying |
| Org policy blocks `allUsers` | Set `allow_unauthenticated = false`; use IAP/LB or internal access |
| Cron not running on dev/stg | Check `enable_cron_cloud_scheduler = true`, migration `cron_invocations`, env `DISABLE_IN_PROCESS_CRON=1`, Scheduler jobs in Console |
| API DB errors outside business hours (dev/stg) | SQL may be STOPPED — wait for start job or temporarily disable `enable_sql_night_weekend_schedule` while debugging |
| API exits on startup / invalid env | Ensure `JWT_SECRET` and `DATABASE_URL` exist in Secret Manager and are listed in `api_secret_env_from_sm` (JWT) or wired by Terraform (DB); check SA has `secretAccessor` |
| `Permission denied` on secret | Re-apply app stack after updating `api_secret_env_from_sm`; confirm `secret_id` matches the Secret Manager resource ID |
| Terraform check fails on prod app plan | Set `sql_deletion_protection = true` and `sql_backup_enabled = true` when `env_suffix = "prod"` and `enable_cloud_sql = true` (§6.7) |

State migration (`app_compose` refactor): [google-cloud/terraform/.migration-snapshots/README.md](terraform/.migration-snapshots/README.md).

---

## New environment checklist (dev)

- [ ] Create GCP project `dx-safar`
- [ ] `terraform.tfvars` for bootstrap, dev/network, dev/app
- [ ] In **dev/app** tfvars: `enable_sql_night_weekend_schedule = true`, `enable_cron_cloud_scheduler = true` (same for stg; prod: `false`)
- [ ] `terragrunt apply` bootstrap → dev/network → dev/app
- [ ] Cloud Build writer on AR repo (bootstrap tfvars)
- [ ] After app apply: verify Terraform secret `dx-safar-database-url-dev`; create `safar-jwt-secret-dev` (and other keys per §6.6) in Secret Manager
- [ ] Set `api_secret_env_from_sm` in dev/app tfvars (at least `JWT_SECRET`); re-apply app stack — **no secrets in tfvars plain env**
- [ ] Cloud Build / GitHub WIF (if using CI)
- [ ] Build `safar-app` / `safar-app` images, deploy or re-apply app
- [ ] Run migrate job, verify Cloud Run health
- [ ] `terragrunt run-all plan` → zero diff (confirm sync)

---

## New environment checklist (prod)

- [ ] All dev checklist items adapted for prod project IDs and `network/prod` state prefix
- [ ] `prod/app/terraform.tfvars`: `sql_deletion_protection = true`, `sql_backup_enabled = true` (and PITR per policy) — §6.7
- [ ] `enable_sql_night_weekend_schedule = false`; no night/weekend SQL stop on prod
- [ ] Prod apply via PR + reviewer; verify backup window and deletion protection in Cloud SQL Console after apply

---

## Related documentation

| Topic | Path |
|-------|------|
| GCP wiki (tier, IAM, naming) | [google-cloud/terraform/wiki.md](terraform/wiki.md) |
| Infra layout | [google-cloud/terraform/README.md](terraform/README.md) |
| Terragrunt live | [google-cloud/terraform/live/README.md](terraform/live/README.md) |
| Environments / tfvars | [google-cloud/terraform/environments/README.md](terraform/environments/README.md) |
| Local deploy scripts | [google-cloud/scripts/README.md](scripts/README.md) |
| Cloud Build | [google-cloud/cloudbuild/README.md](cloudbuild/README.md) |

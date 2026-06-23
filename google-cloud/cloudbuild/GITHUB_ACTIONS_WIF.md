# GitHub Actions — Workload Identity Federation (GCP)

This guide explains how to create **`GCP_WORKLOAD_IDENTITY_PROVIDER`** and related resources so [`.github/workflows/cd-gcp.yml`](../../.github/workflows/cd-gcp.yml) can authenticate to Google Cloud **without** a long-lived JSON key.

**Architecture:** Safar uses **one GCP project** (`dx-safar` by default) for bootstrap, Artifact Registry, Cloud Build, and Cloud Run across dev / staging / production. Environments are separated by image tag and resource naming (`dx-safar-api-dev`, etc.), not by separate GCP projects.

## What you are creating

| Item | Purpose |
|------|---------|
| **Workload identity pool** | Container for external identities (here: GitHub OIDC). |
| **OIDC provider** | Trusts GitHub’s issuer `https://token.actions.githubusercontent.com` and maps token claims to GCP attributes. |
| **`GCP_WORKLOAD_IDENTITY_PROVIDER`** | The provider’s **full resource name**, e.g. `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_ID/providers/PROVIDER_ID`. Paste this into GitHub Environment **secret** `GCP_WORKLOAD_IDENTITY_PROVIDER`. |
| **Service account** | The GCP identity that GitHub Actions **impersonates** after token exchange. |
| **`roles/iam.workloadIdentityUser`** | Allows the GitHub **principal** (this repo only, if configured that way) to use that service account. |

## Prerequisites

- GCP project with billing enabled (if required by your org).
- APIs enabled (enable if prompted): **IAM**, **IAM Credentials**, **Security Token Service** (often enabled automatically with Workload Identity Federation).
- Your GitHub repo in the form `OWNER/REPO` (this document uses **`TeckVeho/safar`** as an example).
- `gcloud` CLI authenticated as a user with permission to create pools, providers, and service accounts (`roles/owner` or equivalent).

Set shell variables (Safar uses a **single GCP project** for all environments — default `dx-safar`):

```bash
export PROJECT_ID="dx-safar"
export PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')
export POOL_ID="github-pool"
export PROVIDER_ID="github-provider"
```

---

## Step 1 — Create a workload identity pool

```bash
gcloud iam workload-identity-pools create "${POOL_ID}" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions"
```

---

## Step 2 — Create the OIDC provider (GitHub)

GitHub Actions requires an **OIDC** provider. For GitHub, Google **requires** an **`attribute-condition`** that references claims from the GitHub token (for example, restrict to a single repository).

**Example: allow only the repository `TeckVeho/safar`:**

```bash
gcloud iam workload-identity-pools providers create-oidc "${PROVIDER_ID}" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="${POOL_ID}" \
  --display-name="GitHub OIDC" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository == 'TeckVeho/safar'"
```

To restrict by **organization** instead, use something like:

`--attribute-condition="assertion.repository_owner == 'YOUR_ORG'"`

Do **not** leave out `attribute-condition` for GitHub; the API may return `INVALID_ARGUMENT` about attribute conditions.

Optional: leave **JWK** empty in the Console (GitHub’s issuer is public).

---

## Step 3 — Obtain `GCP_WORKLOAD_IDENTITY_PROVIDER`

Print the provider’s full resource name and copy it **exactly** (no extra spaces or quotes):

```bash
echo "projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}"
```

Example output:

```text
projects/739321310569/locations/global/workloadIdentityPools/github-pool/providers/github-provider
```

That string is the value for **`GCP_WORKLOAD_IDENTITY_PROVIDER`** in GitHub **Settings → Environments → [environment] → Secrets** (the workflow reads WIF, project ID, and service account email from **secrets**, not variables).

---

## Step 4 — Create a dedicated service account (if you do not have one)

```bash
export SA_ID="github-actions-safar"

gcloud iam service-accounts create "${SA_ID}" \
  --project="${PROJECT_ID}" \
  --display-name="GitHub Actions Safar"
```

Set the email:

```bash
export SA_EMAIL="${SA_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
```

**If you already have a service account** (recommended: reuse it), you do **not** need to create one in Step 4. Set `SA_EMAIL` to that account’s email (same value you will store in GitHub secret `GCP_SERVICE_ACCOUNT`). To list service accounts in the project:

```bash
gcloud iam service-accounts list --project="${PROJECT_ID}" \
  --format="table(email,displayName)"
```

Or in the [Google Cloud Console → IAM & Admin → Service accounts](https://console.cloud.google.com/iam-admin/serviceaccounts), open the account and copy **Email**.

---

## Step 5 — Allow this GitHub repo to impersonate the service account

Bind **`roles/iam.workloadIdentityUser`** on the **service account** so the workload identity **principal** for your repo can assume it.

For **`TeckVeho/safar`** and pool `github-pool`:

```bash
gcloud iam service-accounts add-iam-policy-binding "${SA_EMAIL}" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.repository/TeckVeho/safar"
```

If you used a different `OWNER/REPO`, replace `TeckVeho/safar` in both the **attribute-condition** (Step 2) and this **`member`** path.

Or run: `bash google-cloud/scripts/grant-github-actions-iam.sh` (includes this binding in Step 5).

---

## Step 6 — Grant permissions to run Cloud Build and deploy (single project)

Safar runs **dev, staging, and production in one GCP project** (default `dx-safar`). Build, Artifact Registry (`dx-safar-docker`), and Cloud Run deploy all use that same project. [`.github/workflows/cd-gcp.yml`](../../.github/workflows/cd-gcp.yml) sets `_AR_PROJECT_ID` and `_DEPLOY_PROJECT_ID` both to **`GCP_PROJECT_ID`** — no separate build or common project.

**Local `gcloud builds submit` uses your user identity**; **GitHub Actions uses only the federated service account**, so it needs explicit roles even if builds work on your laptop.

**Script (recommended):** from repo root, after Steps 1–4 (pool, provider, SA exist):

```bash
# Step 5 + Step 6 (WIF bind + all project IAM)
bash google-cloud/scripts/grant-github-actions-iam.sh

# Preview commands only
DRY_RUN=1 bash google-cloud/scripts/grant-github-actions-iam.sh

# First-time: create pool, provider, SA, WIF bind (then run again without --setup-wif for IAM)
CREATE_SA=1 bash google-cloud/scripts/grant-github-actions-iam.sh --setup-wif
bash google-cloud/scripts/grant-github-actions-iam.sh
```

See [`scripts/grant-github-actions-iam.sh`](../scripts/grant-github-actions-iam.sh) and [`scripts/README.md`](../scripts/README.md).

Manual commands below match what the script runs.

Enable APIs (once per project, if not already):

```bash
gcloud services enable cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  storage.googleapis.com \
  serviceusage.googleapis.com \
  cloudresourcemanager.googleapis.com \
  run.googleapis.com \
  --project="${PROJECT_ID}"
```

### Federated service account (`SA_EMAIL` / `GCP_SERVICE_ACCOUNT`)

Project-level roles on **`${PROJECT_ID}`** (adjust to your org’s least-privilege policy):

```bash
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/serviceusage.serviceUsageConsumer"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer"
```

**Cloud Build staging bucket (`*_cloudbuild`).** `gcloud builds submit` uploads source to `gs://${PROJECT_ID}_cloudbuild` before building. Grant **Storage Admin** so the federated SA can create/use that bucket:

**Source cleanup** — GCP does not delete objects under `source/` automatically. The bootstrap Terraform stack sets a GCS lifecycle rule (default: delete after 7 days). Import the existing bucket once: see [`terraform/modules/cloudbuild_bucket/README.md`](../terraform/modules/cloudbuild_bucket/README.md).

```bash
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.admin"
```

*(If your org requires tighter scope, pre-create the bucket and grant `roles/storage.objectAdmin` on that bucket only.)*

### Cloud Build execution service account

GCP uses one of these SAs to **execute** each build (not the federated GitHub SA):

| SA | When used |
|----|-----------|
| `PROJECT_NUMBER@cloudbuild.gserviceaccount.com` | Legacy Cloud Build service account (older projects) |
| `PROJECT_NUMBER-compute@developer.gserviceaccount.com` | Compute Engine default SA (newer projects / default since 2024) |

Check which one your project uses: **Cloud Build → Settings** in Console, or
`gcloud builds describe <any-build-id> --project="${PROJECT_ID}" --format='value(serviceAccount)'`.

Grant on **`${PROJECT_ID}`** (same project for build, push, and deploy):

```bash
# Pick the SA your project uses:
export CLOUDBUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
# or:
export CLOUDBUILD_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/logging.logWriter"

# Cloud Run / Cloud Run Jobs deploy (cloudbuild.dev.yaml, cloudbuild.prod.yaml)
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/iam.serviceAccountUser"
```

If the build fails with `403: … does not have storage.objects.get access` on `gs://${PROJECT_ID}_cloudbuild`, the **execution SA** (not `SA_EMAIL`) is missing **`roles/storage.objectAdmin`**.

**Artifact Registry writer (Terraform).** Bootstrap can grant the Cloud Build SA writer on `dx-safar-docker` via `additional_artifact_registry_writer_members` in [`terraform/environments/bootstrap`](../terraform/environments/bootstrap) — see [`README.md`](README.md).

---

## Where to find `GCP_PROJECT_ID` and `GCP_SERVICE_ACCOUNT` (for GitHub)

Use the **same** `PROJECT_ID` and `SA_EMAIL` in GitHub Environment secrets as in the commands above.

| Value | Where to get it |
|-------|-----------------|
| **`GCP_PROJECT_ID`** | GCP Console project picker (project **ID**, not necessarily the display name). Or: `gcloud projects describe "${PROJECT_ID}" --format='value(projectId)'`. |
| **`GCP_SERVICE_ACCOUNT`** | The full service account **email** `something@PROJECT_ID.iam.gserviceaccount.com`. From Step 4 / list command above, or **GitHub → Settings → Environments → [env] → Secrets** if you stored it already (GitHub does not show the value again after save — use GCP Console / `gcloud` if you forgot). |

The workload identity provider string (**`GCP_WORKLOAD_IDENTITY_PROVIDER`**) comes from Step 3.

---

## Step 7 — Configure GitHub

1. Create **Environments** `develop`, `staging`, and `production` (names must match branch names — see [workflow](../../.github/workflows/cd-gcp.yml)).
2. In **each** environment, under **Secrets**, set:
   - **`GCP_WORKLOAD_IDENTITY_PROVIDER`** — string from Step 3.
   - **`GCP_SERVICE_ACCOUNT`** — `SA_EMAIL` (from Step 4); must match IAM bindings in Steps 5–6.
   - **`GCP_PROJECT_ID`** — `dx-safar` (or your single project ID). All three environments typically use the **same** project ID; URLs differ per env.
3. Optional **Variables** (not secrets):
   - **`GCP_IMAGE_TAG`** — overrides default tag per branch (`dev` / `stage` / `prod` for `develop` / `staging` / `production`).

Safar is a **Next.js monolith** (API routes on the same origin). No `GCP_NEXT_PUBLIC_*` build-time URLs are required.

The workflow passes Cloud Build substitutions from **`GCP_PROJECT_ID` only** — `_AR_PROJECT_ID`, `_DEPLOY_PROJECT_ID`, `_REPO`, and service names are derived automatically (e.g. `dx-safar-docker`, `dx-safar-api-dev`).

The workflow uses **`google-github-actions/auth@v3`** with `workload_identity_provider` and `service_account`; it also requires:

```yaml
permissions:
  id-token: write
  contents: read
```

(already set in `cd-gcp.yml`.)

---

## Which branch to run (workflow)

The workflow **only runs** when you use **Run workflow** with branch **`develop`**, **`staging`**, or **`production`** selected. Other branches are skipped.

The GitHub **Environment** name is always **`github.ref_name`** (same as that branch), so credentials and URLs cannot be overridden from another environment.

---

## Console alternative

You can create the pool and OIDC provider in **IAM & Admin → Workload Identity Federation**. Use the same **issuer URL**, **attribute mapping**, and **attribute condition** as in Step 2, then copy the provider **Resource name** from the provider details page — it matches the format from Step 3.

---

## Troubleshooting

| Symptom | What to check |
|---------|----------------|
| *The user is forbidden from accessing the bucket [...]_cloudbuild* | Step 6: **`roles/storage.admin`** on `dx-safar` for `SA_EMAIL` (federated SA that **uploads** source). |
| `…-compute@developer.gserviceaccount.com does not have storage.objects.get` | Cloud Build **execution SA** cannot read from `_cloudbuild`. Grant **`roles/storage.objectAdmin`** on **`${PROJECT_ID}`** — see Step 6. |
| *does not have permission to write logs to Cloud Logging* / *Logs Writer* | Grant **`roles/logging.logWriter`** on **`${PROJECT_ID}`** to the Cloud Build execution SA. Often appears as **`1 message(s) issued`** — check the next line for **`BUILD FAILURE`**. |
| `BUILD FAILURE` on a **`cloud-sdk`** step (`gcloud run jobs update` / `gcloud run deploy`) | Grant **`roles/run.admin`** and **`roles/iam.serviceAccountUser`** to the Cloud Build **execution SA** on **`${PROJECT_ID}`** (same project as `GCP_PROJECT_ID`). |
| *caller does not have permission to act as service account* | Step 6: **`roles/iam.serviceAccountUser`** on **`${PROJECT_ID}`** for `SA_EMAIL` (federated SA). |
| *serviceusage.services.use* / Service Usage | Step 6: **`roles/serviceusage.serviceUsageConsumer`** on **`${PROJECT_ID}`** for `SA_EMAIL`. |
| Works locally but fails in GitHub Actions | Local CLI uses **your user**; CI uses **only** `GCP_SERVICE_ACCOUNT` — grant Step 6 roles to that SA, not only your account. |
| Push denied to `...-docker.pkg.dev/dx-safar/...` | Grant **`roles/artifactregistry.writer`** on **`${PROJECT_ID}`** to the Cloud Build execution SA; confirm bootstrap repo `dx-safar-docker` exists. |
| Auth fails before `gcloud builds submit` | Step 5 (WIF binding) and secret **`GCP_WORKLOAD_IDENTITY_PROVIDER`**; repo in `attribute-condition` must match `TeckVeho/safar`. |
| `NOT_FOUND: Requested entity was not found` after upload to `gs://…_cloudbuild/source/…` | **`GCP_PROJECT_ID` typo** or display name instead of project ID. Enable **`cloudbuild.googleapis.com`**. Federated SA needs Step 6 roles on the **same** project as `gcloud builds submit --project`. |
| `Cloud Resource Manager API has not been used…` / `SERVICE_DISABLED` | Enable **`cloudresourcemanager.googleapis.com`**. The workflow pre-check uses **`gcloud builds list`** so CI does not require CRM API. |

---

## Appendix — Legacy cross-project layout (optional)

Older Safar setups used separate **common** and **app** GCP projects. That layout is **not** the current architecture. If you still run builds that way (manual `gcloud builds submit` with different `_AR_PROJECT_ID` / `_DEPLOY_PROJECT_ID`), grant the **build project’s execution SA** `roles/run.admin` and `roles/iam.serviceAccountUser` on the **deploy** project, and `roles/artifactregistry.writer` on the common registry repository. See [`scripts/README.md`](../scripts/README.md) for `AR_PROJECT_ID` / `DEPLOY_PROJECT_ID` when using local scripts — [`.github/workflows/cd-gcp.yml`](../../.github/workflows/cd-gcp.yml) does **not** read `GCP_AR_PROJECT_ID` or `GCP_DEPLOY_PROJECT_ID`.

---

## References

- [Configure Workload Identity Federation with deployment pipelines (GitHub)](https://cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines)
- [Google GitHub Actions auth — security considerations](https://github.com/google-github-actions/auth/blob/main/docs/SECURITY_CONSIDERATIONS.md)

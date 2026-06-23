# Dev — application stack (template module composition)

State prefix: `app/dev`.

## Layout

| File | Role |
|------|------|
| `main.tf` | Single call to [`app_compose`](../../../modules/app_compose/) |
| `variables.tf` | Symlink → [`app_compose/variables.tf`](../../../modules/app_compose/variables.tf) |
| `outputs.tf` | Re-exports from `module.app_compose` |
| `moved.tf` | State migration into `module.app_compose` |

## Commands

```bash
terraform init -reconfigure
terraform plan -var-file=terraform.tfvars
```

After layout migration, expect **moved** operations in state (no GCP resource changes when plan is clean).

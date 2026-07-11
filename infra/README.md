## Secrets Manager ARNs (Dev)

| Secret Name | Environment Variable | Used By |
|-------------|---------------------|---------|
| `oppshield/dev/database-url` | `DATABASE_URL` | App |
| `oppshield/dev/jwt-signing-secret` | `JWT_SECRET` | App |
| `oppshield/dev/jwt-refresh-secret` | `JWT_REFRESH_SECRET` | App |
| `oppshield/dev/paystack-secret-key` | `PAYSTACK_SECRET_KEY` | App |

## CloudWatch Logging (Dev)

- **Log Group:** `/ecs/opsshield/dev`
- **Region:** REGION
- **Stream Prefix:** `ecs`

## Production (Prod)

- **Family:** `opsshield/prod`
- **Log Group:** `/ecs/opsshield/prod`
- **Secret ARNs:** `oppshield/prod/*`

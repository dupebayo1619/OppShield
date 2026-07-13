## Secrets Manager ARNs (Dev)

| Secret Name | Environment Variable | Used By |
|-------------|---------------------|---------|
| `opsshield/dev/database-url` | `DATABASE_URL` | App |
| `opsshield/dev/jwt-signing-secret` | `JWT_SECRET` | App |
| `opsshield/dev/jwt-refresh-secret` | `JWT_REFRESH_SECRET` | App |
| `opsshield/dev/paystack-secret-key` | `PAYSTACK_SECRET_KEY` | App |

## CloudWatch Logging (Dev)

- **Log Group:** `/ecs/opsshield/dev`
- **Region:** REGION
- **Stream Prefix:** `ecs`

## Production (Prod)

- **Family:** `opsshield/prod`
- **Log Group:** `/ecs/opsshield/prod`
- **Secret ARNs:** `opsshield/prod/*`

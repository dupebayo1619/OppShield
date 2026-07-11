# OpsShield Infrastructure

## ECS Task Definition

- **Location:** `infra/ecs/task-definition.json`
- **Launch Type:** FARGATE
- **CPU:** 512
- **Memory:** 1024
- **Port:** 3000

## Secrets Manager ARNs

| Secret Name | Environment Variable | Used By |
|-------------|---------------------|---------|
| `opsshield/database-url` | `DATABASE_URL` | App |
| `opsshield/jwt-secret` | `JWT_SECRET` | App |
| `opsshield/jwt-refresh-secret` | `JWT_REFRESH_SECRET` | App |
| `opsshield/paystack-secret` | `PAYSTACK_SECRET_KEY` | App |

## CloudWatch Logging

- **Log Group:** `/ecs/opsshield`
- **Region:** REGION
- **Stream Prefix:** `ecs`

## Coordination with Cloud Team

The Cloud team will provide the actual Secrets Manager ARNs and the ECR repository URL.

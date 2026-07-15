# OpsShield Infrastructure

## ECS Task Definition

- **Location:** `infra/ecs/task-definition.json`
- **Family:** `opsshield-dev`
- **Launch Type:** FARGATE
- **CPU:** 512
- **Memory:** 1024
- **Port:** 3000
- **Image:** `541592468666.dkr.ecr.us-east-1.amazonaws.com/opsshield-dev:latest`

## Secrets Manager ARNs

| Secret Name | Environment Variable | ARN |
|-------------|---------------------|-----|
| `opsshield/dev/database-url` | `DATABASE_URL` | `arn:aws:secretsmanager:us-east-1:541592468666:secret:opsshield/dev/database-url-YaWFD5` |
| `opsshield/dev/jwt-signing-secret` | `JWT_SECRET` | `arn:aws:secretsmanager:us-east-1:541592468666:secret:opsshield/dev/jwt-signing-secret-cU33bK` |
| `opsshield/dev/jwt-refresh-secret` | `JWT_REFRESH_SECRET` | `arn:aws:secretsmanager:us-east-1:541592468666:secret:opsshield/dev/jwt-refresh-secret-YaWFD5` |
| `opsshield/dev/paystack-secret-key` | `PAYSTACK_SECRET_KEY` | `arn:aws:secretsmanager:us-east-1:541592468666:secret:opsshield/dev/paystack-secret-key-U7rNAP` |
| `opsshield/dev/paystack-public-key` | `PAYSTACK_PUBLIC_KEY` | `arn:aws:secretsmanager:us-east-1:541592468666:secret:opsshield/dev/paystack-public-key-OzVejJ` |

## CloudWatch Logging

- **Log Group:** `/ecs/opsshield-dev`
- **Region:** `us-east-1`
- **Stream Prefix:** `ecs`

## ALB

- **DNS Name:** `opsshield-dev-alb-203779119.us-east-1.elb.amazonaws.com`
- **Target Group ARN:** `arn:aws:elasticloadbalancing:us-east-1:541592468666:targetgroup/opsshield-dev-tg/0c4ae84059a12f77`

## ECR

- **Repository URL:** `541592468666.dkr.ecr.us-east-1.amazonaws.com/opsshield-dev`

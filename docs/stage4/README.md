# Stage 4: First Real Deploy to Staging

Overview

Stage 4 involves deploying the OpsShield application to Amazon ECS (Elastic Container Service) using Fargate, with a PostgreSQL database on RDS, application load balancer, and all necessary secrets configured.

---

## 1. OIDC IAM Role Setup (with Cloud) for GitHub Actions Deploy

An OIDC (OpenID Connect) IAM role was set up in collaboration with the Cloud team to enable secure, passwordless authentication between GitHub Actions and AWS. This eliminates the need for long-lived access keys and follows AWS security best practices.

### Key Configuration:
- **Provider:** GitHub Actions OIDC
- **Trusted Repository:** OpsShield
- **Audience:** `sts.amazonaws.com`
- **Permissions:** ECR, ECS, Secrets Manager, CloudWatch Logs


### Verification Commands:

```bash
# Get OIDC Role Details
aws iam get-role --role-name AWSReservedSSO_opsshield-dev-DevOps_d5209645bf03b7ca --region us-east-1 --profile iam-admin

# Get Admin User Identity
aws sts get-caller-identity --profile iam-admin

# List Admin User Policies
aws iam list-attached-user-policies --user-name bayo --region us-east-1 --profile iam-admin

# List All OpsShield Roles
aws iam list-roles --region us-east-1 --profile iam-admin --query 'Roles[?contains(RoleName, `opsshield`)].RoleName' --output table


. Build and Push First Docker Image to ECR
The Docker image was successfully built and pushed to Amazon ECR.

Build Details:
Attribute	Value
Image Name	opsshield-dev
Tag	v3
Base Image	node:20-slim
Prisma Version	5.22.0
Image Size	~133 MB

ECR Details:
Repository: 541592468666.dkr.ecr.us-east-1.amazonaws.com/opsshield-dev

Image Digest: sha256:ab29ec28c1305a65db52bfee3f0b3f49ff03412dde96082197453d6152f0b01d

Pushed: 2026-07-16T11:24:04.136000+01:00


Verification Commands:

bash
# List ECR Images
aws ecr describe-images --repository-name opsshield-dev --region us-east-1 --profile iam-admin

# Get Specific Image (v3)
aws ecr describe-images --repository-name opsshield-dev --image-ids imageTag=v3 --region us-east-1 --profile iam-admin --query 'imageDetails[0].{Tag:imageTags[0],Digest:imageDigest,PushedAt:imagePushedAt}'

# Show Build Command History
docker images | grep opsshield

# Show ECR Repository

aws ecr describe-repositories --repository-names opsshield-dev --region us-east-1 --profile iam-admin

3. First Deploy Attempt to ECS via Pipeline

The application was deployed to ECS Fargate with multiple iterations to resolve environment-specific issues.

Deployment Attempts:
Version	Status	Issue
v1	❌ Failed	Missing DATABASE_URL
v2	❌ Failed	SSM format issue
v3	❌ Failed	Missing JWT secrets
v4-5	❌ Failed	Intermediate fixes
v6	✅ Success	All issues resolved

Final Status:
Service: ACTIVE

Running Tasks: 2

Task Definition: opsshield-dev:6

Launch Type: FARGATE

Environment Issues Resolved:
Issue	Resolution
Missing DATABASE_URL	Added to Secrets Manager
SSM Parameter Format	Updated to Secrets Manager ARN
Missing JWT Secrets	Added JWT_SECRET & JWT_REFRESH_SECRET
Prisma Engine Error	Rebuilt Docker image with OpenSSL symlinks

IAM Permissions	Added required policies

Verification Commands:

bash
# ECS Service Status
aws ecs describe-services --cluster opsshield-dev-cluster --services opsshield-dev-service --region us-east-1 --profile iam-admin

# Service Summary
aws ecs describe-services --cluster opsshield-dev-cluster --services opsshield-dev-service --region us-east-1 --profile iam-admin --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,TaskDef:taskDefinition}'

# Running Tasks
aws ecs list-tasks --cluster opsshield-dev-cluster --region us-east-1 --profile iam-admin

# Service Events

aws ecs describe-services --cluster opsshield-dev-cluster --services opsshield-dev-service --region us-east-1 --profile iam-admin --query 'services[0].events[0:5].message'

4. Task Definition Details

The ECS task definition describes how the application container should run.

Task Definition: opsshield-dev:6
Attribute	Value
Status	ACTIVE
CPU	512 units
Memory	1024 MB
Network Mode	awsvpc
Container Configuration:
Image: 541592468666.dkr.ecr.us-east-1.amazonaws.com/opsshield-dev:v3

Port: 3000 (TCP)

Log Driver: awslogs

Log Group: /ecs/opsshield-dev

Secrets Configured:
Secret	Purpose
DATABASE_URL	PostgreSQL connection string
JWT_SECRET	Access token signing key
JWT_REFRESH_SECRET	Refresh token signing key

Verification Commands:

bash
# Task Definition
aws ecs describe-task-definition --task-definition opsshield-dev --region us-east-1 --profile iam-admin

# Container Secrets
aws ecs describe-task-definition --task-definition opsshield-dev --region us-east-1 --profile iam-admin --query 'taskDefinition.containerDefinitions[0].secrets'

# Container Environment
aws ecs describe-task-definition --task-definition opsshield-dev --region us-east-1 --profile iam-admin --query 'taskDefinition.containerDefinitions[0].environment'

5. ALB & Target Group Configuration

The Application Load Balancer routes external traffic to healthy ECS tasks.

ALB Details:
Attribute	Value
Name	opsshield-dev-alb
DNS	opsshield-dev-alb-203779119.us-east-1.elb.amazonaws.com
Type	application
Scheme	internet-facing
State	active
Target Group:
Attribute	Value
Name	opsshield-dev-tg
Protocol	HTTP
Port	3000
Target Type	ip
Health Check Path	/health
Healthy Threshold	2
Unhealthy Threshold	3
Health Status:
Target 10.0.10.176: ✅ healthy

Target 10.0.11.33: ✅ healthy

Verification Commands:

bash

# ALB Details
aws elbv2 describe-load-balancers --names opsshield-dev-alb --region us-east-1 --profile iam-admin

# Target Health
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:us-east-1:541592468666:targetgroup/opsshield-dev-tg/0c4ae84059a12f77 --region us-east-1 --profile iam-admin

# Target Group Details
aws elbv2 describe-target-groups --target-group-arns arn:aws:elasticloadbalancing:us-east-1:541592468666:targetgroup/opsshield-dev-tg/0c4ae84059a12f77 --region us-east-1 --profile iam-admin


6. Frontend Integration Against Live API

All API endpoints were tested and validated against the live staging environment.

Test Results:
Endpoint	Status	Result
Health Check	✅ HTTP 200 OK	{"status":"ok"}
Registration	✅ HTTP 201 Created	User created, JWT issued
Login	✅ HTTP 200 OK	JWT tokens generated
API Base URL:
http://opsshield-dev-alb-203779119.us-east-1.elb.amazonaws.com


Verification Commands:

bash
# Health Check
curl -s http://opsshield-dev-alb-203779119.us-east-1.elb.amazonaws.com/health

# Registration Test
curl -s -X POST http://opsshield-dev-alb-203779119.us-east-1.elb.amazonaws.com/api/auth/register -H "Content-Type: application/json" -d '{"email":"doc-test@example.com","password":"Test123!","firstName":"Documentation","lastName":"Test","orgName":"DocOrg"}'

# Login Test
curl -s -X POST http://opsshield-dev-alb-203779119.us-east-1.elb.amazonaws.com/api/auth/login -H "Content-Type: application/json" -d '{"email":"doc-test@example.com","password":"Test123!"}'

7. Deployment Summary

Stage 4 deployment complete with all components verified and functional.

Final Status:
Component	Status	Details
OIDC IAM Role	✅ Complete	GitHub Actions OIDC configured
Docker Image	✅ Complete	v3 pushed to ECR
ECS Service	✅ Complete	2 tasks running
Task Definition	✅ Complete	v6 with all secrets
ALB & Target Group	✅ Complete	All targets healthy
API Endpoints	✅ Complete	Health, Register, Login working

Staging Environment:
Application URL: http://opsshield-dev-alb-203779119.us-east-1.elb.amazonaws.com

Health Check: http://opsshield-dev-alb-203779119.us-east-1.elb.amazonaws.com/health

✅ Stage 4 Complete - Ready for Stage 5



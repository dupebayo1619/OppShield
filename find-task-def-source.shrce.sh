#!/usr/bin/env bash
#
# find-task-def-source.sh
#
# Searches your repo for where the ECS task definition environment
# variables are actually defined in source control (Terraform, CDK,
# CloudFormation, serverless.yml, GitHub Actions, etc.) — so you can
# fix JWT_REFRESH_SECRET at the source instead of only patching it
# via the AWS CLI (which would get overwritten on the next deploy).
#
# Usage:
#   chmod +x find-task-def-source.sh
#   ./find-task-def-source.sh [path-to-repo-root]

set -uo pipefail

ROOT="${1:-.}"

echo "=================================================="
echo "1. Infrastructure-as-code files (Terraform / CDK / CFN / SAM)"
echo "=================================================="
find "$ROOT" \
  -not -path "*/node_modules/*" -not -path "*/.git/*" \
  \( -iname "*.tf" -o -iname "*.tf.json" -o -iname "cdk.json" \
     -o -iname "*.template.yaml" -o -iname "*.template.json" \
     -o -iname "template.yaml" -o -iname "template.yml" \) 2>/dev/null

echo
echo "--- Files mentioning 'task_definition' or 'TaskDefinition' ---"
grep -rniE "task_definition|TaskDefinition" "$ROOT" \
  --include="*.tf" --include="*.yaml" --include="*.yml" --include="*.json" \
  --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null

echo
echo "=================================================="
echo "2. Files mentioning JWT_REFRESH_SECRET or JWT_SECRET directly"
echo "=================================================="
grep -rn "JWT_REFRESH_SECRET\|JWT_SECRET" "$ROOT" \
  --exclude-dir=node_modules --exclude-dir=.git \
  --exclude="*.log" 2>/dev/null | grep -v "task-def"

echo
echo "=================================================="
echo "3. ECS-related CI/CD deploy configs"
echo "=================================================="
find "$ROOT" \
  -not -path "*/node_modules/*" -not -path "*/.git/*" \
  \( -path "*.github/workflows/*" -o -path "*.gitlab-ci*" \
     -o -iname "buildspec*.yml" -o -iname "appspec*.yml" \
     -o -iname "docker-compose*.yml" \) 2>/dev/null

echo
echo "--- Contents mentioning ecs, task-definition, or register-task-definition ---"
grep -rniE "ecs |register-task-definition|task-definition|ecs-deploy" "$ROOT" \
  --include="*.yml" --include="*.yaml" \
  --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null

echo
echo "=================================================="
echo "4. Any committed task-def JSON files"
echo "=================================================="
find "$ROOT" \
  -not -path "*/node_modules/*" -not -path "*/.git/*" \
  -iname "*task*def*.json" -o -iname "*taskdef*.json" 2>/dev/null

echo
echo "=================================================="
echo "Done."
echo "=================================================="
echo "If section 1/3/4 found nothing, your task definition is likely"
echo "managed OUTSIDE this repo (a separate infra repo, or manually via"
echo "console/CLI) — meaning your fix from the CLI/script earlier is the"
echo "actual source of truth and won't get overwritten on next deploy."
echo
echo "If section 1 or 3 DID find files defining the task definition,"
echo "that's where you need to add JWT_REFRESH_SECRET permanently —"
echo "otherwise your CLI fix will be reverted next time that IaC/CI runs."

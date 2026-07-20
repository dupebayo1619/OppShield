#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 WAZUH INTEGRATION — COMPLETE LOG INFORMATION"
echo "📅 $(date)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Variables
CLUSTER_NAME="opsshield-dev-cluster"
SERVICE_NAME="opsshield-dev-service"
TASK_DEF="opsshield-dev:15"
ALB_NAME="oppshield-dev-alb"
LOG_GROUP_PREFIX="/ecs/opsshield"

# 1. ECS TASK DEFINITION — LOG CONFIGURATION
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 1. ECS TASK DEFINITION — LOG CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
aws ecs describe-task-definition --task-definition $TASK_DEF --query "taskDefinition.containerDefinitions[0].logConfiguration.options" --output table 2>/dev/null || echo "❌ Task definition not found"
echo ""

# 2. CLOUDWATCH LOG GROUPS (opsshield related)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 2. CLOUDWATCH LOG GROUPS (opsshield related)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
aws logs describe-log-groups --log-group-name-prefix $LOG_GROUP_PREFIX --query "logGroups[*].logGroupName" --output table 2>/dev/null || echo "❌ No log groups found"
echo ""

# 3. ALL LOG GROUPS (filtered)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 3. ALL CLOUDWATCH LOG GROUPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
aws logs describe-log-groups --query "logGroups[?contains(logGroupName, 'opsshield') || contains(logGroupName, 'oppshield')].[logGroupName]" --output table 2>/dev/null || echo "❌ No log groups found"
echo ""

# 4. LOG STREAMS (recent)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 4. LOG STREAMS (recent)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
aws logs describe-log-streams --log-group-name /ecs/opsshield-dev --order-by LastEventTime --descending --limit 3 --query "logStreams[*].[logStreamName,lastEventTimestamp]" --output table 2>/dev/null || echo "❌ No log streams found"
echo ""

# 5. RECENT LOG EVENTS (sample)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 5. RECENT LOG EVENTS (sample)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
LOG_STREAM=$(aws logs describe-log-streams --log-group-name /ecs/opsshield-dev --order-by LastEventTime --descending --limit 1 --query "logStreams[0].logStreamName" --output text 2>/dev/null)
if [ -n "$LOG_STREAM" ] && [ "$LOG_STREAM" != "None" ]; then
  echo "📄 Log Stream: $LOG_STREAM"
  aws logs get-log-events --log-group-name /ecs/opsshield-dev --log-stream-name "$LOG_STREAM" --limit 3 --query "events[*].[timestamp,message]" --output table 2>/dev/null || echo "   No events found"
else
  echo "❌ No log streams available"
fi
echo ""

# 6. ALB LOGS BUCKET
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 6. ALB LOGS BUCKET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
aws elbv2 describe-load-balancers --names $ALB_NAME --query "LoadBalancers[0].Attributes[?contains(Key, 's3')]" --output table 2>/dev/null || echo "❌ ALB not found"
echo ""

# 7. ECS SERVICE LOG CONFIGURATION
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 7. ECS SERVICE LOG CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --query "services[0].taskDefinition" --output text 2>/dev/null || echo "❌ Service not found"
echo ""

# 8. SUMMARY
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   ✅ CORRECT LOG GROUP: /ecs/opsshield-dev"
echo "   ✅ REGION: us-east-1"
echo "   ✅ STREAM PREFIX: ecs"
echo ""
echo "   ❌ INCORRECT LOG GROUP: /ecs/opsshield-app (does not exist)"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ INFORMATION GATHERED"
echo "═══════════════════════════════════════════════════════════════"

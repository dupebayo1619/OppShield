cat > ~/verify-demo-features.sh << 'EOF'
#!/bin/bash
echo "===================================================="
echo "   OpsShield Demo Feature Verification Script"
echo "===================================================="

cd ~/OppShield || { echo "ERROR: ~/OppShield not found"; exit 1; }

echo ""
echo "=== 1. DEPLOYMENT STATUS ==="
echo ""
echo "Health Check:"
curl -s -o /dev/null -w "  HTTP Status: %{http_code}\n" https://staging.srzoh.com.ng/health

echo "Frontend URL:"
curl -s -o /dev/null -w "  HTTP Status: %{http_code}\n" https://opsshield-sentinels.expadox.com

echo ""
echo "=== 2. AUTHENTICATION ==="
echo ""
echo "Login Test:"
LOGIN_RESPONSE=$(curl -s -X POST https://staging.srzoh.com.ng/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@opsshield.io","password":"Password123!"}')

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
  echo "  ✅ Login successful"
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
else
  echo "  ❌ Login failed"
  TOKEN=""
fi

echo ""
echo "=== 3. TASK WORKFLOW ==="
echo ""
if [ -n "$TOKEN" ]; then
  echo "Create Task:"
  CREATE_RESPONSE=$(curl -s -X POST https://staging.srzoh.com.ng/api/tasks \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"title":"Demo Task","description":"Testing demo features"}')
  
  if echo "$CREATE_RESPONSE" | grep -q "task"; then
    echo "  ✅ Create task successful"
    TASK_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "  Task ID: $TASK_ID"
  else
    echo "  ❌ Create task failed"
  fi
else
  echo "  ⏭️ Skipping task tests (no token)"
fi

echo ""
echo "=== 4. FEATURE FLAGS ==="
echo ""
if [ -n "$TOKEN" ]; then
  FLAG_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
    https://staging.srzoh.com.ng/api/feature-flags)
  
  if echo "$FLAG_RESPONSE" | grep -q "task-automation"; then
    echo "  ✅ Feature flags accessible"
    echo "  ✅ task-automation: $(echo "$FLAG_RESPONSE" | grep -o '"task-automation","enabled":[^,}]*')"
  else
    echo "  ❌ Feature flags not accessible"
  fi
else
  echo "  ⏭️ Skipping feature flag tests (no token)"
fi

echo ""
echo "=== 5. BILLING / PAYSTACK ==="
echo ""
if [ -n "$TOKEN" ]; then
  BILLING_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
    https://staging.srzoh.com.ng/api/billing/plan)
  
  if echo "$BILLING_RESPONSE" | grep -q "plan"; then
    echo "  ✅ Billing endpoint accessible"
    echo "  ✅ Plan: $(echo "$BILLING_RESPONSE" | grep -o '"plan":"[^"]*"' | cut -d'"' -f4)"
  else
    echo "  ❌ Billing endpoint not accessible"
  fi
else
  echo "  ⏭️ Skipping billing tests (no token)"
fi

echo ""
echo "=== 6. MFA SETUP ==="
echo ""
if [ -n "$TOKEN" ]; then
  MFA_RESPONSE=$(curl -s -X POST https://staging.srzoh.com.ng/api/auth/mfa/setup \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  
  if echo "$MFA_RESPONSE" | grep -q "qrCode"; then
    echo "  ✅ MFA setup endpoint working"
  else
    echo "  ⚠️ MFA endpoint response: $(echo "$MFA_RESPONSE" | jq -r '.error // "Unknown"')"
  fi
else
  echo "  ⏭️ Skipping MFA tests (no token)"
fi

echo ""
echo "=== 7. DATABASE (Organizations) ==="
echo ""
DB_RESPONSE=$(docker exec oppshield_db_1 psql -U opsshield -d opsshield -t -c \
  "SELECT COUNT(*) FROM \"Organisation\";" 2>/dev/null | tr -d ' ')

if [ -n "$DB_RESPONSE" ] && [ "$DB_RESPONSE" -gt 0 ]; then
  echo "  ✅ Organizations found: $DB_RESPONSE"
else
  echo "  ❌ No organizations found (DB not running or empty)"
fi

echo ""
echo "=== 8. CI/CD PIPELINE ==="
echo ""
if [ -d ".github/workflows" ]; then
  echo "  ✅ GitHub Actions configured"
  echo "  Workflows:"
  for f in .github/workflows/*.yml; do
    echo "    - $(basename $f)"
  done
else
  echo "  ❌ No CI/CD pipeline found"
fi

echo ""
echo "=== 9. INFRASTRUCTURE (AWS) ==="
echo ""
ECS_STATUS=$(aws ecs describe-services \
  --cluster opsshield-dev-cluster \
  --services opsshield-dev-service \
  --query 'services[0].status' --output text 2>/dev/null)

if [ "$ECS_STATUS" = "ACTIVE" ]; then
  echo "  ✅ ECS service running"
else
  echo "  ⚠️ ECS service status: $ECS_STATUS"
fi

ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names opsshield-dev-alb \
  --query 'LoadBalancers[0].DNSName' --output text 2>/dev/null)

if [ -n "$ALB_DNS" ]; then
  echo "  ✅ ALB DNS: $ALB_DNS"
else
  echo "  ⚠️ ALB not found"
fi

echo ""
echo "=== 10. SECURITY FEATURES ==="
echo ""
echo "CORS Headers:"
curl -s -I -X GET https://staging.srzoh.com.ng/api/health 2>/dev/null | grep -i "access-control-allow-origin" | head -1

echo "Security Headers:"
curl -s -I -X GET https://staging.srzoh.com.ng/api/health 2>/dev/null | grep -i "strict-transport-security" | head -1

echo ""
echo "=== 11. FRONTEND PAGES ==="
echo ""
for page in login dashboard tasks settings billing admin/feature-flags; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://opsshield-sentinels.expadox.com/$page")
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "304" ]; then
    echo "  ✅ /$page → $STATUS"
  else
    echo "  ❌ /$page → $STATUS"
  fi
done

echo ""
echo "===================================================="
echo "   VERIFICATION COMPLETE"
echo "===================================================="
echo ""
echo "✅ = Feature is working"
echo "❌ = Feature is broken"
echo "⚠️ = Feature needs attention"
echo "⏭️ = Test skipped (requires authentication)"
EOF

chmod +x ~/verify-demo-features.sh

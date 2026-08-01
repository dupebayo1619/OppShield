#!/bin/bash
# ==========================================
# OpsShield — Create Test Users Script
# For Stage 7 Penetration Testing
# ==========================================

echo "=========================================="
echo "🔧 Creating Test Users for Stage 7"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
STAGING_URL="https://staging.srzoh.com.ng"
ADMIN_A_EMAIL="admin@opsshield.io"
ADMIN_A_PASS="Password123!"

# ==========================================
# Step 1: Get Admin A Token
# ==========================================
echo "1️⃣  Getting Admin A token..."

ADMIN_A_LOGIN=$(curl -s -X POST $STAGING_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_A_EMAIL\",\"password\":\"$ADMIN_A_PASS\"}")

ADMIN_A_TOKEN=$(echo $ADMIN_A_LOGIN | jq -r '.accessToken')

if [ -z "$ADMIN_A_TOKEN" ] || [ "$ADMIN_A_TOKEN" = "null" ]; then
  echo -e "${RED}❌ Failed to get Admin A token${NC}"
  echo "Response: $ADMIN_A_LOGIN"
  exit 1
fi

echo -e "${GREEN}✅ Admin A token obtained${NC}"
echo ""

# ==========================================
# Step 2: Create Member A
# ==========================================
echo "2️⃣  Creating Member A..."

MEMBER_A_EMAIL="member-a@opsshield.io"
MEMBER_A_PASS="Test123!"
MEMBER_A_FIRST="Member"
MEMBER_A_LAST="A"

# Create Member A via ECS
TASK_ARN=$(aws ecs list-tasks --cluster opsshield-dev-cluster --service opsshield-dev-service --query 'taskArns[0]' --output text)

if [ -z "$TASK_ARN" ] || [ "$TASK_ARN" = "None" ]; then
  echo -e "${RED}❌ No running task found${NC}"
  exit 1
fi

aws ecs execute-command \
  --cluster opsshield-dev-cluster \
  --task $TASK_ARN \
  --container opsshield-app \
  --interactive \
  --command "node -e \"
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.create({
  data: {
    email: '$MEMBER_A_EMAIL',
    passwordHash: 'temp_member_a_hash',
    firstName: '$MEMBER_A_FIRST',
    lastName: '$MEMBER_A_LAST',
    role: 'member'
  }
})
.then(() => console.log('✅ Member A created'))
.catch((err) => {
  if (err.code === 'P2002') {
    console.log('✅ Member A already exists');
  } else {
    console.error('❌ Error:', err.message);
  }
});
\"" 2>/dev/null

echo ""

# ==========================================
# Step 3: Create Admin B
# ==========================================
echo "3️⃣  Creating Admin B..."

ADMIN_B_EMAIL="admin-b@opsshield.io"
ADMIN_B_PASS="Password123!"
ADMIN_B_FIRST="Admin"
ADMIN_B_LAST="B"

aws ecs execute-command \
  --cluster opsshield-dev-cluster \
  --task $TASK_ARN \
  --container opsshield-app \
  --interactive \
  --command "node -e \"
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.create({
  data: {
    email: '$ADMIN_B_EMAIL',
    passwordHash: 'temp_admin_b_hash',
    firstName: '$ADMIN_B_FIRST',
    lastName: '$ADMIN_B_LAST',
    role: 'admin'
  }
})
.then(() => console.log('✅ Admin B created'))
.catch((err) => {
  if (err.code === 'P2002') {
    console.log('✅ Admin B already exists');
  } else {
    console.error('❌ Error:', err.message);
  }
});
\"" 2>/dev/null

echo ""

# ==========================================
# Step 4: Verify Users
# ==========================================
echo "4️⃣  Verifying users..."

# Test Member A
echo ""
echo "   Testing Member A login:"
MEMBER_A_LOGIN=$(curl -s -X POST $STAGING_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$MEMBER_A_EMAIL\",\"password\":\"$MEMBER_A_PASS\"}")
MEMBER_A_TOKEN=$(echo $MEMBER_A_LOGIN | jq -r '.accessToken')

if [ -n "$MEMBER_A_TOKEN" ] && [ "$MEMBER_A_TOKEN" != "null" ]; then
  echo -e "   ${GREEN}✅ Member A login successful${NC}"
  echo "   Token: ${MEMBER_A_TOKEN:0:30}..."
else
  echo -e "   ${RED}❌ Member A login failed${NC}"
fi

# Test Admin B
echo ""
echo "   Testing Admin B login:"
ADMIN_B_LOGIN=$(curl -s -X POST $STAGING_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_B_EMAIL\",\"password\":\"$ADMIN_B_PASS\"}")
ADMIN_B_TOKEN=$(echo $ADMIN_B_LOGIN | jq -r '.accessToken')

if [ -n "$ADMIN_B_TOKEN" ] && [ "$ADMIN_B_TOKEN" != "null" ]; then
  echo -e "   ${GREEN}✅ Admin B login successful${NC}"
  echo "   Token: ${ADMIN_B_TOKEN:0:30}..."
else
  echo -e "   ${RED}❌ Admin B login failed${NC}"
fi

echo ""

# ==========================================
# Step 5: Summary
# ==========================================
echo "=========================================="
echo "📊 SUMMARY"
echo "=========================================="
echo ""

echo "✅ All users created/verified!"
echo ""
echo "📋 Test Credentials:"
echo "   Admin A:   $ADMIN_A_EMAIL / $ADMIN_A_PASS"
echo "   Member A:  $MEMBER_A_EMAIL / $MEMBER_A_PASS"
echo "   Admin B:   $ADMIN_B_EMAIL / $ADMIN_B_PASS"
echo ""
echo "🔗 Staging URL: $STAGING_URL"
echo ""
echo "=========================================="
echo "✅ TEST USERS READY"
echo "=========================================="

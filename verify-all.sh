#!/bin/bash
echo "=========================================="
echo "🔍 FULL VERIFICATION"
echo "=========================================="

echo ""
echo "1️⃣ LOCAL ENVIRONMENT:"
echo "   Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "   Local Database Users:"
docker exec -it oppshield_db_1 psql -U opsshield -d opsshield -c "SELECT email, \"firstName\", \"lastName\", role FROM \"User\";"

echo ""
echo "   Local Auth Test:"
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@opsshield.io","password":"Password123!"}' | jq -r '.user.email, .user.role' 2>/dev/null || echo "❌ Auth test failed"

echo ""
echo "2️⃣ STAGING ENVIRONMENT:"
echo "   Health Check:"
curl -s https://staging.srzoh.com.ng/health

echo ""
echo "   Staging Auth Test (Admin):"
curl -s -X POST https://staging.srzoh.com.ng/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@opsshield.io","password":"Password123!"}' | jq -r '.user.email, .user.role' 2>/dev/null || echo "❌ Auth test failed"

echo ""
echo "   Staging Auth Test (Member):"
curl -s -X POST https://staging.srzoh.com.ng/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"member@opsshield.io","password":"Password123!"}' | jq -r '.user.email, .user.role' 2>/dev/null || echo "❌ Auth test failed"

echo ""
echo "=========================================="
echo "✅ VERIFICATION COMPLETE"
echo "=========================================="

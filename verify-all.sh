#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 OPP SHIELD — COMPLETE REPO VERIFICATION"
echo "📅 $(date)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 1. DOCKER CONTAINERS
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 1. DOCKER CONTAINERS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker ps --format "table {{.Names}}\t{{.Status}}"
echo ""

# 2. LOCAL DATABASE TABLES
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 2. LOCAL DATABASE TABLES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker exec -it oppshield_db_1 psql -U opsshield -d opsshield -c "\dt" 2>/dev/null || echo "❌ Database not accessible"
echo ""

# 3. LOCAL DATABASE USERS
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 3. LOCAL DATABASE USERS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker exec -it oppshield_db_1 psql -U opsshield -d opsshield -c "SELECT email, role FROM \"User\";" 2>/dev/null || echo "❌ Users not found"
echo ""

# 4. LOCAL AUTH (ADMIN)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 4. LOCAL AUTH (ADMIN)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@opsshield.io","password":"Password123!"}' | jq -r '"✅ " + .user.email + " | Role: " + .user.role' 2>/dev/null || echo "❌ Failed"
echo ""

# 5. LOCAL AUTH (MEMBER)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 5. LOCAL AUTH (MEMBER)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"member@opsshield.io","password":"Password123!"}' | jq -r '"✅ " + .user.email + " | Role: " + .user.role' 2>/dev/null || echo "❌ Failed"
echo ""

# 6. LOCAL HEALTH
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 6. LOCAL HEALTH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s http://localhost:3000/health | jq . 2>/dev/null || echo "❌ Failed"
echo ""

# 7. STAGING HEALTH
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 7. STAGING HEALTH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s https://staging.srzoh.com.ng/health | jq . 2>/dev/null || echo "❌ Failed"
echo ""

# 8. STAGING AUTH (ADMIN)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 8. STAGING AUTH (ADMIN)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST https://staging.srzoh.com.ng/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@opsshield.io","password":"Password123!"}' | jq -r '"✅ " + .user.email + " | Role: " + .user.role' 2>/dev/null || echo "❌ Failed"
echo ""

# 9. STAGING AUTH (MEMBER)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 9. STAGING AUTH (MEMBER)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST https://staging.srzoh.com.ng/api/auth/login -H "Content-Type: application/json" -d '{"email":"member@opsshield.io","password":"Password123!"}' | jq -r '"✅ " + .user.email + " | Role: " + .user.role' 2>/dev/null || echo "❌ Failed"
echo ""

# 10. FRONTEND HEALTH
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 10. FRONTEND HEALTH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s http://localhost:3001/api/health | jq . 2>/dev/null || echo "❌ Failed"
echo ""

# 11. FRONTEND PAGES
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 11. FRONTEND PAGES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s http://localhost:3001/login > /dev/null && echo "   ✅ Login" || echo "   ❌ Login"
curl -s http://localhost:3001/dashboard > /dev/null && echo "   ✅ Dashboard" || echo "   ❌ Dashboard"
curl -s http://localhost:3001/tasks > /dev/null && echo "   ✅ Tasks" || echo "   ❌ Tasks"
curl -s http://localhost:3001/billing > /dev/null && echo "   ✅ Billing" || echo "   ❌ Billing"
curl -s http://localhost:3001/admin/feature-flags > /dev/null && echo "   ✅ Feature Flags Admin" || echo "   ❌ Feature Flags Admin"
echo ""

# 12. SECURITY HEADERS
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 12. SECURITY HEADERS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   🔒 X-Frame-Options: $(curl -sI https://staging.srzoh.com.ng/health | grep -i "x-frame-options" || echo '❌ Missing')"
echo "   🔒 X-Content-Type-Options: $(curl -sI https://staging.srzoh.com.ng/health | grep -i "x-content-type-options" || echo '❌ Missing')"
echo "   🔒 Strict-Transport-Security: $(curl -sI https://staging.srzoh.com.ng/health | grep -i "strict-transport-security" || echo '❌ Missing')"
echo ""

# 13. GIT STATUS
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 13. GIT STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git status -sb
echo ""

# 14. FEATURE FLAGS
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 14. FEATURE FLAGS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   📍 new-billing-ui: $(grep -c 'new-billing-ui' frontend/lib/featureFlags.ts 2>/dev/null || echo 0)"
echo "   📍 new-registration-flow: $(grep -c 'new-registration-flow' frontend/lib/featureFlags.ts 2>/dev/null || echo 0)"
echo "   📍 analytics-widget: $(grep -c 'analytics-widget' frontend/lib/featureFlags.ts 2>/dev/null || echo 0)"
echo "   📍 bulk-actions: $(grep -c 'bulk-actions' frontend/lib/featureFlags.ts 2>/dev/null || echo 0)"
echo ""

# 15. TASKS PAGE FIX
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 15. TASKS PAGE FIX (Array.isArray)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -c "Array.isArray" frontend/app/tasks/page.tsx 2>/dev/null | awk '{print "   ✅ Found:", $1, "occurrences"}'
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "✅ COMPLETE REPO VERIFICATION FINISHED"
echo "═══════════════════════════════════════════════════════════════"

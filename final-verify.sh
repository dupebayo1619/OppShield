#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 FINAL COMPLETE VERIFICATION - ALL SYSTEMS CHECK"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📅 Date: $(date)"
echo ""

# 1. CHECK LOCAL DOCKER CONTAINERS
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 1. LOCAL DOCKER CONTAINERS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker ps --format "table {{.Names}}\t{{.Status}}" 2>/dev/null || echo "❌ Docker not running"

# 2. CHECK LOCAL DATABASE
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 2. LOCAL DATABASE - USER TABLE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker exec -it oppshield_db_1 psql -U opsshield -d opsshield -c "\dt" 2>/dev/null || echo "❌ Database not accessible"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 3. LOCAL DATABASE - USERS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker exec -it oppshield_db_1 psql -U opsshield -d opsshield -c "SELECT email, role FROM \"User\";" 2>/dev/null || echo "❌ Users not found"

# 4. CHECK LOCAL AUTH
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 4. LOCAL AUTH ENDPOINT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@opsshield.io","password":"Password123!"}' | jq -r '"✅ Admin Login: " + .user.email + " | Role: " + .user.role' 2>/dev/null || echo "❌ Local auth failed"

# 5. CHECK LOCAL HEALTH
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 5. LOCAL HEALTH CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s http://localhost:3000/health 2>/dev/null | jq . || echo "❌ Health check failed"

# 6. CHECK STAGING HEALTH
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 6. STAGING HEALTH CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s https://staging.srzoh.com.ng/health 2>/dev/null | jq . || echo "❌ Staging health check failed"

# 7. CHECK STAGING ADMIN AUTH
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 7. STAGING AUTH (ADMIN)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST https://staging.srzoh.com.ng/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@opsshield.io","password":"Password123!"}' | jq -r '"✅ Admin Login: " + .user.email + " | Role: " + .user.role' 2>/dev/null || echo "❌ Admin login failed"

# 8. CHECK STAGING MEMBER AUTH
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 8. STAGING AUTH (MEMBER)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST https://staging.srzoh.com.ng/api/auth/login -H "Content-Type: application/json" -d '{"email":"member@opsshield.io","password":"Password123!"}' | jq -r '"✅ Member Login: " + .user.email + " | Role: " + .user.role' 2>/dev/null || echo "❌ Member login failed"

# 9. CHECK DNS RESOLUTION
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 9. STAGING DNS RESOLUTION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
dig staging.srzoh.com.ng +short | head -2 || echo "❌ DNS resolution failed"

# 10. CHECK SSL CERTIFICATE
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 10. STAGING SSL CERTIFICATE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
openssl s_client -connect staging.srzoh.com.ng:443 -servername staging.srzoh.com.ng < /dev/null 2>/dev/null | openssl x509 -noout -dates || echo "❌ SSL check failed"

# 11. CHECK FRONTEND
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 11. FRONTEND STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if curl -s http://localhost:3001/health 2>/dev/null | jq .; then
    echo "✅ Frontend is running"
else
    echo "⚠️ Frontend may not be running or health endpoint not available"
fi

# 12. CHECK TASKS PAGE
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 12. TASKS PAGE (Array.isArray fix)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f ~/OppShield/frontend/app/tasks/page.tsx ]; then
    ARRAY_CHECK=$(grep -c "Array.isArray" ~/OppShield/frontend/app/tasks/page.tsx)
    if [ "$ARRAY_CHECK" -gt 0 ]; then
        echo "✅ Array.isArray found in tasks page ($ARRAY_CHECK occurrences)"
    else
        echo "❌ Array.isArray NOT found in tasks page"
    fi
else
    echo "❌ Tasks page not found"
fi

# 13. CHECK PR STATUS
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 13. GIT STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd ~/OppShield
git status -sb

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ FINAL VERIFICATION COMPLETE"
echo "═══════════════════════════════════════════════════════════════"

#!/bin/bash

# ============================================
#  STAGING ENVIRONMENT COMPLETE DIAGNOSTIC
#  OppShield - Full System Health Check
# ============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGING_URL="https://staging.srzoh.com.ng"
DOMAIN="staging.srzoh.com.ng"

echo ""
echo "=========================================="
echo "  🔍 OOPSHIELD STAGING DIAGNOSTIC"
echo "=========================================="
echo "Started: $(date)"
echo "=========================================="
echo ""

# ============================================
# SECTION 1: DNS RESOLUTION
# ============================================
echo -e "${BLUE}📋 SECTION 1: DNS Resolution${NC}"
echo "----------------------------------------"
nslookup $DOMAIN 2>&1 | grep -A5 "Non-authoritative" || echo "❌ DNS lookup failed"
echo ""

# ============================================
# SECTION 2: SSL CERTIFICATE
# ============================================
echo -e "${BLUE}📋 SECTION 2: SSL Certificate${NC}"
echo "----------------------------------------"
echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -text | grep -E "Subject:|Issuer:|Not Before:|Not After:|DNS:" || echo "❌ SSL check failed"
echo ""

# ============================================
# SECTION 3: BASIC CONNECTIVITY
# ============================================
echo -e "${BLUE}📋 SECTION 3: Connectivity Test${NC}"
echo "----------------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $STAGING_URL/)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
    echo -e "${GREEN}✅ Server is reachable (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Server not reachable (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# ============================================
# SECTION 4: HEALTH CHECK
# ============================================
echo -e "${BLUE}📋 SECTION 4: Health Check${NC}"
echo "----------------------------------------"
HEALTH_RESPONSE=$(curl -s $STAGING_URL/health)
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo -e "${GREEN}✅ Health Check: PASSED${NC}"
    echo "Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Health Check: FAILED${NC}"
    echo "Response: $HEALTH_RESPONSE"
fi
echo ""

# ============================================
# SECTION 5: AUTH ENDPOINT TESTS
# ============================================
echo -e "${BLUE}📋 SECTION 5: Auth Endpoint Tests${NC}"
echo "----------------------------------------"

echo "5.1 Testing GET /api/auth/ (expected 404)"
AUTH_GET=$(curl -s -o /dev/null -w "%{http_code}" $STAGING_URL/api/auth/)
if [ "$AUTH_GET" = "404" ]; then
    echo -e "${GREEN}✅ GET /api/auth/ → 404 (as expected)${NC}"
else
    echo -e "${YELLOW}⚠️ GET /api/auth/ → $AUTH_GET (unexpected)${NC}"
fi

echo ""
echo "5.2 Testing POST /api/auth/login"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $STAGING_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test123!"}' 2>/dev/null)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)
LOGIN_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1)

if [ "$LOGIN_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Login endpoint: WORKING${NC}"
    echo "Response: $LOGIN_BODY"
elif [ "$LOGIN_CODE" = "404" ]; then
    echo -e "${RED}❌ Login endpoint: NOT FOUND (404)${NC}"
elif [ "$LOGIN_CODE" = "500" ]; then
    echo -e "${YELLOW}⚠️ Login endpoint: SERVER ERROR (500)${NC}"
    echo "Response: $LOGIN_BODY"
else
    echo -e "${YELLOW}⚠️ Login endpoint: HTTP $LOGIN_CODE${NC}"
fi

echo ""
echo "5.3 Testing POST /api/auth/register"
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $STAGING_URL/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"testuser@example.com","password":"Test123!","firstName":"Test","lastName":"User","orgName":"TestOrg"}' 2>/dev/null)
REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | head -n -1)
REGISTER_CODE=$(echo "$REGISTER_RESPONSE" | tail -n 1)

if [ "$REGISTER_CODE" = "201" ] || [ "$REGISTER_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Registration endpoint: WORKING${NC}"
    echo "Response: $REGISTER_BODY"
elif [ "$REGISTER_CODE" = "409" ]; then
    echo -e "${YELLOW}⚠️ Registration: User already exists (409)${NC}"
    echo "Response: $REGISTER_BODY"
elif [ "$REGISTER_CODE" = "500" ]; then
    echo -e "${YELLOW}⚠️ Registration endpoint: SERVER ERROR (500)${NC}"
    echo "Response: $REGISTER_BODY"
else
    echo -e "${YELLOW}⚠️ Registration endpoint: HTTP $REGISTER_CODE${NC}"
fi
echo ""

# ============================================
# SECTION 6: COMMON DOCS ENDPOINTS
# ============================================
echo -e "${BLUE}📋 SECTION 6: API Documentation${NC}"
echo "----------------------------------------"
DOCS_ENDPOINTS=("/docs" "/swagger" "/api-docs" "/swagger-ui.html" "/api/docs")
for endpoint in "${DOCS_ENDPOINTS[@]}"; do
    DOCS_CODE=$(curl -s -o /dev/null -w "%{http_code}" $STAGING_URL$endpoint)
    if [ "$DOCS_CODE" = "200" ] || [ "$DOCS_CODE" = "302" ]; then
        echo -e "${GREEN}✅ $endpoint → $DOCS_CODE${NC}"
    else
        echo -e "${YELLOW}⚠️ $endpoint → $DOCS_CODE${NC}"
    fi
done
echo ""

# ============================================
# SECTION 7: RATE LIMITING
# ============================================
echo -e "${BLUE}📋 SECTION 7: Rate Limiting Headers${NC}"
echo "----------------------------------------"
RATE_LIMIT=$(curl -s -I $STAGING_URL/api/auth/login | grep -i "ratelimit")
if [ -n "$RATE_LIMIT" ]; then
    echo -e "${GREEN}✅ Rate limiting is active:${NC}"
    echo "$RATE_LIMIT"
else
    echo -e "${YELLOW}⚠️ No rate limit headers detected${NC}"
fi
echo ""

# ============================================
# SECTION 8: SECURITY HEADERS
# ============================================
echo -e "${BLUE}📋 SECTION 8: Security Headers${NC}"
echo "----------------------------------------"
curl -s -I $STAGING_URL/api/auth/login | grep -E "(strict-transport-security|x-frame-options|x-content-type-options|content-security-policy)" || echo "⚠️ Security headers not found"
echo ""

# ============================================
# SECTION 9: CODE CONFIGURATION CHECK
# ============================================
echo -e "${BLUE}📋 SECTION 9: Code Configuration${NC}"
echo "----------------------------------------"

# Check for Prisma
if [ -f "prisma/schema.prisma" ]; then
    echo -e "${GREEN}✅ Prisma schema found${NC}"
else
    echo -e "${YELLOW}⚠️ No Prisma schema found in current directory${NC}"
fi

# Check for .env
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
else
    echo -e "${YELLOW}⚠️ No .env file found in current directory${NC}"
fi

# Check for JWT_SECRET in .env
if [ -f ".env" ] && grep -q "JWT_SECRET" .env; then
    echo -e "${GREEN}✅ JWT_SECRET found in .env${NC}"
else
    echo -e "${YELLOW}⚠️ JWT_SECRET not found in .env${NC}"
fi
echo ""

# ============================================
# SECTION 10: SUMMARY
# ============================================
echo -e "${BLUE}📋 SECTION 10: Summary & Recommendations${NC}"
echo "========================================"

# Count issues
ISSUES=0

# DNS check
if nslookup $DOMAIN >/dev/null 2>&1; then
    echo -e "✅ DNS: ${GREEN}PASSED${NC}"
else
    echo -e "❌ DNS: ${RED}FAILED${NC}"
    ((ISSUES++))
fi

# SSL check
if echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | grep -q "Verify return code: 0"; then
    echo -e "✅ SSL: ${GREEN}PASSED${NC}"
else
    echo -e "❌ SSL: ${RED}FAILED${NC}"
    ((ISSUES++))
fi

# Health check
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo -e "✅ Health: ${GREEN}PASSED${NC}"
else
    echo -e "❌ Health: ${RED}FAILED${NC}"
    ((ISSUES++))
fi

# Auth endpoint
if [ "$LOGIN_CODE" = "200" ]; then
    echo -e "✅ Auth: ${GREEN}WORKING${NC}"
elif [ "$LOGIN_CODE" = "404" ]; then
    echo -e "❌ Auth: ${RED}ENDPOINT NOT FOUND${NC}"
    ((ISSUES++))
elif [ "$LOGIN_CODE" = "500" ]; then
    echo -e "⚠️ Auth: ${YELLOW}SERVER ERROR - Check logs${NC}"
    ((ISSUES++))
fi

echo ""
echo "========================================"
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL SYSTEMS GREEN!${NC}"
    echo "Everything is working correctly."
elif [ $ISSUES -eq 1 ]; then
    echo -e "${YELLOW}⚠️ 1 ISSUE DETECTED${NC}"
else
    echo -e "${RED}🚨 $ISSUES ISSUES DETECTED${NC}"
fi
echo "========================================"

echo ""
echo "📌 Recommendations:"
if [ "$LOGIN_CODE" = "500" ] || [ "$REGISTER_CODE" = "500" ]; then
    echo "1. 🔴 AUTHENTICATION IS BROKEN - Check server logs"
    echo "   - Verify JWT_SECRET and JWT_REFRESH_SECRET are set"
    echo "   - Run Prisma migrations: npx prisma migrate deploy"
    echo "   - Generate Prisma client: npx prisma generate"
    echo "   - Check database connection: npx prisma db push"
fi

if [ "$LOGIN_CODE" = "404" ]; then
    echo "2. 🔴 AUTH ENDPOINTS NOT FOUND - Check routes configuration"
fi

if ! echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo "3. 🔴 HEALTH CHECK FAILING - Application may be down"
fi

echo ""
echo "📋 Server Logs Check (if you have access):"
echo "   - PM2: pm2 logs --lines 50"
echo "   - Docker: docker logs <container-id> --tail 50"
echo "   - ECS: aws logs get-log-events --log-group-name <group> --limit 50"
echo ""

echo "========================================"
echo "✅ Diagnostic Complete: $(date)"
echo "========================================"

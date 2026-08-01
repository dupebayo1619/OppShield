#!/bin/bash
echo "===================================================="
echo "1. Checking for accept()/complete() in tasks controller"
echo "===================================================="
grep -n "async function accept" ~/OppShield/src/controllers/tasks.js && echo "✅ accept() found" || echo "❌ accept() NOT found"
grep -n "async function complete" ~/OppShield/src/controllers/tasks.js && echo "✅ complete() found" || echo "❌ complete() NOT found"
grep -n "accept" ~/OppShield/src/controllers/tasks.js | grep "module.exports" -A5
echo ""
grep -n "module.exports" -A 10 ~/OppShield/src/controllers/tasks.js | grep -E "accept|complete" && echo "✅ exported" || echo "❌ NOT exported"

echo ""
echo "===================================================="
echo "2. Checking for accept/complete routes"
echo "===================================================="
grep -n "accept\|complete" ~/OppShield/src/routes/tasks.js

echo ""
echo "===================================================="
echo "3. Checking DONE vs COMPLETED enum in frontend"
echo "===================================================="
echo "-- Prisma schema enum values:"
grep -A 10 "enum TaskStatus" ~/OppShield/prisma/schema.prisma
echo ""
echo "-- Frontend status references:"
grep -n "COMPLETED\|'DONE'" ~/OppShield/frontend/app/tasks/page.tsx

echo ""
echo "===================================================="
echo "4. Checking dashboard route protection"
echo "===================================================="
if [ -f ~/OppShield/frontend/app/dashboard/layout.tsx ]; then
  cat ~/OppShield/frontend/app/dashboard/layout.tsx
else
  echo "❌ frontend/app/dashboard/layout.tsx does not exist"
fi
echo ""
grep -rn "role.*admin\|isAdmin\|role !== 'admin'" ~/OppShield/frontend/app/dashboard/ 2>/dev/null || echo "❌ No admin role check found in dashboard folder"

echo ""
echo "===================================================="
echo "5. Live API check (requires app running + admin token)"
echo "===================================================="
echo "Run manually if backend is up:"
echo 'TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@opsshield.io\",\"password\":\"Password123!\"}" | jq -r .accessToken)'
echo 'curl -s -X POST http://localhost:3000/api/tasks/SOME_TASK_ID/accept -H "Authorization: Bearer $TOKEN"'

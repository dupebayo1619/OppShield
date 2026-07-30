#!/bin/bash
echo "===================================================="
echo "1. accept()/complete() in tasks controller"
echo "===================================================="
grep -q "async function accept" ~/OppShield/src/controllers/tasks.js && echo "✅ accept() found" || echo "❌ accept() NOT found"
grep -q "async function complete" ~/OppShield/src/controllers/tasks.js && echo "✅ complete() found" || echo "❌ complete() NOT found"
grep -A 10 "module.exports" ~/OppShield/src/controllers/tasks.js | grep -q "accept" && echo "✅ accept exported" || echo "❌ accept NOT exported"
grep -A 10 "module.exports" ~/OppShield/src/controllers/tasks.js | grep -q "complete" && echo "✅ complete exported" || echo "❌ complete NOT exported"

echo ""
echo "===================================================="
echo "2. accept/complete routes"
echo "===================================================="
grep -q "taskController.accept\|taskController\.accept" ~/OppShield/src/routes/tasks.js && echo "✅ accept route wired" || echo "❌ accept route NOT wired"
grep -q "taskController.complete\|taskController\.complete" ~/OppShield/src/routes/tasks.js && echo "✅ complete route wired" || echo "❌ complete route NOT wired"

echo ""
echo "===================================================="
echo "3. DONE vs COMPLETED enum consistency"
echo "===================================================="
echo "-- Schema enum:"
grep -A 10 "enum TaskStatus" ~/OppShield/prisma/schema.prisma
echo ""
if grep -q "'COMPLETED'" ~/OppShield/frontend/app/tasks/page.tsx; then
  echo "❌ 'COMPLETED' still referenced in frontend (mismatch not fully fixed)"
else
  echo "✅ No stray 'COMPLETED' references in frontend"
fi
grep -q "'DONE'" ~/OppShield/frontend/app/tasks/page.tsx && echo "✅ 'DONE' used in frontend" || echo "❌ 'DONE' NOT found in frontend"

echo ""
echo "===================================================="
echo "4. Dashboard client-side route guard"
echo "===================================================="
if [ -f ~/OppShield/frontend/app/dashboard/layout.tsx ]; then
  if grep -q "role !== 'admin'\|role.*admin" ~/OppShield/frontend/app/dashboard/layout.tsx; then
    echo "✅ Admin role check found in layout.tsx"
  else
    echo "❌ layout.tsx exists but has NO role check (still a pass-through)"
  fi
  if grep -q "router.push('/login')" ~/OppShield/frontend/app/dashboard/layout.tsx; then
    echo "✅ Redirects unauthenticated users"
  else
    echo "❌ No auth-token redirect found"
  fi
else
  echo "❌ frontend/app/dashboard/layout.tsx does not exist"
fi

echo ""
echo "===================================================="
echo "5. Dashboard backend admin check"
echo "===================================================="
if [ -f ~/OppShield/src/controllers/dashboard.js ]; then
  grep -q "req.user.role !== 'admin'" ~/OppShield/src/controllers/dashboard.js && echo "✅ Backend admin check present" || echo "❌ No backend admin check in dashboard.js"
  grep -q "new PrismaClient()" ~/OppShield/src/controllers/dashboard.js && echo "⚠️  Uses its own 'new PrismaClient()' instead of shared lib/prisma — check for connection pool duplication" || echo "✅ Not instantiating a separate PrismaClient"
else
  echo "❌ src/controllers/dashboard.js does not exist"
fi

if [ -f ~/OppShield/src/routes/dashboard.js ]; then
  grep -q "authenticate" ~/OppShield/src/routes/dashboard.js && echo "✅ Dashboard route requires authentication" || echo "❌ No authenticate middleware on dashboard route"
else
  echo "❌ src/routes/dashboard.js does not exist"
fi

echo ""
echo "===================================================="
echo "6. Organizations seeded"
echo "===================================================="
docker exec -it oppshield_db_1 psql -U opsshield -d opsshield -c "SELECT name, slug FROM \"Organisation\";" 2>/dev/null || echo "❌ Could not query DB (is oppshield_db_1 running?)"

echo ""
echo "===================================================="
echo "DONE — review any ❌ above"
echo "===================================================="

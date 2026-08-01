#!/bin/bash
cd ~/OppShield || { echo "ERROR: ~/OppShield not found"; exit 1; }

echo "===================================================="
echo "1. Task status enum / possible values (Prisma schema)"
echo "===================================================="
grep -n -A 10 "enum TaskStatus\|status.*Task" prisma/schema.prisma 2>/dev/null

echo ""
echo "===================================================="
echo "2. Task model definition"
echo "===================================================="
grep -n -A 20 "^model Task" prisma/schema.prisma 2>/dev/null

echo ""
echo "===================================================="
echo "3. Task status transition logic (accept/complete/approve/reject)"
echo "===================================================="
grep -n -i "accept\|approve\|reject\|in_progress\|inprogress\|awaiting" src/controllers/tasks.js src/routes/tasks.js 2>/dev/null

echo ""
echo "===================================================="
echo "4. Role-based access control on task routes (member vs admin)"
echo "===================================================="
grep -n "role\|isAdmin\|requireRole\|authorize" src/routes/tasks.js src/middleware/*.js 2>/dev/null

echo ""
echo "===================================================="
echo "5. Organisation model / multi-org support"
echo "===================================================="
grep -n -A 10 "^model Organisation\|^model Organization" prisma/schema.prisma 2>/dev/null

echo ""
echo "===================================================="
echo "6. How many organisations currently exist in seed data"
echo "===================================================="
grep -n -i "orgA\|orgB\|organisation\|organization" prisma/seed.js 2>/dev/null | head -30

echo ""
echo "===================================================="
echo "7. Admin-only dashboard route protection (frontend)"
echo "===================================================="
grep -rn "role.*admin\|isAdmin\|role ===" frontend/app/dashboard 2>/dev/null

echo ""
echo "===================================================="
echo "8. Member-facing task accept/complete buttons (frontend)"
echo "===================================================="
grep -n -i "accept\|complete\|approve\|reject" frontend/app/tasks/page.tsx 2>/dev/null

echo ""
echo "===================================================="
echo "Done."
echo "===================================================="

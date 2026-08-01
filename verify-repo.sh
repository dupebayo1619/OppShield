#!/bin/bash
echo "===================================================="
echo "OppShield Repo Verification Script"
echo "===================================================="

cd ~/OppShield || { echo "ERROR: ~/OppShield not found"; exit 1; }

echo ""
echo "--- 1. Missing backend directories (src, routes, middleware, prisma) ---"
for d in src routes middleware prisma; do
  if [ -d "$d" ]; then
    echo "FOUND: $d/"
    find "$d" -maxdepth 2 -type f
  else
    echo "MISSING: $d/"
  fi
done

echo ""
echo "--- 2. Frontend lib/featureFlags file ---"
if find frontend -path "*/node_modules" -prune -o -iname "featureFlags*" -print 2>/dev/null | grep -q .; then
  find frontend -path "*/node_modules" -prune -o -iname "featureFlags*" -print 2>/dev/null
else
  echo "MISSING: frontend/lib/featureFlags.ts (or similar)"
fi

echo ""
echo "--- 3. .gitignore contents (check if it excludes src/routes/etc) ---"
cat .gitignore 2>/dev/null

echo ""
echo "--- 4. git status / tracked files check (if this is a git repo) ---"
if [ -d .git ]; then
  echo "Git repo detected. Checking tracked backend files:"
  git ls-files | grep -E "^(src/|routes/|middleware/|prisma/|frontend/app/lib/|frontend/lib/)" | head -50
  echo ""
  echo "Untracked files (git status):"
  git status --porcelain | head -50
else
  echo "Not a git repo (no .git directory) — cannot check tracked vs untracked"
fi

echo ""
echo "--- 5. .github/workflows (CI/CD pipeline) ---"
find . -path "*/node_modules" -prune -o -ipath "*.github/workflows*" -print 2>/dev/null

echo ""
echo "--- 6. ZAP scan reports ---"
find . -path "*/node_modules" -prune -o -iname "*zap*" -print 2>/dev/null

echo ""
echo "--- 7. Feature flag keys actually referenced in code ---"
grep -rn "isEnabled(" frontend/app --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v node_modules

echo ""
echo "--- 8. Backup/stray files worth cleaning (*.backup, *.backup2, dummy.zip, 'true' file etc) ---"
find . -path "*/node_modules" -prune -o \( -iname "*.backup*" -o -iname "dummy.zip" -o -iname "true" \) -print 2>/dev/null

echo ""
echo "===================================================="
echo "Verification complete."
echo "===================================================="

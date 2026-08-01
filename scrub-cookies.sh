#!/bin/bash
set -e
cd ~/OppShield || { echo "ERROR: ~/OppShield not found"; exit 1; }

echo "===================================================="
echo "STEP 0: Safety check — make sure git-filter-repo is installed"
echo "===================================================="
if ! command -v git-filter-repo &> /dev/null; then
  echo "git-filter-repo not found. Install it first:"
  echo "  pip install git-filter-repo --break-system-packages"
  echo "  (or) sudo apt install git-filter-repo"
  exit 1
fi

echo ""
echo "===================================================="
echo "STEP 1: Back up your repo before rewriting history"
echo "===================================================="
cd ~
cp -r OppShield OppShield-backup-$(date +%Y%m%d-%H%M%S)
echo "Backup created."

echo ""
echo "===================================================="
echo "STEP 2: Remove cookies.txt from ALL history"
echo "===================================================="
cd ~/OppShield
git filter-repo --path cookies.txt --invert-paths --force

echo ""
echo "===================================================="
echo "STEP 3: Add cookies.txt patterns to .gitignore"
echo "===================================================="
cat >> .gitignore << 'GITIGNORE'
cookies.txt
*.cookie
cookiejar*
GITIGNORE
git add .gitignore
git commit -m "chore: gitignore cookie/session artifacts"

echo ""
echo "===================================================="
echo "STEP 4: Confirm cookies.txt is gone from history"
echo "===================================================="
git log --all --oneline -- cookies.txt || echo "CONFIRMED: no history entries for cookies.txt remain"

echo ""
echo "===================================================="
echo "NEXT STEPS (manual — do these yourself):"
echo "1. Rotate JWT_SECRET and JWT_REFRESH_SECRET in Secrets Manager NOW"
echo "   (filter-repo doesn't matter if the token is still valid)"
echo "2. Re-add your remote (filter-repo strips it for safety):"
echo "   git remote add origin <your-repo-url>"
echo "3. Force-push the rewritten history:"
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo "4. Tell your team to re-clone the repo fresh — their old clones"
echo "   will conflict with the rewritten history."
echo "===================================================="

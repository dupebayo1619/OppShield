#!/bin/bash
cd ~/OppShield || { echo "ERROR: ~/OppShield not found"; exit 1; }

echo "===================================================="
echo "1. .github/workflows/ci.yml contents"
echo "===================================================="
cat .github/workflows/ci.yml 2>/dev/null

echo ""
echo "===================================================="
echo "2. Is ci.yml a required status check? (branch protection - needs GitHub API/token, so just flag it)"
echo "===================================================="
echo "NOTE: Branch protection can't be checked via local files — verify manually in GitHub repo Settings > Branches"

echo ""
echo "===================================================="
echo "3. cookies.txt — check contents WITHOUT printing raw session tokens"
echo "===================================================="
if [ -f cookies.txt ]; then
  echo "File exists. Line count: $(wc -l < cookies.txt)"
  echo "First field of each line (domain) + whether it looks like it has a token value (length only, not the value):"
  awk '{print $1, "| token_field_length=" length($NF)}' cookies.txt 2>/dev/null
  echo ""
  echo "Is cookies.txt in .gitignore?"
  grep -n "cookies" .gitignore || echo "NOT in .gitignore"
  echo ""
  echo "Git log for this file (how long has it been tracked):"
  git log --oneline -- cookies.txt | tail -5
else
  echo "cookies.txt not found"
fi

echo ""
echo "===================================================="
echo "4. billing/page.tsx — check if new-billing-ui flag check still present"
echo "===================================================="
grep -n "new-billing-ui\|isEnabled\|featureFlags" frontend/app/billing/page.tsx 2>/dev/null

echo ""
echo "===================================================="
echo "5. diff on billing/page.tsx to see what changed (uncommitted)"
echo "===================================================="
git diff frontend/app/billing/page.tsx 2>/dev/null | head -100

echo ""
echo "===================================================="
echo "Done."
echo "===================================================="

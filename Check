#!/usr/bin/env bash
#
# check-jwt-secret.sh
#
# Run this ON THE SERVER hosting the auth service (e.g. staging.srzoh.com.ng backend),
# NOT on your local machine or in the browser. It won't fix anything by itself —
# it just tells you WHERE the "secretOrPrivateKey must have a value" error is coming from.
#
# Usage:
#   chmod +x check-jwt-secret.sh
#   ./check-jwt-secret.sh
#
# Optionally pass the process name/dir if it's not auto-detected:
#   ./check-jwt-secret.sh /path/to/app

set -uo pipefail

APP_DIR="${1:-.}"

echo "=================================================="
echo "1. Checking common JWT-related env var names"
echo "=================================================="
JWT_VARS=(JWT_SECRET JWT_SECRET_KEY JWT_PRIVATE_KEY ACCESS_TOKEN_SECRET
          REFRESH_TOKEN_SECRET SECRET_KEY PRIVATE_KEY TOKEN_SECRET AUTH_SECRET)

found_any=false
for var in "${JWT_VARS[@]}"; do
  if [ -n "${!var:-}" ]; then
    echo "[OK]      $var is set (length: ${#!var})"
    found_any=true
  else
    echo "[MISSING] $var is not set in this shell's environment"
  fi
done

if [ "$found_any" = false ]; then
  echo
  echo ">>> None of the common JWT env var names are set in THIS shell."
  echo ">>> IMPORTANT: env vars available to your shell are not necessarily what your"
  echo ">>> Node process sees. Check how the process is actually started (systemd,"
  echo ">>> pm2, docker, k8s) — see steps 3 and 4 below."
fi

echo
echo "=================================================="
echo "2. Searching source code for how the secret is loaded"
echo "=================================================="
if command -v grep >/dev/null 2>&1; then
  echo "--- jwt.sign( calls ---"
  grep -rn --include="*.js" --include="*.ts" "jwt.sign(" "$APP_DIR" 2>/dev/null | grep -v node_modules
  echo
  echo "--- process.env references near 'secret' or 'jwt' or 'key' ---"
  grep -rniE "process\.env\.[A-Z_]*?(SECRET|JWT|KEY)" "$APP_DIR" --include="*.js" --include="*.ts" 2>/dev/null | grep -v node_modules
else
  echo "grep not available — skipping source scan"
fi

echo
echo "=================================================="
echo "3. Checking .env files present on disk"
echo "=================================================="
find "$APP_DIR" -maxdepth 3 -iname "*.env*" -not -path "*/node_modules/*" 2>/dev/null | while read -r f; do
  echo "--- $f ---"
  grep -iE "secret|jwt|key" "$f" 2>/dev/null | sed -E 's/=.*/=<redacted>/'
done

echo
echo "=================================================="
echo "4. Checking how the process is actually run (env may differ!)"
echo "=================================================="

echo "--- systemd services mentioning node/auth ---"
systemctl list-units --type=service 2>/dev/null | grep -iE "node|auth|api" || echo "(systemctl not available or nothing found)"

echo
echo "--- pm2 processes (if pm2 is used) ---"
if command -v pm2 >/dev/null 2>&1; then
  pm2 list
  echo "Run: pm2 env <id>   to see the actual env vars pm2 injected for a given process"
else
  echo "pm2 not installed"
fi

echo
echo "--- docker containers (if containerized) ---"
if command -v docker >/dev/null 2>&1; then
  docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" 2>/dev/null
  echo "Run: docker exec <container_name> env | grep -iE 'secret|jwt|key'"
else
  echo "docker not available"
fi

echo
echo "--- kubernetes pods (if on k8s) ---"
if command -v kubectl >/dev/null 2>&1; then
  kubectl get pods 2>/dev/null | grep -iE "auth|api" || echo "(no matching pods, or kubectl not configured)"
  echo "Run: kubectl exec <pod_name> -- env | grep -iE 'secret|jwt|key'"
  echo "Run: kubectl describe pod <pod_name> | grep -A20 'Environment:'"
else
  echo "kubectl not available"
fi

echo
echo "=================================================="
echo "5. Secrets manager check (if applicable)"
echo "=================================================="
echo "If your secret is pulled from AWS Secrets Manager / Vault / Doppler at runtime,"
echo "confirm the fetch succeeds independently of the app:"
echo
echo "  AWS Secrets Manager:"
echo "    aws secretsmanager get-secret-value --secret-id <your-secret-name>"
echo
echo "  HashiCorp Vault:"
echo "    vault kv get secret/<path-to-jwt-secret>"
echo
echo "  Doppler:"
echo "    doppler secrets get JWT_SECRET"
echo
echo "If these fail (permissions, wrong path, expired token), that's your root cause —"
echo "the app receives undefined and jsonwebtoken throws the exact error you saw."

echo
echo "=================================================="
echo "Done. Summary of what to look for:"
echo "=================================================="
echo "- A JWT var is set locally but with a DIFFERENT NAME than what jwt.sign() expects"
echo "- The var is set in .env but the staging process doesn't load that .env file"
echo "- The var is set in your shell but not in the process manager's environment (pm2/systemd/docker/k8s)"
echo "- A secrets manager fetch is silently failing and returning undefined"

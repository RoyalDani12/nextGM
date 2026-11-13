#!/usr/bin/env bash
# ==============================================================================
# NextGM Deployment Helper Script
# Triggers Render deploy hooks and verifies service health status.
# Usage:
#   ./scripts/deploy.sh [api|worker|client|all]
# Environment variables:
#   RENDER_API_DEPLOY_HOOK       - Webhook URL to deploy NextGM API
#   RENDER_WORKER_DEPLOY_HOOK    - Webhook URL to deploy NextGM Worker
#   RENDER_CLIENT_DEPLOY_HOOK    - Webhook URL to deploy NextGM Client
#   HEALTHCHECK_URL              - Production healthcheck endpoint (default: https://nextgm-1.onrender.com/health)
# ==============================================================================

set -euo pipefail

TARGET="${1:-all}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-https://nextgm-1.onrender.com/health}"

trigger_hook() {
  local service_name="$1"
  local hook_url="$2"

  if [ -z "$hook_url" ]; then
    echo "⚠️  Skipping $service_name: hook URL is not set."
    return 0
  fi

  echo "🚀 Triggering deployment for $service_name..."
  response=$(curl -sS -w "\nHTTP_STATUS:%{http_code}" -X POST "$hook_url")
  status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
  body=$(echo "$response" | grep -v "HTTP_STATUS")

  if [ "$status" -ge 200 ] && [ "$status" -lt 300 ]; then
    echo "✅ $service_name deployment triggered successfully (HTTP $status)."
    [ -n "$body" ] && echo "   Response: $body"
  else
    echo "❌ $service_name deploy hook failed with HTTP $status:"
    echo "   $body"
    return 1
  fi
}

wait_for_health() {
  local url="$1"
  echo "🔍 Verifying health check at $url..."

  local max_attempts=24
  local sleep_sec=10
  local attempt=1

  while [ "$attempt" -le "$max_attempts" ]; do
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" || echo "000")
    echo "   Attempt $attempt/$max_attempts: HTTP $status_code"

    if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ]; then
      echo "🎉 Deployment is healthy and accepting traffic (HTTP $status_code)!"
      return 0
    fi

    sleep "$sleep_sec"
    attempt=$((attempt + 1))
  done

  echo "⚠️  Health check timed out after $((max_attempts * sleep_sec))s."
  return 1
}

echo "=== NextGM Deployment Runner ==="

case "$TARGET" in
  api)
    trigger_hook "API" "${RENDER_API_DEPLOY_HOOK:-${RENDER_DEPLOY_HOOK:-}}"
    ;;
  worker)
    trigger_hook "Worker" "${RENDER_WORKER_DEPLOY_HOOK:-}"
    ;;
  client)
    trigger_hook "Client" "${RENDER_CLIENT_DEPLOY_HOOK:-}"
    ;;
  all)
    trigger_hook "API" "${RENDER_API_DEPLOY_HOOK:-${RENDER_DEPLOY_HOOK:-}}"
    trigger_hook "Worker" "${RENDER_WORKER_DEPLOY_HOOK:-}"
    trigger_hook "Client" "${RENDER_CLIENT_DEPLOY_HOOK:-}"
    ;;
  *)
    echo "Invalid target: $TARGET. Choose from: api, worker, client, all"
    exit 1
    ;;
esac

if [ "$TARGET" = "api" ] || [ "$TARGET" = "all" ]; then
  if [ -n "${VERIFY_HEALTH:-}" ]; then
    wait_for_health "$HEALTHCHECK_URL"
  fi
fi

echo "=== Deployment trigger routine complete ==="

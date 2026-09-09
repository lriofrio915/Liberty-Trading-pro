#!/bin/bash
# Cron VPS: dispara el morning scan de Liberty Trading Pro.
# Llama a /api/cron/morning-scan en Vercel (9am ET, lun-vie).
#
# Cron sugerido (/etc/cron.d/liberty-trading):
#   0 14 * * 1-5 root bash /var/www/liberty-trading-new/scripts/morning-scan-cron.sh >> /var/log/liberty-crons.log 2>&1
#
# (14:00 UTC = 9:00am ET / 8:00am Ecuador UTC-5, ajusta según horario de verano)

set -o pipefail

SECRET_FILE="/root/.liberty-cron-secret"
APP_URL="https://www.libertytrading.pro"

if [[ ! -f "$SECRET_FILE" ]]; then
  echo "$(date -u '+%F %T') morning-scan ERROR: falta $SECRET_FILE"
  exit 1
fi
SECRET=$(tr -d '[:space:]' < "$SECRET_FILE")

RESPONSE=$(curl -sSL --max-time 120 -X GET \
  -H "Authorization: Bearer $SECRET" \
  -w '\n%{http_code}' \
  "${APP_URL}/api/cron/morning-scan")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "$(date -u '+%F %T') morning-scan [HTTP ${HTTP_CODE}] ${BODY}"
[[ "$HTTP_CODE" == "200" ]] || exit 1

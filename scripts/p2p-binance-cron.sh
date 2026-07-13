#!/bin/bash
# Cron VPS: fetch de ofertas P2P Binance USDT/USD (Ecuador) y POST al route
# /api/cron/p2p-binance en producción (Vercel). El fetch se hace aquí porque
# Binance está bloqueado desde Vercel serverless.
#
# Cron sugerido (/etc/cron.d/liberty-trading):
#   */15 * * * * root bash /var/www/liberty-trading-new/scripts/p2p-binance-cron.sh >> /var/log/liberty-crons.log 2>&1

set -o pipefail

SECRET_FILE="/root/.liberty-cron-secret"
APP_URL="https://www.libertytrading.pro"
P2P_API="https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"
PAY_TYPES='["Produbanco","BancoGuayaquil"]'

if [[ ! -f "$SECRET_FILE" ]]; then
  echo "$(date -u '+%F %T') p2p-binance ERROR: falta $SECRET_FILE"
  exit 1
fi
SECRET=$(tr -d '[:space:]' < "$SECRET_FILE")

fetch_side() {
  local trade_type="$1"
  curl -s --max-time 20 -X POST "$P2P_API" \
    -H 'Content-Type: application/json' \
    -d "{\"asset\":\"USDT\",\"fiat\":\"USD\",\"tradeType\":\"${trade_type}\",\"page\":1,\"rows\":10,\"payTypes\":${PAY_TYPES},\"countries\":[\"EC\"]}" \
    | jq '.data // []'
}

BUY=$(fetch_side BUY)
SELL=$(fetch_side SELL)

if [[ -z "$BUY" || -z "$SELL" || "$BUY" == "[]" || "$SELL" == "[]" ]]; then
  echo "$(date -u '+%F %T') p2p-binance ERROR: fetch Binance vacío (buy=${#BUY}b sell=${#SELL}b)"
  exit 1
fi

RESPONSE=$(jq -n --argjson buy "$BUY" --argjson sell "$SELL" '{buy: $buy, sell: $sell}' \
  | curl -sSL --max-time 60 -X POST \
      -H "Authorization: Bearer $SECRET" \
      -H 'Content-Type: application/json' \
      -d @- \
      -w '\n%{http_code}' \
      "${APP_URL}/api/cron/p2p-binance")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "$(date -u '+%F %T') p2p-binance [HTTP ${HTTP_CODE}] ${BODY}"
[[ "$HTTP_CODE" == "200" ]] || exit 1

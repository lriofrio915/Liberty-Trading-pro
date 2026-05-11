# Liberty Brokers Service

Python FastAPI microservice for direct broker execution — MT5 (via EA bridge + cloudflared tunnel) and IBKR (via ib_insync + TWS/Gateway).

## Setup

```bash
cp .env.example .env
# Fill in DATABASE_URL, LIBERTY_INTERNAL_TOKEN, ENCRYPTION_KEY, VERCEL_URL

# Generate ENCRYPTION_KEY:
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

## Deploy to Fly.io

```bash
fly auth login
fly launch --name liberty-brokers --region iad --no-deploy
fly secrets set \
  DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" \
  LIBERTY_INTERNAL_TOKEN="$(python -c 'import uuid; print(uuid.uuid4())')" \
  ENCRYPTION_KEY="$(python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())')" \
  VERCEL_URL="https://your-liberty-app.vercel.app" \
  NODE_BACKEND_URL="https://your-liberty-app.vercel.app"
fly deploy
fly logs
```

## Authentication

Every request from Next.js must include:
```
X-Liberty-Token: <LIBERTY_INTERNAL_TOKEN>
```

Requests without this header receive 401.

## MT5 EA Bridge

The MT5 EA (DevRico003/mt5-rest-api) runs inside MetaTrader 5 and exposes a REST API on `localhost:6542`. Users tunnel it publicly via:

```bash
cloudflared tunnel --url http://localhost:6542
```

The generated `https://*.trycloudflare.com` URL is saved as `mt5TunnelUrl`.

## Rate Limiting

Order endpoints: 10 orders/minute per IP. Users who exceed this receive HTTP 429.

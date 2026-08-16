# Vibe Agent (sección dashboard)

UI Next.js que consume **Vibe-Trading** (https://github.com/HKUDS/Vibe-Trading) — un agente Python/FastAPI con 71 skills financieros, 29 swarm presets y export a TradingView/NinjaTrader 8.

**No reescribe nada en TypeScript.** Solo proxy + UI. El motor sigue siendo el FastAPI Python.

## Arquitectura

```
Browser ──► /api/trading/vibe/*  (proxy + auth Supabase)  ──► FastAPI :8899
                                                              (Vibe-Trading)
```

### Archivos

| Path | Rol |
|---|---|
| `lib/vibe-trading.ts` | Cliente helper (`vibeJSON`, `vibeSSEProxy`) |
| `app/api/trading/vibe/sessions/route.ts` | POST → crea sesión |
| `app/api/trading/vibe/sessions/[id]/messages/route.ts` | POST → enviar mensaje |
| `app/api/trading/vibe/sessions/[id]/stream/route.ts` | GET (SSE) → eventos del agente |
| `app/api/trading/vibe/swarm/route.ts` | GET presets · POST run |
| `app/api/trading/vibe/swarm/runs/[id]/stream/route.ts` | GET (SSE) → eventos swarm |
| `app/dashboard/vibe/page.tsx` | Server component (auth + plan gate Club) |
| `app/dashboard/vibe/VibeClient.tsx` | UI: chat, swarm, streaming SSE |

Todas las rutas validan sesión Supabase y la página redirige a `/dashboard/upgrade` si el usuario no tiene plan Club (excepto admin).

## Variables de entorno

Añadir a `.env.local`:

```bash
VIBE_TRADING_BASE_URL=http://localhost:8899
# opcional: solo si activas auth Bearer en el FastAPI
VIBE_TRADING_API_KEY=
```

En producción Vercel: el FastAPI **no corre en Vercel** (long-running + SSE). Hostearlo en Fly.io / Railway / VPS y apuntar `VIBE_TRADING_BASE_URL` al dominio público (ej. `https://vibe.tu-dominio.com`).

## Levantar el backend

### Opción A — Docker (recomendado)

```bash
git clone https://github.com/HKUDS/Vibe-Trading.git
cd Vibe-Trading
cp agent/.env.example agent/.env
# editar agent/.env: descomentar OPENROUTER_API_KEY y pegar la misma de Liberty
docker compose up --build
```

API queda en `http://localhost:8899`.

### Opción B — pip

```bash
pip install vibe-trading-ai
vibe-trading serve --port 8899
```

## Verificación

1. `curl http://localhost:8899/swarm/presets` → JSON con presets.
2. `npm run dev` en Liberty-Trading-pro.
3. Login → ir a `/dashboard/vibe`.
4. Mandar un mensaje → ver tokens en streaming.
5. Tab **SWARM** → elegir preset → ejecutar → ver SSE.

## Notas

- Si el backend no responde, la UI muestra un banner con el comando exacto para levantarlo (no rompe el dashboard).
- El parser de eventos SSE acepta varios formatos del agente (`{type, content}`, `{delta}`, `{text}`, string crudo). Si el upstream cambia, ajustar `attachStream()` en `VibeClient.tsx`.
- No persistimos las conversaciones aún. Si lo necesitas, añadir modelo `VibeTradingRun` a `prisma/schema.prisma` y guardar al recibir `done`.

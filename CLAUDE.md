# Liberty Trading Pro — Contexto del Proyecto

## Qué es esto

Plataforma SaaS de trading con 4 tiers (FREE, CLUB, PRO, PORTFOLIO).
Combina educación, herramientas algorítmicas, comunidad y un AI assistant ("Vinces").
Monetiza vía Hotmart con 4 productos: academia, club, mensual, anual.

## Stack

- **Framework:** Next.js 15 (App Router) con TypeScript
- **Base de datos:** PostgreSQL via Supabase + Prisma ORM
- **Auth:** Supabase SSR
- **AI:** OpenRouter (modelos múltiples) + Groq
- **Pagos:** Hotmart (webhooks en `/api/webhook`)
- **WhatsApp:** Evolution API (bot de leads y soporte)
- **Automatización:** N8N (webhooks de leads y landing)
- **Media:** Cloudinary (avatares, screenshots de trades, certificados)
- **Email:** Resend
- **Charts:** Recharts
- **Mapas:** Leaflet + react-leaflet

## Módulos del Dashboard

| Ruta | Descripción |
|------|-------------|
| `academia` | Contenido educativo (acceso por plan) |
| `algolab` | Lab de trading algorítmico — backtesting + generación MQL5 |
| `analisis` | Análisis de mercado |
| `championship` | Competencia de trading entre usuarios |
| `comunidad` | Posts, likes, comentarios |
| `conocimiento` | Base de conocimiento |
| `leads` | CRM interno (solo admin) |
| `monitor` | Monitor de mercado (iframe de worldmonitor.app) |
| `oportunidades` | Señales de trading |
| `planes` | Gestión del plan de trading del usuario |
| `profile` | Perfil, certificados, configuración |
| `reportes` | Reportes semanales y mensuales |
| `retiros` | Historial de retiros de cuenta |
| `track-record` | Historial público de operaciones (`/track-record/[slug]`) |
| `upgrade` | Página de upgrade de plan |
| `vinces` | AI assistant de trading (OpenRouter) |

## Planes de usuario

```
FREE < CLUB < PRO < PORTFOLIO
```

Gestionados en Prisma (`Plan` enum). Hotmart actualiza el plan via webhook.

## Cron Jobs (GitHub Actions)

- `cron-morning-scan` — Escaneo matutino de mercado
- `cron-midday-prices` — Precios al mediodía
- `cron-close-prices` — Precios de cierre
- `cron-bias-monitor` — Monitor de sesgo del mercado

Todos requieren `CRON_SECRET` en el header de la request.

## AlgoLab — Módulo Crítico

El moat técnico del producto. Flujo:
1. Usuario sube dataset de precios (`AlgoDataset`)
2. Crea estrategia con indicadores (`AlgoStrategy`)
3. Ejecuta backtest (`algolab-backtest.ts`) — analiza patrones de velas
4. Ve reporte de patrones (`AlgoPatternReport`)
5. Exporta código MQL5 para MetaTrader 5 (`algolab-mql5.ts`)

El generador MQL5 usa `SL_ATR_Mult` y `TP_ATR_Mult` como parámetros de entrada del EA.

## Variables de Entorno Requeridas

```
DATABASE_URL, DIRECT_URL          # Prisma/Supabase
NEXT_PUBLIC_SUPABASE_URL          # Supabase client
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Supabase client
SUPABASE_SERVICE_ROLE_KEY         # Server-side Supabase
OPENROUTER_API_KEY, OPENROUTER_MODEL  # AI (Vinces)
GROQ_API_KEY                      # AI alternativo
NEXT_PUBLIC_APP_URL               # URL base del app
RESEND_API_KEY                    # Emails
HOTMART_WEBHOOK_TOKEN             # Validación de pagos
HOTMART_LINK_*                    # Links de compra (academia, club, mensual, anual)
CLOUDINARY_*                      # Media uploads
N8N_WEBHOOK_*                     # Automatización
EVOLUTION_API_URL/INSTANCE/KEY    # WhatsApp bot
LUIS_PHONE                        # Notificaciones al admin
CRON_SECRET                       # Autenticación de cron jobs
```

## Comandos Útiles

```bash
npx prisma studio          # UI para ver la base de datos
npx prisma db push         # Aplicar cambios de schema sin migración
npx prisma generate        # Regenerar Prisma client
npx next lint              # ESLint
npx tsc --noEmit           # TypeScript check
npm run dev                # Dev server en puerto 3000
```

## Decisiones de Arquitectura

- **Supabase para auth, Prisma para queries:** No usar el cliente de Supabase para queries de datos, solo para auth y storage
- **Server Components por defecto:** Solo añadir `'use client'` cuando sea necesario (interactividad)
- **No hay tests actualmente:** El backtest engine (`algolab-backtest.ts`) es prioridad para cobertura
- **Track Record público:** `/track-record/[slug]` es intencional — sirve como marketing

## Skill Routing

Cuando el usuario pida algo que corresponda a un skill disponible, invoca el skill antes de responder directamente.

Reglas clave:
- Bugs, errores, 500s → `/investigate`
- Deploy, push, PR → `/ship`
- QA, probar el sitio → `/qa`
- Review de código → `/review`
- Health check, calidad → `/health`
- Diseño, UI/UX → `/design-review`
- Arquitectura → `/plan-eng-review`

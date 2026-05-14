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
- `cron-followup` — Follow-up automático via WhatsApp a leads en estado CTA (3 etapas: 6h, 24h, 72h)

Todos requieren `CRON_SECRET` en el header de la request.

## Páginas Públicas

| Ruta | Descripción |
|------|-------------|
| `/p/[id]` | Vista pública de un post de comunidad (compartir en redes) |
| `/p2p` | Landing de servicio P2P compra/venta USDT con Luis (CTA WhatsApp) |
| `/maestria-futuros` | Landing del producto "Maestría en Futuros" (Hotmart anual) |
| `/mentoria-integral` | Landing del producto "Mentoría Integral" (Hotmart mensual) |
| `/unirse` | Landing principal de captación de leads con formulario y Vinces widget |
| `/track-record/[slug]` | Track record público de un trader (marketing) |
| `/video-semana/[id]` | Video semanal público con análisis en vivo |

## APIs Notables

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/benchmark` | Series históricas de S&P 500 y NASDAQ normalizadas. Params: `desde`, `hasta`. Cache 1h. |
| `POST /api/webhook/hotmart` | Recibe eventos de pago Hotmart y actualiza el plan del usuario |
| `POST /api/vinces-wa` | Webhook del bot WhatsApp de Vinces (responde preguntas de leads) |

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

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health

## Regla Graphify (lectura obligatoria antes de buscar)

Antes de hacer Glob, Grep o Read sobre múltiples archivos, primero:

1. Verifica que `graphify-out/GRAPH_REPORT.md` exista. Si no, sugiéreme correr `/graphify .` y espera mi confirmación.
2. Si existe, léelo primero. Identifica si la respuesta a mi pregunta ya está ahí (god nodes, comunidades, suggested questions).
3. Si la pregunta es sobre relaciones entre módulos, usa `/graphify query "..."` antes de abrir archivos.
4. Si es sobre cómo se conectan dos cosas, usa `/graphify path "NodeA" "NodeB"`.
5. Solo después, si el grafo no responde, abre archivos.

Esta regla aplica salvo que yo te diga explícitamente "ignora el grafo" o "abre directo el archivo X".

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

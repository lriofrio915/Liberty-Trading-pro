# 04 · Design tokens

Los valores exactos que consume el código. La fuente de verdad en runtime es
`app/globals.css`; este documento explica qué significa cada uno.

## Cómo están conectados

```
app/globals.css :root          →  define las CSS custom properties
app/globals.css html.light     →  las sobrescribe para modo claro
tailwind.config.ts             →  las expone como utilidades de Tailwind
```

Cambiar un color en `globals.css` actualiza los tres consumidores y respeta el modo
claro automáticamente. **Nunca escribas un hex dentro de un componente.**

## Color

| Token CSS | Utilidad Tailwind | Oscuro (default) | Claro | Rol |
|---|---|---|---|---|
| `--gold` | `gold` | `#C9A84C` | `#C9A84C` | Acento primario |
| `--gold-light` | `gold-light` | `#E8C96A` | `#E8C96A` | Alto del degradado, hover |
| `--gold-dark` | `gold-dark` | `#9A7A30` | `#9A7A30` | Bajo del degradado, bordes |
| `--bg-primary` | `ink` | `#080808` | `#f5f2eb` | Fondo base |
| `--bg-secondary` | `surface` | `#0d0d0d` | `#edeae1` | Sección alterna |
| `--bg-card` / `--panel` | `panel` | `#111111` | `#ffffff` | Tarjetas y paneles |
| `--bg-hover` | `hover` | `#1a1a1a` | `#e4e0d6` | Estados interactivos |
| `--border` | `line` | `#1e1e1e` | `#d8d3c8` | Separadores |
| `--text-primary` | `ink1` | `#f0ece4` | `#1a1612` | Titulares, texto principal |
| `--text-secondary` | `ink2` | `#8a8480` | `#6b6460` | Texto de apoyo |
| `--text-muted` | `ink3` | `#4a4642` | `#9a9490` | Labels y metadatos |
| `--green` | `profit` | `#00C896` | `#00966e` | P&L positivo |
| `--red` | `loss` | `#FF4444` | `#d93535` | P&L negativo |

Los tres tonos de oro no cambian entre modos: son la constante de la marca.

**Modo claro:** existe pero solo está montado en el dashboard
(`app/dashboard/layout.tsx` monta `ThemeProvider`). Las páginas públicas son siempre
oscuras. Es intencional: la landing es una pieza de marca, no una interfaz de trabajo.

## Tipografía

| Token | Fuente | Se carga en |
|---|---|---|
| `--font-serif` | Cormorant Garamond (300-700, normal + italic) | `app/layout.tsx` |
| `--font-mono` | DM Mono (300/400/500) | `app/layout.tsx` |
| `--font-sans` | Syne | `app/layout.tsx` |

Todas vía `next/font/google` con `display: 'swap'`. Utilidades Tailwind:
`font-serif`, `font-mono`, `font-sans`.

### Clases compuestas

Definidas en `app/globals.css`, son la manera correcta de aplicar la tipografía:

| Clase | Qué hace |
|---|---|
| `.headline` | Cormorant italic 300, tracking -0.02em, line-height 1.05, text-wrap balance |
| `.label-mono` | DM Mono 0.7rem, mayúsculas, tracking 0.15em, color terciario, tabular-nums |
| `.gradient-gold` | Degradado de marca 135° aplicado sobre el texto vía background-clip |
| `.font-mono-custom` | Solo la familia mono, sin los demás atributos de `.label-mono` |

## Componentes

| Clase | Descripción |
|---|---|
| `.card` | Panel, borde 1px, radio 12px, padding 1.5rem, transición de borde 200ms |
| `.card-gold` | Igual pero con borde `--gold-dark` |
| `.card-panel` | Radio 16px, padding 2rem — para bloques grandes |
| `.track-panel` | Radio 16px con líneas horizontales de fondo cada 32px |
| `.btn-gold` | Degradado oro, texto negro, DM Mono 0.8rem, hover eleva -1px + glow |
| `.btn-outline` | Transparente, borde oro al 40%, texto oro |
| `.input` | Fondo superficie, borde 1px, radio 8px, foco en oro |

## Espaciado

| Contexto | Valor |
|---|---|
| Entre secciones | `py-20` (5rem) |
| Padding lateral | `px-4` móvil, `px-6` desde `sm` |
| Contenedor de contenido | `max-w-6xl` (1152px) |
| Contenedor de navbar/footer | `max-w-7xl` (1280px) |
| Separación de rejilla | `gap-5` tarjetas, `gap-12` bloques grandes |

## Radios

| Elemento | Radio |
|---|---|
| Tarjeta | 12px |
| Panel | 16px |
| Botón | 6-8px |
| Píldora / badge | 999px |
| Foto (marco) | 16px |

## Efectos

| Clase | Definición |
|---|---|
| `.noise` | Ruido SVG fractal inline, opacidad 4%, capa fija, `z-index: 0` |
| `.grid-bg` | Rejilla dorada al 4%, celdas de 64px |
| `.glow-gold` | `0 0 40px rgba(201,168,76,0.15)` |
| `.glow-gold-sm` | `0 0 20px rgba(201,168,76,0.1)` |
| `.pulse-dot` | Pulso de 2s — solo para indicadores en vivo |
| `.fade-up` | Entrada de 600ms al hacer scroll |

## Datos de marca — `lib/brand.ts`

No son tokens visuales, pero siguen la misma lógica de fuente única.

| Export | Contenido |
|---|---|
| `BRAND.name` / `.role` / `.tagline` | Identidad |
| `BRAND.products` | Los cuatro nombres Liberty |
| `BRAND.legalName` | "Liberty Trading Club" — solo para contexto legal |
| `BRAND.phone` / `.phoneDisplay` / `.email` | Contacto |
| `BRAND.social` | Handles y URLs |
| `BRAND.hotmart` | Links de checkout, con fallback por entorno |
| `BRAND.price` | Precio mensual, fee de éxito, mínimo de portfolio |
| `BRAND.photos` | Rutas de las fotos — hoy placeholders |
| `SERVICES` | Los cuatro servicios con copy, bullets y CTA |
| `RISK_DISCLAIMER` | Texto legal obligatorio |
| `wa(mensaje)` | Constructor de links de WhatsApp |

Al recibir las fotos reales solo hay que cambiar `BRAND.photos`. Ningún componente
apunta a una ruta de imagen directamente.

## Variables de entorno relacionadas

| Variable | Efecto |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Base de `metadataBase` y de las URLs canónicas |
| `NEXT_PUBLIC_HOTMART_LINK_MENSUAL` | CTA de Liberty Club |
| `NEXT_PUBLIC_HOTMART_LINK_BOTS` | CTA de Liberty Algo. **Si está vacío, cae a WhatsApp** |

Ese fallback es intencional: permite publicar la tarjeta de bots antes de que el
producto exista en Hotmart, sin dejar un botón roto.

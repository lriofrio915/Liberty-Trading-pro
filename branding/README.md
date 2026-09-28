# Identidad de marca — Luis Riofrio

Esta carpeta es la fuente de verdad de la marca. Si algo que se publica
(landing, post, mensaje de WhatsApp, PDF, anuncio) contradice lo que dice aquí,
lo que está mal es la publicación.

## Índice

| Documento | Qué resuelve |
|---|---|
| [01-estrategia.md](01-estrategia.md) | Quién eres, para quién, contra quién y por qué te elegirían |
| [02-identidad-verbal.md](02-identidad-verbal.md) | Cómo hablas: nombres, tono, mensajes, qué no decir |
| [03-identidad-visual.md](03-identidad-visual.md) | Cómo te ves: logo, color, tipografía, layout, foto |
| [04-design-tokens.md](04-design-tokens.md) | Los valores exactos que usa el código |
| [05-guia-fotografia.md](05-guia-fotografia.md) | Qué fotos necesitas y cómo conseguirlas |
| [06-aplicaciones.md](06-aplicaciones.md) | Cómo se aplica todo lo anterior en cada canal |
| [07-legal-y-disclaimers.md](07-legal-y-disclaimers.md) | Qué puedes decir y qué te expone legalmente |

## Assets

| Archivo | Uso |
|---|---|
| `assets/logo-wordmark.svg` | Logo principal — web, presentaciones, documentos |
| `assets/logo-monograma.svg` | LR en caja — favicon, avatar, sello |
| `assets/logo-liberty.svg` | Lockup secundario para los productos Liberty |
| `assets/liberty-trading-club/` | Sistema de logos de Liberty Trading Club: isotipo, logotipo, horizontal y con respaldo, en 5 variantes de color (SVG con texto en trazos + `png/` al doble) |
| `assets/liberty-trading-club/piezas/` | Piezas listas: post y portada de reel, historia, portadas de FB, avatar, tarjeta, certificado, portada de Hotmart |
| `manual/Manual-de-marca-Liberty-Trading-Club.pdf` | Manual de marca del Club (20 páginas) |

Para regenerar: `python branding/manual/src/logos.py` (logos), `python branding/manual/src/render.py` (PNGs y piezas),
y el PDF imprimiendo `branding/manual/src/manual.html` con Chrome headless (`--print-to-pdf`).

El favicon activo del sitio es `app/icon.svg` (misma pieza que el monograma,
con tipografía del sistema para que no dependa de una fuente descargada).

## Cómo se conecta con el código

```
branding/04-design-tokens.md   ← documentación
        │
app/globals.css :root          ← fuente de verdad en runtime (CSS custom properties)
        │
tailwind.config.ts             ← expone los tokens como utilidades (text-gold, bg-panel)
        │
lib/brand.ts                   ← datos de marca: nombre, teléfono, links, fotos, servicios
```

Reglas prácticas:

- **Un color nuevo se define en `app/globals.css`**, nunca hardcodeado en un componente.
- **Un dato de marca nuevo (teléfono, link de pago, red social) va en `lib/brand.ts`.**
  Si lo escribes literal dentro de un componente, en seis meses habrá dos versiones distintas.
- **Una foto nueva se registra en `BRAND.photos`.** Los componentes nunca apuntan a una ruta directa.

## Estado actual

- [x] Arquitectura de marca definida
- [x] Sistema visual documentado
- [x] Logo y favicon
- [x] `lib/brand.ts` como fuente única
- [x] Tokens expuestos en Tailwind
- [x] OG image de la home
- [ ] **Fotos reales de Luis**: la web sigue con placeholders; sesión profesional pendiente. Ver [05-guia-fotografia.md](05-guia-fotografia.md)
- [ ] Producto de $1,500 en Hotmart y `NEXT_PUBLIC_HOTMART_LINK_QUANT`
- [ ] Decidir si la página de FB "Luis Riofrío Trader Cuantitativo" nombra al empleador. Ver [07-legal-y-disclaimers.md](07-legal-y-disclaimers.md)
- [ ] Revisión legal del encuadre de Liberty Portfolio. Ver [07-legal-y-disclaimers.md](07-legal-y-disclaimers.md)

## Deuda técnica conocida

No bloquea nada, pero conviene resolverlo antes de que crezca:

1. **21 archivos con `#C9A84C` literal**, sobre todo en el dashboard.
   Deberían ser `var(--gold)` o `text-gold`. Migración mecánica, sin riesgo.
2. **`/unirse` está fuera del sistema visual**: hex hardcodeados, Georgia en vez de
   Cormorant, sin Navbar/Footer compartidos. Es la página que reciben todos los
   reels, así que es la siguiente en importancia.

Resuelto el 2026-09-28: el typo "Club Liberty Trading Club", la marca inexistente
"Liberty Trading Pro" (kyc, unirse, leads), las landings duplicadas (ya no existen),
y `app/api/upload/document/route.ts`, que ahora exige sesión igual que `app/api/upload`.

# 06 · Aplicaciones

Cómo se aplica la marca en cada canal.

## Web — landing principal (`/`)

Estructura de cinco secciones. Se rediseñó desde siete porque el visitante abandonaba
antes de llegar al precio.

| # | Sección | Función | Archivo |
|---|---|---|---|
| 1 | Hero | Quién eres + foto + 3 KPIs en vivo + 2 CTAs | `components/Hero/Hero.tsx` |
| 2 | Servicios | Las cuatro tarjetas, cada una con su CTA | `app/page.tsx` |
| 3 | Prueba | Foto + credenciales + cita + track record en vivo | `app/page.tsx` |
| 4 | Precio | Plan mensual + bloque Liberty Portfolio | `components/Pricing/Pricing.tsx` |
| 5 | Cierre | FAQ (3) + CTA a WhatsApp + disclaimer | `app/page.tsx` |

**Regla de copy:** ninguna sección supera dos frases de texto corrido. Lo demás son
bullets de una línea o datos.

**Objetivo de longitud:** la página completa debe caber en unas cuatro pantallas de
1080px. Si crece más, hay que recortar, no comprimir la tipografía.

**Punto de verdad de la página:** el bloque de track record. Todo lo anterior sirve
para llevar al visitante hasta ahí; todo lo posterior asume que ya lo vio.

## Web — otras páginas públicas

| Ruta | Estado |
|---|---|
| `/p2p` | Coherente con el sistema. Destino del CTA de Liberty Exchange |
| `/track-record/[slug]` | Coherente. Es la prueba pública |
| `/unirse` | **Fuera del sistema visual** — hex hardcodeados, Georgia en vez de Cormorant, sin Navbar/Footer compartidos |
| `/maestria-futuros` | Coherente pero duplicado con `/mentoria-integral` |
| `/mentoria-integral` | Coherente pero duplicado con `/maestria-futuros` |

Las tres últimas quedan fuera de este trabajo. Ver la deuda técnica en
[README.md](README.md).

## Compartir en redes (Open Graph)

Al pegar un link del sitio en WhatsApp, Facebook o X aparece una tarjeta con imagen.
Antes no había ninguna: los links salían sin preview, que en un negocio cuyo canal
principal es WhatsApp es una pérdida directa de clics.

| Página | Imagen |
|---|---|
| Home `/` | `app/opengraph-image.tsx` — generada, 1200×630 |
| Post de comunidad | `app/p/[id]/opengraph-image.tsx` |
| Track record | `app/track-record/[slug]/opengraph-image.tsx` |
| Video semanal | `app/video-semana/[id]/opengraph-image.tsx` |

Las cuatro comparten el mismo lenguaje: fondo `#080808`, acento oro, tipografía serif
para el nombre y monoespaciada para los datos.

`metadataBase` está definido en `app/layout.tsx` a partir de `BRAND.url`, así que las
rutas relativas de OG resuelven correctamente en todos los entornos.

## WhatsApp

Es tu canal de cierre. Todo lo que se envía por aquí es marca.

**Foto de perfil:** la foto 05 (avatar), recorte circular.
**Nombre:** `Luis Riofrio` — no el nombre del negocio.
**Descripción:** `Asesor de Inversiones · Ecuador`

**Links de la landing:** todos los CTA de WhatsApp llevan mensaje precargado
específico del servicio, generado con `wa()` de `lib/brand.ts`. Esto te dice qué
tarjeta de la landing convirtió sin necesidad de preguntarlo.

```ts
wa('Hola Luis, me interesa el servicio de intercambio cripto USDT/USD')
```

Plantillas de respuesta en [02-identidad-verbal.md](02-identidad-verbal.md).

**Emojis:** aquí sí. WhatsApp es su terreno natural. En la web, no.

## Hotmart

Es donde se cobra, así que la coherencia importa aunque no controles el diseño de la
plataforma.

| Campo | Valor |
|---|---|
| Nombre del productor | Luis Riofrio |
| Nombre del producto (mensual) | Liberty Club — Educación en Trading |
| Imagen de portada | Foto 04 (OG) con el wordmark superpuesto |
| Avatar | Monograma LR o foto 05 |
| Descripción | Mensajes clave 1, 2 y 4 de la identidad verbal |

**Pendiente:** crear el producto de Liberty Algo y pegar su link en
`NEXT_PUBLIC_HOTMART_LINK_BOTS`. Mientras esté vacío, el CTA de la tarjeta de bots
cae automáticamente a WhatsApp — no queda roto, pero tampoco cobra solo.

## Email

Remitentes en uso: `soporte@libertytrading.pro` y `noreply@libertytrading.pro`.

**Firma:**
```
Luis Riofrio
Asesor de Inversiones
+593 99 669 1586 · libertytrading.pro
```

Sin logo en la firma, sin frase motivacional, sin aviso de "piense en el
medioambiente antes de imprimir".

## Presentaciones y PDF

- Fondo `#080808`, texto `#f0ece4`.
- Titulares en Cormorant italic, datos en DM Mono.
- Un solo acento dorado por diapositiva.
- Wordmark abajo a la izquierda, pequeño.
- Cualquier diapositiva con cifras de rendimiento lleva el disclaimer de riesgo al
  pie. Sin excepción.

## Redes sociales

**Handles:** `@libertytradingclub` en Instagram y Facebook. Se mantienen pese a no
coincidir con la nueva marca personal — cambiarlos costaría más audiencia de la que
gana en coherencia. El nombre visible del perfil sí debe ser `Luis Riofrio`.

**Formato de post:**
1. Dato o afirmación incómoda en la primera línea.
2. Contexto en dos o tres líneas.
3. Qué hacer con eso.

**Publica una operación perdedora al menos una vez al mes.** Es lo más eficiente que
puedes hacer por la marca: nadie que esté inflando resultados lo hace.

## Checklist antes de publicar cualquier pieza

- [ ] ¿El nombre está bien escrito? (Luis Riofrio · Liberty Club, no "Liberty Trading Club Club")
- [ ] ¿Hay alguna promesa de rentabilidad, explícita o insinuada?
- [ ] Si muestra resultados, ¿lleva el disclaimer?
- [ ] ¿Los titulares tienen menos de 6 palabras y ningún signo de exclamación?
- [ ] ¿Algún bloque supera dos frases?
- [ ] ¿El dorado aparece como acento o como decoración? (debe ser lo primero)
- [ ] ¿Podría decir esto un vendedor que no opera? Si sí, reescribir.

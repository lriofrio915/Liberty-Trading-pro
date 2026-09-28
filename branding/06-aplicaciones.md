# 06 · Aplicaciones

Cómo se aplica la marca en cada canal.

## Web — landing principal (`/`)

La home vende un solo producto: **Liberty Trading Club** ($1,500, pago único). Es
`components/QuantLanding/QuantLanding.tsx`; `/liberty-quant` muestra la misma landing.
Exchange y Portfolio no están en la home: se llega por `/p2p` y por WhatsApp.

Mientras `NEXT_PUBLIC_HOTMART_LINK_QUANT` esté vacío, el CTA de compra cae a
WhatsApp con mensaje precargado.

**Regla de copy:** ninguna sección supera dos frases de texto corrido. Lo demás son
bullets de una línea o datos.

**Punto de verdad de la página:** el bloque de track record y el histórico del
portafolio. Todo lo anterior sirve para llevar al visitante hasta ahí.

## Web — otras páginas públicas

| Ruta | Estado |
|---|---|
| `/unirse` | Curso gratis, imán de leads. **Fuera del sistema visual**: hex hardcodeados, Georgia en vez de Cormorant, sin Navbar/Footer compartidos |
| `/p2p` | Coherente con el sistema. Destino del CTA de Liberty Exchange |
| `/track-record/[slug]` | Coherente. Es la prueba pública |
| `/p/[id]` | Post público de la comunidad |

## Compartir en redes (Open Graph)

Al pegar un link del sitio en WhatsApp, Facebook o X aparece una tarjeta con imagen.
Antes no había ninguna: los links salían sin preview, que en un negocio cuyo canal
principal es WhatsApp es una pérdida directa de clics.

| Página | Imagen |
|---|---|
| Home `/` | `app/opengraph-image.tsx` — generada, 1200×630 |
| Post de comunidad | `app/p/[id]/opengraph-image.tsx` |
| Track record | `app/track-record/[slug]/opengraph-image.tsx` |

Las tres comparten el mismo lenguaje: fondo `#080808`, acento oro, tipografía serif
para el nombre y monoespaciada para los datos.

`metadataBase` está definido en `app/layout.tsx` a partir de `BRAND.url`, así que las
rutas relativas de OG resuelven correctamente en todos los entornos.

## WhatsApp

Es tu canal de cierre. Todo lo que se envía por aquí es marca.

**Foto de perfil:** la foto 05 (avatar), recorte circular.
**Nombre:** `Luis Riofrio` — no el nombre del negocio.
**Descripción:** `Trader Cuantitativo · Ecuador`

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
| Nombre del producto | Liberty Trading Club |
| Precio | $1,500, pago único |
| Imagen de portada | Foto 04 (OG) con el wordmark superpuesto |
| Avatar | Monograma LR o foto 05 |
| Descripción | Mensajes clave 1, 2 y 4 de la identidad verbal |

**Pendiente:** crear el producto de $1,500 y pegar su link en
`NEXT_PUBLIC_HOTMART_LINK_QUANT` (Vercel). Mientras esté vacío, el CTA cae a
WhatsApp: no queda roto, pero tampoco cobra solo.

Los productos mensual y anual antiguos están retirados. `BRAND.hotmart.mensual`
se conserva solo por el webhook histórico.

## Email

Remitentes en uso: `soporte@libertytrading.pro` y `noreply@libertytrading.pro`.

**Firma:**
```
Luis Riofrio
Trader Cuantitativo
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

| Cuenta | Uso | Nombre visible |
|---|---|---|
| FB página `facebook.com/luisriofrio.trader` | Marca profesional: reels, posts de trading, CTA al curso gratis | Luis Riofrío Trader Cuantitativo |
| IG `@luisriofrioec` | Marca personal: reels y trading | Luis Riofrio |
| FB página Liberty Trading Club + IG `@liberty_trading_club` | Cuentas del producto | Liberty Trading Club |
| Perfil personal de FB (Luis Riofrio Lopez) | Personal; lo de trading se redirige a la página | — |

Los handles del producto (`@liberty_trading_club`) se mantienen aunque no coincidan
con la marca personal: cambiarlos costaría más audiencia de la que gana en coherencia.

**Empleador:** puede aparecer en IG personal y en el perfil personal de FB, nunca en
las cuentas del producto. Ver [07-legal-y-disclaimers.md](07-legal-y-disclaimers.md).

**CTA de todo el contenido orgánico:** el curso gratis en `libertytrading.pro/unirse`.

**Formato de post:**
1. Dato o afirmación incómoda en la primera línea.
2. Contexto en dos o tres líneas.
3. Qué hacer con eso.

**Reels:** vertical 9:16, subtítulos quemados, primera frase en los primeros 3
segundos, cierre con el curso gratis. Si muestran cifras, el caption lleva el
disclaimer corto de track record.

**Publica una operación perdedora al menos una vez al mes.** Es lo más eficiente que
puedes hacer por la marca: nadie que esté inflando resultados lo hace.

## Checklist antes de publicar cualquier pieza

- [ ] ¿El nombre está bien escrito? (Luis Riofrio · Liberty Trading Club, no "Liberty Club" ni "Liberty Trading Pro")
- [ ] ¿Hay alguna promesa de rentabilidad, explícita o insinuada?
- [ ] Si muestra resultados, ¿lleva el disclaimer?
- [ ] ¿Los titulares tienen menos de 6 palabras y ningún signo de exclamación?
- [ ] ¿Algún bloque supera dos frases?
- [ ] ¿El dorado aparece como acento o como decoración? (debe ser lo primero)
- [ ] ¿Podría decir esto un vendedor que no opera? Si sí, reescribir.

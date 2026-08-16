# 05 · Guía de fotografía

## Estado actual

**No hay fotos reales.** Todas las posiciones de la web usan placeholders SVG en
`public/brand/placeholders/`, que muestran una silueta con la etiqueta
`FOTO PENDIENTE` y la proporción correcta.

Se eligió un placeholder evidente en vez de una foto de stock a propósito: una foto
de otra persona puesta donde va la tuya puede llegar a producción sin que nadie lo
note. Un cartel que dice "foto pendiente" no.

**Para reemplazarlos:** sube las fotos y cambia las rutas en `BRAND.photos`
(`lib/brand.ts`). Los componentes no tocan rutas de imagen directamente, así que un
solo archivo se edita.

```ts
photos: {
  hero:     '/brand/luis-hero.webp',      // o una URL de Cloudinary
  portrait: '/brand/luis-retrato.webp',
  desk:     '/brand/luis-escritorio.webp',
  og:       '/brand/luis-og.webp',
  avatar:   '/brand/luis-avatar.webp',
}
```

Cloudinary ya está autorizado en `next.config.mjs`, así que una URL de
`res.cloudinary.com` funciona igual de bien que un archivo local.

## Dirección visual

**Retrato editorial de bajo perfil.** Fondo casi negro, luz cálida lateral, mirada
directa, sin sonrisa de catálogo.

Lo que debe transmitir: *esta persona sabe lo que hace y no necesita demostrártelo.*

Lo que debe evitar a toda costa: la estética de gurú financiero. Nada de relojes en
primer plano, coches, fajos de billetes, brazos cruzados, pulgares arriba, ni ese
gesto de señalar a cámara. Cada uno de esos elementos te acerca visualmente a la
competencia de la que te quieres diferenciar.

## Las fotos que necesitas

| # | Uso en la web | Proporción | Mínimo | Prioridad |
|---|---|---|---|---|
| 01 | Hero de la landing | 4:5 vertical | 1200×1500 | **Crítica** |
| 02 | Sección "Quién está detrás" | 1:1 | 1000×1000 | **Crítica** |
| 03 | Contexto de trabajo | 3:2 horizontal | 1800×1200 | Media |
| 04 | Compartir en redes / OG | 1.91:1 | 1200×630 | Alta |
| 05 | Avatar (navbar, WhatsApp, Hotmart) | 1:1 | 800×800 | Alta |
| 06 | Liberty Exchange (opcional) | 4:5 vertical | 1200×1500 | Baja |

Con la 01, la 02 y la 05 la web ya funciona completa. Las demás mejoran, no
desbloquean.

---

## Prompts de generación

Escritos en inglés: Nano Banana, Midjourney, Flux e Imagen responden notablemente
mejor en inglés que en español, sobre todo en términos de iluminación y óptica.

**Sustituye la descripción física por la tuya real.** Si vas a generar imágenes que
te representen, describe tu edad, tono de piel, corte de pelo y barba con precisión —
si no, tendrás un retrato de otra persona con tu nombre debajo, que es peor que un
placeholder.

### Base común

Pégala al inicio de cada prompt. Es lo que hace que las seis fotos parezcan de la
misma sesión.

```
Professional editorial portrait of a Latin American man in his late 30s,
short dark hair, well-groomed short beard, confident and calm expression.
Cinematic low-key lighting: warm golden key light from camera left,
subtle cool rim light on the right shoulder separating him from the
background. Deep charcoal-black background (#080808) with soft falloff.
Shot on 85mm f/1.4, shallow depth of field, natural skin texture,
fine film grain. Muted palette: black, charcoal, warm gold accents.
Financial-professional mood — serious, trustworthy, understated wealth.
NOT flashy, NOT luxury-influencer aesthetic.
```

### Negative prompt común

```
cartoon, illustration, 3d render, plastic skin, over-smoothed, HDR,
oversaturated, neon colors, blue corporate lighting, stock-photo smile,
crossed arms, thumbs up, money, cash stacks, sports car, luxury watch
close-up, gold chains, cluttered background, text, watermark, logo,
distorted hands, extra fingers
```

---

### 01 · Hero — 4:5

```
[BASE] Medium shot from mid-chest up, body angled 15 degrees to camera
left, head turned to face the lens directly. Wearing a charcoal merino
crew-neck sweater or an unstructured dark navy blazer over a black shirt,
no tie. Hands out of frame. Large negative space above the head for
layout breathing room. Background completely clean — no props, no
furniture. Aspect ratio 4:5, vertical.
```

Es la foto más importante del sitio. El cuarto inferior se funde con un degradado
hacia el fondo de la página, así que **no pongas nada relevante ahí abajo**.

### 02 · Retrato — 1:1

```
[BASE] Tight portrait, head and upper chest, straight to camera, slight
forward lean conveying attentiveness. Warm gold light more pronounced on
the cheekbone. Subtle catchlight in both eyes. Charcoal shirt, top button
open. Background pure near-black with a faint golden radial glow behind
the shoulder. Aspect ratio 1:1, square.
```

Va junto a tus credenciales y la cita. Más cercana que la del hero: aquí el visitante
ya decidió leerte, quiere ver quién eres.

### 03 · Escritorio — 3:2

```
[BASE] Environmental portrait: the man seated at a dark wooden desk in a
dimly lit home office at night, three-quarter view, looking at two
ultrawide monitors that glow with abstract out-of-focus candlestick
charts in amber and dark green — chart details deliberately blurred and
unreadable. A closed notebook and a black ceramic coffee cup on the desk.
Warm desk lamp as practical light source in frame. Deep shadows,
window blinds barely visible in the far background. Aspect ratio 3:2,
horizontal, wide framing with the subject on the right third.
```

Los gráficos van desenfocados a propósito: unos números legibles en una foto
promocional invitan a que alguien los compare con tu track record real.

### 04 · OG / redes — 1.91:1

```
[BASE] Wide cinematic composition, subject positioned in the RIGHT third
of the frame, medium shot, arms relaxed at sides, calm direct gaze.
The entire LEFT two thirds is empty dark negative space with a soft
golden gradient falloff — intentionally reserved for overlaid typography.
Aspect ratio 1.91:1, horizontal banner.
```

Los dos tercios vacíos de la izquierda no son un descuido: ahí va el texto que se
superpone al compartir el link.

### 05 · Avatar — 1:1

```
[BASE] Close headshot, head and shoulders only, centered, straight to
camera, warm approachable half-smile with closed lips. Even soft lighting
with a gentle gold key. Solid dark background, no gradient. Composed to
survive a circular crop — leave 12% margin around the head.
Aspect ratio 1:1.
```

Esta es la única donde sí quieres media sonrisa: se va a ver a 40px junto a un
mensaje de WhatsApp, y ahí la seriedad se lee como antipatía.

### 06 · Liberty Exchange (opcional) — 4:5

```
[BASE] Three-quarter profile, subject looking down at a smartphone held
in one hand at chest height, screen glow lighting the face from below in
a soft cool tone that contrasts the warm gold key from the left. Screen
content not visible. Dark background. Conveys focus and discretion, not
excitement. Aspect ratio 4:5, vertical.
```

---

## Si haces sesión con fotógrafo (recomendado)

Una sesión real siempre gana a una generada, y en una marca cuyo argumento central es
la transparencia, usar retratos sintéticos es una contradicción que alguien terminará
señalando. Si generas imágenes con IA, trátalo como una solución temporal.

**Ficha técnica para pasarle al fotógrafo:**

- Fondo: negro o gris carbón liso, sin textura.
- Luz principal: cálida (3200-3800K), lateral a 45°, ligeramente por encima del nivel
  de los ojos.
- Luz de contra: fría y sutil, en el hombro contrario, para separar del fondo.
- Óptica: 85mm o equivalente, f/1.8-2.8.
- Exposición: subexpón medio paso. La marca vive en las sombras; un retrato plano y
  bien iluminado no encaja.
- Entrega: RAW + JPG, sin retoque de piel agresivo. La textura de piel se conserva.

**Vestuario:** dos opciones como máximo. Suéter de cuello redondo en gris carbón, y
blazer azul muy oscuro sin estructura sobre camisa negra. Sin corbata. Evita blanco
puro (rebota luz y rompe la paleta), estampados y logos.

**Lo más importante:** dispara las seis tomas **en la misma sesión, con el mismo
esquema de luz.** Si el hero tiene luz cálida y la foto de la sección de prueba
tiene luz de otro día, la página se ve armada con retazos aunque no sepas explicar
por qué.

**Pide siempre una versión con fondo negro liso** además de la ambientada. Te permite
recortar la silueta sin máscara compleja si algún día cambia el layout.

## Antes de subir

1. Recorta a la proporción exacta de la tabla.
2. Exporta a **WebP, calidad 82**, ancho máximo 1600px. Una foto de hero no debería
   pasar de 200 KB.
3. Sube a `public/brand/` o a Cloudinary.
4. Actualiza `BRAND.photos` en `lib/brand.ts`.
5. Verifica en móvil: el hero recorta la foto, comprueba que tu cara no queda cortada.

El componente `BrandPhoto` detecta si la ruta es un SVG y lo sirve sin optimizar;
en cuanto pongas un WebP o JPG, `next/image` lo optimiza automáticamente. No hay
que cambiar nada más.

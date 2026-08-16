# 03 · Identidad visual

## Concepto

**Terminal financiera con acabado editorial.**

Dos referencias cruzadas: la seriedad tipográfica de una publicación como el
Financial Times, y la densidad de datos de una plataforma de trading. Fondo negro
profundo, oro apagado como único acento, y números en monoespaciada para que los
datos se lean *como datos*.

Lo que evita deliberadamente: el azul corporativo de banca (genérico y frío), el
verde neón de las apps cripto (barato), y el dorado brillante saturado (que es
exactamente la estética de los gurús de los que quieres diferenciarte).

El oro elegido (`#C9A84C`) es apagado, casi latón. Es una decisión importante: el
oro saturado grita, este susurra.

## Logo

No hay símbolo ilustrado. En servicios financieros personales el logotipo
tipográfico transmite más autoridad, y además escala mejor a un favicon de 32px.

### Wordmark principal — `assets/logo-wordmark.svg`

```
        Luis Riofrio          ← Cormorant Garamond italic 300, degradado oro
        ──────────────        ← regla dorada al 55% de opacidad
   ASESOR DE INVERSIONES      ← DM Mono, 7px de tracking, gris #8a8480
```

**Área de respeto:** el alto de la letra "L" por cada lado.
**Tamaño mínimo:** 180px de ancho. Por debajo, usar el monograma.

### Monograma — `assets/logo-monograma.svg`

"LR" en Cormorant italic dentro de una caja negra de esquinas redondeadas con borde
dorado. Se usa en favicon, avatar de redes, sello de documento y cualquier espacio
cuadrado pequeño.

El favicon del sitio (`app/icon.svg`) es la misma pieza pero con Georgia en lugar de
Cormorant: un favicon no puede depender de una fuente que se descarga después.

### Lockup Liberty — `assets/logo-liberty.svg`

Para materiales específicos de un producto Liberty. Siempre subordinado: si aparece
junto al wordmark principal, va más pequeño.

### Usos prohibidos

- Rotar, inclinar o deformar la proporción.
- Cambiar el degradado por un dorado plano saturado.
- Ponerlo sobre una foto sin una capa oscura de por medio (mínimo 60% de opacidad).
- Añadirle sombra, brillo exterior o bisel.
- Reescribir el descriptor ("Trader Profesional", "Experto en Finanzas", etc.).

## Color

Paleta completa, con su razón de ser. Valores exactos en
[04-design-tokens.md](04-design-tokens.md).

### Acento

| | Hex | Cuándo |
|---|---|---|
| Oro | `#C9A84C` | Acento único: CTA, cifras clave, eyebrows, bordes activos |
| Oro claro | `#E8C96A` | Extremo alto del degradado, estado hover |
| Oro oscuro | `#9A7A30` | Extremo bajo del degradado, bordes en reposo |

El degradado de marca va siempre en la misma dirección (135°, de oscuro a claro) y
en el mismo orden. Es lo que hace que el texto dorado se lea como metal y no como
amarillo.

### Superficies

| | Hex | Uso |
|---|---|---|
| Fondo | `#080808` | Base. Negro con un punto de calidez, no `#000` |
| Superficie | `#0d0d0d` | Secciones alternas — da ritmo al scroll |
| Panel | `#111111` | Tarjetas |
| Hover | `#1a1a1a` | Estados interactivos |
| Línea | `#1e1e1e` | Separadores y bordes en reposo |

La alternancia fondo/superficie entre secciones es lo que estructura la página sin
necesidad de líneas divisorias gruesas.

### Texto

| | Hex | Uso |
|---|---|---|
| Primario | `#f0ece4` | Titulares y texto principal. Crema, **no blanco puro** |
| Secundario | `#8a8480` | Párrafos de apoyo |
| Terciario | `#4a4642` | Labels, metadatos, notas al pie |

El crema en vez de blanco puro reduce la fatiga visual sobre negro y aporta la
calidez editorial que sostiene el concepto.

### Semánticos

| | Hex | Uso |
|---|---|---|
| Ganancia | `#00C896` | P&L positivo, operaciones WIN, estados activos |
| Pérdida | `#FF4444` | P&L negativo, operaciones LOSS, errores |

**Estos dos colores solo se usan para datos financieros y estados de sistema.**
Nunca como decoración. Cuando alguien ve verde en esta marca, debe significar
dinero ganado.

### Accesibilidad

| Combinación | Contraste | Veredicto |
|---|---|---|
| Primario sobre fondo | 17.0:1 | AAA |
| Secundario sobre fondo | 5.43:1 | AA texto normal |
| Terciario sobre fondo | 2.14:1 | **Falla AA — solo labels ≥14px en mayúsculas** |
| Oro sobre fondo | 8.76:1 | AAA |
| Negro sobre oro (botón) | 9.19:1 | AAA |

Medidos con la fórmula WCAG 2.1 sobre el fondo `#080808`.

El terciario no pasa AA para texto normal. Es correcto para lo que hace —labels
cortas en mayúsculas con tracking amplio— pero **nunca debe usarse en un párrafo**.
Si un texto explicativo está en terciario, es un bug de accesibilidad.

## Tipografía

Tres familias, tres trabajos claramente separados.

### Cormorant Garamond — titulares
Italic, peso 300, tracking -0.02em. Es la voz de autoridad de la marca. Una serif
italic ligera en tamaño grande transmite una seriedad editorial que ninguna sans
geométrica consigue.

Solo para titulares y citas. **Nunca para texto corrido** — en cuerpo pequeño la
italic ligera se vuelve difícil de leer.

### DM Mono — datos y etiquetas
Los labels van siempre en mayúsculas, 0.7rem, tracking 0.15em, con
`font-variant-numeric: tabular-nums`.

El monoespaciado hace dos cosas: alinea las cifras en columnas (crítico en la tabla
de operaciones) y da la señal implícita de "esto es un dato, no una promesa". Los
botones también van en mono — les da un carácter de terminal en vez de app.

### Syne — cuerpo
Sans geométrica con carácter propio. Contrasta bien con la serif sin competir.
Solo para párrafos y elementos de interfaz.

### Escala

| Nivel | Tamaño | Familia |
|---|---|---|
| Display (H1) | 72 / 60 / 48 px | Cormorant italic 300 |
| H2 | 48 / 40 px | Cormorant italic 300 |
| H3 | 24 px | Cormorant italic 300 |
| Body | 16 px | Syne |
| Small | 14 px | Syne |
| Label | 11 px, mayúsculas, tracking .15em | DM Mono |

Los tres valores en display y H2 son escritorio / tablet / móvil.

## Layout

- **Contenedor:** `max-w-6xl` (1152px) para secciones de contenido, `max-w-7xl` para
  navbar y footer.
- **Ritmo vertical:** `py-20` entre secciones. El diseño anterior usaba `py-24` — se
  redujo al condensar la landing.
- **Padding lateral:** `px-4` en móvil, `px-6` desde tablet.
- **Radios:** 12px en tarjetas, 16px en paneles, 6-8px en botones, 999px en píldoras.
- **Bordes:** 1px de `#1e1e1e` en reposo, oro al hacer hover en elementos interactivos.

### Composición de una sección

```
label-mono dorada          ← eyebrow: categoriza la sección
Titular en Cormorant       ← con la mitad significativa en degradado
Una o dos frases máximo    ← nunca más
[contenido: tarjetas, datos, tabla]
```

Este patrón se repite en las cinco secciones de la landing. La consistencia es lo
que hace que la página se lea rápido.

## Texturas y efectos

Se usan con moderación deliberada. Todos existen ya en `app/globals.css`:

| Efecto | Clase | Dónde |
|---|---|---|
| Ruido de película | `.noise` | Una capa fija sobre toda la página, 4% de opacidad |
| Rejilla | `.grid-bg` | Solo en el hero |
| Resplandor dorado | `.glow-gold-sm` | Solo en el elemento con el CTA principal |
| Radial dorado | inline | Detrás del hero y en paneles destacados |

**El resplandor dorado marca el punto de conversión.** Si aparece en más de un
elemento por pantalla, deja de significar nada.

## Iconografía

Actualmente son emojis Unicode. Es una decisión pragmática que funciona en WhatsApp
y no añade dependencias, pero **le resta un punto de seriedad a la marca en la web**.

En la landing rediseñada los emojis se eliminaron de las tarjetas de servicio a favor
de numeración (`01`, `02`...) en DM Mono dorada, que es más coherente con el concepto
de terminal financiera.

Recomendación a futuro: si se añade un set de iconos, que sea de línea, 1.5px de
grosor, esquinas rectas, monocromo en oro o gris. Nunca iconos rellenos ni
multicolor. Los emojis se mantienen en WhatsApp, donde son el lenguaje nativo.

## Fotografía

Ver [05-guia-fotografia.md](05-guia-fotografia.md) para la guía completa y los prompts.

En una línea: **retrato editorial de bajo perfil**, luz cálida lateral sobre fondo
casi negro, mirada directa, sin sonrisa de catálogo, sin objetos de estatus.

La foto debe transmitir "esta persona sabe lo que hace y no necesita demostrártelo",
no "esta persona quiere venderte algo".

## Movimiento

Discreto. Nada rebota, nada gira.

| Animación | Duración | Uso |
|---|---|---|
| Hover de borde/color | 150-200ms ease | Tarjetas, links |
| Elevación de botón | 150ms, -1px | Solo el CTA principal |
| Fade-up al entrar | 600ms ease | Secciones al hacer scroll |
| Punto pulsante | 2s infinito | Solo indicadores de "en vivo" |
| Ticker | 35s lineal | Barra de precios |

El punto pulsante verde es el único elemento en movimiento constante de la marca, y
significa una cosa concreta: hay datos en tiempo real. No usarlo decorativamente.

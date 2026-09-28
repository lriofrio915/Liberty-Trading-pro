# 01 · Estrategia de marca

> Actualizado 2026-09-28. Modelo vigente: un solo producto de educación
> (Liberty Trading Club, $1,500 pago único) más Exchange y Portfolio.

## El problema del mercado

El sector de educación financiera en Latinoamérica tiene un problema de credibilidad
estructural: casi nadie muestra resultados verificables. La oferta se divide en dos
extremos igual de poco convincentes:

- **Los que venden sueños.** Lamborghinis, capturas de pantalla recortadas, promesas
  de rentabilidad. Cero verificación.
- **Los académicos sin operativa.** Contenido correcto pero de alguien que no arriesga
  su propio dinero.

Tu ventaja no es enseñar mejor. Es **ser auditable**.

## Posicionamiento

> El único trader en Ecuador que publica cada operación —ganadoras y perdedoras— y
> te enseña a hacer lo mismo.

Esta frase es la columna vertebral de todo. Cada pieza de comunicación debe poder
justificarse contra ella.

**Tagline:** *Transparencia como método.*

No es "transparencia como valor" — eso lo dice cualquiera. Es un método: el track
record público en la base de datos, actualizado operación a operación, es
infraestructura del producto, no marketing.

## Arquitectura de marca

Marca madre = la persona. En servicios financieros la confianza se deposita en un
nombre y una cara, no en un logo corporativo. Liberty queda como casa de productos.

```
LUIS RIOFRIO · Trader Cuantitativo
│
├── Curso gratis (/unirse)    Puerta de entrada · IBKR, acciones con Claude, opciones
│
├── Liberty Trading Club      Educación cuantitativa · $1,500 pago único, de por vida
├── Liberty Exchange          Intercambio cripto ↔ fiat
└── Liberty Portfolio         Formación en acciones de EEUU vía IBKR · 20% de éxito
```

No hay suscripción mensual ni anual: se retiraron en septiembre de 2026. Los bots
ya no son un producto aparte (el antiguo "Liberty Algo"): van dentro del Club.

### Reglas de nomenclatura

| Situación | Correcto | Incorrecto |
|---|---|---|
| Titular de landing, firma, tarjeta | Luis Riofrio | Liberty Trading Club |
| El producto educativo | Liberty Trading Club (o "el Club" en texto corrido) | Liberty Club, Liberty Quant, Liberty Quant Club |
| Documento legal, factura, Hotmart | Liberty Trading Club | — |
| Cualquier contexto | — | Liberty Trading Club Club |
| Cualquier contexto | — | Liberty Trading Pro |
| Cualquier contexto | — | Club Liberty Trading |
| Los bots | "los 6 bots del portafolio comunitario" | Liberty Algo (producto retirado) |

Handles y dominio que se mantienen aunque no coincidan con la marca personal:
`@liberty_trading_club` (Instagram) y `libertytrading.pro`. Cambiarlos costaría más
audiencia y SEO de lo que gana en coherencia.

## Canales de la marca personal

| Canal | Rol |
|---|---|
| Página de Facebook **Luis Riofrío Trader Cuantitativo** (`facebook.com/luisriofrio.trader`) | Marca profesional en Facebook. Todo el contenido de trading va aquí |
| Instagram **@luisriofrioec** | Marca personal. Reels y contenido de trading |
| Perfil personal de Facebook (Luis Riofrio Lopez) | Personal. Lo de trading se redirige a la página |
| Facebook **Liberty Trading Club** + Instagram **@liberty_trading_club** | Marca del producto |
| WhatsApp +593 99 669 1586 | Canal de cierre, atendido personalmente por Luis |

## Los tres servicios

### 01 · Liberty Trading Club — Educación cuantitativa
**Qué es:** formación en trading algorítmico cuantitativo, en pago único con acceso
de por vida.
**Qué incluye:**
- Video clases: Claude Code, NinjaTrader 8 y Obsidian para crear estrategias desde cero.
- Montar la infraestructura del negocio: panel propio conectado a NinjaTrader y Supabase.
- Portafolio comunitario de 6 bots para NinjaTrader 8, con código completo, validados
  con Walk-Forward y Montecarlo.
- Pase directo a una cuenta fondeada de $200k en PJ Capital. Luis compra el pase para
  cada alumno (le cuesta $300).
- Proyecto final: el alumno aporta una estrategia validada al portafolio comunitario.

**Precio:** $1,500, pago único. Valores en `BRAND.price` de `lib/brand.ts`.
**Argumento de cierre:** no esperas a terminar el curso para operar. Los bots del
portafolio trabajan en tu cuenta fondeada mientras aprendes a construir los tuyos.

### 02 · Liberty Exchange — Intercambio cripto
**Qué es:** cambio de dólares cripto (USDT, BTC) a dólares fiat y viceversa.
**Por qué importa para la marca:** es tu servicio de mayor frecuencia y menor fricción.
Un cliente que cambia USDT contigo cada mes es un cliente que ya te confía dinero.
**Ventaja operativa:** el monitor automático de precios P2P de Binance corre cada 15
minutos, así que compites con precio informado, no a ojo.

### 03 · Liberty Portfolio — Acciones EEUU
**Qué es:** formación para invertir en acciones de la bolsa de EEUU dentro de la cuenta
IBKR del propio alumno.
**Modelo:** sin mensualidad, 20% de comisión de éxito sobre las ganancias generadas.
$10.000 es el capital ideal, pero se puede empezar con bastante menos; no es un mínimo.
**El punto que más tranquiliza:** el capital nunca sale de su cuenta. Esto se dice
siempre, primero y en voz alta. Es la diferencia entre ser educador y ser custodio
(ver [07-legal-y-disclaimers.md](07-legal-y-disclaimers.md)).

## La puerta de entrada: el curso gratis

`libertytrading.pro/unirse` es el imán de leads: abrir cuenta en Interactive Brokers,
analizar acciones con Claude y entender opciones. Gratis, sin tarjeta. Todo el
contenido orgánico (reels, posts) apunta aquí, no directamente al Club.

**Brecha a tener en cuenta:** el curso gratis enseña acciones y opciones; el Club
vende futuros, bots y cuentas fondeadas. La secuencia de emails o WhatsApp después
del registro tiene que hacer ese puente. Si no, el lead que llega por acciones no
entiende por qué le ofrecen futuros.

## Audiencias

### A · El curioso (entrada por el curso gratis)
Sabe que "debería invertir", no sabe por dónde. Ha visto cursos caros y desconfía.
**Objeción principal:** "¿y si no sirvo para esto?"
**Respuesta:** empieza gratis. Abre tu cuenta en IBKR y compra tu primera acción antes
de pagar nada.

### B · El operador atascado (entrada por el Club)
Ya opera. Pierde por disciplina, no por falta de conocimiento. Probablemente ha
quemado una o dos pruebas de fondeo.
**Objeción principal:** "ya sé trading, ¿qué me vas a enseñar?"
**Respuesta:** a sistematizar. Bots con código abierto, validados, que respetan el
drawdown de la mesa, y el pase a una cuenta de $200k incluido.

### C · El que tiene capital (entrada por Liberty Portfolio)
Tiene $10.000+ y quiere exposición a acciones de EEUU sin estudiar el mercado.
**Objeción principal:** "¿por qué te confiaría mi dinero?"
**Respuesta:** no lo haces. Está en tu cuenta. Y solo cobro si ganas.

### D · El que mueve cripto (entrada por Liberty Exchange)
Freelancer, comerciante o remesador que necesita convertir USDT a dólares.
**Objeción principal:** "¿me vas a estafar?"
**Respuesta:** operación con comprobante, track record público, ubicación conocida.

## Cómo se conectan las audiencias

```
Contenido orgánico (reels, página, IG)
    ↓
Curso gratis /unirse  ← Exchange (confianza barata, alta frecuencia)
    ↓
Liberty Trading Club ($1,500)
    ↓
Liberty Portfolio (te delega capital en su propia cuenta)
```

La home de la web vende solo el Club. Exchange (`/p2p`) y Portfolio siguen activos y
se llega a ellos por sus rutas y por WhatsApp.

## Competencia

| Tipo | Cómo compiten | Cómo los superas |
|---|---|---|
| Gurús de Instagram | Aspiracional, resultados no verificables | Track record en base de datos, con pérdidas |
| Academias grandes (cursos $500-2000) | Producción alta, contenido genérico | Bots con código, cuenta fondeada incluida, infraestructura propia del alumno |
| Vendedores de bots | Backtests dudosos, cajas negras, cero soporte | Código completo, Walk-Forward y Montecarlo, y enseñas a construirlos |
| Casas de cambio P2P | Solo precio | Precio informado + los otros servicios |

Tu vulnerabilidad real: **eres una sola persona.** El soporte a alumnos de un pago de
por vida no escala solo. Decide pronto qué parte del soporte es comunidad y qué parte
es tuya.

## Métricas que importan

1. Registros en `/unirse` por semana, y de dónde vienen (reel, página, IG).
2. Tasa de conversión de lead del curso gratis a alumno del Club.
3. Cuántos clientes de Exchange terminan en el curso gratis o en el Club.
4. Cuántas visitas a la landing llegan al bloque de track record.
5. Conversaciones de WhatsApp por servicio: te dice qué canal está funcionando.

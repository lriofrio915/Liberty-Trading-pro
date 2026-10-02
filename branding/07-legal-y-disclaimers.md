# 07 · Legal y disclaimers

> Este documento recoge criterios de comunicación para reducir exposición. **No es
> asesoría legal.** Antes de escalar publicidad pagada o de aumentar el volumen de
> Liberty Portfolio, consulta con un abogado ecuatoriano especializado en mercado
> de valores.

## Por qué esto importa aquí

"Asesor de inversiones" es un título regulado en la mayoría de jurisdicciones. En
Ecuador el mercado de valores está bajo la Superintendencia de Compañías, Valores y
Seguros; en EEUU, bajo la SEC. Cuando alguien combina tres elementos —publicación de
resultados, asesoría sobre valores concretos, y cobro por ello— entra en el terreno
donde los reguladores miran.

Tú tienes los tres. Eso no significa que estés haciendo algo mal; significa que la
forma de describirlo importa más de lo normal.

## El encuadre de Liberty Portfolio

Este es el punto de mayor exposición y también el más fácil de resolver, porque la
descripción correcta es además la verdadera.

**Lo que realmente haces:** el cliente abre su propia cuenta en Interactive Brokers.
Tú lo asesoras sobre qué comprar. El capital nunca sale de su cuenta ni pasa por la
tuya. Cobras un porcentaje sobre las ganancias.

**Cómo describirlo (enfoque educativo, desde 2026-09-26):**

> Aprende a invertir en acciones de la bolsa de EEUU con tu propia cuenta de
> Interactive Brokers: te enseño mi método y tú tomas cada decisión. El capital
> nunca sale de tu cuenta y mantienes el control total.

**Punto abierto:** el texto ya es educativo, pero el cobro sigue siendo una comisión
de éxito del 20% sobre las ganancias del alumno. Luis decidió mantenerla por ahora.
Una comisión ligada al resultado de la cartera de otra persona puede interpretarse
como remuneración por asesoría aunque el texto diga "formación". Es la primera
pregunta para el abogado (ver Pendientes).

**Cómo NO describirlo:**

| No digas | Por qué |
|---|---|
| Gestiono tu portafolio | Sugiere gestión discrecional de fondos de terceros |
| Administro tu dinero | Sugiere custodia |
| Fondo de inversión | Es una figura regulada específica que no eres |
| Rentabilidad esperada del X% | Proyección de retornos |
| Inversión segura / sin riesgo | Falso y sancionable |

La distinción entre **asesoría** (recomiendas, el cliente decide y ejecuta en su
cuenta) y **gestión discrecional** (operas por él con poder sobre su cuenta) es la
línea regulatoria más importante de todo tu negocio. En la comunicación, quédate
del lado educativo: enseñas un método y el alumno decide y ejecuta en su cuenta.
Nunca "te asesoro", "te recomiendo comprar" ni "gestiono tu cartera".

Si en algún momento pasas a operar directamente en cuentas de clientes con poder
delegado, ya no es lo mismo y necesitas asesoría legal antes, no después.

## El título profesional: "Trader Cuantitativo"

**Decisión (2026-09-26):** Luis deja de usar "Asesor de Inversiones". Es un título
regulado y no tiene la licencia, así que aunque se use como descriptor genera una
exposición innecesaria. El descriptor oficial pasa a ser **Trader Cuantitativo**
(`BRAND.role` en `lib/brand.ts`, logo wordmark, bios de redes).

| Permitido | Prohibido |
|---|---|
| Trader Cuantitativo | Asesor de Inversiones (con o sin "Registrado") |
| Trader de futuros | Asesor Autorizado por la Superintendencia |
| Desarrollador de bots de trading | Registered Investment Advisor / RIA |
| Mentor de trading | Corredor de bolsa / Agente de valores |
| Educador en trading algorítmico | Administrador de fondos / Gestor de portafolios |

**Empleador: sí en perfiles personales, no en lo que vende.** Decisión de Luis
(2026-09-28), que reemplaza la regla anterior de no nombrarlo nunca.

| Dónde | ¿Se nombra la empresa donde trabaja Luis? |
|---|---|
| Instagram personal @luisriofrioec (bio, etiquetas) | Sí |
| Perfil personal de Facebook | Sí |
| Web `libertytrading.pro` (todas las páginas), `lib/brand.ts` | **No** |
| Hotmart, anuncios pagados, PDFs y presentaciones de venta | **No** |
| Cuentas del producto (Liberty Trading Club en FB e IG) | **No** |
| Página de FB "Luis Riofrío Trader Cuantitativo" | **Pendiente de decidir.** Es donde van los reels y el CTA al curso gratis, así que funciona como canal de venta |

**Por qué la línea está ahí:** en un perfil personal, mencionar dónde trabajas es
información biográfica. En una página que vende un producto financiero, el nombre
del empleador se lee como aval: parece que la empresa respalda el Club, y eso es
un conflicto de interés para ambos. Además, la autoridad de la marca se construye
con el track record propio, no con el logo de un tercero.

**Antes de etiquetar a la empresa con frecuencia,** revisa si tiene una política
para empleados sobre redes sociales o sobre actividades externas relacionadas con
inversión. Muchas firmas la tienen.

## Track record

Publicar resultados reales es tu mayor activo de marca y, precisamente por eso, el
lugar donde más cuidado hay que tener con la redacción.

**Reglas:**

1. Etiquétalo siempre como **resultados de tu cuenta de capital propio**, no como una
   oferta ni como un resultado que otro pueda esperar.
2. Publícalo completo: no se borran ni se ocultan operaciones. La marca no necesita
   *hablar* de las pérdidas en su contenido, pero el historial no puede filtrarse: un
   track record sin operaciones perdedoras es engañoso y una señal de alarma para
   cualquier regulador.
3. Nunca presentes un rendimiento pasado como indicativo de uno futuro.
4. No uses el track record como argumento de venta directo del tipo "gana lo mismo
   que yo".

**Texto que acompaña al bloque de track record en la landing:**

> Resultados de la cuenta de capital propio de Luis Riofrio. Rendimientos pasados no
> garantizan resultados futuros.

Está implementado en `app/page.tsx`, debajo de la tabla de operaciones.

## Disclaimer de riesgo

Definido una sola vez en `lib/brand.ts` como `RISK_DISCLAIMER`, y usado en el pie de
la landing y en el footer global:

> Operar futuros, acciones, opciones y criptomonedas implica riesgo de pérdida de
> capital. Los resultados publicados corresponden a la cuenta de capital propio de
> Luis Riofrio y no garantizan rendimientos futuros. El contenido es educativo e
> informativo; no constituye una recomendación personalizada de inversión ni una
> oferta de valores.

**Dónde debe aparecer, sin excepción:**

- Pie de la landing
- Footer global del sitio
- Cualquier página que muestre rendimientos
- Presentaciones y PDF con cifras
- Materiales de venta de Liberty Portfolio

**Dónde no hace falta:** posts orgánicos de redes sin cifras concretas, mensajes de
WhatsApp de conversación normal.

## Bots de trading (portafolio comunitario del Club)

Terreno con su propio riesgo de sobrepromesa.

**Reglas:**
- Si publicas resultados de un bot, indica si son de backtest o de operativa real.
  Presentar un backtest como resultado real es la práctica más denunciada del sector.
- Nunca "bot rentable garantizado" ni "sistema infalible".
- Menciona explícitamente que el rendimiento pasado del bot no predice el futuro y
  que puede perder dinero.
- Para pruebas de fondeo: no prometas que el bot pasa la prueba. Di que está
  configurado para respetar los límites de drawdown de las mesas.

**Fórmula segura:**

> Bot configurado para respetar los límites de drawdown de las mesas de fondeo.
> Resultados de operativa real desde [fecha]: [datos]. Todo sistema automatizado
> puede generar pérdidas.

## Pase a cuenta fondeada (PJ Capital)

El Club incluye un pase directo a una cuenta fondeada de $200k que Luis compra para
cada alumno.

- Di "pase directo a una cuenta fondeada de $200k". Nunca "te damos $200k",
  "capital de $200k para ti" ni nada que sugiera que el alumno recibe ese dinero.
- La cuenta tiene reglas de la mesa (drawdown, límites diarios) y se puede perder.
  Dilo cuando hables del pase.
- "Valor $300" es lo que cuesta el pase, no el tamaño de la cuenta.

## Liberty Exchange — intercambio cripto

Riesgo distinto: no es regulación de valores, es prevención de lavado de activos.

**Buenas prácticas mínimas:**
- Conserva registro de cada operación: fecha, monto, contraparte, comprobante.
- Ten un criterio de monto a partir del cual pides identificación.
- Rechaza operaciones cuyo origen de fondos no puedas explicar.
- No anuncies "sin preguntas" ni "anónimo" ni "sin verificación". Aunque tu operativa
  sea informal, anunciarlo así te expone.

Ecuador ha ido endureciendo la normativa sobre activos virtuales. Si el volumen
crece, esto pasa de ser una buena práctica a una obligación — vale la pena
adelantarse.

## Educación vs. recomendación personalizada

Liberty Trading Club y el curso gratis son formación. Mantén la distinción clara:

| Educativo (seguro) | Recomendación personalizada (regulado) |
|---|---|
| "Así analizo una empresa antes de comprarla" | "Compra estas acciones" |
| "Este es mi criterio de entrada en NQ" | "Entra largo en NQ ahora" |
| "Así construyo un plan de trading" | "Este es el plan que debes seguir con tu capital" |

En las señales y reportes de oportunidades que ya publicas en el dashboard, el
encuadre debe ser siempre "esto es lo que veo y por qué", no "haz esto". La
diferencia parece semántica y no lo es.

## Pendientes

- [ ] Consulta legal sobre si Liberty Portfolio requiere registro ante la
      Superintendencia de Compañías, Valores y Seguros, en particular por la
      comisión de éxito del 20% y el formulario KYC (pide capital y cuenta IBKR).
- [x] Credenciales de empleador: resuelto (2026-09-28). Sí en perfiles personales,
      no en web ni materiales de venta. Falta decidir la página profesional de FB.
- [ ] Términos y condiciones del sitio (hoy no existen).
- [x] Política de privacidad: publicada en `/privacidad` (2026-10-02), según la LOPDP.
      Enlazada en el footer y junto a los formularios de leads. Si se añade un formulario,
      un proveedor o un rastreador nuevo, actualizar `app/privacidad/page.tsx`.
- [ ] Definir umbral de identificación para operaciones de Liberty Exchange.

Los dos primeros son los importantes. Los demás son higiene que conviene tener antes
de invertir en publicidad pagada.

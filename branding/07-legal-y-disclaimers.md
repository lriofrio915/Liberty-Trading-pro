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

**Cómo describirlo:**

> Te asesoro en la compra de acciones dentro de tu propia cuenta de Interactive
> Brokers. El capital nunca sale de tu cuenta y mantienes el control total. Mi comisión
> de éxito es del 20% de las ganancias generadas.

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
línea regulatoria más importante de todo tu negocio. Mantente del lado de la
asesoría, y dilo explícitamente en cada comunicación.

Si en algún momento pasas a operar directamente en cuentas de clientes con poder
delegado, ya no es lo mismo y necesitas asesoría legal antes, no después.

## El título "Asesor de Inversiones"

Se usa como descriptor profesional, y en ese uso es defendible. Lo que no puedes
hacer es sugerir un registro o licencia que no tienes.

| Permitido | Prohibido |
|---|---|
| Asesor de Inversiones | Asesor de Inversiones Registrado |
| Operador Financiero | Asesor Autorizado por la Superintendencia |
| Trader de futuros | Registered Investment Advisor / RIA |
| Mentor de trading | Corredor de bolsa / Agente de valores |
| Gestor de portafolios en IBKR | Administrador de fondos |

**No nombrar empresas empleadoras en la comunicación de marca.** Decisión tomada:
mencionar dónde trabaja Luis abre un conflicto de interés con esa empresa y no aporta
lo suficiente para justificarlo. La autoridad se construye con el track record propio,
no con el logo de un tercero. Aplica a la web, redes, materiales de venta y bios.

## Track record

Publicar resultados reales es tu mayor activo de marca y, precisamente por eso, el
lugar donde más cuidado hay que tener con la redacción.

**Reglas:**

1. Etiquétalo siempre como **resultados de tu cuenta de capital propio**, no como una
   oferta ni como un resultado que otro pueda esperar.
2. Incluye las operaciones perdedoras. Además de ser lo correcto, un track record sin
   pérdidas es una señal de alarma para cualquier regulador.
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

## Liberty Algo — bots de trading

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

Liberty Club es formación. Mantén la distinción clara:

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
      Superintendencia de Compañías, Valores y Seguros.
- [x] Credenciales de empleador: resuelto — no se nombran empresas empleadoras
      (conflicto de interés).
- [ ] Términos y condiciones del sitio (hoy no existen).
- [ ] Política de privacidad — obligatoria: capturas leads con nombre, teléfono y
      email vía `/api/leads/capture`.
- [ ] Definir umbral de identificación para operaciones de Liberty Exchange.

Los dos primeros son los importantes. Los demás son higiene que conviene tener antes
de invertir en publicidad pagada.

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const VIDEO = 'https://www.youtube.com/watch?v=VIDEO_PENDIENTE'

const lecciones = [

  // ─── CAPÍTULO 1: PLATAFORMA NT8 ────────────────────────────────────────────

  {
    titulo: 'Instalación de NinjaTrader 8 y Conexión de Cuentas',
    categoria: 'Plataforma NT8',
    orden: 1,
    publicado: true,
    videoUrl: VIDEO,
    descripcion: 'Instala NinjaTrader 8 desde cero y conecta tu cuenta demo Sim101 para practicar con datos en tiempo real sin costo.',
    contenido: `<h2>Instalación de NinjaTrader 8</h2>

<p>NinjaTrader 8 (NT8) es la plataforma de ejecución que utilizaremos para operar futuros del Nasdaq. Es gratuita para simulación y análisis.</p>

<h3>Pasos de instalación</h3>
<ol>
  <li>Ve a <strong>ninjatrader.com</strong> y descarga la versión más reciente de NinjaTrader 8</li>
  <li>Ejecuta el instalador y sigue las instrucciones en pantalla</li>
  <li>Una vez instalado, abre NinjaTrader y selecciona <em>"New Account"</em></li>
  <li>Regístrate con tu correo electrónico — recibirás tus credenciales por email</li>
</ol>

<h3>Conectar la cuenta demo Sim101</h3>
<p>La cuenta <strong>Sim101</strong> es la cuenta simulada nativa de NinjaTrader. Te permite operar en tiempo real con dinero ficticio sin pagar nada.</p>
<ol>
  <li>En la barra superior, ve a <strong>Connections → Configure</strong></li>
  <li>Selecciona <em>NinjaTrader Brokerage</em> como conexión</li>
  <li>Ingresa tus credenciales y activa el modo Simulation</li>
  <li>La cuenta Sim101 aparecerá disponible en el Account Selector</li>
</ol>

<h3>¿Por qué usar Sim101 primero?</h3>
<p>Antes de arriesgar capital real o comprar una prueba de fondeo, es <strong>obligatorio</strong> practicar en simulación hasta que el sistema sea mecánico y automático para ti. No se trata de practicar hasta que funcione — se trata de practicar hasta que no pueda fallar.</p>`,
  },

  {
    titulo: 'Cómo Obtener tu Demo Gratuita de Bulenox',
    categoria: 'Plataforma NT8',
    orden: 2,
    publicado: true,
    videoUrl: VIDEO,
    descripcion: 'Configura una cuenta demo de Bulenox y conéctala a NinjaTrader 8 para practicar en el entorno real de una prop firm.',
    contenido: `<h2>¿Qué es Bulenox?</h2>

<p><strong>Bulenox</strong> es una empresa de fondeo (prop firm) que ofrece cuentas demo gratuitas con datos en tiempo real. Practicar en Bulenox es importante porque te familiarizas con las reglas reales de las evaluaciones.</p>

<h3>Obtener tu demo gratuita</h3>
<ol>
  <li>Ve a <strong>bulenox.com</strong> y crea una cuenta gratuita</li>
  <li>Accede a tu panel de usuario y busca la opción <em>"Free Demo"</em> o <em>"Practice Account"</em></li>
  <li>Recibirás por email:
    <ul>
      <li>Usuario (Server Login)</li>
      <li>Contraseña</li>
      <li>Servidor de conexión</li>
    </ul>
  </li>
</ol>

<h3>Conectar Bulenox en NinjaTrader 8</h3>
<ol>
  <li>En NT8: <strong>Connections → Configure → Add</strong></li>
  <li>Busca y selecciona <em>Bulenox</em> en la lista de brokers</li>
  <li>Ingresa tu usuario, contraseña y servidor de Bulenox</li>
  <li>Haz clic en <strong>OK</strong> y luego en <strong>Connect</strong></li>
  <li>Verifica que el indicador de conexión esté en <span style="color:#22c55e">verde</span></li>
</ol>

<h3>Tamaños de cuenta disponibles en Bulenox</h3>
<table>
  <thead><tr><th>Tamaño</th><th>Objetivo de ganancia</th><th>Pérdida máxima diaria</th><th>Trailing Drawdown</th></tr></thead>
  <tbody>
    <tr><td><strong>25K</strong></td><td>$1,500</td><td>$1,000</td><td>$1,500</td></tr>
    <tr><td><strong>50K</strong></td><td>$3,000</td><td>$2,000</td><td>$2,500</td></tr>
    <tr><td><strong>100K</strong></td><td>$6,000</td><td>$3,000</td><td>$4,500</td></tr>
    <tr><td><strong>150K</strong></td><td>$9,000</td><td>$4,500</td><td>$6,000</td></tr>
  </tbody>
</table>`,
  },

  {
    titulo: 'Abrir Cuenta en Interactive Brokers (IBKR)',
    categoria: 'Plataforma NT8',
    orden: 3,
    publicado: true,
    videoUrl: VIDEO,
    descripcion: 'Paso a paso para abrir tu cuenta real en Interactive Brokers y conectarla a NinjaTrader 8 para operar con capital propio.',
    contenido: `<h2>Interactive Brokers (IBKR)</h2>

<p>Cuando estés listo para operar con capital real, <strong>Interactive Brokers</strong> es el broker que utilizamos. Ofrece acceso directo a los mercados de futuros con comisiones muy competitivas.</p>

<h3>Abrir tu cuenta</h3>
<p>Usa el siguiente link de referido para registrarte:</p>
<p><a href="https://ibkr.com/referral/luis6493" target="_blank" style="color:#C9A84C;font-weight:bold;">→ https://ibkr.com/referral/luis6493</a></p>

<ol>
  <li>Haz clic en el link y selecciona <em>"Open Account"</em></li>
  <li>Completa el formulario con tus datos personales</li>
  <li>Selecciona <strong>Futures</strong> como producto de interés</li>
  <li>Envía los documentos requeridos (identificación + comprobante de domicilio)</li>
  <li>IBKR validará tu cuenta en 1-3 días hábiles</li>
</ol>

<h3>Conectar IBKR con NinjaTrader 8</h3>
<ol>
  <li>Descarga e instala <strong>TWS (Trader Workstation)</strong> desde ibkr.com</li>
  <li>En TWS: activa la API en <em>Edit → Global Configuration → API → Settings</em></li>
  <li>Marca <em>"Enable ActiveX and Socket Clients"</em> y anota el puerto (por defecto 7497)</li>
  <li>En NT8: <strong>Connections → Configure → Add → Interactive Brokers</strong></li>
  <li>Ingresa el puerto y conecta</li>
</ol>

<h3>Depósito mínimo</h3>
<p>Para operar MNQ (Micro Nasdaq) con gestión de riesgo adecuada, se recomienda un mínimo de <strong>$2,000 - $5,000</strong> según el plan de trading que definas en el capítulo de Gestión de Riesgo.</p>`,
  },

  {
    titulo: 'Cómo Comprar una Prueba de Fondeo',
    categoria: 'Plataforma NT8',
    orden: 4,
    publicado: true,
    videoUrl: VIDEO,
    descripcion: 'Entiende qué es una evaluación de prop firm, cómo funciona el proceso y cuándo es el momento correcto para comprarla.',
    contenido: `<h2>¿Qué es una prueba de fondeo?</h2>

<p>Una <strong>prueba de fondeo</strong> (o evaluación) es un proceso en el que demuestras a una empresa de capital (prop firm) que puedes operar de forma consistente y controlada. Si la apruebas, ellos te dan capital real para operar y tú te quedas con un porcentaje de las ganancias.</p>

<h3>¿Cómo funciona con Bulenox?</h3>
<ol>
  <li>Compras una evaluación (ej: cuenta de 50K por ~$200)</li>
  <li>Operas durante el período de evaluación cumpliendo las reglas:
    <ul>
      <li>Alcanzar el objetivo de ganancia (ej: $3,000 en 50K)</li>
      <li>No superar la pérdida máxima diaria (ej: $2,000)</li>
      <li>No tocar el trailing drawdown</li>
    </ul>
  </li>
  <li>Si apruebas → recibes una cuenta financiada real</li>
  <li>Con la cuenta financiada → operas y cobras 80-90% de las ganancias</li>
</ol>

<h3>¿Cuándo comprar la evaluación?</h3>
<p>Solo cuando cumplas <strong>estos 3 criterios</strong>:</p>
<ul>
  <li>✅ Llevas mínimo 30 días operando en simulación de forma consistente</li>
  <li>✅ Tu sistema es mecánico — ejecutas sin dudar, sin cambiar reglas</li>
  <li>✅ Has completado el capítulo de Gestión de Riesgo y tienes tu plan escrito</li>
</ul>

<p><strong style="color:#ef4444">No compres la evaluación si no cumples los 3 criterios.</strong> Es mejor seguir practicando y ahorrar el dinero de la evaluación.</p>

<h3>Regla de oro</h3>
<blockquote style="border-left:3px solid #C9A84C;padding-left:1rem;color:#8a8480">
  La evaluación no se compra para aprender a operar. Se compra para demostrar lo que ya sabes hacer.
</blockquote>`,
  },

  // ─── CAPÍTULO 2: CONFIGURACIÓN DE GRÁFICAS ────────────────────────────────

  {
    titulo: 'Configuración de la Gráfica MNQ 1 Minuto',
    categoria: 'Configuracion de Graficas',
    orden: 1,
    publicado: true,
    videoUrl: VIDEO,
    descripcion: 'Configura el único chart que necesitas: MNQ en 1 minuto. El sistema es minimalista por diseño — una sola gráfica, un solo timeframe.',
    contenido: `<h2>El sistema minimalista</h2>

<p>A diferencia de lo que ves en YouTube con múltiples pantallas y docenas de indicadores, este sistema utiliza <strong>una sola gráfica</strong> en <strong>un solo timeframe</strong>: el <strong>MNQ (Micro E-mini Nasdaq) en 1 minuto</strong>.</p>

<p>La simplicidad no es limitación — es ventaja. Menos información = menos confusión = mejor ejecución.</p>

<h3>Abrir la gráfica MNQ</h3>
<ol>
  <li>En NT8: clic derecho en el workspace → <strong>New Chart</strong></li>
  <li>En Instrument, escribe <strong>MNQ 03-26</strong> (o el contrato vigente del trimestre actual)</li>
  <li>Selecciona tipo de gráfica: <strong>Candlestick</strong></li>
  <li>Timeframe: <strong>1 Minute</strong></li>
  <li>Haz clic en <strong>OK</strong></li>
</ol>

<h3>Configuración visual recomendada</h3>
<ul>
  <li><strong>Velas:</strong> alcistas en verde (#22c55e), bajistas en rojo (#ef4444)</li>
  <li><strong>Fondo:</strong> negro o gris muy oscuro — reduce la fatiga visual</li>
  <li><strong>Cuadrícula:</strong> desactivada o muy sutil</li>
  <li><strong>Panel de órdenes:</strong> visible y accesible (lo configuramos en la siguiente lección)</li>
</ul>

<h3>Nota sobre el contrato (rollover)</h3>
<p>Los futuros del Nasdaq tienen vencimiento trimestral. Los contratos son:</p>
<ul>
  <li><strong>Marzo (H):</strong> vence tercera semana de marzo</li>
  <li><strong>Junio (M):</strong> vence tercera semana de junio</li>
  <li><strong>Septiembre (U):</strong> vence tercera semana de septiembre</li>
  <li><strong>Diciembre (Z):</strong> vence tercera semana de diciembre</li>
</ul>
<p>Aproximadamente 1 semana antes del vencimiento, debes hacer rollover al siguiente contrato.</p>`,
  },

  {
    titulo: 'Atajos de Teclado para Ejecución Rápida',
    categoria: 'Configuracion de Graficas',
    orden: 2,
    publicado: true,
    videoUrl: VIDEO,
    descripcion: 'Configura los hotkeys en NinjaTrader 8 para entrar y salir del mercado en milisegundos. La velocidad de ejecución es clave en intradía.',
    contenido: `<h2>¿Por qué usar atajos de teclado?</h2>

<p>En trading intradía, especialmente en 1 minuto, <strong>cada segundo cuenta</strong>. Usar el mouse para ejecutar órdenes introduce latencia y errores. Los atajos de teclado permiten entrar, salir o ajustar posiciones en fracciones de segundo.</p>

<h3>Configurar hotkeys en NT8</h3>
<ol>
  <li>Ve a <strong>Tools → Options → Hotkeys</strong></li>
  <li>Configura las siguientes teclas según tu comodidad:</li>
</ol>

<table>
  <thead><tr><th>Acción</th><th>Tecla sugerida</th></tr></thead>
  <tbody>
    <tr><td>Buy Market (Comprar al mercado)</td><td><strong>F1</strong></td></tr>
    <tr><td>Sell Market (Vender al mercado)</td><td><strong>F2</strong></td></tr>
    <tr><td>Close Position (Cerrar posición)</td><td><strong>F3</strong> o <strong>Escape</strong></td></tr>
    <tr><td>Cancel All Orders</td><td><strong>F4</strong></td></tr>
    <tr><td>Reverse Position</td><td><strong>F5</strong></td></tr>
  </tbody>
</table>

<h3>SuperDOM vs Chart Trader</h3>
<p>Puedes ejecutar órdenes desde dos lugares:</p>
<ul>
  <li><strong>SuperDOM:</strong> panel lateral con precio de oferta/demanda en tiempo real. Ideal para ver la profundidad del mercado.</li>
  <li><strong>Chart Trader:</strong> panel integrado en la gráfica. Más visual, permite ver las órdenes directamente en el chart.</li>
</ul>
<p>Para este sistema usaremos principalmente <strong>Chart Trader</strong> activado dentro de la gráfica MNQ.</p>

<h3>Práctica obligatoria</h3>
<p>Antes de pasar al siguiente capítulo, practica en Sim101 durante al menos 2-3 días:</p>
<ul>
  <li>Abrir y cerrar posiciones únicamente con teclado</li>
  <li>Hacerlo sin mirar el teclado (memoria muscular)</li>
  <li>Ejecutar en menos de 2 segundos desde la señal hasta la orden enviada</li>
</ul>`,
  },

  // ─── CAPÍTULO 3: ESTRATEGIA INTRADÍA NQ ───────────────────────────────────

  {
    titulo: 'El Método 1-2-3: Cómo Decidir la Dirección del Día',
    categoria: 'Estrategia Intradia NQ',
    orden: 1,
    publicado: true,
    videoUrl: VIDEO,
    descripcion: 'El núcleo del sistema: el método 1-2-3 para determinar si el día es alcista o bajista antes de abrir cualquier operación.',
    contenido: `<h2>El método 1-2-3</h2>

<p>El sistema se basa en un principio simple pero poderoso: <strong>solo operamos en la dirección del mercado ese día</strong>. No peleamos contra la tendencia intradía.</p>

<p>El método 1-2-3 es la herramienta para identificar esa dirección antes de abrir la plataforma.</p>

<h3>Los 3 pasos</h3>

<p><strong>Paso 1 — Identifica el contexto de apertura</strong></p>
<p>Observa dónde abre el precio en relación al cierre del día anterior. Este dato nos da el primer sesgo: ¿el mercado quiere ir arriba o abajo?</p>

<p><strong>Paso 2 — Confirma con la acción del precio en los primeros minutos</strong></p>
<p>Durante los primeros 15-30 minutos de la sesión, el precio te "cuenta" la historia del día. Observa sin operar. Deja que el mercado muestre su intención.</p>

<p><strong>Paso 3 — Espera la señal de entrada</strong></p>
<p>Una vez identificada la dirección, esperas la configuración específica de entrada del sistema. No anticipas — reaccionas a lo que el mercado hace.</p>

<h3>Regla fundamental</h3>
<blockquote style="border-left:3px solid #C9A84C;padding-left:1rem;color:#8a8480">
  Si el método 1-2-3 no da una dirección clara, el día es SIN OPERAR. La claridad es condición obligatoria para entrar al mercado.
</blockquote>

<h3>Lo que NO es el método</h3>
<ul>
  <li>❌ No es un indicador técnico</li>
  <li>❌ No es análisis fundamental</li>
  <li>❌ No requiere noticias económicas</li>
  <li>✅ Es lectura de acción del precio en el contexto del día</li>
</ul>`,
  },

  {
    titulo: 'Reglas de Entrada y Salida',
    categoria: 'Estrategia Intradia NQ',
    orden: 2,
    publicado: true,
    videoUrl: VIDEO,
    descripcion: 'Las reglas exactas de cuándo entrar al mercado, dónde colocar el stop loss y cuándo tomar ganancias.',
    contenido: `<h2>Reglas de Entrada</h2>

<p>Una entrada válida requiere <strong>las 3 condiciones simultáneamente</strong>:</p>

<ol>
  <li>El método 1-2-3 indica una dirección clara para el día</li>
  <li>El precio está en la zona de entrada (definida en la lección anterior)</li>
  <li>La vela de confirmación se forma según el patrón del sistema</li>
</ol>

<p>Si alguna de las 3 no está presente → <strong>no entras</strong>.</p>

<h3>Stop Loss</h3>
<p>El stop loss es obligatorio en cada operación. No es opcional. Se coloca:</p>
<ul>
  <li>Por debajo/encima del punto de invalidación de la señal</li>
  <li>El tamaño del stop define el riesgo de la operación (ver capítulo de Gestión de Riesgo)</li>
  <li>Nunca se mueve en contra de la posición (ampliar el stop está prohibido por las reglas del sistema)</li>
</ul>

<h3>Gestión de la posición abierta</h3>
<ul>
  <li><strong>Target fijo:</strong> el sistema tiene un objetivo de ganancia definido en puntos de MNQ</li>
  <li><strong>Trailing stop:</strong> alternativa para capturar movimientos más grandes en días de tendencia fuerte</li>
  <li><strong>Cierre manual:</strong> solo si el precio muestra señal de reversión clara antes de alcanzar el target</li>
</ul>

<h3>Salida</h3>
<p>Sales cuando ocurre uno de estos 3 eventos (el primero que suceda):</p>
<ol>
  <li>El precio alcanza el <strong>target de ganancia</strong></li>
  <li>El precio toca el <strong>stop loss</strong></li>
  <li>Se cumplen las <strong>condiciones de invalidación</strong> del setup</li>
</ol>

<p>No se sale "por intuición", no se corre el target, no se mueve el stop en contra.</p>`,
  },

  {
    titulo: 'Reglas del Sistema y Condiciones para Operar',
    categoria: 'Estrategia Intradia NQ',
    orden: 3,
    publicado: true,
    videoUrl: VIDEO,
    descripcion: 'El conjunto de reglas que define cuándo el sistema está activo y cuándo no. Disciplina antes que rentabilidad.',
    contenido: `<h2>Condiciones para operar</h2>

<p>El sistema solo está activo cuando <strong>todas</strong> estas condiciones se cumplen:</p>

<ul>
  <li>✅ Es un día de mercado regular (no días de vencimiento de contratos, no días con noticias de alto impacto como FOMC, CPI, NFP a menos que la estrategia lo contemple explícitamente)</li>
  <li>✅ La sesión de Nueva York está activa (horario principal de liquidez)</li>
  <li>✅ El método 1-2-3 da una dirección clara</li>
  <li>✅ No has alcanzado tu límite de pérdida diaria</li>
  <li>✅ No has alcanzado tu límite de operaciones por día</li>
</ul>

<h3>Días de NO operar</h3>
<ul>
  <li>Días con eventos de alto impacto (FOMC, NFP, CPI) — el mercado se vuelve errático</li>
  <li>Días de vencimiento de contratos (Quad Witching)</li>
  <li>Días con poca liquidez (vísperas de festivos en EE.UU.)</li>
  <li>Cualquier día en que el método 1-2-3 no genere una señal clara</li>
</ul>

<h3>Límite de operaciones</h3>
<p>Máximo <strong>1-2 operaciones por día</strong>. El sistema no es de alta frecuencia. Cada operación tiene peso.</p>

<h3>La disciplina de no operar</h3>
<blockquote style="border-left:3px solid #C9A84C;padding-left:1rem;color:#8a8480">
  Uno de los días más rentables de un trader es aquel en el que decide conscientemente NO operar porque las condiciones no están dadas. Preservar el capital en días malos es parte del sistema.
</blockquote>`,
  },

  {
    titulo: 'Objetivos y Gestión de la Operación',
    categoria: 'Estrategia Intradia NQ',
    orden: 4,
    publicado: true,
    videoUrl: VIDEO,
    descripcion: 'Define los objetivos de ganancia por operación y por día, y aprende a gestionar la posición una vez que está abierta.',
    contenido: `<h2>Objetivos del sistema</h2>

<p>El sistema tiene objetivos <strong>realistas y consistentes</strong>, no grandiosos. La rentabilidad viene de la consistencia, no de un trade grande.</p>

<h3>Objetivos por operación</h3>
<ul>
  <li><strong>Target conservador:</strong> 10-20 puntos de MNQ (~$100-$200 por contrato)</li>
  <li><strong>Target estándar:</strong> 20-40 puntos de MNQ (~$200-$400 por contrato)</li>
  <li><strong>Target ampliado:</strong> cuando hay tendencia fuerte, se puede usar trailing stop</li>
</ul>

<p>Cada punto de MNQ vale <strong>$0.50</strong>. Un movimiento de 20 puntos = $10 por contrato de MNQ.</p>
<p>(En NQ grande, cada punto vale $5. En MNQ = $0.50, que es 1/10 del NQ)</p>

<h3>Objetivo diario</h3>
<p>Definido en tu plan de trading personal (capítulo 4). La referencia general:</p>
<ul>
  <li><strong>Mínimo diario:</strong> alcanzar 1 operación ganadora que cubra comisiones + algo de ganancia</li>
  <li><strong>Objetivo diario:</strong> 1-2 operaciones ganadoras siguiendo el plan</li>
  <li><strong>Máximo diario:</strong> 2 operaciones (si se dan las señales) — después de 2, cierra la plataforma</li>
</ul>

<h3>Gestión una vez en posición</h3>
<ol>
  <li>Stop loss colocado <strong>inmediatamente</strong> al entrar — nunca operar sin stop</li>
  <li>No mover el stop en contra de la posición</li>
  <li>Opcionalmente: mover el stop a breakeven cuando el precio avanza 50% del camino al target</li>
  <li>Cerrar en el target o en el stop — el mercado decide</li>
</ol>`,
  },

  // ─── CAPÍTULO 4: GESTIÓN DE RIESGO ───────────────────────────────────────

  {
    titulo: 'Cómo Escribir tu Plan de Trading',
    categoria: 'Gestion de Riesgo',
    orden: 1,
    publicado: true,
    videoUrl: VIDEO,
    descripcion: 'El plan de trading es el documento más importante que escribirás como trader. Sin plan, no hay sistema — solo apuestas.',
    contenido: `<h2>¿Por qué necesitas un plan escrito?</h2>

<p>Un plan de trading escrito es tu "manual de operaciones". Te dice exactamente qué hacer en cada situación <em>antes</em> de que ocurra, eliminando decisiones emocionales en el calor del mercado.</p>

<h3>Estructura del plan de trading</h3>

<p><strong>1. Mercado e instrumento</strong></p>
<ul>
  <li>Instrumento: MNQ (Micro E-mini Nasdaq)</li>
  <li>Plataforma: NinjaTrader 8</li>
  <li>Timeframe: 1 minuto</li>
  <li>Sesión: Nueva York (9:30 AM - 12:00 PM ET)</li>
</ul>

<p><strong>2. Sistema y señales</strong></p>
<ul>
  <li>Método de dirección: 1-2-3 (según el capítulo de Estrategia)</li>
  <li>Condiciones de entrada (copia exactamente las reglas del capítulo anterior)</li>
  <li>Stop loss: [define en puntos]</li>
  <li>Target: [define en puntos]</li>
</ul>

<p><strong>3. Gestión de riesgo</strong></p>
<ul>
  <li>% máximo de riesgo por operación: [define: 1%, 2%]</li>
  <li>Pérdida máxima diaria: [define en $]</li>
  <li>Máximo de operaciones por día: [define: 1 o 2]</li>
</ul>

<p><strong>4. Reglas de disciplina</strong></p>
<ul>
  <li>Si alcanzo mi pérdida máxima diaria → cierre la plataforma, sin excepciones</li>
  <li>Si realizo 2 operaciones → cierre la plataforma, sin excepciones</li>
  <li>No opero días de alto impacto: FOMC, NFP, CPI</li>
</ul>

<p><strong>5. Revisión</strong></p>
<ul>
  <li>Revisa y actualiza el plan cada 30 días basado en estadísticas reales</li>
</ul>

<p>Escribe tu plan en papel, impímelo y tenlo visible mientras operas.</p>`,
  },

  {
    titulo: 'Porcentaje de Riesgo por Operación',
    categoria: 'Gestion de Riesgo',
    orden: 2,
    publicado: true,
    videoUrl: VIDEO,
    descripcion: 'Define cuánto dinero arriesgas por operación en función del tamaño de tu cuenta. La regla del 1-2% que protege tu capital.',
    contenido: `<h2>La regla del porcentaje de riesgo</h2>

<p>La regla más importante en gestión de riesgo: <strong>nunca arriesgues más del 1-2% de tu cuenta en una sola operación</strong>.</p>

<h3>¿Por qué 1-2%?</h3>
<p>Con un 2% de riesgo por operación, necesitarías perder <strong>50 operaciones consecutivas</strong> para arruinar tu cuenta. Eso simplemente no pasa con un sistema que tiene reglas claras.</p>

<p>Con un 1%, necesitarías perder 100 seguidas. La matematica trabaja para ti.</p>

<h3>Cálculo del riesgo en $</h3>
<table>
  <thead><tr><th>Tamaño de cuenta</th><th>Riesgo 1%</th><th>Riesgo 2%</th></tr></thead>
  <tbody>
    <tr><td>$2,000</td><td>$20</td><td>$40</td></tr>
    <tr><td>$5,000</td><td>$50</td><td>$100</td></tr>
    <tr><td>$10,000</td><td>$100</td><td>$200</td></tr>
    <tr><td>$25,000 (fondeo)</td><td>$250</td><td>$500</td></tr>
    <tr><td>$50,000 (fondeo)</td><td>$500</td><td>$1,000</td></tr>
  </tbody>
</table>

<h3>Regla para cuentas de fondeo</h3>
<p>En cuentas de Bulenox (prop firm), el riesgo por operación se calcula sobre el <strong>trailing drawdown</strong>, no sobre el balance total:</p>
<ul>
  <li>Cuenta 50K → trailing drawdown $2,500 → riesgo 2% = $50 por operación</li>
  <li>Esto es más conservador pero te protege de perder la cuenta</li>
</ul>

<h3>Regla de pérdida máxima diaria</h3>
<p>Define un límite diario. Ejemplo: si tu riesgo por operación es $100, tu pérdida máxima diaria podría ser $200 (2 pérdidas consecutivas).</p>
<p><strong>Cuando alcances ese límite → cierra la plataforma, sin excepciones, sin "una más".</strong></p>`,
  },

  {
    titulo: 'Métricas Clave de la Estrategia',
    categoria: 'Gestion de Riesgo',
    orden: 3,
    publicado: true,
    videoUrl: VIDEO,
    descripcion: 'Las estadísticas que debes conocer de tu sistema: win rate, ratio R, profit factor, drawdown esperado. Los números que determinan si tu sistema es rentable.',
    contenido: `<h2>Las métricas del trader profesional</h2>

<p>Un trader profesional no dice "creo que mi sistema funciona". Lo demuestra con números. Estas son las métricas que debes llevar de cada período de operativa.</p>

<h3>Win Rate</h3>
<p>Porcentaje de operaciones ganadoras sobre el total.</p>
<p><em>Ejemplo: 60 ganadoras de 100 = 60% win rate</em></p>
<p>⚠️ Un win rate alto no garantiza rentabilidad. Depende del ratio R.</p>

<h3>Ratio Riesgo/Beneficio (R)</h3>
<p>Cuánto ganas en promedio vs cuánto pierdes en promedio.</p>
<ul>
  <li><strong>1R:</strong> ganas lo mismo que arriesgas</li>
  <li><strong>2R:</strong> ganas el doble de lo que arriesgas</li>
  <li><strong>1.5R:</strong> con un 50% de win rate ya eres rentable</li>
</ul>

<h3>Profit Factor</h3>
<p>Ganancias brutas totales / Pérdidas brutas totales</p>
<ul>
  <li><strong>Menos de 1.0:</strong> sistema perdedor</li>
  <li><strong>1.0 - 1.5:</strong> sistema marginal</li>
  <li><strong>1.5 - 2.0:</strong> sistema sólido</li>
  <li><strong>Más de 2.0:</strong> sistema excelente</li>
</ul>

<h3>Drawdown máximo</h3>
<p>La caída máxima desde un pico hasta un valle en el equity curve. Es normal que ocurra — un sistema sin drawdown no existe. Lo que importa es que sea <strong>recuperable y predecible</strong>.</p>

<h3>Expectativa matemática</h3>
<p><em>Expectativa = (Win Rate × Ganancia promedio) - (Loss Rate × Pérdida promedio)</em></p>
<p>Si la expectativa es positiva, el sistema es matemáticamente rentable en el largo plazo.</p>

<h3>Tu dashboard de métricas</h3>
<p>Todas estas métricas las puedes ver en tiempo real en la sección <strong>Track Record</strong> de esta plataforma, donde registras cada operación.</p>`,
  },

  {
    titulo: 'Cálculo del Tamaño de Posición',
    categoria: 'Gestion de Riesgo',
    orden: 4,
    publicado: true,
    videoUrl: VIDEO,
    descripcion: 'Aprende a calcular exactamente cuántos contratos de MNQ operar en función de tu riesgo definido y el stop loss de la señal.',
    contenido: `<h2>Position Sizing: la fórmula</h2>

<p>El tamaño de posición no es una decisión arbitraria. Es el resultado de una fórmula matemática que parte de tu riesgo definido.</p>

<h3>La fórmula</h3>
<pre style="background:#0d0d0d;padding:1rem;border-radius:8px;color:#C9A84C">
Contratos = Riesgo en $ / (Stop en puntos × Valor del punto)
</pre>

<h3>Valor del punto en MNQ</h3>
<ul>
  <li>Cada punto de MNQ = <strong>$0.50</strong></li>
  <li>Cada tick de MNQ = <strong>$0.25</strong> (1 punto = 4 ticks)</li>
</ul>

<h3>Ejemplos prácticos</h3>

<p><strong>Ejemplo 1:</strong> Cuenta de $5,000, riesgo 2% = $100, stop loss de 10 puntos</p>
<pre style="background:#0d0d0d;padding:1rem;border-radius:8px;color:#f0ece4">
Contratos = $100 / (10 puntos × $0.50) = $100 / $5 = 20 contratos MNQ
</pre>

<p><strong>Ejemplo 2:</strong> Cuenta fondeo 50K, riesgo $100, stop de 20 puntos</p>
<pre style="background:#0d0d0d;padding:1rem;border-radius:8px;color:#f0ece4">
Contratos = $100 / (20 × $0.50) = $100 / $10 = 10 contratos MNQ
</pre>

<h3>Regla de escalado</h3>
<p>Si empiezas con <strong>1 contrato</strong> y tienes una cuenta pequeña ($2,000-$5,000), eso es perfectamente correcto. No te apresures a operar más contratos. Escala solo cuando:</p>
<ul>
  <li>Tu win rate sea estable por 60+ días</li>
  <li>Tu drawdown no supere el 10% del capital</li>
  <li>La fórmula lo indique matemáticamente</li>
</ul>

<h3>Regla de margen en futuros</h3>
<p>Verifica siempre que tengas suficiente margen para la cantidad de contratos. En IBKR, el margen intradía del MNQ es aproximadamente <strong>$40-$50 por contrato</strong>.</p>`,
  },

  // ─── CAPÍTULO 5: PSICOLOGÍA DEL TRADER ───────────────────────────────────

  {
    titulo: 'Dopamina del Proceso, No del Resultado',
    categoria: 'Psicologia del Trader',
    orden: 1,
    publicado: true,
    videoUrl: VIDEO,
    descripcion: 'El cambio mental más importante: reprograma tu cerebro para sentir satisfacción al seguir el plan, no al ganar dinero. Aquí empieza la consistencia.',
    contenido: `<h2>El problema de la dopamina mal calibrada</h2>

<p>El 95% de los traders que fracasan no lo hacen por falta de un buen sistema. Fracasan porque su cerebro está programado para buscar dopamina en el lugar equivocado: en el dinero ganado.</p>

<p>Cuando tu satisfacción viene de ganar dinero, tu cerebro te sabotea. Te hace:</p>
<ul>
  <li>Mover el stop loss para "darle más tiempo" a una posición perdedora</li>
  <li>Cerrar anticipadamente una posición ganadora por miedo a perder la ganancia</li>
  <li>Sobreoperar después de una pérdida para "recuperar"</li>
  <li>Aumentar el tamaño después de una racha ganadora por exceso de confianza</li>
</ul>

<h3>La reprogramación</h3>
<p>El objetivo es simple pero profundo: <strong>sentir satisfacción al seguir el plan, independientemente del resultado de la operación</strong>.</p>

<p>Esto no es motivación. Es neurología aplicada al trading.</p>

<h3>El ejercicio de reprogramación</h3>
<p>Al final de cada día de operativa, hazte esta única pregunta:</p>
<blockquote style="border-left:3px solid #22c55e;padding-left:1rem;color:#f0ece4;font-size:1.1rem">
  ¿Seguí mi plan al 100%?
</blockquote>
<p>Si la respuesta es <strong>sí</strong>: ese fue un <strong>buen día</strong> — sin importar si ganaste o perdiste dinero.</p>
<p>Si la respuesta es <strong>no</strong>: ese fue un <strong>mal día</strong> — sin importar si terminaste en verde.</p>

<h3>Por qué esto funciona</h3>
<p>Si sigues tu plan consistentemente durante 100 operaciones, y tu sistema tiene expectativa positiva, la matemática garantiza que serás rentable. La única variable que puedes controlar al 100% es la ejecución del plan — no el resultado de cada trade.</p>`,
  },

  {
    titulo: 'Desapego a los Resultados: Enfócate en tu Plan',
    categoria: 'Psicologia del Trader',
    orden: 2,
    publicado: true,
    videoUrl: VIDEO,
    descripcion: 'Aprende a separar emocionalmente el resultado de cada operación de tu valor como trader. La pérdida no eres tú — es el mercado ejerciendo probabilidades.',
    contenido: `<h2>El desapego como herramienta profesional</h2>

<p>Un médico que pierde un paciente no deja de ejercer la medicina. Analiza qué pasó, aprende, y sigue ayudando a los demás pacientes con el mismo protocolo.</p>

<p>Un trader profesional hace lo mismo: analiza las pérdidas, aprende, y sigue ejecutando el sistema sin cambiar las reglas por el resultado de un trade individual.</p>

<h3>La paradoja del control</h3>
<ul>
  <li><strong>No puedes controlar:</strong> si el mercado va a tu favor o en tu contra</li>
  <li><strong>Sí puedes controlar:</strong> si sigues las reglas de entrada, si colocas el stop, si respetas el target</li>
</ul>
<p>El desapego no es indiferencia. Es enfocar toda tu energía en lo que sí está bajo tu control.</p>

<h3>La frase que cambia todo</h3>
<blockquote style="border-left:3px solid #C9A84C;padding-left:1rem;color:#f0ece4;font-size:1.1rem">
  "Si seguiste tu plan y perdiste, fue un buen día.<br>
  Si no seguiste tu plan y ganaste, fue un mal día."
</blockquote>

<h3>Cómo manejar una racha de pérdidas</h3>
<ol>
  <li><strong>Detente y analiza:</strong> ¿seguiste el sistema en cada operación? Si sí, la racha es estadística normal.</li>
  <li><strong>Reduce el tamaño:</strong> baja temporalmente a 1 contrato para reducir el impacto psicológico.</li>
  <li><strong>No cambies el sistema:</strong> los peores errores ocurren cuando los traders modifican su sistema durante una racha perdedora.</li>
  <li><strong>Vuelve a simulación:</strong> si tienes 3+ días con ejecución inconsistente, regresa a Sim101 hasta recuperar la mecánica.</li>
</ol>

<h3>Journaling emocional</h3>
<p>Registra en el campo "Sentimiento" del Track Record cómo te sentiste en cada operación. Con el tiempo verás patrones: ¿en qué estados emocionales cometes más errores?</p>`,
  },

  {
    titulo: 'Mentalidad de Probabilidades y Consistencia',
    categoria: 'Psicologia del Trader',
    orden: 3,
    publicado: true,
    videoUrl: VIDEO,
    descripcion: 'El trading es un negocio de probabilidades a largo plazo, no de certezas en cada operación. Entiende por qué la consistencia supera siempre a la búsqueda del trade perfecto.',
    contenido: `<h2>El trading es probabilístico, no determinístico</h2>

<p>No existe el "trade perfecto" que siempre gana. No existe el sistema con 100% de win rate. El trading funciona como un casino: la ventaja no viene de cada mano individual, sino de jugar suficientes manos con ventaja matemática a tu favor.</p>

<h3>La analogía del casino</h3>
<p>El casino no sabe si la próxima mano de blackjack la ganará o la perderá. Pero sabe que después de 100,000 manos, habrá ganado porque tiene ventaja estadística del 0.5%.</p>
<p>Tu sistema de trading, si tiene expectativa positiva, funciona igual. Necesitas:</p>
<ul>
  <li>Un sistema con ventaja estadística (esto lo construiste en los capítulos anteriores)</li>
  <li>Suficientes operaciones para que la ventaja se materialice (mínimo 50-100)</li>
  <li>Disciplina para no interrumpir el proceso antes de llegar a esa muestra</li>
</ul>

<h3>La consistencia antes que la rentabilidad</h3>
<p>El objetivo del primer año no es ser millonario. El objetivo es demostrar, con datos, que puedes ejecutar un sistema de forma consistente durante 12 meses.</p>
<p>Si logras eso, la rentabilidad es consecuencia matemática inevitable.</p>

<h3>Checklist del trader consistente</h3>
<ul>
  <li>☐ Sigo mi plan en el 90%+ de las operaciones</li>
  <li>☐ Registro cada operación en el Track Record con honestidad</li>
  <li>☐ Reviso mis métricas semanalmente</li>
  <li>☐ No cambio las reglas del sistema durante períodos de pérdida</li>
  <li>☐ Tengo definida mi pérdida máxima diaria y la respeto siempre</li>
  <li>☐ Mi satisfacción viene de seguir el proceso, no de los resultados</li>
</ul>

<h3>El destino del trader consistente</h3>
<p>Los traders que llegan al año 2 y 3 siguiendo estos principios no son excepciones con suerte. Son la consecuencia lógica de aplicar matemáticas, disciplina y psicología correcta al mercado. Este curso te da las herramientas. La ejecución es tuya.</p>

<blockquote style="border-left:3px solid #C9A84C;padding-left:1rem;color:#C9A84C;font-style:italic">
  El mercado no tiene que darte nada. Tú tienes que tomar lo que el sistema te ofrece, cuando te lo ofrece, exactamente como está definido.
</blockquote>`,
  },
]

async function main() {
  console.log('🎓 Seeding academia...')

  // Clear existing lessons
  await prisma.leccionProgreso.deleteMany({})
  await prisma.leccion.deleteMany({})
  console.log('  ✓ Lecciones anteriores eliminadas')

  for (const l of lecciones) {
    await prisma.leccion.create({ data: l })
    console.log(`  ✓ ${l.categoria.padEnd(30)} → ${l.titulo}`)
  }

  console.log(`\n✅ ${lecciones.length} lecciones creadas correctamente`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

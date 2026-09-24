// Generado por prisma/academia/build.py desde prisma/academia/lecciones.py — no editar a mano.
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const lecciones = [
  {
    "titulo": "Bienvenido al club: cómo vas a trabajar",
    "descripcion": "Los tres pilares del club, la ruta que vas a seguir y lo que se espera de ti al final: tu propia estrategia en el portafolio comunitario.",
    "contenido": "<h2>Un negocio, no una apuesta</h2> <p>Este club no te enseña a adivinar el mercado. Te enseña a construir un <strong>sistema</strong>: estrategias que se programan, se validan con estadística y se operan con reglas fijas, medidas con un track record propio.</p> <h3>Los tres pilares</h3> <ol> <li><strong>Video clases</strong> — la infraestructura (Claude Code, tu app de track record) y el método para crear estrategias con Claude Code, NinjaTrader 8 y Obsidian.</li> <li><strong>Portafolio comunitario</strong> — 6 bots validados que instalas desde la primera semana, mientras aprendes.</li> <li><strong>Cuenta fondeada de $200k</strong> — un pase directo de PJ Capital para operar con capital de la mesa.</li> </ol> <h3>Tu ruta</h3> <ul> <li><strong>Día 1:</strong> activas tu cuenta fondeada e instalas NinjaTrader 8.</li> <li><strong>Semana 1:</strong> instalas el portafolio comunitario.</li> <li><strong>Semanas 2–8:</strong> recorres los módulos y construyes tu laboratorio.</li> <li><strong>Proyecto final:</strong> creas tu propia estrategia, la validas y la compartes con la comunidad.</li> </ul> <blockquote style=\"border-left:3px solid #C9A84C;padding-left:1rem;color:#C9A84C;font-style:italic\">Un backtest bonito no es un backtest fiable. Aquí aprendes a distinguirlos.</blockquote>",
    "videoUrl": null,
    "orden": 1,
    "categoria": "01 · Infraestructura del negocio",
    "publicado": true
  },
  {
    "titulo": "Tu estación de trabajo: equipo, VPS y suscripciones",
    "descripcion": "Lo que necesitas antes de empezar: una PC con Windows o un VPS para NinjaTrader 8 y tu suscripción a Claude para usar Claude Code.",
    "contenido": "<h2>Lo mínimo para operar un negocio algorítmico</h2> <h3>1. Una máquina que no se apague</h3> <p>NinjaTrader 8 solo corre en <strong>Windows</strong>. Tienes dos opciones:</p> <ul> <li><strong>Tu PC</strong> — válido para aprender y hacer backtests. Para operar bots en real, la PC debe quedar encendida y conectada durante la sesión.</li> <li><strong>Un VPS con Windows</strong> — un servidor en la nube que corre 24/7. Es lo recomendado cuando los bots operan capital: no depende de tu internet ni de tu luz.</li> </ul> <p>Referencia de recursos: 4 GB de RAM como mínimo (8 GB recomendado), 2 núcleos y disco SSD.</p> <h3>2. Tu suscripción a Claude</h3> <p>El club te enseña a usar <strong>Claude Code</strong>, pero la suscripción es tuya y no está incluida. El plan <strong>Pro ($20/mes)</strong> es suficiente para todo el curso.</p> <h3>3. Cuentas que vas a crear</h3> <ul> <li>NinjaTrader (gratis para simulación y backtest).</li> <li>GitHub (gratis) — para guardar tu código.</li> <li>Vercel (gratis) — para publicar tu app de track record.</li> <li>Obsidian (gratis) — tu laboratorio de investigación.</li> </ul>",
    "videoUrl": null,
    "orden": 2,
    "categoria": "01 · Infraestructura del negocio",
    "publicado": true
  },
  {
    "titulo": "Instalar y configurar Claude Code",
    "descripcion": "Instala Claude Code, inicia sesión con tu cuenta de Claude y aprende a darle contexto con un archivo CLAUDE.md.",
    "contenido": "<h2>Claude Code: tu desarrollador cuantitativo</h2> <p>Claude Code es un asistente de programación que trabaja en tu computadora: lee tus archivos, escribe código, lo ejecuta y corrige errores. Tú describes lo que quieres; él lo construye y tú revisas.</p> <h3>Instalación</h3> <ol> <li>Descarga Claude Code desde <strong>claude.com/claude-code</strong> (app de escritorio o terminal).</li> <li>Inicia sesión con la misma cuenta de tu suscripción Pro.</li> <li>Crea una carpeta de trabajo, por ejemplo <code>C:\\Trading\\liberty</code>, y abre Claude Code dentro de ella.</li> </ol> <h3>El archivo CLAUDE.md</h3> <p>Es la memoria del proyecto. Claude lo lee al empezar cada sesión. Escribe ahí lo que nunca debe olvidar:</p> <ul> <li>Qué instrumento operas (MNQ) y en qué sesión (RTH o ETH).</li> <li>Tus reglas innegociables: todo valor como parámetro, stop loss obligatorio, logs en cada entrada y salida.</li> <li>Dónde guardas las estrategias y los resultados.</li> </ul> <h3>Buenas prácticas</h3> <ul> <li>Pide una cosa a la vez y revisa el resultado antes de la siguiente.</li> <li>Si algo no compila, pega el error completo: Claude lo corrige mejor con el mensaje exacto.</li> <li>Nunca aceptes un \"funciona\" sin verlo compilar y correr tú mismo.</li> </ul>",
    "videoUrl": null,
    "orden": 3,
    "categoria": "01 · Infraestructura del negocio",
    "publicado": true
  },
  {
    "titulo": "Git y GitHub: tu código versionado",
    "descripcion": "Guarda cada versión de tus estrategias y de tu app con Git, y respáldalas en GitHub para no perder nunca un cambio.",
    "contenido": "<h2>Por qué versionar</h2> <p>Una estrategia pasa por decenas de versiones. Sin control de versiones no sabes qué cambió entre el backtest que funcionaba y el que dejó de funcionar. Git guarda cada cambio con su fecha y su motivo.</p> <h3>Lo esencial</h3> <ol> <li>Crea una cuenta en <strong>github.com</strong>.</li> <li>Pide a Claude Code: <em>\"inicializa un repositorio git en esta carpeta y súbelo a un repositorio privado de GitHub\"</em>.</li> <li>Cada vez que cierres un cambio importante, pide un <strong>commit</strong> con un mensaje claro: <em>\"RSI2: stop a 60 ticks, WFO ventana 3\"</em>.</li> </ol> <h3>Qué va en el repositorio</h3> <ul> <li>El código <code>.cs</code> de cada estrategia.</li> <li>Las exportaciones de resultados (CSV) y los registros de WFO.</li> <li>Tu app de track record (módulo 02).</li> </ul> <p>Qué <strong>no</strong> va: contraseñas, claves de API ni datos de tu cuenta del bróker.</p>",
    "videoUrl": null,
    "orden": 4,
    "categoria": "01 · Infraestructura del negocio",
    "publicado": true
  },
  {
    "titulo": "Por qué necesitas un track record propio",
    "descripcion": "Sin registro no hay negocio: cómo un track record honesto te dice si tu sistema funciona y te da credibilidad ante terceros.",
    "contenido": "<h2>Lo que no se mide, no se gestiona</h2> <p>Un track record es el historial completo de tus operaciones: ganadoras y perdedoras, sin recortes. Es la única forma de saber si tu sistema en real se parece a su backtest.</p> <h3>Qué te responde</h3> <ul> <li>¿El profit factor en real se parece al del Walk-Forward?</li> <li>¿El drawdown actual está dentro de lo esperado o es una señal de que el edge se rompió?</li> <li>¿Qué estrategia del portafolio aporta y cuál resta?</li> </ul> <h3>Las reglas de un track record honesto</h3> <ol> <li>Se registran <strong>todas</strong> las operaciones, no solo las buenas.</li> <li>Se registran con comisiones reales.</li> <li>No se borra nada. Si hubo un error, se anota como error.</li> </ol> <blockquote style=\"border-left:3px solid #C9A84C;padding-left:1rem;color:#C9A84C;font-style:italic\">Publico mis pérdidas igual que mis ganancias. No vendo sueños — muestro datos.</blockquote>",
    "videoUrl": null,
    "orden": 1,
    "categoria": "02 · Tu app de track record",
    "publicado": true
  },
  {
    "titulo": "Crear tu app con Claude Code",
    "descripcion": "Construye paso a paso una aplicación web para registrar tus operaciones, con base de datos, sin escribir el código a mano.",
    "contenido": "<h2>De la idea a la app en una tarde</h2> <p>Vas a construir una aplicación web propia (Next.js) con una base de datos donde viven tus operaciones.</p> <h3>El pedido a Claude Code</h3> <p>Empieza con una descripción clara, por ejemplo:</p> <p><em>\"Crea una app Next.js con una base de datos Supabase para registrar operaciones de trading. Cada operación tiene: fecha, estrategia, instrumento, dirección, contratos, precio de entrada, precio de salida, comisiones y P&amp;L neto. Quiero una página para registrar y otra para ver el historial.\"</em></p> <h3>Cómo avanzar</h3> <ol> <li>Pide primero la estructura y la base de datos. Revisa que los campos sean los correctos.</li> <li>Después, el formulario de registro. Pruébalo con una operación real.</li> <li>Después, el historial. Verifica que los totales cuadren con tu bróker.</li> </ol> <p>Cada paso termina con un commit (módulo 01).</p>",
    "videoUrl": null,
    "orden": 2,
    "categoria": "02 · Tu app de track record",
    "publicado": true
  },
  {
    "titulo": "Publicar tu app: deploy en Vercel",
    "descripcion": "Pon tu app en internet con Vercel, conectada a GitHub, para que se actualice sola cada vez que guardas un cambio.",
    "contenido": "<h2>Tu track record, en tu propio dominio</h2> <ol> <li>Crea una cuenta en <strong>vercel.com</strong> usando tu GitHub.</li> <li>Importa el repositorio de tu app.</li> <li>Configura las variables de entorno (las claves de la base de datos). Nunca las subas al repositorio.</li> <li>Pulsa Deploy. En un par de minutos tienes una URL pública.</li> </ol> <h3>Cómo se actualiza</h3> <p>Cada vez que haces push a la rama principal, Vercel publica la nueva versión. Por eso: prueba antes de hacer push.</p> <h3>Opcional: tu dominio</h3> <p>Puedes conectar un dominio propio desde el panel de Vercel. Un track record en tu dominio transmite profesionalismo.</p>",
    "videoUrl": null,
    "orden": 3,
    "categoria": "02 · Tu app de track record",
    "publicado": true
  },
  {
    "titulo": "Métricas y curva de capital en tu app",
    "descripcion": "Agrega a tu app las métricas que importan — neto, drawdown, profit factor, win rate — y la curva de capital de cada estrategia.",
    "contenido": "<h2>Del listado al tablero</h2> <p>Un historial de operaciones no dice nada por sí solo. Pide a Claude Code que calcule y grafique:</p> <ul> <li><strong>Beneficio neto</strong> total y por estrategia.</li> <li><strong>Drawdown máximo</strong> — la mayor caída desde un pico. Es la métrica clave.</li> <li><strong>Profit factor</strong> — ganancias brutas ÷ pérdidas brutas.</li> <li><strong>Win rate</strong> — siempre junto al ratio riesgo/beneficio.</li> <li><strong>Curva de capital</strong> acumulada, total y por estrategia.</li> </ul> <h3>Compara real vs backtest</h3> <p>Guarda también las métricas del Walk-Forward de cada estrategia y muéstralas al lado de las reales. Si el drawdown real supera con claridad el peor caso de Montecarlo, esa estrategia se revisa.</p>",
    "videoUrl": null,
    "orden": 4,
    "categoria": "02 · Tu app de track record",
    "publicado": true
  },
  {
    "titulo": "Instalar NinjaTrader 8 y conectar datos",
    "descripcion": "Instala NinjaTrader 8, conecta la simulación y descarga el histórico que vas a usar en tus backtests.",
    "contenido": "<h2>NinjaTrader 8: backtest y ejecución</h2> <ol> <li>Descarga NinjaTrader 8 desde <strong>ninjatrader.com</strong> e instálalo.</li> <li>Crea tu usuario. La simulación y el Strategy Analyzer son gratuitos.</li> <li>Conéctate (Connections) para recibir datos. La cuenta <strong>Sim101</strong> te permite operar en simulación.</li> </ol> <h3>Configuración clave</h3> <ul> <li><strong>Zona horaria:</strong> Tools → Options → General. Todas las estrategias del club asumen hora de Nueva York (<em>Eastern Standard Time</em>).</li> <li><strong>Histórico:</strong> descarga datos de NQ y MNQ desde el Historical Data Manager. Cuantos más años, mejor el backtest.</li> <li><strong>Plantilla de sesión:</strong> define si el gráfico usa RTH (sesión regular) o ETH (sesión completa). Cambia por completo el resultado de las medias móviles.</li> </ul>",
    "videoUrl": null,
    "orden": 1,
    "categoria": "03 · NinjaTrader 8 y el portafolio comunitario",
    "publicado": true
  },
  {
    "titulo": "Activar tu cuenta fondeada de $200k (PJ Capital)",
    "descripcion": "Activa el pase directo de PJ Capital incluido en tu inscripción, conecta la cuenta a NinjaTrader y conoce sus reglas.",
    "contenido": "<h2>Capital de la mesa, no el tuyo</h2> <p>Tu inscripción incluye un <strong>pase directo a una cuenta fondeada de $200,000 en PJ Capital</strong>. Directo significa que no pasas una prueba de evaluación.</p> <h3>Activación</h3> <ol> <li>Recibirás los datos de activación por WhatsApp o email tras tu inscripción.</li> <li>Completa el registro en PJ Capital con tus datos reales (se usan para los pagos).</li> <li>Conecta la cuenta en NinjaTrader 8 (Connections) con las credenciales que te entreguen.</li> </ol> <h3>Lee las reglas antes de operar</h3> <ul> <li><strong>Drawdown máximo</strong> permitido y cómo se calcula.</li> <li><strong>Reglas de consistencia</strong> para solicitar retiros.</li> <li>Horarios y noticias en las que no se permite operar, si aplica.</li> </ul> <p>Los bots del portafolio están pensados para respetar límites de drawdown, pero la responsabilidad de configurar el tamaño es tuya (módulo 09).</p>",
    "videoUrl": null,
    "orden": 2,
    "categoria": "03 · NinjaTrader 8 y el portafolio comunitario",
    "publicado": true
  },
  {
    "titulo": "Instalar los 6 bots del portafolio comunitario",
    "descripcion": "Importa el código de las 6 estrategias en NinjaTrader 8, compílalo y configúralo en tus gráficos.",
    "contenido": "<h2>El portafolio que recibes</h2> <p>Seis estrategias sobre MNQ, validadas por separado y en conjunto:</p> <ul> <li><strong>Overnight Drift</strong> — prima nocturna.</li> <li><strong>RSI2 Reversion</strong> — reversión a la media.</li> <li><strong>ZigZag Breakout</strong> — ruptura.</li> <li><strong>Weekend Effect</strong> — estacional.</li> <li><strong>Momentum de Apertura</strong> — momentum.</li> <li><strong>IBS Reversion</strong> — reversión a la media.</li> </ul> <h3>Instalación</h3> <ol> <li>Descarga los archivos desde la sección del portafolio comunitario.</li> <li>En NinjaTrader: Tools → Import → NinjaScript Add-On, o copia los <code>.cs</code> a la carpeta <code>Documents\\NinjaTrader 8\\bin\\Custom\\Strategies</code>.</li> <li>Abre el NinjaScript Editor y compila (F5). No debe haber errores.</li> <li>Agrega cada estrategia a su gráfico con la temporalidad y la sesión indicadas en su ficha.</li> </ol> <p>Empieza en <strong>Sim101</strong> unos días para confirmar que cada bot entra y sale como describe su ficha.</p>",
    "videoUrl": null,
    "orden": 3,
    "categoria": "03 · NinjaTrader 8 y el portafolio comunitario",
    "publicado": true
  },
  {
    "titulo": "Operar el portafolio día a día",
    "descripcion": "La rutina diaria de un operador de bots: revisar conexiones, confirmar ejecuciones y registrar resultados.",
    "contenido": "<h2>Operar bots no es \"encender y olvidar\"</h2> <h3>Antes de la sesión</h3> <ul> <li>NinjaTrader conectado y con las estrategias habilitadas (en verde).</li> <li>La cuenta correcta seleccionada en cada estrategia.</li> <li>Sin posiciones abiertas inesperadas.</li> </ul> <h3>Después de la sesión</h3> <ul> <li>Compara las operaciones del día con lo que la estrategia debía hacer.</li> <li>Registra todo en tu app de track record.</li> <li>Revisa el Output de NinjaTrader: los logs te dicen por qué entró o salió cada bot.</li> </ul> <h3>Cuándo intervenir</h3> <p>Casi nunca. Apagar un bot después de una pérdida es la forma más común de destruir un sistema rentable. Solo se interviene por fallas técnicas o si la estrategia sale de los rangos de su Montecarlo.</p>",
    "videoUrl": null,
    "orden": 4,
    "categoria": "03 · NinjaTrader 8 y el portafolio comunitario",
    "publicado": true
  },
  {
    "titulo": "Configurar tu bóveda de investigación",
    "descripcion": "Organiza Obsidian como laboratorio: ideas, tesis, backtests y diario de trading enlazados entre sí.",
    "contenido": "<h2>Un laboratorio, no una libreta</h2> <p>Obsidian guarda notas en texto plano y las enlaza entre sí. En seis meses vas a tener decenas de ideas y backtests; sin orden, repetirás pruebas que ya descartaste.</p> <h3>Estructura recomendada</h3> <ul> <li><strong>00-Ideas</strong> — cada idea de estrategia, en una línea, antes de programarla.</li> <li><strong>10-Estrategias</strong> — una nota por estrategia con su tesis (siguiente lección).</li> <li><strong>20-Backtests</strong> — una nota por corrida: fecha, parámetros, métricas y conclusión.</li> <li><strong>30-Diario</strong> — lo que pasó cada semana con el portafolio en real.</li> <li><strong>90-Descartadas</strong> — las ideas que murieron y por qué. Es la carpeta más valiosa.</li> </ul> <h3>Enlázalo todo</h3> <p>Usa <code>[[nombre de la nota]]</code> para conectar cada backtest con su estrategia. La vista de grafo te mostrará qué ideas generaron más trabajo.</p>",
    "videoUrl": null,
    "orden": 1,
    "categoria": "04 · Obsidian: tu laboratorio quant",
    "publicado": true
  },
  {
    "titulo": "La plantilla de tesis de una estrategia",
    "descripcion": "Escribe la tesis de cada estrategia antes de programarla: qué edge busca, por qué debería existir y qué no cumple.",
    "contenido": "<h2>Primero la tesis, después el código</h2> <p>Cada estrategia del portafolio tiene una tesis escrita. Copia esta plantilla en tu bóveda:</p> <ol> <li><strong>En una frase:</strong> qué hace la estrategia.</li> <li><strong>El edge:</strong> por qué debería existir esa ventaja (comportamiento, estructura del mercado, estacionalidad).</li> <li><strong>Especificación:</strong> instrumento, temporalidad, sesión, zona horaria, entrada, filtro, salida, stop.</li> <li><strong>Métricas:</strong> las del Walk-Forward, no las del optimizador.</li> <li><strong>Lo que no cumple:</strong> los criterios que la estrategia no pasa.</li> </ol> <blockquote style=\"border-left:3px solid #C9A84C;padding-left:1rem;color:#C9A84C;font-style:italic\">Si un dato incomoda, se publica igual. La sección «lo que no cumple» no es opcional.</blockquote>",
    "videoUrl": null,
    "orden": 2,
    "categoria": "04 · Obsidian: tu laboratorio quant",
    "publicado": true
  },
  {
    "titulo": "De discrecional a sistemático",
    "descripcion": "Qué cambia cuando pasas de operar con tu criterio a operar reglas que un programa ejecuta y una estadística valida.",
    "contenido": "<h2>El cambio de mentalidad</h2> <p>El trader discrecional decide en el momento. El trader sistemático decide <strong>antes</strong>, con reglas escritas, y deja que el programa ejecute.</p> <h3>Lo que ganas</h3> <ul> <li><strong>Medición:</strong> una regla se puede probar sobre 10 años de datos. Una intuición no.</li> <li><strong>Consistencia:</strong> el bot no tiene miedo ni euforia.</li> <li><strong>Escala:</strong> puedes operar varias estrategias a la vez sin mirar la pantalla.</li> </ul> <h3>Lo que tienes que aceptar</h3> <ul> <li>Habrá meses en pérdida. En el histórico del portafolio, alrededor de 1 de cada 3 meses cerró en negativo.</li> <li>La mayoría de tus ideas no pasarán la validación. Eso es el proceso funcionando.</li> <li>Nunca dirás que una estrategia \"funciona\": dirás que <em>habría funcionado</em> en esas condiciones.</li> </ul>",
    "videoUrl": null,
    "orden": 1,
    "categoria": "05 · Fundamentos cuantitativos",
    "publicado": true
  },
  {
    "titulo": "Anatomía de un edge",
    "descripcion": "Los cuatro tipos de ventaja estadística que usamos — momentum, reversión a la media, estacional y ruptura — con ejemplos del portafolio.",
    "contenido": "<h2>¿De dónde sale la ventaja?</h2> <p>Una estrategia rentable explota un comportamiento que se repite. En el portafolio usamos cuatro familias:</p> <ul> <li><strong>Momentum</strong> — lo que se mueve fuerte tiende a seguir moviéndose. <em>Ejemplo: Momentum de Apertura.</em></li> <li><strong>Reversión a la media</strong> — tras un exceso, el precio tiende a volver. <em>Ejemplos: RSI2 Reversion, IBS Reversion.</em></li> <li><strong>Estacional</strong> — ciertos momentos del calendario o del día se comportan distinto. <em>Ejemplos: Weekend Effect, Overnight Drift.</em></li> <li><strong>Ruptura</strong> — cuando el precio rompe un rango, suele extenderse. <em>Ejemplo: ZigZag Breakout.</em></li> </ul> <h3>Por qué mezclarlas</h3> <p>Cada familia gana en regímenes de mercado distintos. Por eso un portafolio con las cuatro sufre mucho menos que cualquiera de ellas sola (módulo 09).</p>",
    "videoUrl": null,
    "orden": 2,
    "categoria": "05 · Fundamentos cuantitativos",
    "publicado": true
  },
  {
    "titulo": "Las 6 métricas que importan",
    "descripcion": "De las docenas que devuelve el Strategy Analyzer, solo seis deciden. Qué mide cada una y qué umbral buscar.",
    "contenido": "<h2>Solo seis números deciden</h2> <ul> <li><strong>Net Profit</strong> — ganancia tras comisiones. Mayor a $0; es la menos importante de las importantes.</li> <li><strong>Profit Factor</strong> — ganancias brutas ÷ pérdidas brutas. Mayor a 1.5 es bueno.</li> <li><strong>Max Drawdown</strong> — la mayor caída desde un pico. Menos del 20% del capital. <strong>Es la métrica clave.</strong></li> <li><strong>Win Rate</strong> — % de operaciones ganadoras. Mayor a 40%, acompañado de un PF alto.</li> <li><strong>Sharpe Ratio</strong> — rentabilidad ajustada al riesgo. 0.8 aceptable, más de 1 decente.</li> <li><strong>Avg Bars/Trade</strong> — duración media en velas. Al menos 2, obligatorio.</li> </ul> <h3>Muestra mínima: 200 operaciones</h3> <p>Por debajo de eso cualquier conclusión es anécdota.</p> <h3>El win rate engaña solo</h3> <p>Un 90% de aciertos con riesgo/beneficio 1:13 pierde dinero; un 35% con 1:3 gana. Calcula el win rate de equilibrio: <code>riesgo ÷ (riesgo + beneficio)</code>. Con TP $150 y SL $2,000 necesitas 93% de aciertos solo para empatar.</p>",
    "videoUrl": null,
    "orden": 3,
    "categoria": "05 · Fundamentos cuantitativos",
    "publicado": true
  },
  {
    "titulo": "El proceso de 9 pasos",
    "descripcion": "El camino que recorre toda estrategia, de la especificación a la cuenta real, sin saltarse la validación.",
    "contenido": "<h2>De la idea al dinero real</h2> <ol start=\"0\"> <li><strong>Especificación</strong> — cerrar ambigüedades antes de escribir código.</li> <li><strong>Idea y objetivo</strong> — qué edge se busca.</li> <li><strong>Idea de estrategia</strong> — activo, temporalidad, indicadores, disparo y gestión de riesgo.</li> <li><strong>Código + los 4 Mandamientos</strong> — si falla uno, se reconstruye.</li> <li><strong>Optimización bruta</strong> — o descarte.</li> <li><strong>Optimización fina</strong>.</li> <li><strong>Elección de variante</strong> — la meseta, no el pico.</li> <li><strong>Walk-Forward</strong> — pruebas de robustez.</li> <li><strong>Montecarlo</strong> — peor caso y riesgo de ruina.</li> <li><strong>Incubación</strong> en simulación con parámetros congelados, y recién entonces, <strong>real</strong>.</li> </ol> <blockquote style=\"border-left:3px solid #C9A84C;padding-left:1rem;color:#C9A84C;font-style:italic\">Descartar una idea en la optimización es un resultado exitoso del proceso, no un fracaso.</blockquote>",
    "videoUrl": null,
    "orden": 1,
    "categoria": "06 · De la idea al código",
    "publicado": true
  },
  {
    "titulo": "Paso 0: la especificación",
    "descripcion": "Las ocho preguntas que debes responder antes de programar. Cada una ha roto backtests reales.",
    "contenido": "<h2>Ocho preguntas antes de la primera línea</h2> <ol> <li><strong>Instrumento y tick:</strong> MNQ = $0.50/tick · NQ = $5/tick · MES = $1.25/tick · ES = $12.50/tick.</li> <li><strong>Sesión RTH o ETH:</strong> cambia por completo cualquier media móvil.</li> <li><strong>Zona horaria del gráfico:</strong> si la lógica está en hora de Nueva York, el gráfico debe estar en Eastern.</li> <li><strong>Precisión temporal:</strong> ¿la lógica necesita segundos? La serie principal no basta.</li> <li><strong>Calculate:</strong> <code>OnBarClose</code> por defecto, para evitar ver el futuro.</li> <li><strong>Entradas por día:</strong> ¿una o varias?</li> <li><strong>Cierre de sesión:</strong> ¿qué pasa con la posición abierta?</li> <li><strong>Datos:</strong> ¿desde cuándo son fiables?</li> </ol> <p>Si no sabes la respuesta a una, no programes todavía: asumir mal cuesta horas de backtests inválidos.</p>",
    "videoUrl": null,
    "orden": 2,
    "categoria": "06 · De la idea al código",
    "publicado": true
  },
  {
    "titulo": "Programar tu estrategia con Claude Code",
    "descripcion": "Cómo pedirle a Claude Code una estrategia de NinjaScript que compile a la primera y cumpla las reglas innegociables.",
    "contenido": "<h2>Tú defines la lógica, Claude escribe el C#</h2> <h3>Un buen pedido incluye</h3> <ul> <li>Las respuestas del Paso 0.</li> <li>La regla de entrada, el filtro, la salida y el stop, en lenguaje natural.</li> <li>Las reglas innegociables (siguiente lista).</li> </ul> <h3>Reglas innegociables del código</h3> <ul> <li>Todo valor numérico como <strong>parámetro</strong> (NinjaScriptProperty). Si no es parámetro, no se puede optimizar.</li> <li><strong>Stop loss obligatorio.</strong> El take profit es opcional.</li> <li><strong>Logs</strong> en cada entrada, salida y P&amp;L. Sin logs no se puede depurar.</li> <li><strong>Cierre de seguridad por horario</strong>, aunque la estrategia cierre sola al final de la sesión.</li> <li>Comentarios que expliquen el <em>porqué</em>, no el qué.</li> </ul> <h3>El ciclo</h3> <p>Pide el código → cópialo al NinjaScript Editor → compila (F5) → si hay error, pega el mensaje completo a Claude → repite hasta compilar → corre un primer backtest.</p>",
    "videoUrl": null,
    "orden": 3,
    "categoria": "06 · De la idea al código",
    "publicado": true
  },
  {
    "titulo": "Los 4 Mandamientos del backtest fiable",
    "descripcion": "El filtro que aplicamos después de programar y antes de optimizar. Si falla uno, la estrategia se reconstruye.",
    "contenido": "<h2>Antes de optimizar, verifica los cuatro</h2> <ol> <li><strong>Stop loss de al menos 40 ticks.</strong> Con stops más ajustados, el simulador no sabe si el precio tocó primero el stop o el objetivo dentro de la vela: adivina.</li> <li><strong>Avg Bars/Trade de al menos 2.</strong> Si la operación dura menos de 2 velas, el motor resuelve entrada y salida en la misma vela. Es la métrica más ignorada y la que más backtests invalida.</li> <li><strong>Velas válidas.</strong> Datos sin huecos y una temporalidad coherente con la lógica.</li> <li><strong>Entrada al open de la vela siguiente.</strong> La señal se evalúa al cierre y se ejecuta en la apertura siguiente. Entrar con información de la misma vela es hacer trampa al pasado.</li> </ol> <p>Repórtalos con el número concreto: <em>\"SL = 60 ticks ✅ · Avg bars/trade = 26,4 ✅\"</em>, nunca con un \"cumple\".</p> <blockquote style=\"border-left:3px solid #C9A84C;padding-left:1rem;color:#C9A84C;font-style:italic\">Optimizar un backtest que miente solo produce una mentira más precisa.</blockquote>",
    "videoUrl": null,
    "orden": 1,
    "categoria": "07 · Los 4 Mandamientos",
    "publicado": true
  },
  {
    "titulo": "Las 4 formas en que un backtest miente",
    "descripcion": "Datos defectuosos, look-ahead, sobreoptimización y simulación imprecisa: cómo detectar cada una y qué concluye (y qué no) un backtest.",
    "contenido": "<h2>Conoce al enemigo</h2> <ol> <li><strong>Datos defectuosos</strong> — huecos o errores en el histórico. Basura entra, basura sale.</li> <li><strong>Look-ahead bias</strong> — la estrategia usa información que en tiempo real no tendría.</li> <li><strong>Sobreoptimización</strong> — parámetros ajustados hasta que el pasado es perfecto. Se detecta con Walk-Forward.</li> <li><strong>Simulación imprecisa</strong> — el motor desconoce el recorrido dentro de la vela. Lo cubren los Mandamientos 1 y 2.</li> </ol> <h3>Configuración de backtest recomendada</h3> <ul> <li>5 a 10 años de datos.</li> <li>Comisiones siempre activadas y realistas.</li> <li>Slippage de al menos 1 tick (el portafolio usa 2).</li> </ul> <h3>Una curva demasiado perfecta es sospechosa</h3> <p>Buscamos una curva que suba, con caídas pequeñas y que se recuperen rápido. Si parece una línea recta, casi siempre es sobreoptimización.</p>",
    "videoUrl": null,
    "orden": 2,
    "categoria": "07 · Los 4 Mandamientos",
    "publicado": true
  },
  {
    "titulo": "Optimización: la meseta, no el pico",
    "descripcion": "Cómo usar el optimizador como brújula, qué parámetros optimizar y cómo elegir una variante robusta.",
    "contenido": "<h2>El optimizador es una brújula, no un veredicto</h2> <p>El optimizador encuentra los parámetros que mejor funcionaron en el pasado: los memoriza. Sus números no se creen; solo te dicen dónde buscar.</p> <h3>El plan</h3> <ol> <li><strong>Fase bruta:</strong> rangos amplios y pasos grandes. Si ninguna zona da PF mayor a 1.3, se descarta.</li> <li><strong>Fase fina:</strong> rangos estrechos alrededor de la zona prometedora.</li> </ol> <h3>Qué optimizar</h3> <ul> <li><strong>Sí:</strong> umbrales del disparo, parámetros de riesgo y periodos centrales de la tesis.</li> <li><strong>No:</strong> horarios con razón estructural, número de contratos, lo que impone la lógica del edge.</li> <li>Más de 4 o 5 parámetros a la vez y el Walk-Forward deja de ser confiable.</li> </ul> <h3>La meseta</h3> <p>Elige un set de parámetros rodeado de vecinos con resultados parecidos. Un pico aislado entre resultados malos es ruido.</p>",
    "videoUrl": null,
    "orden": 1,
    "categoria": "08 · Optimización, Walk-Forward y Montecarlo",
    "publicado": true
  },
  {
    "titulo": "Walk-Forward: el número que decide",
    "descripcion": "Cómo validar en datos que la estrategia nunca vio, cómo configurar las ventanas y cómo leer el veredicto.",
    "contenido": "<h2>La regla de oro</h2> <p>Si el optimizador da PF 2.5 y el Walk-Forward da PF 1.1, la estrategia <strong>no es robusta</strong>. El número que decide es siempre el del Walk-Forward.</p> <h3>Cómo funciona</h3> <p>Divide los datos en ventanas. En cada una optimiza en un tramo (In-Sample) y prueba en el tramo siguiente, que nunca vio (Out-of-Sample). La cadena de tramos OOS es lo más parecido a haber operado en real.</p> <h3>Configuración de referencia</h3> <ul> <li>Ventana de optimización: <strong>548 días</strong> (18 meses). Ventana de prueba: <strong>183 días</strong> (6 meses).</li> <li>El In-Sample debe cubrir tendencia alcista, crisis y lateral, y generar al menos 200 operaciones.</li> <li>Guarda al menos 12 meses finales sin tocar hasta el final.</li> </ul> <h3>Veredicto</h3> <ul> <li><strong>APTA:</strong> PF promedio OOS ≥ 1.3 · eficiencia (WFE) ≥ 50% · ≥ 75% de ventanas rentables · ≥ 200 operaciones OOS.</li> <li><strong>REVISAR:</strong> PF OOS ≥ 1.0 y WFE ≥ 35%.</li> <li><strong>DESCARTAR:</strong> el resto.</li> </ul> <p>Registra cada corrida en el Excel de registro de WFO del club.</p>",
    "videoUrl": null,
    "orden": 2,
    "categoria": "08 · Optimización, Walk-Forward y Montecarlo",
    "publicado": true
  },
  {
    "titulo": "Montecarlo e incubación",
    "descripcion": "Estima el peor drawdown posible reordenando tus operaciones y deja la estrategia en simulación antes de darle capital.",
    "contenido": "<h2>El peor caso que todavía no viste</h2> <p>El drawdown del backtest es solo <em>un</em> orden posible de las operaciones. Montecarlo las reordena miles de veces y te dice qué tan mal podría ir.</p> <h3>Qué obtienes</h3> <ul> <li><strong>Drawdown peor caso</strong> (por ejemplo, el percentil 95).</li> <li><strong>Riesgo de ruina</strong> para tu tamaño de cuenta.</li> </ul> <p>Si el peor caso supera el drawdown máximo permitido por tu cuenta fondeada, reduce el tamaño o no la operes.</p> <h3>Incubación</h3> <p>Con los parámetros <strong>congelados</strong>, la estrategia corre en simulación unas semanas. Solo pasa a real si se comporta dentro de lo esperado por el Walk-Forward y el Montecarlo.</p>",
    "videoUrl": null,
    "orden": 3,
    "categoria": "08 · Optimización, Walk-Forward y Montecarlo",
    "publicado": true
  },
  {
    "titulo": "El poder de diversificar",
    "descripcion": "Por qué seis estrategias juntas caen mucho menos que cualquiera por separado, con los números reales del portafolio.",
    "contenido": "<h2>Juntas son otra cosa</h2> <p>En el backtest del portafolio (enero 2015 – agosto 2026, MNQ, 1 contrato por estrategia):</p> <ul> <li>Si sumas los peores drawdowns de cada estrategia por separado: <strong>−$15,994</strong>.</li> <li>El peor drawdown real del portafolio operando junto: <strong>−$4,099</strong>.</li> <li>Una reducción del <strong>74.4%</strong>, porque sus peores días no coinciden.</li> </ul> <h3>Lo que cambia la mirada</h3> <p>Por separado, ninguna estrategia supera un Neto/Drawdown de 9.2. Juntas, el portafolio llega a <strong>21.8</strong>. Una estrategia mediocre sola puede ser valiosa dentro de un portafolio si gana cuando las demás pierden.</p> <p>Por eso una estrategia se evalúa con criterios de portafolio antes de descartarla: ZigZag Breakout estuvo fuera 24 horas y volvió cuando se midió su aporte al conjunto.</p>",
    "videoUrl": null,
    "orden": 1,
    "categoria": "09 · Gestión de portafolio",
    "publicado": true
  },
  {
    "titulo": "Correlación, tamaño y reglas de la cuenta",
    "descripcion": "Cómo correr varios bots sin que se pisen: correlación entre estrategias, tamaño de posición y límites de la cuenta fondeada.",
    "contenido": "<h2>Varios bots, una sola cuenta</h2> <h3>Correlación</h3> <p>Dos estrategias muy correlacionadas son casi la misma apuesta dos veces. Mira sobre todo la correlación en los <strong>peores días</strong>: es la que define tu drawdown.</p> <h3>Tamaño de posición</h3> <ul> <li>Empieza con 1 contrato MNQ por estrategia, como en el backtest.</li> <li>Sube el tamaño solo cuando el drawdown real esté dentro del peor caso de Montecarlo.</li> <li>El número de contratos no se optimiza: se decide con el riesgo.</li> </ul> <h3>Reglas de la cuenta fondeada</h3> <p>Suma los drawdowns peor caso de las estrategias que corres a la vez y compáralo con el límite de tu cuenta. Deja margen: el pasado no garantiza el futuro.</p>",
    "videoUrl": null,
    "orden": 2,
    "categoria": "09 · Gestión de portafolio",
    "publicado": true
  },
  {
    "titulo": "Tu estrategia al portafolio comunitario",
    "descripcion": "El proyecto final: crea tu propia estrategia, valídala con el proceso completo y compártela con la comunidad.",
    "contenido": "<h2>De alumno a aportante</h2> <p>El proyecto final es tu propia estrategia, recorriendo el proceso completo. Si pasa el filtro, se suma al portafolio comunitario y todos los miembros se benefician.</p> <h3>Lo que debes entregar</h3> <ol> <li><strong>La tesis</strong> en la plantilla del módulo 04, incluida la sección \"lo que no cumple\".</li> <li><strong>El código</strong> <code>.cs</code> que compile y cumpla las reglas innegociables.</li> <li><strong>Los 4 Mandamientos</strong> reportados con sus números.</li> <li><strong>El registro de Walk-Forward</strong> con el veredicto.</li> <li><strong>El Montecarlo</strong> con el drawdown peor caso.</li> <li><strong>Su aporte al portafolio:</strong> cómo cambian el drawdown y el Neto/DD del conjunto al sumarla.</li> </ol> <h3>Qué pasa si no pasa</h3> <p>Documentas por qué se descartó y lo compartes igual. Una idea descartada con datos le ahorra semanas de trabajo a toda la comunidad.</p> <blockquote style=\"border-left:3px solid #C9A84C;padding-left:1rem;color:#C9A84C;font-style:italic\">El portafolio crece con cada alumno. El tuyo puede ser el próximo bot.</blockquote>",
    "videoUrl": null,
    "orden": 1,
    "categoria": "10 · Proyecto final",
    "publicado": true
  }
]

async function main() {
  console.log('🎓 Seeding academia...')
  await prisma.leccionProgreso.deleteMany({})
  await prisma.leccion.deleteMany({})
  for (const l of lecciones) {
    await prisma.leccion.create({ data: l })
    console.log(`  ✓ ${l.categoria} → ${l.titulo}`)
  }
  console.log(`\n✅ ${lecciones.length} lecciones creadas`)
}

main().catch(console.error).finally(() => prisma.$disconnect())

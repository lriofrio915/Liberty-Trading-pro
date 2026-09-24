"""
Temario de la Academia — Liberty Trading Club (trading algorítmico cuantitativo).

Fuente única del contenido de las lecciones. `python prisma/academia/build.py`
genera a partir de aquí:
  - prisma/seed-academia.ts  (seed de Prisma, reemplaza todas las lecciones)
  - prisma/academia/lecciones.sql (INSERT para aplicar directo en Supabase)

El contenido es HTML. La Academia convierte cada salto de línea en <br/>, así
que build.py compacta el HTML a una sola línea: escribe aquí con saltos libres.
Usa CMD() para comandos de PowerShell y PROMPT() para prompts de Claude Code:
la Academia les agrega un botón «Copiar».
"""

MODULOS = [
    '01 · Infraestructura del negocio',
    '02 · Tu panel de negocio de trading',
    '03 · NinjaTrader 8 y el portafolio comunitario',
    '04 · Obsidian: tu laboratorio quant',
    '05 · Fundamentos cuantitativos',
    '06 · De la idea al código',
    '07 · Los 4 Mandamientos',
    '08 · Optimización, Walk-Forward y Montecarlo',
    '09 · Gestión de portafolio',
    '10 · Proyecto final',
]

NOTA = '<blockquote style="border-left:3px solid #C9A84C;padding-left:1rem;color:#C9A84C;font-style:italic">{}</blockquote>'

# Bloques con botón «Copiar» (la Academia lo agrega a todo <pre>).
# Van en una sola línea: build.py colapsa los espacios del HTML.
_PRE = ('<pre data-tipo="{tipo}" style="background:#0b0b0b;border:1px solid #2a2a2a;border-left:3px solid {borde};'
        'border-radius:8px;padding:12px 14px;margin:10px 0 16px;white-space:pre-wrap;word-break:break-word;'
        'font-size:13px;line-height:1.55;color:#e8e4dc"><span style="display:block;font-size:10px;letter-spacing:.12em;'
        'text-transform:uppercase;color:{borde};margin-bottom:6px">{etiqueta}</span><code>{texto}</code></pre>')


def _escapar(texto: str) -> str:
    return texto.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def CMD(texto: str) -> str:
    """Un comando para pegar en PowerShell."""
    return _PRE.format(tipo='cmd', borde='#6b6460', etiqueta='PowerShell', texto=_escapar(texto))


def PROMPT(texto: str) -> str:
    """Un prompt para pegar en Claude Code."""
    return _PRE.format(tipo='prompt', borde='#C9A84C', etiqueta='Prompt para Claude Code', texto=_escapar(texto))

LECCIONES = [
    # ─── 01 · Infraestructura del negocio ────────────────────────────────────
    dict(
        modulo=0,
        titulo='Bienvenido al club: cómo vas a trabajar',
        descripcion='Los tres pilares del club, la ruta que vas a seguir y lo que se espera de ti al final: tu propia estrategia en el portafolio comunitario.',
        contenido='''
<h2>Un negocio, no una apuesta</h2>
<p>Este club no te enseña a adivinar el mercado. Te enseña a montar un <strong>negocio de trading algorítmico</strong>: estrategias que se programan, se validan con estadística, se operan con reglas fijas y se administran con números, como cualquier empresa.</p>
<h3>Los tres pilares</h3>
<ol>
  <li><strong>Video clases</strong> — la infraestructura (Claude Code y tu panel de negocio conectado a NinjaTrader) y el método para crear estrategias con Claude Code, NinjaTrader 8 y Obsidian.</li>
  <li><strong>Portafolio comunitario</strong> — 6 bots validados que instalas desde la primera semana, mientras aprendes.</li>
  <li><strong>Cuenta fondeada de $200k</strong> — un pase directo de PJ Capital para operar con capital de la mesa.</li>
</ol>
<h3>Tu ruta</h3>
<ul>
  <li><strong>Día 1:</strong> preparas tu computadora o VPS, instalas Claude Code y activas tu cuenta fondeada.</li>
  <li><strong>Semana 1:</strong> instalas el portafolio comunitario en NinjaTrader 8.</li>
  <li><strong>Semanas 2–3:</strong> construyes tu panel de negocio, conectado a tu cuenta para ver ingresos, egresos y métricas en automático.</li>
  <li><strong>Semanas 3–8:</strong> aprendes a crear y validar estrategias.</li>
  <li><strong>Proyecto final:</strong> creas tu propia estrategia y la compartes con la comunidad.</li>
</ul>
<h3>Cómo usar las lecciones</h3>
<p>Cada vez que veas un recuadro con el botón <strong>Copiar</strong>, es un comando o un prompt listo para usar: cópialo tal cual y pégalo en PowerShell o en Claude Code. Donde veas texto entre corchetes, como <code>[TU NOMBRE]</code>, reemplázalo por tus datos.</p>
''' + NOTA.format('Un backtest bonito no es un backtest fiable. Aquí aprendes a distinguirlos.'),
    ),
    dict(
        modulo=0,
        titulo='Tu estación de trabajo: computadora, VPS y cuentas',
        descripcion='Lo que necesitas antes de empezar: una PC con Windows o un VPS para NinjaTrader 8, tu suscripción a Claude y las cuentas gratuitas que vas a usar.',
        contenido='''
<h2>Lo mínimo para operar un negocio algorítmico</h2>
<h3>1. Una máquina con Windows</h3>
<p>NinjaTrader 8 solo corre en <strong>Windows</strong>. Tienes dos opciones:</p>
<ul>
  <li><strong>Tu PC</strong> — válido para aprender y hacer backtests. Para operar bots, la PC debe quedar encendida y conectada toda la sesión.</li>
  <li><strong>Un VPS con Windows</strong> — un servidor en la nube que corre 24/7. Es lo recomendado cuando los bots operan capital: no depende de tu internet ni de tu luz. Te conectas a él con <em>Conexión a Escritorio remoto</em> y lo usas como una PC normal.</li>
</ul>
<p>Referencia: 8 GB de RAM (4 GB como mínimo), 2 núcleos, disco SSD y Windows 10/11 o Windows Server 2022/2025. Todo lo que instalemos en el curso se instala igual en tu PC o en el VPS.</p>
<h3>2. Tu suscripción a Claude</h3>
<p>El club te enseña a usar <strong>Claude Code</strong>, pero la suscripción es tuya y no está incluida. El plan <strong>Pro ($20/mes)</strong> es suficiente para todo el curso. Contrátalo en <strong>claude.ai</strong>.</p>
<h3>3. Cuentas gratuitas que vas a crear</h3>
<ul>
  <li><strong>NinjaTrader</strong> — plataforma de backtest y ejecución.</li>
  <li><strong>GitHub</strong> — guarda el código de tu panel y de tus estrategias.</li>
  <li><strong>Supabase</strong> — la base de datos de tu negocio.</li>
  <li><strong>Vercel</strong> — publica tu panel en internet.</li>
  <li><strong>Obsidian</strong> — tu laboratorio de investigación.</li>
</ul>
<p>Usa el mismo correo en todas: te facilitará conectar unas con otras.</p>
''',
    ),
    dict(
        modulo=0,
        titulo='Preparar Windows: Git, Node.js y GitHub desde PowerShell',
        descripcion='Instala con comandos las herramientas que Claude Code necesita para trabajar: Git, Node.js y la terminal de GitHub.',
        contenido='''
<h2>Abre PowerShell</h2>
<p>Pulsa la tecla <strong>Windows</strong>, escribe <strong>PowerShell</strong> y abre <em>Windows PowerShell</em>. Todo lo que sigue se escribe ahí: copia cada comando, pégalo con clic derecho y pulsa Enter.</p>
<h3>1. Comprueba que tienes winget</h3>
<p>winget es el instalador de programas de Windows. Si responde con un número de versión, sigue al paso 2.</p>
''' + CMD('winget --version') + '''
<p>Si dice que no se reconoce el comando (pasa en algunos VPS con Windows Server), instala cada programa desde su página: <strong>git-scm.com</strong>, <strong>nodejs.org</strong> (versión LTS) y <strong>cli.github.com</strong>, y salta al paso 3.</p>
<h3>2. Instala Git, Node.js y GitHub CLI</h3>
<p><strong>Git</strong> guarda las versiones de tu código. <strong>Node.js</strong> hace funcionar tu panel web. <strong>GitHub CLI</strong> conecta tu computadora con GitHub.</p>
''' + CMD('winget install --id Git.Git -e --source winget') + CMD('winget install --id OpenJS.NodeJS.LTS -e --source winget') + CMD('winget install --id GitHub.cli -e --source winget') + '''
<p>Acepta los permisos que te pida Windows. Cuando terminen los tres, <strong>cierra PowerShell y ábrelo de nuevo</strong> para que reconozca los programas nuevos.</p>
<h3>3. Verifica la instalación</h3>
<p>Cada comando debe responder con un número de versión:</p>
''' + CMD('git --version; node --version; npm --version; gh --version') + '''
<h3>4. Permite ejecutar scripts de npm</h3>
<p>Windows bloquea por defecto los scripts de PowerShell y eso rompe comandos como <code>npm run dev</code>. Este comando lo permite solo para tu usuario:</p>
''' + CMD('Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force') + '''
<h3>5. Preséntate ante Git y conecta GitHub</h3>
<p>Reemplaza tu nombre y tu correo (el mismo de tu cuenta de GitHub):</p>
''' + CMD('git config --global user.name "[TU NOMBRE]"') + CMD('git config --global user.email "[TU CORREO]"') + CMD('gh auth login') + '''
<p>En <code>gh auth login</code> elige: <em>GitHub.com</em> → <em>HTTPS</em> → <em>Yes</em> → <em>Login with a web browser</em>. Copia el código que te muestra, pulsa Enter y pégalo en el navegador.</p>
''',
    ),
    dict(
        modulo=0,
        titulo='Instalar Claude Code desde PowerShell',
        descripcion='Instala Claude Code con un solo comando, inicia sesión con tu cuenta de Claude y aprende lo básico para trabajar con él.',
        contenido='''
<h2>Claude Code: tu desarrollador cuantitativo</h2>
<p>Claude Code es un asistente de programación que trabaja dentro de tu computadora: lee tus archivos, escribe código, lo ejecuta y corrige errores. Tú describes lo que quieres; él lo construye; tú revisas.</p>
<h3>1. Instálalo</h3>
<p>En PowerShell (no hace falta abrirlo como administrador), pega este comando oficial de Anthropic:</p>
''' + CMD('irm https://claude.ai/install.ps1 | iex') + '''
<p>Cuando termine, <strong>cierra PowerShell y ábrelo de nuevo</strong>, y comprueba la instalación:</p>
''' + CMD('claude --version') + '''
<p>Si algo no funciona, este comando revisa tu instalación y te dice qué falta:</p>
''' + CMD('claude doctor') + '''
<h3>2. Crea tu carpeta de trabajo</h3>
<p>Todo el curso vive en una carpeta. Créala y entra en ella:</p>
''' + CMD('mkdir C:\\Trading; cd C:\\Trading') + '''
<h3>3. Abre Claude Code e inicia sesión</h3>
''' + CMD('claude') + '''
<p>La primera vez te pedirá iniciar sesión: elige la opción de <strong>tu cuenta de Claude (suscripción Pro)</strong>. Se abrirá el navegador; autoriza el acceso y vuelve a PowerShell.</p>
<h3>4. Lo básico dentro de Claude Code</h3>
<ul>
  <li>Escribe lo que quieres en español y pulsa Enter.</li>
  <li>Claude te pedirá permiso antes de crear archivos o ejecutar comandos: lee qué va a hacer y acepta.</li>
  <li><strong>Esc</strong> detiene lo que está haciendo.</li>
  <li><code>/clear</code> empieza una conversación nueva (úsalo al cambiar de tema).</li>
  <li><code>/help</code> muestra la ayuda. Para salir, escribe <code>/exit</code> o cierra la ventana.</li>
</ul>
<h3>Prueba de fuego</h3>
<p>Pega este prompt para confirmar que todo funciona:</p>
''' + PROMPT('Revisa que tengo instalados Git, Node.js, npm y GitHub CLI, y que GitHub CLI tiene la sesión iniciada. Dime la versión de cada uno y si falta algo para empezar el curso de Liberty Trading Club.'),
    ),
    dict(
        modulo=0,
        titulo='Dale memoria a Claude: el archivo CLAUDE.md',
        descripcion='Crea el archivo que Claude lee al empezar cada sesión, con tus reglas de trading y de trabajo, para no repetirlas nunca.',
        contenido='''
<h2>La memoria de tu proyecto</h2>
<p>Claude no recuerda conversaciones anteriores, pero lee el archivo <strong>CLAUDE.md</strong> de la carpeta cada vez que empieza. Ahí va todo lo que nunca debe olvidar.</p>
<p>Dentro de Claude Code, en tu carpeta <code>C:\\Trading</code>, pega este prompt:</p>
''' + PROMPT('Crea un archivo CLAUDE.md en esta carpeta con estas reglas para todas nuestras sesiones: (1) Soy alumno de Liberty Trading Club y opero futuros MNQ en NinjaTrader 8 con una cuenta fondeada de PJ Capital. (2) Explícame en español, paso a paso y sin tecnicismos innecesarios. (3) En estrategias de NinjaScript: todo valor numérico debe ser un parámetro (NinjaScriptProperty), el stop loss es obligatorio, cada entrada y salida se registra con Print en el Output, se usa Calculate.OnBarClose y hay un cierre de seguridad por horario. (4) Nunca me digas que una estrategia funciona por un backtest: di que habría funcionado en esas condiciones. (5) Nunca escribas contraseñas ni claves en el código ni las subas a GitHub: van en archivos .env que están en .gitignore. (6) Antes de borrar o sobrescribir algo importante, pregúntame.') + '''
<h3>Buenas prácticas con Claude Code</h3>
<ul>
  <li><strong>Una cosa a la vez.</strong> Pide un paso, revísalo y luego el siguiente.</li>
  <li><strong>Pega el error completo.</strong> Si algo falla, copia el mensaje exacto; Claude lo corrige mucho mejor.</li>
  <li><strong>Verifica tú.</strong> No aceptes un "listo" sin ver el resultado funcionando.</li>
  <li><strong>Actualiza el CLAUDE.md</strong> cada vez que descubras una regla nueva. Puedes pedírselo: <em>"agrega esta regla al CLAUDE.md"</em>.</li>
</ul>
''',
    ),
    dict(
        modulo=0,
        titulo='Git y GitHub: tu código versionado',
        descripcion='Guarda cada versión de tu panel y de tus estrategias con Git y respáldalas en GitHub, pidiéndoselo a Claude Code.',
        contenido='''
<h2>Por qué versionar</h2>
<p>Tu panel y tus estrategias van a pasar por decenas de versiones. Sin control de versiones no sabes qué cambió entre la versión que funcionaba y la que dejó de funcionar. Git guarda cada cambio con su fecha y su motivo; GitHub lo respalda en la nube.</p>
<h3>Subir un proyecto a GitHub por primera vez</h3>
<p>Dentro de la carpeta del proyecto, en Claude Code:</p>
''' + PROMPT('Inicializa un repositorio git en esta carpeta, crea un .gitignore adecuado (que excluya node_modules, .next y todos los archivos .env), haz el primer commit y crea un repositorio PRIVADO en mi cuenta de GitHub con gh para subirlo. Al final muéstrame el enlace del repositorio.') + '''
<h3>Guardar cambios cada día</h3>
<p>Cada vez que cierres una mejora que funciona:</p>
''' + PROMPT('Revisa los cambios que hicimos, haz un commit con un mensaje claro en español que describa qué cambió y súbelo a GitHub.') + '''
<h3>Volver atrás si algo se rompe</h3>
''' + PROMPT('Algo dejó de funcionar. Muéstrame los últimos 10 commits con su descripción y explícame cómo volver a la última versión que funcionaba sin perder el historial.') + '''
<p>Qué <strong>nunca</strong> va a GitHub: contraseñas, claves de API, el token de tu panel ni datos de acceso de tu cuenta de PJ Capital.</p>
''',
    ),

    # ─── 02 · Tu panel de negocio de trading ─────────────────────────────────
    dict(
        modulo=1,
        titulo='Más que un track record: el panel de tu negocio',
        descripcion='Qué vas a construir: una web propia, conectada a tu cuenta de PJ Capital en NinjaTrader, que muestra en automático ingresos, egresos y métricas de tu negocio.',
        contenido='''
<h2>Administra tu trading como una empresa</h2>
<p>Un track record solo guarda operaciones. Lo que vas a construir es el <strong>panel de administración de tu negocio</strong>: sabes en todo momento cuánto ganas, cuánto gastas, cuánto riesgo tienes y qué estrategia aporta o resta.</p>
<h3>Qué vas a ver sin escribir nada a mano</h3>
<ul>
  <li><strong>Hoy:</strong> P&amp;L realizado, operaciones, comisiones y saldo de la cuenta.</li>
  <li><strong>El mes:</strong> ingresos, egresos y el resultado neto del negocio.</li>
  <li><strong>Riesgo:</strong> tu drawdown actual y cuánto te falta para el límite de PJ Capital.</li>
  <li><strong>Por estrategia:</strong> neto, win rate y profit factor de cada bot.</li>
  <li><strong>Curva de capital</strong> de la cuenta.</li>
</ul>
<h3>Cómo funciona</h3>
<ol>
  <li><strong>NinjaTrader 8</strong> ejecuta tus bots en tu cuenta de PJ Capital.</li>
  <li>Un complemento que vas a instalar en NinjaTrader (<em>LibertyReporter</em>) envía cada ejecución y el saldo de la cuenta a tu panel.</li>
  <li><strong>Tu panel web</strong> (Next.js, publicado en Vercel) recibe esos datos con una clave secreta.</li>
  <li><strong>Supabase</strong> los guarda en tu base de datos.</li>
  <li>El panel calcula las métricas y te las muestra.</li>
</ol>
<p>Lo único que registras a mano son los gastos que NinjaTrader no conoce (VPS, suscripciones, datos de mercado) y los retiros que te pague la mesa.</p>
''' + NOTA.format('Lo que no se mide, no se gestiona. Y lo que no se gestiona, no es un negocio.'),
    ),
    dict(
        modulo=1,
        titulo='Crear tu panel con Claude Code',
        descripcion='Crea el proyecto web de tu panel con un prompt, córrelo en tu computadora y súbelo a GitHub.',
        contenido='''
<h2>El esqueleto del panel</h2>
<p>En PowerShell, entra a tu carpeta de trabajo y abre Claude Code:</p>
''' + CMD('cd C:\\Trading; claude') + '''
<p>Pega este prompt:</p>
''' + PROMPT('Crea una aplicación web con Next.js (App Router), TypeScript y Tailwind CSS en una carpeta nueva llamada mi-negocio-trading. Será el panel de administración de mi negocio de trading algorítmico. Por ahora quiero: un menú lateral con Tablero, Operaciones, Gastos y Configuración; y en el Tablero cuatro secciones vacías: Resumen del día, Mes en curso (ingresos y egresos), Riesgo de la cuenta y Rendimiento por estrategia. Diseño oscuro, sobrio y legible en celular. No conectes ninguna base de datos todavía. Cuando termines, córrelo en local, verifica que compila sin errores y dime qué dirección abrir en el navegador.') + '''
<h3>Míralo funcionar</h3>
<p>Claude te dará una dirección, normalmente <strong>http://localhost:3000</strong>. Ábrela en el navegador. Si quieres correrlo tú más tarde:</p>
''' + CMD('cd C:\\Trading\\mi-negocio-trading; npm run dev') + '''
<p>Para detenerlo, pulsa <strong>Ctrl + C</strong> en PowerShell.</p>
<h3>Guárdalo en GitHub</h3>
<p>Dentro de Claude Code, en la carpeta <code>mi-negocio-trading</code>, usa el prompt de la lección <em>Git y GitHub</em> para crear el repositorio privado.</p>
''',
    ),
    dict(
        modulo=1,
        titulo='Conectar Supabase: la base de datos de tu negocio',
        descripcion='Crea tu proyecto en Supabase, conecta el panel y crea las tablas donde se guardarán ejecuciones, saldos, gastos y retiros.',
        contenido='''
<h2>Dónde viven tus datos</h2>
<p><strong>Supabase</strong> es una base de datos en la nube, gratuita para empezar. Ahí se guardará todo lo que envíe NinjaTrader y todo lo que registres.</p>
<h3>1. Crea tu proyecto en Supabase</h3>
<ol>
  <li>Entra a <strong>supabase.com</strong> y crea una cuenta con tu GitHub.</li>
  <li>Pulsa <strong>New project</strong>. Nombre: <em>mi-negocio-trading</em>. Crea una contraseña fuerte para la base de datos y <strong>guárdala</strong>. Región: la más cercana a ti (por ejemplo, <em>East US</em>).</li>
  <li>Espera un par de minutos a que termine de crearse.</li>
</ol>
<h3>2. Prepara la conexión en tu panel</h3>
<p>En Claude Code, dentro de <code>mi-negocio-trading</code>:</p>
''' + PROMPT('Conecta este proyecto a Supabase. Instala @supabase/supabase-js y @supabase/ssr. Crea un archivo .env.local con estas variables vacías para que yo las llene: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY e INGEST_TOKEN. Verifica que .env.local esté en .gitignore. Crea un cliente de Supabase para el navegador y otro para el servidor; el del servidor es el único que puede usar la SUPABASE_SERVICE_ROLE_KEY. Genera un valor aleatorio largo para INGEST_TOKEN y escríbelo en .env.local.') + '''
<h3>3. Copia tus claves</h3>
<p>En Supabase, ve a <strong>Project Settings → API</strong> y copia en <code>.env.local</code>:</p>
<ul>
  <li><strong>Project URL</strong> → <code>NEXT_PUBLIC_SUPABASE_URL</code></li>
  <li><strong>anon public</strong> → <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
  <li><strong>service_role</strong> → <code>SUPABASE_SERVICE_ROLE_KEY</code> (es secreta: nunca la compartas)</li>
</ul>
<h3>4. Crea las tablas</h3>
''' + PROMPT('Escribe un archivo supabase/schema.sql con las tablas de mi negocio: (1) cuentas: nombre (el nombre exacto de la cuenta en NinjaTrader, único), proveedor, capital_inicial, limite_drawdown y creada_en. (2) ejecuciones: cuenta, estrategia, instrumento, direccion (compra o venta), cantidad, precio, comision, ejecutada_en y execution_id único para no guardar duplicados. (3) operaciones: cuenta, estrategia, instrumento, direccion, cantidad, entrada_en, salida_en, precio_entrada, precio_salida, pnl_bruto, comisiones y pnl_neto. (4) snapshots_cuenta: cuenta, saldo, pnl_realizado_dia y registrado_en. (5) gastos: concepto, categoria (datos, plataforma, fondeo, vps, suscripciones, otros), monto, frecuencia (unico, mensual, anual) y fecha. (6) retiros: cuenta, monto, fecha y estado (solicitado, pagado). Todas con id y fecha de creación. Activa Row Level Security en todas y crea índices por cuenta y fecha. Explícame en palabras simples qué hace el SQL antes de que yo lo ejecute.') + '''
<p>Abre el archivo <code>supabase/schema.sql</code>, copia todo su contenido y pégalo en Supabase → <strong>SQL Editor</strong> → <strong>New query</strong> → <strong>Run</strong>. Luego revisa en <strong>Table Editor</strong> que aparezcan las seis tablas.</p>
<h3>5. Registra tu cuenta de PJ Capital</h3>
<p>En <strong>Table Editor → cuentas → Insert row</strong>, agrega tu cuenta con su nombre exacto en NinjaTrader (lo ves en la pestaña <em>Accounts</em> del Control Center), el capital de $200,000 y el límite de drawdown que indiquen las reglas de PJ Capital.</p>
''',
    ),
    dict(
        modulo=1,
        titulo='Conectar NinjaTrader y tu cuenta de PJ Capital',
        descripcion='Crea la puerta de entrada de tu panel y el complemento LibertyReporter para que NinjaTrader envíe cada ejecución y tu saldo en automático.',
        contenido='''
<h2>Datos en automático, sin escribir nada</h2>
<p>Vas a crear dos piezas: una <strong>puerta de entrada</strong> en tu panel que solo acepta datos con tu clave secreta, y un <strong>complemento para NinjaTrader</strong> que envía cada ejecución y el saldo de la cuenta.</p>
<h3>1. La puerta de entrada del panel</h3>
<p>En Claude Code, dentro de <code>mi-negocio-trading</code>:</p>
''' + PROMPT('Crea un endpoint POST en /api/ninjatrader que reciba eventos de NinjaTrader 8. Debe: (1) responder 401 si el header Authorization no es exactamente "Bearer " seguido del INGEST_TOKEN de .env.local; (2) aceptar dos tipos de evento en JSON: "ejecucion" (cuenta, estrategia, instrumento, direccion, cantidad, precio, comision, ejecutada_en, execution_id) y "snapshot" (cuenta, saldo, pnl_realizado_dia, registrado_en); (3) validar los campos y responder 400 con un mensaje claro si falta alguno; (4) guardar las ejecuciones en la tabla ejecuciones ignorando duplicados por execution_id, y los snapshots en snapshots_cuenta, usando el cliente de servidor con la service role; (5) responder {"ok": true}. Después dame un comando de PowerShell con Invoke-RestMethod para probarlo en local con una ejecución de ejemplo, y verifica que la fila aparece en Supabase.') + '''
<h3>2. El complemento para NinjaTrader</h3>
<p>Ahora el complemento. Reemplaza <code>[NOMBRE DE TU CUENTA]</code> por el nombre exacto de tu cuenta de PJ Capital en NinjaTrader:</p>
''' + PROMPT('Escribe un AddOn de NinjaScript para NinjaTrader 8 llamado LibertyReporter, en un archivo LibertyReporter.cs listo para copiar a Documentos\\NinjaTrader 8\\bin\\Custom\\AddOns. Al inicio del archivo deja tres constantes que yo pueda editar: NOMBRE_CUENTA = "[NOMBRE DE TU CUENTA]", URL_PANEL = "http://localhost:3000" y TOKEN = "" (ahí pegaré mi INGEST_TOKEN). El AddOn debe: (1) al iniciar NinjaTrader, buscar esa cuenta y suscribirse a su evento ExecutionUpdate; (2) por cada ejecución, enviar a URL_PANEL + "/api/ninjatrader" un POST JSON de tipo "ejecucion" con cuenta, nombre de la estrategia u orden, instrumento, dirección, cantidad, precio, comisión, hora en UTC (ISO 8601) y ExecutionId, con el header Authorization: Bearer TOKEN; (3) cada 5 minutos enviar un evento "snapshot" con el saldo (AccountItem.CashValue) y el P&L realizado del día (AccountItem.RealizedProfitLoss); (4) hacer los envíos en segundo plano para no congelar NinjaTrader, reintentar hasta 3 veces si fallan y registrar cada envío y cada error en la ventana Output de NinjaScript; (5) usar System.Net.WebClient para no necesitar referencias adicionales; (6) desuscribirse de los eventos al cerrar. Comenta en español el porqué de cada parte.') + '''
<h3>3. Instálalo en NinjaTrader</h3>
<ol>
  <li>Copia <code>LibertyReporter.cs</code> a <code>Documentos\\NinjaTrader 8\\bin\\Custom\\AddOns</code>.</li>
  <li>Abre el archivo y pega tu <code>INGEST_TOKEN</code> (el de <code>.env.local</code>) en la constante <code>TOKEN</code>.</li>
  <li>En NinjaTrader: <strong>New → NinjaScript Editor</strong> y pulsa <strong>F5</strong> para compilar. No debe haber errores; si los hay, pégalos completos en Claude Code.</li>
  <li>Abre <strong>New → NinjaScript Output</strong> para ver los mensajes del complemento.</li>
</ol>
<h3>4. Pruébalo primero en simulación</h3>
<ol>
  <li>Cambia temporalmente <code>NOMBRE_CUENTA</code> a <code>Sim101</code>, compila y deja tu panel corriendo con <code>npm run dev</code>.</li>
  <li>Abre una orden manual de 1 MNQ en Sim101 y ciérrala.</li>
  <li>En el Output debe aparecer el envío, y en Supabase → Table Editor → <strong>ejecuciones</strong> deben aparecer las dos ejecuciones.</li>
  <li>Si funciona, vuelve a poner el nombre de tu cuenta de PJ Capital y compila de nuevo.</li>
</ol>
''' + PROMPT('El AddOn LibertyReporter no está enviando datos. Este es el mensaje del Output de NinjaTrader: [PEGA AQUÍ EL MENSAJE]. Y esta es la respuesta del panel en la terminal: [PEGA AQUÍ]. Encuentra la causa y corrígela.'),
    ),
    dict(
        modulo=1,
        titulo='Los egresos del negocio: gastos y retiros',
        descripcion='Registra lo que NinjaTrader no conoce — VPS, suscripciones, datos, fondeo — y los retiros que te paga la mesa, para ver el resultado real del negocio.',
        contenido='''
<h2>Ganar en la cuenta no es lo mismo que ganar en el negocio</h2>
<p>Tu cuenta puede estar en positivo y tu negocio en negativo si no cuentas lo que te cuesta operar. Las comisiones llegan solas desde NinjaTrader; el resto lo registras una vez y el panel lo reparte por mes.</p>
<h3>Egresos típicos</h3>
<ul>
  <li><strong>VPS</strong> — mensual.</li>
  <li><strong>Suscripción a Claude</strong> — $20 al mes.</li>
  <li><strong>Datos de mercado y plataforma</strong> — según tu configuración de NinjaTrader.</li>
  <li><strong>Fondeo</strong> — pases o evaluaciones de nuevas cuentas.</li>
  <li><strong>Comisiones</strong> — automáticas desde las ejecuciones.</li>
</ul>
<h3>Ingresos reales</h3>
<p>El P&amp;L de la cuenta fondeada es una ganancia en papel hasta que la mesa te paga. Por eso registramos los <strong>retiros</strong>: lo solicitado y lo efectivamente pagado.</p>
<h3>El prompt</h3>
''' + PROMPT('Crea la página Gastos con un formulario para registrar gastos (concepto, categoría, monto, frecuencia y fecha) y una tabla con los gastos registrados que permita editarlos y eliminarlos. Crea también una sección Retiros en la misma página para registrar retiros de la cuenta fondeada con su estado (solicitado o pagado). Agrega una función que calcule el egreso de un mes: gastos únicos de ese mes, más gastos mensuales, más la doceava parte de los gastos anuales, más las comisiones de las ejecuciones de ese mes. Muestra ese total arriba de la página.') + '''
<p>Registra ahora mismo tus gastos actuales. Es la base para saber si tu negocio es rentable.</p>
''',
    ),
    dict(
        modulo=1,
        titulo='El tablero: las métricas de tu negocio',
        descripcion='Protege tu panel con inicio de sesión, reconstruye las operaciones a partir de las ejecuciones y arma el tablero con todas las métricas de gestión.',
        contenido='''
<h2>Tres prompts, un tablero completo</h2>
<p>Ve uno por uno. Revisa que cada paso funcione antes de pegar el siguiente.</p>
<h3>1. Solo tú entras</h3>
''' + PROMPT('Protege todo el panel con inicio de sesión usando Supabase Auth con enlace mágico por correo. Solo debe poder entrar mi correo: [TU CORREO]. Cualquier otro correo debe ver un mensaje de acceso denegado. El endpoint /api/ninjatrader debe seguir funcionando sin sesión porque se protege con el INGEST_TOKEN. Crea las políticas de Row Level Security necesarias y dame el SQL para ejecutarlo en Supabase.') + '''
<p>En Supabase → <strong>Authentication → URL Configuration</strong> agrega <code>http://localhost:3000</code> como Site URL mientras pruebas en local.</p>
<h3>2. De ejecuciones a operaciones</h3>
''' + PROMPT('Crea una función que reconstruya las operaciones a partir de la tabla ejecuciones: agrupa por cuenta, estrategia e instrumento, empareja cada entrada con su salida (considerando cantidades parciales) y calcula pnl_bruto con el valor del punto de cada instrumento (MNQ = $2 por punto, NQ = $20, MES = $5, ES = $50), comisiones y pnl_neto. Guarda el resultado en la tabla operaciones sin duplicar. Ejecútala cada vez que llegue una ejecución de salida al endpoint /api/ninjatrader. Muestra las operaciones en la página Operaciones con filtros por fecha y estrategia.') + '''
<h3>3. El tablero</h3>
''' + PROMPT('Construye el Tablero leyendo de Supabase. (1) Resumen del día: P&L realizado, número de operaciones, comisiones y saldo actual de la cuenta (último snapshot). (2) Mes en curso: ingresos (P&L neto de operaciones y retiros pagados), egresos (la función de egresos del mes) y resultado neto del negocio, comparado con el mes anterior. (3) Riesgo de la cuenta: saldo máximo alcanzado, drawdown actual en dólares y en porcentaje, y cuánto falta para el limite_drawdown de la cuenta, con una barra que se ponga amarilla al 50% y roja al 80% del límite. (4) Rendimiento por estrategia: neto, operaciones, win rate, profit factor y promedio por operación. (5) Curva de capital con los snapshots de la cuenta. Refresca los datos cada minuto y que se vea bien en el celular.') + '''
<h3>Revisa que los números cuadren</h3>
<p>Al final de tu primera semana, compara el P&amp;L del panel con el reporte de NinjaTrader (<em>Account Performance</em>). Si no coinciden, pídele a Claude que busque la diferencia operación por operación.</p>
''',
    ),
    dict(
        modulo=1,
        titulo='Publicar tu panel en internet con Vercel',
        descripcion='Publica tu panel en Vercel, configura las claves y apunta NinjaTrader a la dirección pública para que el panel funcione 24/7.',
        contenido='''
<h2>Tu panel, disponible desde cualquier lugar</h2>
<p>Hasta ahora el panel corre en tu computadora. Publicado en Vercel, lo ves desde el celular y NinjaTrader le envía datos aunque tu PC esté apagada (siempre que NinjaTrader corra en tu VPS).</p>
<h3>1. Publica el proyecto</h3>
<ol>
  <li>Asegúrate de que tus últimos cambios estén en GitHub (prompt de la lección <em>Git y GitHub</em>).</li>
  <li>Entra a <strong>vercel.com</strong> con tu GitHub y pulsa <strong>Add New → Project</strong>.</li>
  <li>Importa el repositorio <em>mi-negocio-trading</em>.</li>
  <li>Antes de pulsar Deploy, abre <strong>Environment Variables</strong> y agrega las cuatro variables de tu <code>.env.local</code> con los mismos valores.</li>
  <li>Pulsa <strong>Deploy</strong>. En un par de minutos tendrás una dirección como <code>https://mi-negocio-trading.vercel.app</code>.</li>
</ol>
<h3>2. Actualiza el inicio de sesión</h3>
<p>En Supabase → <strong>Authentication → URL Configuration</strong>, cambia la Site URL a tu dirección de Vercel y agrégala en Redirect URLs.</p>
<h3>3. Apunta NinjaTrader al panel publicado</h3>
<p>Abre <code>LibertyReporter.cs</code>, cambia <code>URL_PANEL</code> por tu dirección de Vercel (sin barra al final) y compila con F5. Desde ahora cada ejecución llega directo a tu panel en internet.</p>
<h3>4. Cómo se actualiza</h3>
<p>Cada vez que subes cambios a GitHub, Vercel publica la nueva versión sola. Por eso: prueba en local con <code>npm run dev</code> antes de subir.</p>
''' + PROMPT('Revisa que mi panel esté listo para producción: que ninguna clave esté escrita en el código, que .env.local no esté en GitHub, que el endpoint /api/ninjatrader rechace peticiones sin token y que todas las páginas pidan inicio de sesión. Dime qué encontraste y corrige lo necesario.'),
    ),

    # ─── 03 · NinjaTrader 8 y el portafolio comunitario ──────────────────────
    dict(
        modulo=2,
        titulo='Instalar NinjaTrader 8 y conectar datos',
        descripcion='Instala NinjaTrader 8, conecta la simulación y descarga el histórico que vas a usar en tus backtests.',
        contenido='''
<h2>NinjaTrader 8: backtest y ejecución</h2>
<ol>
  <li>Descarga NinjaTrader 8 desde <strong>ninjatrader.com</strong> e instálalo.</li>
  <li>Crea tu usuario. La simulación y el Strategy Analyzer son gratuitos.</li>
  <li>Conéctate (Connections) para recibir datos. La cuenta <strong>Sim101</strong> te permite operar en simulación.</li>
</ol>
<h3>Configuración clave</h3>
<ul>
  <li><strong>Zona horaria:</strong> Tools → Options → General. Todas las estrategias del club asumen hora de Nueva York (<em>Eastern Standard Time</em>).</li>
  <li><strong>Histórico:</strong> descarga datos de NQ y MNQ desde el Historical Data Manager. Cuantos más años, mejor el backtest.</li>
  <li><strong>Plantilla de sesión:</strong> define si el gráfico usa RTH (sesión regular) o ETH (sesión completa). Cambia por completo el resultado de las medias móviles.</li>
</ul>
''',
    ),
    dict(
        modulo=2,
        titulo='Activar tu cuenta fondeada de $200k (PJ Capital)',
        descripcion='Activa el pase directo de PJ Capital incluido en tu inscripción, conecta la cuenta a NinjaTrader y conoce sus reglas.',
        contenido='''
<h2>Capital de la mesa, no el tuyo</h2>
<p>Tu inscripción incluye un <strong>pase directo a una cuenta fondeada de $200,000 en PJ Capital</strong>. Directo significa que no pasas una prueba de evaluación.</p>
<h3>Activación</h3>
<ol>
  <li>Recibirás los datos de activación por WhatsApp o email tras tu inscripción.</li>
  <li>Completa el registro en PJ Capital con tus datos reales (se usan para los pagos).</li>
  <li>Conecta la cuenta en NinjaTrader 8 (Connections) con las credenciales que te entreguen.</li>
</ol>
<h3>Lee las reglas antes de operar</h3>
<ul>
  <li><strong>Drawdown máximo</strong> permitido y cómo se calcula.</li>
  <li><strong>Reglas de consistencia</strong> para solicitar retiros.</li>
  <li>Horarios y noticias en las que no se permite operar, si aplica.</li>
</ul>
<p>Los bots del portafolio están pensados para respetar límites de drawdown, pero la responsabilidad de configurar el tamaño es tuya (módulo 09).</p>
''',
    ),
    dict(
        modulo=2,
        titulo='Instalar los 6 bots del portafolio comunitario',
        descripcion='Importa el código de las 6 estrategias en NinjaTrader 8, compílalo y configúralo en tus gráficos.',
        contenido='''
<h2>El portafolio que recibes</h2>
<p>Seis estrategias sobre MNQ, validadas por separado y en conjunto:</p>
<ul>
  <li><strong>Overnight Drift</strong> — prima nocturna.</li>
  <li><strong>RSI2 Reversion</strong> — reversión a la media.</li>
  <li><strong>ZigZag Breakout</strong> — ruptura.</li>
  <li><strong>Weekend Effect</strong> — estacional.</li>
  <li><strong>Momentum de Apertura</strong> — momentum.</li>
  <li><strong>IBS Reversion</strong> — reversión a la media.</li>
</ul>
<h3>Instalación</h3>
<ol>
  <li>Descarga los archivos desde la sección del portafolio comunitario.</li>
  <li>En NinjaTrader: Tools → Import → NinjaScript Add-On, o copia los <code>.cs</code> a la carpeta <code>Documents\\NinjaTrader 8\\bin\\Custom\\Strategies</code>.</li>
  <li>Abre el NinjaScript Editor y compila (F5). No debe haber errores.</li>
  <li>Agrega cada estrategia a su gráfico con la temporalidad y la sesión indicadas en su ficha.</li>
</ol>
<p>Empieza en <strong>Sim101</strong> unos días para confirmar que cada bot entra y sale como describe su ficha.</p>
''',
    ),
    dict(
        modulo=2,
        titulo='Operar el portafolio día a día',
        descripcion='La rutina diaria de un operador de bots: revisar conexiones, confirmar ejecuciones y registrar resultados.',
        contenido='''
<h2>Operar bots no es "encender y olvidar"</h2>
<h3>Antes de la sesión</h3>
<ul>
  <li>NinjaTrader conectado y con las estrategias habilitadas (en verde).</li>
  <li>La cuenta correcta seleccionada en cada estrategia.</li>
  <li>Sin posiciones abiertas inesperadas.</li>
</ul>
<h3>Después de la sesión</h3>
<ul>
  <li>Abre tu panel de negocio: las ejecuciones del día ya deben estar ahí, enviadas por LibertyReporter.</li>
  <li>Compara las operaciones del día con lo que cada estrategia debía hacer.</li>
  <li>Revisa el Output de NinjaTrader: los logs te dicen por qué entró o salió cada bot.</li>
  <li>Mira el riesgo de la cuenta en el panel: cuánto te falta para el límite de drawdown de PJ Capital.</li>
</ul>
<h3>Cuándo intervenir</h3>
<p>Casi nunca. Apagar un bot después de una pérdida es la forma más común de destruir un sistema rentable. Solo se interviene por fallas técnicas o si la estrategia sale de los rangos de su Montecarlo.</p>
''',
    ),

    # ─── 04 · Obsidian ────────────────────────────────────────────────────────
    dict(
        modulo=3,
        titulo='Configurar tu bóveda de investigación',
        descripcion='Organiza Obsidian como laboratorio: ideas, tesis, backtests y diario de trading enlazados entre sí.',
        contenido='''
<h2>Un laboratorio, no una libreta</h2>
<p>Obsidian guarda notas en texto plano y las enlaza entre sí. En seis meses vas a tener decenas de ideas y backtests; sin orden, repetirás pruebas que ya descartaste.</p>
<h3>Estructura recomendada</h3>
<ul>
  <li><strong>00-Ideas</strong> — cada idea de estrategia, en una línea, antes de programarla.</li>
  <li><strong>10-Estrategias</strong> — una nota por estrategia con su tesis (siguiente lección).</li>
  <li><strong>20-Backtests</strong> — una nota por corrida: fecha, parámetros, métricas y conclusión.</li>
  <li><strong>30-Diario</strong> — lo que pasó cada semana con el portafolio en real.</li>
  <li><strong>90-Descartadas</strong> — las ideas que murieron y por qué. Es la carpeta más valiosa.</li>
</ul>
<h3>Enlázalo todo</h3>
<p>Usa <code>[[nombre de la nota]]</code> para conectar cada backtest con su estrategia. La vista de grafo te mostrará qué ideas generaron más trabajo.</p>
''',
    ),
    dict(
        modulo=3,
        titulo='La plantilla de tesis de una estrategia',
        descripcion='Escribe la tesis de cada estrategia antes de programarla: qué edge busca, por qué debería existir y qué no cumple.',
        contenido='''
<h2>Primero la tesis, después el código</h2>
<p>Cada estrategia del portafolio tiene una tesis escrita. Copia esta plantilla en tu bóveda:</p>
<ol>
  <li><strong>En una frase:</strong> qué hace la estrategia.</li>
  <li><strong>El edge:</strong> por qué debería existir esa ventaja (comportamiento, estructura del mercado, estacionalidad).</li>
  <li><strong>Especificación:</strong> instrumento, temporalidad, sesión, zona horaria, entrada, filtro, salida, stop.</li>
  <li><strong>Métricas:</strong> las del Walk-Forward, no las del optimizador.</li>
  <li><strong>Lo que no cumple:</strong> los criterios que la estrategia no pasa.</li>
</ol>
''' + NOTA.format('Si un dato incomoda, se publica igual. La sección «lo que no cumple» no es opcional.'),
    ),

    # ─── 05 · Fundamentos cuantitativos ──────────────────────────────────────
    dict(
        modulo=4,
        titulo='De discrecional a sistemático',
        descripcion='Qué cambia cuando pasas de operar con tu criterio a operar reglas que un programa ejecuta y una estadística valida.',
        contenido='''
<h2>El cambio de mentalidad</h2>
<p>El trader discrecional decide en el momento. El trader sistemático decide <strong>antes</strong>, con reglas escritas, y deja que el programa ejecute.</p>
<h3>Lo que ganas</h3>
<ul>
  <li><strong>Medición:</strong> una regla se puede probar sobre 10 años de datos. Una intuición no.</li>
  <li><strong>Consistencia:</strong> el bot no tiene miedo ni euforia.</li>
  <li><strong>Escala:</strong> puedes operar varias estrategias a la vez sin mirar la pantalla.</li>
</ul>
<h3>Lo que tienes que aceptar</h3>
<ul>
  <li>Habrá meses en pérdida. En el histórico del portafolio, alrededor de 1 de cada 3 meses cerró en negativo.</li>
  <li>La mayoría de tus ideas no pasarán la validación. Eso es el proceso funcionando.</li>
  <li>Nunca dirás que una estrategia "funciona": dirás que <em>habría funcionado</em> en esas condiciones.</li>
</ul>
''',
    ),
    dict(
        modulo=4,
        titulo='Anatomía de un edge',
        descripcion='Los cuatro tipos de ventaja estadística que usamos — momentum, reversión a la media, estacional y ruptura — con ejemplos del portafolio.',
        contenido='''
<h2>¿De dónde sale la ventaja?</h2>
<p>Una estrategia rentable explota un comportamiento que se repite. En el portafolio usamos cuatro familias:</p>
<ul>
  <li><strong>Momentum</strong> — lo que se mueve fuerte tiende a seguir moviéndose. <em>Ejemplo: Momentum de Apertura.</em></li>
  <li><strong>Reversión a la media</strong> — tras un exceso, el precio tiende a volver. <em>Ejemplos: RSI2 Reversion, IBS Reversion.</em></li>
  <li><strong>Estacional</strong> — ciertos momentos del calendario o del día se comportan distinto. <em>Ejemplos: Weekend Effect, Overnight Drift.</em></li>
  <li><strong>Ruptura</strong> — cuando el precio rompe un rango, suele extenderse. <em>Ejemplo: ZigZag Breakout.</em></li>
</ul>
<h3>Por qué mezclarlas</h3>
<p>Cada familia gana en regímenes de mercado distintos. Por eso un portafolio con las cuatro sufre mucho menos que cualquiera de ellas sola (módulo 09).</p>
''',
    ),
    dict(
        modulo=4,
        titulo='Las 6 métricas que importan',
        descripcion='De las docenas que devuelve el Strategy Analyzer, solo seis deciden. Qué mide cada una y qué umbral buscar.',
        contenido='''
<h2>Solo seis números deciden</h2>
<ul>
  <li><strong>Net Profit</strong> — ganancia tras comisiones. Mayor a $0; es la menos importante de las importantes.</li>
  <li><strong>Profit Factor</strong> — ganancias brutas ÷ pérdidas brutas. Mayor a 1.5 es bueno.</li>
  <li><strong>Max Drawdown</strong> — la mayor caída desde un pico. Menos del 20% del capital. <strong>Es la métrica clave.</strong></li>
  <li><strong>Win Rate</strong> — % de operaciones ganadoras. Mayor a 40%, acompañado de un PF alto.</li>
  <li><strong>Sharpe Ratio</strong> — rentabilidad ajustada al riesgo. 0.8 aceptable, más de 1 decente.</li>
  <li><strong>Avg Bars/Trade</strong> — duración media en velas. Al menos 2, obligatorio.</li>
</ul>
<h3>Muestra mínima: 200 operaciones</h3>
<p>Por debajo de eso cualquier conclusión es anécdota.</p>
<h3>El win rate engaña solo</h3>
<p>Un 90% de aciertos con riesgo/beneficio 1:13 pierde dinero; un 35% con 1:3 gana. Calcula el win rate de equilibrio: <code>riesgo ÷ (riesgo + beneficio)</code>. Con TP $150 y SL $2,000 necesitas 93% de aciertos solo para empatar.</p>
''',
    ),

    # ─── 06 · De la idea al código ───────────────────────────────────────────
    dict(
        modulo=5,
        titulo='El proceso de 9 pasos',
        descripcion='El camino que recorre toda estrategia, de la especificación a la cuenta real, sin saltarse la validación.',
        contenido='''
<h2>De la idea al dinero real</h2>
<ol start="0">
  <li><strong>Especificación</strong> — cerrar ambigüedades antes de escribir código.</li>
  <li><strong>Idea y objetivo</strong> — qué edge se busca.</li>
  <li><strong>Idea de estrategia</strong> — activo, temporalidad, indicadores, disparo y gestión de riesgo.</li>
  <li><strong>Código + los 4 Mandamientos</strong> — si falla uno, se reconstruye.</li>
  <li><strong>Optimización bruta</strong> — o descarte.</li>
  <li><strong>Optimización fina</strong>.</li>
  <li><strong>Elección de variante</strong> — la meseta, no el pico.</li>
  <li><strong>Walk-Forward</strong> — pruebas de robustez.</li>
  <li><strong>Montecarlo</strong> — peor caso y riesgo de ruina.</li>
  <li><strong>Incubación</strong> en simulación con parámetros congelados, y recién entonces, <strong>real</strong>.</li>
</ol>
''' + NOTA.format('Descartar una idea en la optimización es un resultado exitoso del proceso, no un fracaso.'),
    ),
    dict(
        modulo=5,
        titulo='Paso 0: la especificación',
        descripcion='Las ocho preguntas que debes responder antes de programar. Cada una ha roto backtests reales.',
        contenido='''
<h2>Ocho preguntas antes de la primera línea</h2>
<ol>
  <li><strong>Instrumento y tick:</strong> MNQ = $0.50/tick · NQ = $5/tick · MES = $1.25/tick · ES = $12.50/tick.</li>
  <li><strong>Sesión RTH o ETH:</strong> cambia por completo cualquier media móvil.</li>
  <li><strong>Zona horaria del gráfico:</strong> si la lógica está en hora de Nueva York, el gráfico debe estar en Eastern.</li>
  <li><strong>Precisión temporal:</strong> ¿la lógica necesita segundos? La serie principal no basta.</li>
  <li><strong>Calculate:</strong> <code>OnBarClose</code> por defecto, para evitar ver el futuro.</li>
  <li><strong>Entradas por día:</strong> ¿una o varias?</li>
  <li><strong>Cierre de sesión:</strong> ¿qué pasa con la posición abierta?</li>
  <li><strong>Datos:</strong> ¿desde cuándo son fiables?</li>
</ol>
<p>Si no sabes la respuesta a una, no programes todavía: asumir mal cuesta horas de backtests inválidos.</p>
''',
    ),
    dict(
        modulo=5,
        titulo='Programar tu estrategia con Claude Code',
        descripcion='Cómo pedirle a Claude Code una estrategia de NinjaScript que compile a la primera y cumpla las reglas innegociables.',
        contenido='''
<h2>Tú defines la lógica, Claude escribe el C#</h2>
<h3>Un buen pedido incluye</h3>
<ul>
  <li>Las respuestas del Paso 0.</li>
  <li>La regla de entrada, el filtro, la salida y el stop, en lenguaje natural.</li>
  <li>Las reglas innegociables (siguiente lista).</li>
</ul>
<h3>Reglas innegociables del código</h3>
<ul>
  <li>Todo valor numérico como <strong>parámetro</strong> (NinjaScriptProperty). Si no es parámetro, no se puede optimizar.</li>
  <li><strong>Stop loss obligatorio.</strong> El take profit es opcional.</li>
  <li><strong>Logs</strong> en cada entrada, salida y P&amp;L. Sin logs no se puede depurar.</li>
  <li><strong>Cierre de seguridad por horario</strong>, aunque la estrategia cierre sola al final de la sesión.</li>
  <li>Comentarios que expliquen el <em>porqué</em>, no el qué.</li>
</ul>
<h3>Plantilla de prompt</h3>
<p>Completa los corchetes con tu especificación y pégala en Claude Code:</p>
''' + PROMPT('Escribe una estrategia de NinjaScript para NinjaTrader 8 llamada [NOMBRE] en un archivo [NOMBRE].cs listo para la carpeta Documentos\\NinjaTrader 8\\bin\\Custom\\Strategies. Especificación: instrumento [MNQ], gráfico de [X minutos], sesión [RTH o ETH], zona horaria del gráfico Eastern. Entrada: [regla de entrada]. Filtro: [filtro]. Salida: [regla de salida]. Stop loss: [N ticks]. Take profit: [N ticks o ninguno]. Máximo [N] entradas por día. Cierre de seguridad a las [hora] hora de Nueva York. Reglas: todo valor numérico como NinjaScriptProperty para poder optimizarlo, Calculate.OnBarClose, stop loss obligatorio, Print en el Output en cada entrada, salida y P&L, y comentarios en español que expliquen el porqué. Antes de escribir el código, dime si mi especificación tiene ambigüedades.') + '''
<h3>El ciclo</h3>
<p>Pide el código → cópialo al NinjaScript Editor → compila (F5) → si hay error, pega el mensaje completo a Claude → repite hasta compilar → corre un primer backtest.</p>
''' + PROMPT('Al compilar [NOMBRE].cs en NinjaTrader aparece este error: [PEGA EL ERROR COMPLETO]. Corrígelo sin cambiar la lógica de la estrategia y explícame qué estaba mal.'),
    ),

    # ─── 07 · Los 4 Mandamientos ─────────────────────────────────────────────
    dict(
        modulo=6,
        titulo='Los 4 Mandamientos del backtest fiable',
        descripcion='El filtro que aplicamos después de programar y antes de optimizar. Si falla uno, la estrategia se reconstruye.',
        contenido='''
<h2>Antes de optimizar, verifica los cuatro</h2>
<ol>
  <li><strong>Stop loss de al menos 40 ticks.</strong> Con stops más ajustados, el simulador no sabe si el precio tocó primero el stop o el objetivo dentro de la vela: adivina.</li>
  <li><strong>Avg Bars/Trade de al menos 2.</strong> Si la operación dura menos de 2 velas, el motor resuelve entrada y salida en la misma vela. Es la métrica más ignorada y la que más backtests invalida.</li>
  <li><strong>Velas válidas.</strong> Datos sin huecos y una temporalidad coherente con la lógica.</li>
  <li><strong>Entrada al open de la vela siguiente.</strong> La señal se evalúa al cierre y se ejecuta en la apertura siguiente. Entrar con información de la misma vela es hacer trampa al pasado.</li>
</ol>
<p>Repórtalos con el número concreto: <em>"SL = 60 ticks ✅ · Avg bars/trade = 26,4 ✅"</em>, nunca con un "cumple".</p>
''' + NOTA.format('Optimizar un backtest que miente solo produce una mentira más precisa.'),
    ),
    dict(
        modulo=6,
        titulo='Las 4 formas en que un backtest miente',
        descripcion='Datos defectuosos, look-ahead, sobreoptimización y simulación imprecisa: cómo detectar cada una y qué concluye (y qué no) un backtest.',
        contenido='''
<h2>Conoce al enemigo</h2>
<ol>
  <li><strong>Datos defectuosos</strong> — huecos o errores en el histórico. Basura entra, basura sale.</li>
  <li><strong>Look-ahead bias</strong> — la estrategia usa información que en tiempo real no tendría.</li>
  <li><strong>Sobreoptimización</strong> — parámetros ajustados hasta que el pasado es perfecto. Se detecta con Walk-Forward.</li>
  <li><strong>Simulación imprecisa</strong> — el motor desconoce el recorrido dentro de la vela. Lo cubren los Mandamientos 1 y 2.</li>
</ol>
<h3>Configuración de backtest recomendada</h3>
<ul>
  <li>5 a 10 años de datos.</li>
  <li>Comisiones siempre activadas y realistas.</li>
  <li>Slippage de al menos 1 tick (el portafolio usa 2).</li>
</ul>
<h3>Una curva demasiado perfecta es sospechosa</h3>
<p>Buscamos una curva que suba, con caídas pequeñas y que se recuperen rápido. Si parece una línea recta, casi siempre es sobreoptimización.</p>
''',
    ),

    # ─── 08 · Optimización, WFO y Montecarlo ─────────────────────────────────
    dict(
        modulo=7,
        titulo='Optimización: la meseta, no el pico',
        descripcion='Cómo usar el optimizador como brújula, qué parámetros optimizar y cómo elegir una variante robusta.',
        contenido='''
<h2>El optimizador es una brújula, no un veredicto</h2>
<p>El optimizador encuentra los parámetros que mejor funcionaron en el pasado: los memoriza. Sus números no se creen; solo te dicen dónde buscar.</p>
<h3>El plan</h3>
<ol>
  <li><strong>Fase bruta:</strong> rangos amplios y pasos grandes. Si ninguna zona da PF mayor a 1.3, se descarta.</li>
  <li><strong>Fase fina:</strong> rangos estrechos alrededor de la zona prometedora.</li>
</ol>
<h3>Qué optimizar</h3>
<ul>
  <li><strong>Sí:</strong> umbrales del disparo, parámetros de riesgo y periodos centrales de la tesis.</li>
  <li><strong>No:</strong> horarios con razón estructural, número de contratos, lo que impone la lógica del edge.</li>
  <li>Más de 4 o 5 parámetros a la vez y el Walk-Forward deja de ser confiable.</li>
</ul>
<h3>La meseta</h3>
<p>Elige un set de parámetros rodeado de vecinos con resultados parecidos. Un pico aislado entre resultados malos es ruido.</p>
''',
    ),
    dict(
        modulo=7,
        titulo='Walk-Forward: el número que decide',
        descripcion='Cómo validar en datos que la estrategia nunca vio, cómo configurar las ventanas y cómo leer el veredicto.',
        contenido='''
<h2>La regla de oro</h2>
<p>Si el optimizador da PF 2.5 y el Walk-Forward da PF 1.1, la estrategia <strong>no es robusta</strong>. El número que decide es siempre el del Walk-Forward.</p>
<h3>Cómo funciona</h3>
<p>Divide los datos en ventanas. En cada una optimiza en un tramo (In-Sample) y prueba en el tramo siguiente, que nunca vio (Out-of-Sample). La cadena de tramos OOS es lo más parecido a haber operado en real.</p>
<h3>Configuración de referencia</h3>
<ul>
  <li>Ventana de optimización: <strong>548 días</strong> (18 meses). Ventana de prueba: <strong>183 días</strong> (6 meses).</li>
  <li>El In-Sample debe cubrir tendencia alcista, crisis y lateral, y generar al menos 200 operaciones.</li>
  <li>Guarda al menos 12 meses finales sin tocar hasta el final.</li>
</ul>
<h3>Veredicto</h3>
<ul>
  <li><strong>APTA:</strong> PF promedio OOS ≥ 1.3 · eficiencia (WFE) ≥ 50% · ≥ 75% de ventanas rentables · ≥ 200 operaciones OOS.</li>
  <li><strong>REVISAR:</strong> PF OOS ≥ 1.0 y WFE ≥ 35%.</li>
  <li><strong>DESCARTAR:</strong> el resto.</li>
</ul>
<p>Registra cada corrida en el Excel de registro de WFO del club.</p>
''',
    ),
    dict(
        modulo=7,
        titulo='Montecarlo e incubación',
        descripcion='Estima el peor drawdown posible reordenando tus operaciones y deja la estrategia en simulación antes de darle capital.',
        contenido='''
<h2>El peor caso que todavía no viste</h2>
<p>El drawdown del backtest es solo <em>un</em> orden posible de las operaciones. Montecarlo las reordena miles de veces y te dice qué tan mal podría ir.</p>
<h3>Qué obtienes</h3>
<ul>
  <li><strong>Drawdown peor caso</strong> (por ejemplo, el percentil 95).</li>
  <li><strong>Riesgo de ruina</strong> para tu tamaño de cuenta.</li>
</ul>
<p>Si el peor caso supera el drawdown máximo permitido por tu cuenta fondeada, reduce el tamaño o no la operes.</p>
<h3>Incubación</h3>
<p>Con los parámetros <strong>congelados</strong>, la estrategia corre en simulación unas semanas. Solo pasa a real si se comporta dentro de lo esperado por el Walk-Forward y el Montecarlo.</p>
''',
    ),

    # ─── 09 · Gestión de portafolio ──────────────────────────────────────────
    dict(
        modulo=8,
        titulo='El poder de diversificar',
        descripcion='Por qué seis estrategias juntas caen mucho menos que cualquiera por separado, con los números reales del portafolio.',
        contenido='''
<h2>Juntas son otra cosa</h2>
<p>En el backtest del portafolio (enero 2015 – agosto 2026, MNQ, 1 contrato por estrategia):</p>
<ul>
  <li>Si sumas los peores drawdowns de cada estrategia por separado: <strong>−$15,994</strong>.</li>
  <li>El peor drawdown real del portafolio operando junto: <strong>−$4,099</strong>.</li>
  <li>Una reducción del <strong>74.4%</strong>, porque sus peores días no coinciden.</li>
</ul>
<h3>Lo que cambia la mirada</h3>
<p>Por separado, ninguna estrategia supera un Neto/Drawdown de 9.2. Juntas, el portafolio llega a <strong>21.8</strong>. Una estrategia mediocre sola puede ser valiosa dentro de un portafolio si gana cuando las demás pierden.</p>
<p>Por eso una estrategia se evalúa con criterios de portafolio antes de descartarla: ZigZag Breakout estuvo fuera 24 horas y volvió cuando se midió su aporte al conjunto.</p>
''',
    ),
    dict(
        modulo=8,
        titulo='Correlación, tamaño y reglas de la cuenta',
        descripcion='Cómo correr varios bots sin que se pisen: correlación entre estrategias, tamaño de posición y límites de la cuenta fondeada.',
        contenido='''
<h2>Varios bots, una sola cuenta</h2>
<h3>Correlación</h3>
<p>Dos estrategias muy correlacionadas son casi la misma apuesta dos veces. Mira sobre todo la correlación en los <strong>peores días</strong>: es la que define tu drawdown.</p>
<h3>Tamaño de posición</h3>
<ul>
  <li>Empieza con 1 contrato MNQ por estrategia, como en el backtest.</li>
  <li>Sube el tamaño solo cuando el drawdown real esté dentro del peor caso de Montecarlo.</li>
  <li>El número de contratos no se optimiza: se decide con el riesgo.</li>
</ul>
<h3>Reglas de la cuenta fondeada</h3>
<p>Suma los drawdowns peor caso de las estrategias que corres a la vez y compáralo con el límite de tu cuenta. Deja margen: el pasado no garantiza el futuro.</p>
''',
    ),

    # ─── 10 · Proyecto final ─────────────────────────────────────────────────
    dict(
        modulo=9,
        titulo='Tu estrategia al portafolio comunitario',
        descripcion='El proyecto final: crea tu propia estrategia, valídala con el proceso completo y compártela con la comunidad.',
        contenido='''
<h2>De alumno a aportante</h2>
<p>El proyecto final es tu propia estrategia, recorriendo el proceso completo. Si pasa el filtro, se suma al portafolio comunitario y todos los miembros se benefician.</p>
<h3>Lo que debes entregar</h3>
<ol>
  <li><strong>La tesis</strong> en la plantilla del módulo 04, incluida la sección "lo que no cumple".</li>
  <li><strong>El código</strong> <code>.cs</code> que compile y cumpla las reglas innegociables.</li>
  <li><strong>Los 4 Mandamientos</strong> reportados con sus números.</li>
  <li><strong>El registro de Walk-Forward</strong> con el veredicto.</li>
  <li><strong>El Montecarlo</strong> con el drawdown peor caso.</li>
  <li><strong>Su aporte al portafolio:</strong> cómo cambian el drawdown y el Neto/DD del conjunto al sumarla.</li>
</ol>
<h3>Qué pasa si no pasa</h3>
<p>Documentas por qué se descartó y lo compartes igual. Una idea descartada con datos le ahorra semanas de trabajo a toda la comunidad.</p>
''' + NOTA.format('El portafolio crece con cada alumno. El tuyo puede ser el próximo bot.'),
    ),
]

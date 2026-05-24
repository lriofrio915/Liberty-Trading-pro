# Changelog

All notable changes to Liberty Trading Club are documented here.

## [0.1.2.0] - 2026-05-01

### Fixed
- **Seguridad**: eliminadas todas las URLs y números de teléfono hardcodeados del código fuente — ahora se leen desde variables de entorno (`HOTMART_LINK_MENSUAL`, `HOTMART_LINK_ANUAL`, `NEXT_PUBLIC_HOTMART_LINK_MENSUAL`, `NEXT_PUBLIC_HOTMART_LINK_ANUAL`, `NEXT_PUBLIC_VINCES_WA`)
- **Chat landing Vinces**: advertencia en logs cuando los links de Hotmart no están configurados — evita que leads queden sin link de pago de forma silenciosa
- **Botón WhatsApp en `/unirse`**: ya no renderiza `<a href="">` cuando `NEXT_PUBLIC_VINCES_WA` no está configurado
- **Tests en Linux**: añadido `@rolldown/binding-linux-x64-gnu` como dependencia explícita para resolver falla de módulo nativo en entornos Linux

## [0.1.1.0] - 2026-05-01

### Added
- **Copiloto IA** (antes "Vibe Agent"): tarjeta explicativa en la página con 3 pilares — Estrategias personalizadas, Backtesting inteligente, Código Pine/MT5 listo para usar
- **Comunidad libre con modo lectura**: usuarios FREE pueden ver el feed completo; banner de upgrade para invitarlos a publicar
- **PortfolioTooltip custom**: tooltip de alta visibilidad en la gráfica de Distribución de Portafolio (colores hardcodeados, elimina el problema de texto oscuro sobre fondo oscuro en dark mode)

### Changed
- **Menú lateral reorganizado**: servicios gratuitos primero (Dashboard, Academia, Comunidad, Championship, Monitor Mundial); sección CLUB abajo con los servicios de pago
- **Nombres más claros en el menú**: "Planes" → "Plan de Trading", "Análisis" → "Sesgo del Día" 🧭, "Oportunidades" → "Oportunidades de Inversión" 📈, "Vibe Agent" → "Copiloto IA" 🧠
- **Heading de Análisis**: página renombrada a "Sesgo del Día" con subtítulo actualizado
- **Heading de Vibe Agent**: página renombrada a "Copiloto de Trading"
- Comunidad movida a sección gratuita; Academia movida a sección gratuita

### Fixed
- **Bug Copiloto IA**: segundo mensaje al agente ya no genera error 404 "Session not found" — la sesión se recrea automáticamente al detectar expiración del backend
- **Tooltip dark mode**: gráfica de Distribución de Portafolio ahora muestra texto claro sobre fondo oscuro al hacer hover

## [0.1.0.0] - 2026-04-01

### Added
- Plataforma SaaS de trading inicial (FREE, CLUB, PRO, PORTFOLIO)
- Dashboard, Academia, Comunidad, Championship, Monitor Mundial
- Análisis de mercado con 7 agentes de IA
- Vibe-Trading agent proxy (HKUDS)
- Sistema de autenticación Supabase
- Integración Hotmart webhooks
- AlgoLab: backtesting + generación MQL5

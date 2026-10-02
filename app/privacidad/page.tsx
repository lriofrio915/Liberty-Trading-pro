import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/components/Footer/Footer'
import { BRAND } from '@/lib/brand'

/**
 * Política de privacidad. Redactada según la Ley Orgánica de Protección de Datos Personales
 * de Ecuador (LOPDP, 2021) a partir de lo que el sitio realmente recoge (leads, cuentas,
 * KYC, Hotmart) y de los encargados que usa. Si se añade un formulario, un proveedor o un
 * rastreador nuevo, hay que actualizar esta página y ACTUALIZADA.
 */
const ACTUALIZADA = '2 de octubre de 2026'

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: `Cómo ${BRAND.legalName} y ${BRAND.name} tratan tus datos personales.`,
  alternates: { canonical: '/privacidad' },
}

function S({ n, titulo, children }: { n: string; titulo: string; children: React.ReactNode }) {
  return (
    <section className="py-8 border-t border-[var(--border)]">
      <div className="label-mono text-[10px] text-[var(--gold)] mb-2">{n}</div>
      <h2 className="headline text-3xl text-[var(--text-primary)] mb-4">{titulo}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-[var(--text-secondary)] [&_strong]:text-[var(--text-primary)] [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </section>
  )
}

export default function PrivacidadPage() {
  const mail = <a className="text-[var(--gold)] underline" href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
  return (
    <>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-16">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-12" aria-label={`${BRAND.legalName} — inicio`}>
          <Image src={BRAND.logos.isotipo} alt="" width={36} height={36} className="h-9 w-9" unoptimized />
          <span className="flex flex-col leading-none">
            <span className="headline text-xl gradient-gold">Liberty</span>
            <span className="label-mono text-[8px] mt-0.5">Trading Club</span>
          </span>
        </Link>

        <div className="label-mono mb-3">Legal</div>
        <h1 className="headline text-5xl sm:text-6xl text-[var(--text-primary)]">Política de <span className="gradient-gold">privacidad</span></h1>
        <p className="text-sm text-[var(--text-muted)] mt-4">Última actualización: {ACTUALIZADA}</p>
        <p className="text-[15px] leading-relaxed text-[var(--text-secondary)] mt-6">
          Esta política explica qué datos personales recogemos en {BRAND.domain}, para qué los usamos, con quién
          los compartimos y cómo puedes ejercer tus derechos, conforme a la Ley Orgánica de Protección de Datos
          Personales del Ecuador (LOPDP).
        </p>

        <S n="01" titulo="Responsable del tratamiento">
          <p>
            <strong>{BRAND.name}</strong>, que opera {BRAND.legalName} desde Ecuador. Contacto para cualquier
            asunto de privacidad: {mail} · WhatsApp {BRAND.phoneDisplay}.
          </p>
        </S>

        <S n="02" titulo="Qué datos recogemos">
          <ul>
            <li><strong>Formularios de contacto y del curso gratis:</strong> nombre, teléfono (WhatsApp), correo electrónico y el programa que te interesa.</li>
            <li><strong>Cuenta en la plataforma:</strong> correo, nombre, teléfono, país, foto de perfil, biografía y, si los completas, tu estilo y años de experiencia en trading.</li>
            <li><strong>Uso de la plataforma:</strong> planes de trading, sesiones y operaciones que registras, reportes, publicaciones y comentarios en la comunidad, certificados y archivos que subes (imágenes y PDF).</li>
            <li><strong>Formulario de perfil de inversionista (KYC)</strong>, solo si lo completas: nombre completo, fecha de nacimiento, nacionalidad, ciudad y país, tipo y número de documento de identidad, capital disponible, horizonte, tolerancia al riesgo, experiencia, origen de los fondos, objetivo, si eres persona expuesta políticamente (PEP) y tu número de cuenta de Interactive Brokers.</li>
            <li><strong>Compras:</strong> el pago lo procesa Hotmart. Nosotros recibimos de Hotmart tu nombre, correo, teléfono y el estado de la compra; <strong>nunca recibimos ni guardamos los datos de tu tarjeta</strong>.</li>
            <li><strong>Conexión con broker</strong>, si la activas: datos técnicos de la conexión con Interactive Brokers (identificador de cuenta y estado). No pedimos ni guardamos tu contraseña del broker.</li>
            <li><strong>Datos técnicos mínimos:</strong> las cookies de sesión necesarias para mantenerte conectado y una preferencia de tema (claro/oscuro) guardada en tu navegador.</li>
          </ul>
          <p>No usamos cookies publicitarias, píxeles de seguimiento ni herramientas de analítica de terceros.</p>
        </S>

        <S n="03" titulo="Para qué los usamos y con qué base legal">
          <ul>
            <li><strong>Responder tus consultas y darte acceso al curso gratis</strong> (tu consentimiento al enviar el formulario).</li>
            <li><strong>Prestar el servicio que contratas:</strong> crear tu cuenta, dar acceso a la formación y a las herramientas, emitir certificados y brindarte soporte (ejecución del contrato).</li>
            <li><strong>Evaluar tu perfil de inversionista</strong> cuando lo solicitas para la formación en acciones (tu consentimiento y medidas precontractuales), y cumplir obligaciones de prevención de lavado de activos cuando correspondan (obligación legal).</li>
            <li><strong>Enviarte comunicaciones</strong> sobre tu cuenta y, si lo aceptas, sobre contenido y programas de {BRAND.legalName}. Puedes pedir que dejemos de escribirte en cualquier momento (consentimiento).</li>
            <li><strong>Seguridad y mejora de la plataforma</strong>, como detectar usos indebidos o errores (interés legítimo).</li>
          </ul>
          <p>
            Algunas funciones usan <strong>inteligencia artificial</strong> para generar análisis y reportes a partir de los
            datos de trading que registras. No tomamos decisiones con efectos jurídicos sobre ti basadas únicamente en
            tratamientos automatizados.
          </p>
        </S>

        <S n="04" titulo="Con quién los compartimos">
          <p>No vendemos ni alquilamos tus datos. Los compartimos solo con proveedores que los tratan por nuestra cuenta (encargados) para que el servicio funcione:</p>
          <ul>
            <li><strong>Supabase</strong>: base de datos y autenticación.</li>
            <li><strong>Vercel</strong>: alojamiento del sitio.</li>
            <li><strong>Cloudinary</strong>: almacenamiento de imágenes y documentos que subes.</li>
            <li><strong>Resend</strong>: envío de correos.</li>
            <li><strong>Hotmart</strong>: procesamiento de pagos y acceso a los productos comprados.</li>
            <li><strong>Proveedores de inteligencia artificial</strong> (vía OpenRouter y Groq): generación de análisis y traducción de noticias.</li>
            <li><strong>WhatsApp (Meta)</strong>: cuando nos escribes o te contactamos por ese canal.</li>
          </ul>
          <p>También podemos comunicar datos a autoridades competentes cuando la ley lo exija.</p>
        </S>

        <S n="05" titulo="Transferencias internacionales">
          <p>
            Varios de estos proveedores tienen servidores fuera del Ecuador, principalmente en Estados Unidos. Usamos
            proveedores que aplican medidas de seguridad y garantías contractuales para proteger los datos, conforme
            a lo previsto en la LOPDP para transferencias internacionales.
          </p>
        </S>

        <S n="06" titulo="Cuánto tiempo los conservamos">
          <ul>
            <li><strong>Datos de contacto de interesados</strong> que no se convierten en alumnos: hasta 24 meses desde el último contacto, salvo que pidas eliminarlos antes.</li>
            <li><strong>Datos de cuenta y de uso:</strong> mientras tu cuenta esté activa. Si la eliminas, los borramos o anonimizamos, salvo lo que debamos conservar por ley.</li>
            <li><strong>Datos de compras y del perfil KYC:</strong> el tiempo que exijan las normas tributarias y de prevención de lavado de activos aplicables.</li>
          </ul>
        </S>

        <S n="07" titulo="Tus derechos">
          <p>Conforme a la LOPDP puedes ejercer en cualquier momento tus derechos de:</p>
          <ul>
            <li><strong>Acceso</strong> a tus datos y a información sobre su tratamiento.</li>
            <li><strong>Rectificación y actualización</strong> de datos inexactos o incompletos.</li>
            <li><strong>Eliminación</strong> de tus datos.</li>
            <li><strong>Oposición</strong> al tratamiento, incluido el envío de comunicaciones.</li>
            <li><strong>Portabilidad</strong> de los datos que nos diste, en un formato estructurado.</li>
            <li><strong>Suspensión</strong> del tratamiento.</li>
            <li><strong>No ser objeto de decisiones</strong> basadas únicamente en valoraciones automatizadas.</li>
            <li><strong>Revocar tu consentimiento</strong>, sin efectos retroactivos.</li>
          </ul>
          <p>
            Escríbenos a {mail} indicando qué derecho quieres ejercer. Podemos pedirte que confirmes tu identidad.
            Te responderemos en un plazo máximo de 15 días. Si consideras que no atendimos tu solicitud, puedes
            presentar un reclamo ante la <strong>Superintendencia de Protección de Datos Personales</strong> del Ecuador.
          </p>
        </S>

        <S n="08" titulo="Seguridad">
          <p>
            Aplicamos medidas técnicas y organizativas para proteger tus datos: conexiones cifradas (HTTPS), acceso
            restringido a la base de datos, control de acceso por usuario y almacenamiento con proveedores que cuentan
            con certificaciones de seguridad. Ningún sistema es infalible; si ocurriera una vulneración que afecte tus
            datos, te lo notificaremos y lo comunicaremos a la autoridad en los plazos que fija la ley.
          </p>
        </S>

        <S n="09" titulo="Menores de edad">
          <p>
            Nuestros servicios están dirigidos a mayores de 18 años. No recogemos conscientemente datos de menores;
            si detectamos que un menor nos dio sus datos, los eliminaremos.
          </p>
        </S>

        <S n="10" titulo="Cambios en esta política">
          <p>
            Podemos actualizar esta política cuando cambien nuestros servicios o la normativa. Publicaremos la versión
            vigente en esta página con su fecha de actualización y, si el cambio es relevante, te avisaremos por correo
            o en la plataforma.
          </p>
        </S>
      </main>
      <Footer />
    </>
  )
}

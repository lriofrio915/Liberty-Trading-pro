/**
 * Fuente única de verdad de la marca.
 *
 * Todo dato público de marca (nombre, teléfono, redes, links de pago, rutas de
 * fotos) vive aquí. Antes estaba duplicado y divergido entre Hero, Pricing,
 * Footer y las rutas de API — de ahí las 7 variantes del nombre y los links de
 * Hotmart hardcodeados.
 *
 * Se importa tanto desde Server como desde Client Components, así que no puede
 * leer variables de entorno privadas. Los valores públicos van literales; los
 * que cambian por entorno usan NEXT_PUBLIC_*.
 *
 * Documentación completa: /branding
 */

/** Teléfono de Luis en formato E.164 sin el signo +. Dato público. */
const PHONE = '593996691586'

/** Link de checkout del plan mensual. Se sobrescribe por entorno si existe. */
const HOTMART_MENSUAL =
  process.env.NEXT_PUBLIC_HOTMART_LINK_MENSUAL ||
  'https://pay.hotmart.com/R104900326X?checkoutMode=2'

/**
 * Link de checkout de los bots. Aún no existe el producto en Hotmart:
 * mientras esté vacío, el CTA cae a WhatsApp (ver `services.algo.href`).
 */
const HOTMART_BOTS = process.env.NEXT_PUBLIC_HOTMART_LINK_BOTS || ''

/** Construye un link de WhatsApp a Luis con mensaje precargado. */
export function wa(message: string): string {
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`
}

export const BRAND = {
  /** Marca madre: la persona. */
  name: 'Luis Riofrio',
  role: 'Asesor de Inversiones',
  tagline: 'Transparencia como método',
  credential: 'Operador Financiero — Emporium Quality Funds',

  /** Casa de productos. Ver /branding/01-estrategia.md */
  house: 'Liberty',
  products: {
    club: 'Liberty Club',
    algo: 'Liberty Algo',
    exchange: 'Liberty Exchange',
    portfolio: 'Liberty Portfolio',
  },

  /** Nombre legal e histórico del producto de suscripción. No usar en titulares. */
  legalName: 'Liberty Trading Club',

  domain: 'libertytrading.pro',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://libertytrading.pro',

  phone: PHONE,
  /** Mismo número, formateado para lectura humana. */
  phoneDisplay: '+593 99 669 1586',
  email: 'soporte@libertytrading.pro',
  location: 'Ecuador · Latinoamérica',

  social: {
    handle: '@libertytradingclub',
    instagram: 'https://instagram.com/libertytradingclub',
    facebook: 'https://facebook.com/libertytradingclub',
    whatsapp: `https://wa.me/${PHONE}`,
  },

  hotmart: {
    mensual: HOTMART_MENSUAL,
    bots: HOTMART_BOTS,
  },

  /** Precio ancla de la suscripción. Un solo sitio que tocar si sube. */
  price: {
    monthly: 29,
    monthlyLabel: '$29',
    successFee: '30%',
    portfolioMinimum: '$10,000',
  },

  /**
   * Fotos de Luis. Hoy apuntan a placeholders SVG generados en public/brand.
   * Al recibir las fotos reales basta con cambiar estas rutas (o apuntarlas a
   * Cloudinary, ya autorizado en next.config.mjs) — no hay que tocar componentes.
   * Especificaciones y prompts de generación: /branding/05-guia-fotografia.md
   */
  photos: {
    hero: '/brand/placeholders/01-hero.svg',
    portrait: '/brand/placeholders/02-retrato.svg',
    desk: '/brand/placeholders/03-escritorio.svg',
    og: '/brand/placeholders/04-og.svg',
    avatar: '/brand/placeholders/05-avatar.svg',
  },

  /** Track record público de Luis. */
  trackRecordSlug: 'cmmjkgdt800004kjq1zep8qc9',
} as const

/** Disclaimer de riesgo. Obligatorio en landing y en cualquier bloque de resultados. */
export const RISK_DISCLAIMER =
  'Operar futuros, acciones, opciones y criptomonedas implica riesgo de pérdida ' +
  'de capital. Los resultados publicados corresponden a la cuenta de capital ' +
  'propio de Luis Riofrio y no garantizan rendimientos futuros. El contenido es ' +
  'educativo e informativo; no constituye una recomendación personalizada de ' +
  'inversión ni una oferta de valores.'

/** Los cuatro servicios, en el orden en que aparecen en la landing. */
export const SERVICES = [
  {
    id: 'club',
    num: '01',
    name: BRAND.products.club,
    category: 'Educación',
    pitch:
      'Te enseño uno a uno a operar futuros —discrecional y algorítmico— con NinjaTrader 8 y Claude.',
    bullets: [
      'Trading discrecional y algorítmico en futuros',
      'Apertura y manejo de tu cuenta IBKR en EEUU',
      'Análisis y compra de empresas',
    ],
    price: `${BRAND.price.monthlyLabel}/mes`,
    priceNote: 'Cancela cuando quieras',
    cta: 'Suscribirme',
    href: HOTMART_MENSUAL,
    hotmart: true,
  },
  {
    id: 'algo',
    num: '02',
    name: BRAND.products.algo,
    category: 'Bots de futuros',
    pitch:
      'Bots de trading listos para operar, probados en cuenta real y en pruebas de fondeo.',
    bullets: [
      'Compatibles con cuentas reales',
      'Aptos para pruebas de fondeo',
      'Instalación y parámetros incluidos',
    ],
    price: 'Pago único',
    priceNote: 'Sin mensualidad',
    cta: HOTMART_BOTS ? 'Comprar bot' : 'Consultar bots',
    href: HOTMART_BOTS || wa('Hola Luis, quiero información sobre los bots de trading para futuros'),
    hotmart: Boolean(HOTMART_BOTS),
  },
  {
    id: 'exchange',
    num: '03',
    name: BRAND.products.exchange,
    category: 'Intercambio cripto',
    pitch:
      'Cambio dólares cripto a dólares fiat y viceversa. Directo, sin intermediarios.',
    bullets: [
      'USDT y BTC ↔ dólares en efectivo o transferencia',
      'Ecuador y Latinoamérica',
      'Comprobante en cada operación',
    ],
    price: 'Tasa del día',
    priceNote: 'Consulta por WhatsApp',
    cta: 'Cotizar cambio',
    href: wa('Hola Luis, me interesa el servicio de intercambio cripto USDT/USD'),
    hotmart: false,
  },
  {
    id: 'portfolio',
    num: '04',
    name: BRAND.products.portfolio,
    category: 'Acciones EEUU',
    pitch:
      'Te asesoro en la compra de acciones en la bolsa de EEUU dentro de tu propia cuenta IBKR.',
    bullets: [
      'El capital nunca sale de tu cuenta',
      `Solo cobro ${BRAND.price.successFee} sobre las ganancias`,
      `Capital sugerido desde ${BRAND.price.portfolioMinimum}`,
    ],
    price: `${BRAND.price.successFee} de éxito`,
    priceNote: 'Sin mensualidad',
    cta: 'Agendar consulta',
    href: wa('Hola Luis, me interesa la asesoría para comprar acciones en EEUU vía IBKR'),
    hotmart: false,
  },
] as const

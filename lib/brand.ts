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
 * Link de checkout de Liberty Trading Club ($1,500, pago único). Aún no existe el
 * producto en Hotmart: mientras esté vacío, el CTA cae a WhatsApp (ver
 * `services.quant.href`). Cuando Luis cree el producto en Hotmart, setear
 * NEXT_PUBLIC_HOTMART_LINK_QUANT en Vercel.
 */
const HOTMART_QUANT = process.env.NEXT_PUBLIC_HOTMART_LINK_QUANT || ''

/** Construye un link de WhatsApp a Luis con mensaje precargado. */
export function wa(message: string): string {
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`
}

export const BRAND = {
  /** Marca madre: la persona. */
  name: 'Luis Riofrio',
  role: 'Asesor de Inversiones',
  tagline: 'Transparencia como método',
  /**
   * Línea de autoridad de Luis. Mantener genérica y verificable: no nombrar
   * empresas empleadoras para evitar conflictos de interés.
   */
  credential: 'Trader de futuros, acciones y opciones',

  /** Casa de productos. Ver /branding/01-estrategia.md */
  house: 'Liberty',
  products: {
    /** Id interno `quant` por compatibilidad con Hotmart/leads (plan QUANT). */
    quant: 'Liberty Trading Club',
    exchange: 'Liberty Exchange',
    portfolio: 'Liberty Portfolio',
  },

  /**
   * Nombre legal. Desde sep-2026 es también el nombre del producto educativo
   * (pago único, $1,500 lifetime) — la antigua suscripción mensual/anual con
   * este nombre está retirada.
   */
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
    /** @deprecated Suscripción retirada. Se mantiene solo por si el webhook histórico aún la referencia. */
    mensual: HOTMART_MENSUAL,
    quant: HOTMART_QUANT,
  },

  /** Precio ancla de Liberty Trading Club. Un solo sitio que tocar si cambia. */
  price: {
    quant: 1500,
    quantLabel: '$1,500',
    /**
     * Cuenta fondeada incluida en el club: pase directo de PJ Capital que Luis
     * compra y entrega al alumno. `fundingValueLabel` es lo que cuesta ese pase.
     */
    fundingAccountLabel: '$200k',
    fundingProvider: 'PJ Capital',
    fundingValueLabel: '$300',
    successFee: '20%',
    /** Capital de referencia, no un mínimo: se puede empezar con menos. */
    portfolioReference: '$10,000',
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

/** Los tres servicios, en el orden en que aparecen en la landing. */
export const SERVICES = [
  {
    id: 'quant',
    num: '01',
    name: BRAND.products.quant,
    category: 'Especialización cuantitativa',
    pitch:
      'Trading algorítmico con enfoque cuantitativo: video clases, 6 bots listos para NinjaTrader 8 y un pase directo a cuenta fondeada de $200k para operar desde el día uno.',
    bullets: [
      'Video clases: Claude Code + NinjaTrader 8 + Obsidian',
      'Portafolio comunitario: 6 bots listos para descargar',
      'Pase directo a cuenta fondeada de $200k (PJ Capital, valor $300)',
    ],
    price: BRAND.price.quantLabel,
    priceNote: 'Pago único',
    cta: HOTMART_QUANT ? 'Quiero entrar al club' : 'Consultar Liberty Trading Club',
    href: HOTMART_QUANT || wa('Hola Luis, quiero información sobre Liberty Trading Club'),
    hotmart: Boolean(HOTMART_QUANT),
  },
  {
    id: 'exchange',
    num: '02',
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
    num: '03',
    name: BRAND.products.portfolio,
    category: 'Acciones EEUU',
    pitch:
      'Te asesoro en la compra de acciones en la bolsa de EEUU dentro de tu propia cuenta IBKR.',
    bullets: [
      'El capital nunca sale de tu cuenta',
      `Gano ${BRAND.price.successFee} cuando tú ganas`,
      `Empieza con lo que tengas — ${BRAND.price.portfolioReference} es el punto ideal`,
    ],
    price: `${BRAND.price.successFee} de éxito`,
    priceNote: 'Sin mensualidad',
    cta: 'Agendar consulta',
    href: wa('Hola Luis, me interesa la asesoría para comprar acciones en EEUU vía IBKR'),
    hotmart: false,
  },
] as const

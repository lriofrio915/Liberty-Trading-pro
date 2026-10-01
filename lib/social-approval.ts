import { createHmac, timingSafeEqual } from 'crypto'
import { BRAND } from '@/lib/brand'

/**
 * Enlaces firmados para aprobar o descartar un SocialPost desde WhatsApp.
 * La firma ata el id y la acción: un enlace de "descartar" no sirve para "aprobar".
 * Secreto: SOCIAL_APPROVAL_SECRET (Vercel). Sin él no se generan ni aceptan enlaces.
 */
export type AccionSocial = 'aprobar' | 'descartar'

/** Los borradores no aprobados en este plazo caducan y ya no se publican. */
export const CADUCIDAD_MS = 24 * 60 * 60 * 1000

function secreto(): string {
  const s = process.env.SOCIAL_APPROVAL_SECRET
  if (!s) throw new Error('Falta SOCIAL_APPROVAL_SECRET')
  return s
}

export function firmar(id: string, accion: AccionSocial): string {
  return createHmac('sha256', secreto()).update(`${accion}:${id}`).digest('hex').slice(0, 40)
}

export function firmaValida(id: string, accion: AccionSocial, sig: string | null): boolean {
  if (!sig || !/^[0-9a-f]{40}$/.test(sig)) return false
  return timingSafeEqual(Buffer.from(firmar(id, accion)), Buffer.from(sig))
}

export function enlace(id: string, accion: AccionSocial): string {
  return `${BRAND.url}/api/social/${accion}?id=${encodeURIComponent(id)}&sig=${firmar(id, accion)}`
}

/** Autorización de las llamadas del VPS (crear borrador, firmar subidas). */
export function autorizadoVps(req: Request): boolean {
  const secret = process.env.SOCIAL_API_SECRET
  return Boolean(secret) && req.headers.get('authorization') === `Bearer ${secret}`
}

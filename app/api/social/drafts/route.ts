// POST /api/social/drafts — el VPS (social-autopost) registra el post del día como borrador.
// Body: { fecha, pilar, tema, slides: string[] (URLs Cloudinary), caption, hashtags: string[], alt? }
// Responde con los enlaces firmados de aprobar/descartar que se mandan a Luis por WhatsApp.
// Auth: Authorization: Bearer SOCIAL_API_SECRET.
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizadoVps, enlace } from '@/lib/social-approval'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const esUrlCloudinary = (u: unknown) => typeof u === 'string' && /^https:\/\/res\.cloudinary\.com\//.test(u)

export async function POST(req: NextRequest) {
  if (!autorizadoVps(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => null)
  if (!b || typeof b.tema !== 'string' || typeof b.caption !== 'string' || typeof b.pilar !== 'string'
    || typeof b.fecha !== 'string' || !Array.isArray(b.slides) || !Array.isArray(b.hashtags)) {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }
  if (b.slides.length < 1 || b.slides.length > 10 || !b.slides.every(esUrlCloudinary)) {
    return NextResponse.json({ error: 'slides: 1–10 URLs de Cloudinary' }, { status: 400 })
  }
  const post = await prisma.socialPost.create({
    data: {
      fecha: b.fecha, pilar: b.pilar, tema: b.tema.slice(0, 200), slides: b.slides,
      caption: b.caption, hashtags: b.hashtags.map(String), alt: typeof b.alt === 'string' ? b.alt : null,
    },
  })
  return NextResponse.json({ id: post.id, aprobar: enlace(post.id, 'aprobar'), descartar: enlace(post.id, 'descartar') })
}

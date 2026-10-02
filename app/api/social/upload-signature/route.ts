// POST /api/social/upload-signature — firma una subida directa a Cloudinary para el VPS.
// Las imágenes van del VPS a Cloudinary sin pasar por Vercel (límite de 4,5 MB por petición).
// Misma receta de firma que app/api/upload/route.ts, con carpeta propia.
// Auth: Authorization: Bearer SOCIAL_API_SECRET.
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { autorizadoVps } from '@/lib/social-approval'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FOLDER = 'liberty/social'

export async function POST(req: NextRequest) {
  if (!autorizadoVps(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  const apiKey = process.env.CLOUDINARY_API_KEY
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  if (!apiSecret || !apiKey || !cloudName) return NextResponse.json({ error: 'Cloudinary sin configurar' }, { status: 500 })
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = crypto.createHash('sha1').update(`folder=${FOLDER}&timestamp=${timestamp}${apiSecret}`).digest('hex')
  return NextResponse.json({
    url: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    fields: { api_key: apiKey, timestamp: String(timestamp), signature, folder: FOLDER },
  })
}

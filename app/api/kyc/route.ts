import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { notifyNexus } from '@/lib/notify-nexus'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

async function checkAdmin() {
  if (!ADMIN_EMAIL) return null
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return null
  return user
}

// POST — envío público del formulario KYC (sin auth)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      fullName, email, phone, dateOfBirth, nationality, country, city,
      tier, capitalDisponible, horizonte, toleranciaRiesgo, experiencia,
      fuenteCapital, objetivo, tieneIbkr, ibkrAccount, esPep,
      documentType, documentNumber,
    } = body

    if (!fullName?.trim() || !country?.trim()) {
      return NextResponse.json({ error: 'Nombre y país son requeridos' }, { status: 400 })
    }
    if (!documentType || !documentNumber?.trim()) {
      return NextResponse.json({ error: 'Documento de identidad requerido' }, { status: 400 })
    }

    const kyc = await (prisma as any).kycClient.create({
      data: {
        fullName:         fullName.trim(),
        email:            email?.trim() || null,
        phone:            phone?.trim() || null,
        dateOfBirth:      dateOfBirth || null,
        nationality:      nationality?.trim() || null,
        country:          country.trim(),
        city:             city?.trim() || null,
        tier:             tier || null,
        capitalDisponible: capitalDisponible ? parseFloat(capitalDisponible) : null,
        horizonte:        horizonte || null,
        toleranciaRiesgo: toleranciaRiesgo || null,
        experiencia:      experiencia?.trim() || null,
        fuenteCapital:    fuenteCapital || null,
        objetivo:         objetivo || null,
        tieneIbkr:        Boolean(tieneIbkr),
        ibkrAccount:      tieneIbkr ? ibkrAccount?.trim() || null : null,
        esPep:            Boolean(esPep),
        documentType:     documentType,
        documentNumber:   documentNumber.trim(),
        submittedAt:      new Date(),
      },
    })

    // Notificar a Luis via nexus_claw
    notifyNexus('kyc_submission', {
      nombre: fullName,
      email,
      phone,
      tier: tier || 'No especificado',
      capital: capitalDisponible ? `USD ${capitalDisponible}` : 'No especificado',
      pais: country,
    }).catch(() => {}) // no bloquear si falla la notificación

    return NextResponse.json({ ok: true, id: kyc.id })
  } catch (err: any) {
    console.error('[KYC POST]', err?.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// GET — listar KYC submissions (admin only)
export async function GET(req: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const page   = parseInt(searchParams.get('page') || '1')
  const limit  = 20

  const where: any = {}
  if (status) where.status = status

  const [clientes, total] = await Promise.all([
    (prisma as any).kycClient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    (prisma as any).kycClient.count({ where }),
  ])

  // Stats
  const [porStatus, aumRaw] = await Promise.all([
    (prisma as any).kycClient.groupBy({ by: ['status'], _count: { status: true } }),
    (prisma as any).kycClient.aggregate({
      where: { status: 'APROBADO' },
      _sum: { capitalAsignado: true },
    }),
  ])

  const aum = aumRaw._sum?.capitalAsignado || 0

  return NextResponse.json({ clientes, total, page, limit, stats: { porStatus, aum } })
}

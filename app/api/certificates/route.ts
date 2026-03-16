import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase-server'

async function getDbUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return prisma.user.findUnique({ where: { authId: user.id } })
}

export async function GET() {
  try {
    const dbUser = await getDbUser()
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const certificates = await (prisma as any).certificate.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ certificates })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const dbUser = await getDbUser()
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, category, fileUrl, fileType, issuedBy, issuedDate, public: isPublic } = await req.json()

    if (!title?.trim() || !category || !fileUrl) {
      return NextResponse.json({ error: 'Título, categoría y archivo son requeridos' }, { status: 400 })
    }

    const VALID_CATEGORIES = ['FONDEO', 'RETIRO', 'MERITO', 'ACADEMICO', 'DIPLOMA', 'OTRO']
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 })
    }

    const cert = await (prisma as any).certificate.create({
      data: {
        userId: dbUser.id,
        title: title.trim(),
        category,
        fileUrl,
        fileType: fileType || 'image',
        issuedBy: issuedBy?.trim() || null,
        issuedDate: issuedDate?.trim() || null,
        public: isPublic !== false,
      },
    })

    return NextResponse.json({ certificate: cert })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

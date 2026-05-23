import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { getEffectiveAccess } from '@/lib/access'
import { redirect } from 'next/navigation'

const HOTMART_MENSUAL = process.env.HOTMART_LINK_MENSUAL || 'https://pay.hotmart.com/R104900326X?checkoutMode=2'

const CLUB_FEATURES = [
  { icon: '📈', label: 'Track Record verificable' },
  { icon: '🎯', label: 'Oportunidades de mercado en tiempo real' },
  { icon: '🎓', label: 'Academia completa (17+ lecciones)' },
  { icon: '🤝', label: 'Comunidad exclusiva de traders' },
  { icon: '🤖', label: 'Vinces — IA asistente de trading' },
  { icon: '📊', label: 'Reportes avanzados y análisis' },
  { icon: '🎬', label: 'Video de la semana — entradas en vivo' },
  { icon: '💰', label: 'Historial de retiros' },
]

export default async function UpgradePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { plan: true, trialEndsAt: true, name: true },
  })

  // If already has club access, redirect home
  if (dbUser) {
    const access = getEffectiveAccess({ plan: dbUser.plan, trialEndsAt: dbUser.trialEndsAt })
    if (access.canAccessClub) redirect('/dashboard')
  }

  const trialExpired = dbUser?.trialEndsAt && dbUser.trialEndsAt < new Date()
  const firstName = dbUser?.name?.includes('@') ? 'trader' : (dbUser?.name?.split(' ')[0] ?? 'trader')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg-primary)' }}>

      {/* Top accent */}
      <div className="fixed top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#C9A84C,#e8c96a,#C9A84C)' }} />

      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-10">
          {trialExpired ? (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono mb-4"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                ⏰ Tu período de prueba ha terminado
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                {firstName}, fue un gusto verte operar
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: '#888' }}>
                Tu prueba gratuita de 14 días terminó. Para seguir accediendo a todas las herramientas,
                activa tu membresía Club.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono mb-4"
                style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>
                🔒 Sección exclusiva Club
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                Acceso exclusivo para miembros
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: '#888' }}>
                Esta sección requiere una membresía Club activa. Únete para acceder a todas las herramientas.
              </p>
            </>
          )}
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {CLUB_FEATURES.map(f => (
            <div key={f.label} className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-xl flex-shrink-0">{f.icon}</span>
              <span className="text-sm text-white">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Pricing card */}
        <div className="max-w-sm mx-auto mb-8">
          <div className="rounded-2xl border p-6 flex flex-col relative overflow-hidden"
            style={{ background: 'rgba(201,168,76,0.06)', borderColor: 'rgba(201,168,76,0.3)' }}>
            <div className="text-[10px] font-mono tracking-widest uppercase mb-2" style={{ color: '#C9A84C' }}>
              Plan Pro Mensual
            </div>
            <div className="text-4xl font-black text-white mb-1" style={{ fontFamily: 'Georgia, serif' }}>
              $29
              <span className="text-base font-normal" style={{ color: '#888' }}>/mes</span>
            </div>
            <p className="text-xs mb-5" style={{ color: '#666' }}>Sin permanencia · Cancela cuando quieras</p>
            <a href={HOTMART_MENSUAL} target="_blank" rel="noopener noreferrer"
              className="mt-auto text-center py-3 rounded-xl text-sm font-bold transition-colors hover:opacity-90"
              style={{ background: '#C9A84C', color: '#080808' }}>
              Activar Plan Pro →
            </a>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link href="/dashboard" className="text-sm transition-colors hover:text-[#C9A84C]"
            style={{ color: '#555' }}>
            ← Volver al dashboard
          </Link>
        </div>

      </div>
    </main>
  )
}

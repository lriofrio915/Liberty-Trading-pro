import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export const metadata = { title: 'Investigación — Liberty Trading' }
export const dynamic = 'force-dynamic'

function pctCell(v: number | null) {
  if (v == null) return <td className="px-3 py-2 text-center text-zinc-500">—</td>
  const color = v > 0 ? 'text-emerald-400' : v < 0 ? 'text-red-400' : 'text-zinc-400'
  return (
    <td className={`px-3 py-2 text-center font-mono text-sm ${color}`}>
      {v > 0 ? '+' : ''}{v.toFixed(2)}%
    </td>
  )
}

function priceCell(v: number | null) {
  if (v == null) return <td className="px-3 py-2 text-center text-zinc-500">—</td>
  return <td className="px-3 py-2 text-center font-mono text-sm text-zinc-300">${v.toLocaleString()}</td>
}

export default async function InvestigacionPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect('/auth/login')
  if (user.email !== ADMIN_EMAIL) redirect('/dashboard')

  const scans = await prisma.marketScan.findMany({
    where: { fecha: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    include: {
      oportunidades: { orderBy: { confianza: 'desc' } },
    },
    orderBy: { fecha: 'desc' },
  })

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Investigación de Señales</h1>
        <p className="text-zinc-400 text-sm mb-6">Últimos 30 días — rendimientos por checkpoint y flips de sesgo</p>

        {scans.length === 0 && (
          <div className="text-zinc-500 text-center py-20">Sin datos aún.</div>
        )}

        {scans.map(scan => (
          <div key={scan.id} className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-semibold">
                {new Date(scan.fecha).toLocaleDateString('es-EC', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  timeZone: 'UTC',
                })}
              </h2>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                scan.sesgogeneral === 'ALCISTA' ? 'bg-emerald-900 text-emerald-300' :
                scan.sesgogeneral === 'BAJISTA' ? 'bg-red-900 text-red-300' :
                'bg-zinc-800 text-zinc-400'
              }`}>
                {scan.sesgogeneral}
              </span>
              <span className="text-zinc-500 text-sm">{scan.oportunidades.length} oportunidades</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-900 text-zinc-400 text-xs uppercase tracking-wide">
                    <th className="px-3 py-2 text-left">Símbolo</th>
                    <th className="px-3 py-2 text-center">Sesgo</th>
                    <th className="px-3 py-2 text-center">Conf.</th>
                    <th className="px-3 py-2 text-center">Precio 9am</th>
                    <th className="px-3 py-2 text-center">12pm</th>
                    <th className="px-3 py-2 text-center">Rend. 12pm</th>
                    <th className="px-3 py-2 text-center">14:45</th>
                    <th className="px-3 py-2 text-center">Rend. 14:45</th>
                    <th className="px-3 py-2 text-center">3pm</th>
                    <th className="px-3 py-2 text-center">Rend. 3pm</th>
                    <th className="px-3 py-2 text-center">Flip a</th>
                    <th className="px-3 py-2 text-center">Rend. Flip</th>
                  </tr>
                </thead>
                <tbody>
                  {scan.oportunidades.map((o, i) => (
                    <tr key={o.id} className={`border-t border-zinc-800 ${i % 2 === 0 ? 'bg-zinc-950' : 'bg-zinc-900/30'}`}>
                      <td className="px-3 py-2 font-semibold text-white">{o.simbolo}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          o.sesgo === 'COMPRA' ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-900/60 text-red-300'
                        }`}>
                          {o.sesgo}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-zinc-300">{o.confianza}%</td>
                      {priceCell(o.precio9am)}
                      {priceCell(o.precio12pm)}
                      {pctCell(o.rendimiento12pm)}
                      {priceCell(o.precio1445)}
                      {pctCell(o.rendimiento1445)}
                      {priceCell(o.precio3pm)}
                      {pctCell(o.rendimiento3pm)}
                      <td className="px-3 py-2 text-center text-xs text-amber-400">
                        {o.horaSesgoFlip ?? '—'}
                      </td>
                      {pctCell(o.rendimientoFlip)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'

interface Props {
  daysLeft: number | null
  trialExpired: boolean
  isOnTrial: boolean
}

export default function TrialBanner({ daysLeft, trialExpired, isOnTrial }: Props) {
  if (!isOnTrial && !trialExpired) return null

  if (trialExpired) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs font-mono flex-wrap"
        style={{ background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
        <span style={{ color: '#ef4444' }}>
          ⏰ Tu prueba gratuita terminó · Algunas secciones están bloqueadas
        </span>
        <Link href="/dashboard/upgrade"
          className="px-3 py-1 rounded-lg font-bold transition-opacity hover:opacity-80 flex-shrink-0"
          style={{ background: '#ef4444', color: '#fff' }}>
          Activar Club →
        </Link>
      </div>
    )
  }

  if (!isOnTrial || daysLeft === null) return null

  const pct = Math.max(0, Math.min(100, ((14 - daysLeft) / 14) * 100))
  const urgent = daysLeft <= 3

  return (
    <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2"
      style={{ background: urgent ? 'rgba(239,68,68,0.06)' : 'rgba(201,168,76,0.06)', borderBottom: `1px solid ${urgent ? 'rgba(239,68,68,0.15)' : 'rgba(201,168,76,0.15)'}` }}>

      <div className="flex-1 flex items-center gap-3 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest uppercase"
              style={{ color: urgent ? '#ef4444' : '#C9A84C' }}>
              {urgent ? '⚠️' : '🎁'} Prueba gratuita — {daysLeft} {daysLeft === 1 ? 'día' : 'días'} restante{daysLeft !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', maxWidth: '200px' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: urgent ? '#ef4444' : '#C9A84C' }} />
          </div>
        </div>
      </div>

      <Link href="/dashboard/upgrade"
        className="text-[10px] font-mono px-3 py-1.5 rounded-lg border transition-all hover:opacity-80 flex-shrink-0 text-center"
        style={{
          borderColor: urgent ? 'rgba(239,68,68,0.4)' : 'rgba(201,168,76,0.4)',
          color: urgent ? '#ef4444' : '#C9A84C',
        }}>
        Ver planes →
      </Link>
    </div>
  )
}

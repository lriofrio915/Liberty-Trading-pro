'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const FuturosSesgoTab = dynamic(() => import('./FuturosSesgoTab'), { ssr: false })
const MiCuentaTab = dynamic(() => import('./MiCuentaTab'), { ssr: false })
const PlanesClient = dynamic(() => import('../planes/PlanesClient'), { ssr: false })
const TrackRecordClient = dynamic(() => import('@/components/TrackRecord/TrackRecordClient'), { ssr: false })
const ReportesClient = dynamic(() => import('../reportes/ReportesClient'), { ssr: false })

type Tab = 'sesgo' | 'cuenta' | 'plan' | 'track' | 'reportes'

interface Session {
  id: string; date: string; instrumento: string; direccion: string; resultado: string
  pnlBruto: number; comisiones: number; pnlNeto: number; contratos: number
  entryPrice: number | null; exitPrice: number | null; siguioPlan: boolean
  sentimiento: string | null; notas: string | null; planId: string | null
}

interface Plan {
  id: string; name: string; capitalInicial: number; createdAt: string
  dataFeedMensual: number | null; comisionPorTrade: number | null
}

const NAV_TABS: [Tab, string][] = [
  ['sesgo', 'SESGO INTRADÍA'],
  ['cuenta', 'MI CUENTA'],
]

export default function FuturosClient({
  isAdmin,
  sessions = [],
  plans = [],
  fullPlans = [],
  retiros = [],
  userId = '',
  userName = null,
  userPlan = null,
}: {
  isAdmin: boolean
  sessions?: Session[]
  plans?: Plan[]
  fullPlans?: any[]
  retiros?: any[]
  userId?: string
  userName?: string | null
  userPlan?: string | null
}) {
  const [tab, setTab] = useState<Tab>('sesgo')

  // MI CUENTA se resalta también cuando estamos en sub-tabs plan/track/reportes
  const isActiveCuenta = tab === 'cuenta' || tab === 'plan' || tab === 'track' || tab === 'reportes'

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black mb-2">
          <span className="gradient-gold">Futuros</span>
        </h1>
      </div>

      {/* Nav unificada */}
      <div className="overflow-x-auto scrollbar-none mb-8">
        <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {NAV_TABS.map(([id, label]) => {
            const isActive = id === 'cuenta' ? isActiveCuenta : tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id === 'cuenta' && isActiveCuenta && tab !== 'cuenta' ? 'cuenta' : id)}
                className="px-5 py-2 rounded-lg text-xs font-mono tracking-widest transition-all whitespace-nowrap"
                style={isActive
                  ? { background: 'var(--gold-dark)', color: '#000', fontWeight: 700 }
                  : { color: 'var(--text-secondary)' }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {tab === 'sesgo' && <FuturosSesgoTab isAdmin={isAdmin} />}

      {tab === 'cuenta' && (
        <MiCuentaTab
          sessions={sessions}
          plans={plans}
          userName={userName}
          userPlan={userPlan}
          onSwitchTab={setTab}
        />
      )}

      {tab === 'plan' && (
        <div>
          <button
            onClick={() => setTab('cuenta')}
            className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest mb-6 transition-colors hover:text-[var(--gold)]"
            style={{ color: 'var(--text-muted)' }}
          >
            ← MI CUENTA
          </button>
          <PlanesClient initialPlans={fullPlans} initialRetiros={retiros} />
        </div>
      )}

      {tab === 'track' && (
        <div>
          <button
            onClick={() => setTab('cuenta')}
            className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest mb-6 transition-colors hover:text-[var(--gold)]"
            style={{ color: 'var(--text-muted)' }}
          >
            ← MI CUENTA
          </button>
          <TrackRecordClient
            initialSessions={sessions as any}
            initialPlans={plans.map(p => ({ id: p.id, name: p.name }))}
            userId={userId}
          />
        </div>
      )}

      {tab === 'reportes' && (
        <div>
          <button
            onClick={() => setTab('cuenta')}
            className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest mb-6 transition-colors hover:text-[var(--gold)]"
            style={{ color: 'var(--text-muted)' }}
          >
            ← MI CUENTA
          </button>
          <ReportesClient />
        </div>
      )}

    </div>
  )
}

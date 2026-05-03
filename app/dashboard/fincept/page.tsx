'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  calculateBlackScholes,
  calculateBondPrice,
  calculateImpliedVolatility,
  calculateBinomialTree,
  getUserProfile,
  type BlackScholesResult,
  type BondPriceResult,
} from '@/lib/fincept'

type Tool = 'options' | 'bond' | 'iv' | 'binomial'

interface UserProfile {
  email: string
  credits: number
  plan: string
}

export default function FinceptTerminalPage() {
  const [tool, setTool] = useState<Tool>('options')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BlackScholesResult | BondPriceResult | number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load user profile
  useEffect(() => {
    getUserProfile().then(setProfile).catch(() => {})
  }, [])

  // ── Option Pricing State ───────────────────────────────────────────────────────
  const [optionParams, setOptionParams] = useState({
    spot: 100,
    strike: 105,
    rate: 0.05,
    volatility: 0.2,
    timeToMaturity: 0.25,
    optionType: 'call' as 'call' | 'put',
  })

  // ── Bond Pricing State ───────────────────────────────────────────────────────
  const [bondParams, setBondParams] = useState({
    faceValue: 1000,
    couponRate: 0.05,
    yield: 0.04,
    yearsToMaturity: 5,
    frequency: 2,
  })

  // ── IV Calculation State ──────────────────────────────────────────────────────
  const [ivParams, setIvParams] = useState({
    spot: 100,
    strike: 105,
    rate: 0.05,
    price: 10,
    timeToMaturity: 0.25,
    optionType: 'call' as 'call' | 'put',
  })

  // ── Binomial Tree State ───────────────────────────────────────────────────────
  const [binomialParams, setBinomialParams] = useState({
    spot: 100,
    strike: 105,
    rate: 0.05,
    volatility: 0.2,
    timeToMaturity: 0.25,
    optionType: 'call' as 'call' | 'put',
    steps: 50,
  })

  const handleCalculate = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      if (tool === 'options') {
        const data = await calculateBlackScholes(optionParams)
        if (data) setResult(data)
        else setError('Error al calcular. Verifica los parámetros.')
      } else if (tool === 'bond') {
        const data = await calculateBondPrice(bondParams)
        if (data) setResult(data)
        else setError('Error al calcular precio del bono.')
      } else if (tool === 'iv') {
        const data = await calculateImpliedVolatility(ivParams)
        if (data !== null) setResult(data)
        else setError('No se pudo calcular IV. Verifica el precio de la opción.')
      } else if (tool === 'binomial') {
        const data = await calculateBinomialTree(binomialParams)
        if (data) setResult({ price: data.price, delta: data.delta, gamma: 0, vega: 0, theta: 0, rho: 0 } as BlackScholesResult)
        else setError('Error al calcular con árbol binomial.')
      }
    } catch (e) {
      setError('Error de conexión con Fincept API')
    } finally {
      setLoading(false)
    }
  }, [tool, optionParams, bondParams, ivParams, binomialParams])

  const ToolCard = ({ id, title, icon, description }: { id: Tool; title: string; icon: string; description: string }) => (
    <button
      onClick={() => { setTool(id); setResult(null); setError(null) }}
      className={`p-4 rounded-xl border text-left transition-all ${
        tool === id
          ? 'border-[var(--gold)] bg-[var(--gold)]/10'
          : 'border-[var(--border)] hover:border-[var(--gold)]/50'
      }`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-bold text-sm" style={{ color: tool === id ? 'var(--gold)' : 'var(--text-primary)' }}>{title}</div>
      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{description}</div>
    </button>
  )

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black mb-1">
            <span className="gradient-gold">Fincept Terminal</span>
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Herramientas de finanzas cuantitativas · API de Fincept
          </p>
        </div>
        {profile && (
          <div className="text-right">
            <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>CRÉDITOS DISPONIBLES</div>
            <div className="text-2xl font-black text-[var(--gold)]">{profile.credits}</div>
          </div>
        )}
      </div>

      {/* Tool Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <ToolCard id="options" title="Black-Scholes" icon="📊" description="Precio de opciones" />
        <ToolCard id="bond" title="Precio de Bonos" icon="📜" description="Duration y convexidad" />
        <ToolCard id="iv" title="Volatilidad Implícita" icon="📈" description="Calcular IV desde precio" />
        <ToolCard id="binomial" title="Árbol Binomial" icon="🌳" description="Método discreto" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="card p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--gold)' }}>
            Parámetros de Entrada
          </h2>

          {tool === 'options' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Precio Spot ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={optionParams.spot}
                    onChange={e => setOptionParams({ ...optionParams, spot: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Strike ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={optionParams.strike}
                    onChange={e => setOptionParams({ ...optionParams, strike: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Tasa Libre de Riesgo</label>
                  <input
                    type="number"
                    step="0.01"
                    value={optionParams.rate}
                    onChange={e => setOptionParams({ ...optionParams, rate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Volatilidad (σ)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={optionParams.volatility}
                    onChange={e => setOptionParams({ ...optionParams, volatility: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Tiempo (años)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={optionParams.timeToMaturity}
                    onChange={e => setOptionParams({ ...optionParams, timeToMaturity: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Tipo</label>
                  <select
                    value={optionParams.optionType}
                    onChange={e => setOptionParams({ ...optionParams, optionType: e.target.value as 'call' | 'put' })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm"
                  >
                    <option value="call">Call (Compra)</option>
                    <option value="put">Put (Venta)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {tool === 'bond' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Valor Facial ($)</label>
                  <input
                    type="number"
                    value={bondParams.faceValue}
                    onChange={e => setBondParams({ ...bondParams, faceValue: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Tasa Cupón (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bondParams.couponRate * 100}
                    onChange={e => setBondParams({ ...bondParams, couponRate: parseFloat(e.target.value) / 100 || 0 })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Rendimiento (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bondParams.yield * 100}
                    onChange={e => setBondParams({ ...bondParams, yield: parseFloat(e.target.value) / 100 || 0 })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Años al Vencimiento</label>
                  <input
                    type="number"
                    value={bondParams.yearsToMaturity}
                    onChange={e => setBondParams({ ...bondParams, yearsToMaturity: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)]">Frecuencia de Cupón</label>
                <select
                  value={bondParams.frequency}
                  onChange={e => setBondParams({ ...bondParams, frequency: parseInt(e.target.value) })}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm"
                >
                  <option value={1}>Anual</option>
                  <option value={2}>Semestral</option>
                  <option value={4}>Trimestral</option>
                  <option value={12}>Mensual</option>
                </select>
              </div>
            </div>
          )}

          {tool === 'iv' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Spot ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ivParams.spot}
                    onChange={e => setIvParams({ ...ivParams, spot: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Strike ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ivParams.strike}
                    onChange={e => setIvParams({ ...ivParams, strike: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Precio Opción ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ivParams.price}
                    onChange={e => setIvParams({ ...ivParams, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Tasa (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ivParams.rate * 100}
                    onChange={e => setIvParams({ ...ivParams, rate: parseFloat(e.target.value) / 100 || 0 })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Tiempo (años)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ivParams.timeToMaturity}
                    onChange={e => setIvParams({ ...ivParams, timeToMaturity: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Tipo</label>
                  <select
                    value={ivParams.optionType}
                    onChange={e => setIvParams({ ...ivParams, optionType: e.target.value as 'call' | 'put' })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm"
                  >
                    <option value="call">Call</option>
                    <option value="put">Put</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {tool === 'binomial' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Spot ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={binomialParams.spot}
                    onChange={e => setBinomialParams({ ...binomialParams, spot: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Strike ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={binomialParams.strike}
                    onChange={e => setBinomialParams({ ...binomialParams, strike: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Volatilidad (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={binomialParams.volatility * 100}
                    onChange={e => setBinomialParams({ ...binomialParams, volatility: parseFloat(e.target.value) / 100 || 0 })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Pasos</label>
                  <input
                    type="number"
                    value={binomialParams.steps}
                    onChange={e => setBinomialParams({ ...binomialParams, steps: parseInt(e.target.value) || 50 })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Tasa (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={binomialParams.rate * 100}
                    onChange={e => setBinomialParams({ ...binomialParams, rate: parseFloat(e.target.value) / 100 || 0 })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)]">Tiempo (años)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={binomialParams.timeToMaturity}
                    onChange={e => setBinomialParams({ ...binomialParams, timeToMaturity: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full mt-6 py-3 rounded-lg font-bold text-sm tracking-widest bg-[var(--gold)] text-black hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'CALCULANDO...' : 'CALCULAR'}
          </button>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-950/50 border border-red-500/30 text-xs text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="card p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--gold)' }}>
            Resultados
          </h2>

          {result === null && !error && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🧮</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Ingresa los parámetros y presiona "Calcular"
              </p>
            </div>
          )}

          {tool === 'options' && result && typeof result === 'object' && 'price' in result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                  <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Precio</div>
                  <div className="text-2xl font-black text-green-400">${(result as BlackScholesResult).price.toFixed(2)}</div>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                  <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Delta</div>
                  <div className="text-2xl font-mono" style={{ color: 'var(--text-primary)' }}>{(result as BlackScholesResult).delta.toFixed(4)}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                  <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Gamma</div>
                  <div className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{(result as BlackScholesResult).gamma.toFixed(4)}</div>
                </div>
                <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                  <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Theta</div>
                  <div className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{(result as BlackScholesResult).theta.toFixed(4)}</div>
                </div>
                <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                  <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Vega</div>
                  <div className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{(result as BlackScholesResult).vega.toFixed(4)}</div>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>Greeks Explicados</p>
                <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  <p><span className="text-green-400">Δ Delta:</span> Cambio en precio por $1 movimiento del subyacente</p>
                  <p><span className="text-yellow-400">Γ Gamma:</span> Cambio en Delta ante movimientos del precio</p>
                  <p><span className="text-red-400">Θ Theta:</span> Decay temporal diario (valor tiempo que pierde la opción)</p>
                  <p><span className="text-blue-400">ν Vega:</span> Sensibilidad a cambios en volatilidad</p>
                </div>
              </div>
            </div>
          )}

          {tool === 'bond' && result && typeof result === 'object' && 'price' in result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                  <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Precio</div>
                  <div className="text-2xl font-black" style={{ color: 'var(--gold)' }}>${(result as BondPriceResult).price.toFixed(2)}</div>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                  <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Yield</div>
                  <div className="text-2xl font-mono text-green-400">{((result as BondPriceResult).yieldToMaturity * 100).toFixed(2)}%</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                  <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Duration</div>
                  <div className="text-xl font-mono" style={{ color: 'var(--text-primary)' }}>{(result as BondPriceResult).duration.toFixed(2)}</div>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                  <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Convexidad</div>
                  <div className="text-xl font-mono" style={{ color: 'var(--text-primary)' }}>{(result as BondPriceResult).convexity.toFixed(2)}</div>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>Métricas de Bonos</p>
                <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  <p><span className="text-[var(--gold)]">Duration:</span> Sensibilidad del precio a cambios en tasas (mayor = más riesgo)</p>
                  <p><span className="text-[var(--gold)]">Convexidad:</span> Measure de curvatura - mayor convexidad = mejor protección ante tasas</p>
                </div>
              </div>
            </div>
          )}

          {tool === 'iv' && result !== null && typeof result === 'number' && (
            <div className="text-center py-8">
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Volatilidad Implícita</div>
              <div className="text-5xl font-black text-green-400">{(result * 100).toFixed(2)}%</div>
              <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
                IV mayor a 30% = Alta volatilidad | IV menor a 15% = Baja volatilidad
              </p>
            </div>
          )}

          {tool === 'binomial' && result && typeof result === 'object' && 'price' in result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                  <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Precio</div>
                  <div className="text-2xl font-black text-green-400">${(result as { price: number }).price.toFixed(2)}</div>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                  <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Delta</div>
                  <div className="text-2xl font-mono" style={{ color: 'var(--text-primary)' }}>{(result as { delta: number }).delta.toFixed(4)}</div>
                </div>
              </div>
              <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>Árbol Binomial</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Método discreto que model's el precio del subyacente en {binomialParams.steps} pasos.
                  Más preciso que Black-Scholes para opciones americanas o conDividendos.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Educational Section */}
      <div className="mt-6 card p-5">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--gold)' }}>
          Cómo Usar Este Dashboard
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-bold mb-2 text-[var(--text-primary)]">📊 Black-Scholes</div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              El estándar para pricing de opciones europeas. Ingresa el precio actual del activo, strike, volatilidad (de tu análisis técnico), y tiempo hasta expiración. Ideal para estrategias de opciones.
            </p>
          </div>
          <div>
            <div className="font-bold mb-2 text-[var(--text-primary)]">📜 Bonos</div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Calcula precio de bonos, duration y convexidad. Útil para análisis de riesgo de tasa de interés y-carve de yield curve. La duration indica cuánto suba/baja el precio con 1% cambio en tasas.
            </p>
          </div>
          <div>
            <div className="font-bold mb-2 text-[var(--text-primary)]">📈 Volatilidad Implícita</div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Si tienes el precio de mercado de una opción, calcula la IV. Compara con volatilidad histórica para identificar si opciones están "caras" o "baratas".
            </p>
          </div>
        </div>
      </div>

      {/* Credits Warning */}
      <div className="mt-4 p-3 rounded-lg border border-yellow-500/30 bg-yellow-950/20">
        <p className="text-xs text-yellow-400">
          ⚠️ <strong>Costo de créditos:</strong> Black-Scholes y Bonos = 2 créditos | IV = 1 crédito | Binomial = 2 créditos
        </p>
      </div>
    </div>
  )
}
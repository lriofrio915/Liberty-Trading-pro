// lib/algolab-engine.ts
// Orquestador AI: genera arquetipos de estrategia y barre parámetros

import type { Candle } from './algolab-parser'
import { computeIndicators, type IndicatorId } from './algolab-indicators'
import { runBacktest, type StrategyRule, type BacktestConfig, type BacktestResult } from './algolab-backtest'

export interface GeneratedStrategy {
  name: string
  description: string
  rules: StrategyRule
  indicators: Record<string, unknown>
  result: BacktestResult
  score: number
}

export interface GenerateConfig extends BacktestConfig {
  maxResults?: number
}

// ─── LLAMADA A LA IA ─────────────────────────────────────────────────────────

async function callAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set')
  const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3-0324'

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://www.libertytrading.pro',
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? '{}'
  } finally {
    clearTimeout(timer)
  }
}

// ─── PROMPT PARA ARQUETIPOS ──────────────────────────────────────────────────

function buildArchetypePrompt(
  symbol: string,
  timeframe: string,
  indicatorIds: IndicatorId[],
  sampleCandles: Candle[]
): string {
  const prices = sampleCandles.slice(-20).map(c => ({
    t: new Date(c.t).toISOString().slice(0, 16),
    o: c.o.toFixed(4), h: c.h.toFixed(4), l: c.l.toFixed(4), c: c.c.toFixed(4),
  }))

  return `Eres un quant trader experto. Analiza datos OHLCV de ${symbol} en ${timeframe} con indicadores disponibles: ${indicatorIds.join(', ')}.

Últimas velas (muestra de ${sampleCandles.length}):
${JSON.stringify(prices, null, 2)}

Genera exactamente 6 arquetipos de estrategia. Para cada uno devuelve:
- name: nombre descriptivo en español
- description: descripción breve (máx 80 chars)
- direction: "long" | "short" | "both"
- entry: { indicator, operator, value } — usa los indicadores disponibles
- exit: { indicator, operator, value }
- sl: { type: "atr_multiplier", value: número } — valor entre 1.5-3.0
- tp: { type: "atr_multiplier", value: número } — valor entre 2.0-4.0
- paramRanges: { [paramName]: [min, max, step] } — para barrer parámetros

Operadores válidos: ">", "<", ">=", "<=", "cross_above", "cross_below"
Indicadores válidos para indicator/value: SMA_20, EMA_20, RSI_14, MACD.macd, MACD.signal, MACD.histogram, ATR_14, BB.upper, BB.lower, BB.middle, ADX.adx, STOCH.k, STOCH.d, CCI_20, SAR, SUPERTREND.trend, OBV, MFI_14, CMF_20

Responde SOLO con JSON: { "archetypes": [...] }`
}

// ─── BARRIDO DE PARÁMETROS ───────────────────────────────────────────────────

interface Archetype {
  name: string
  description: string
  direction: 'long' | 'short' | 'both'
  entry: StrategyRule['entry']
  exit: StrategyRule['exit']
  sl: StrategyRule['sl']
  tp: StrategyRule['tp']
  paramRanges?: Record<string, [number, number, number]>
}

function buildVariants(archetype: Archetype): StrategyRule[] {
  const base: StrategyRule = {
    direction: archetype.direction,
    entry: archetype.entry,
    exit: archetype.exit,
    sl: archetype.sl,
    tp: archetype.tp,
  }

  const variants: StrategyRule[] = [base]

  // Barrer sl/tp multipliers
  const slValues = [1.5, 2.0, 2.5, 3.0]
  const tpValues = [2.0, 2.5, 3.0, 3.5, 4.0]

  for (const slV of slValues) {
    for (const tpV of tpValues) {
      if (slV === archetype.sl.value && tpV === archetype.tp.value) continue
      variants.push({
        ...base,
        sl: { ...base.sl, value: slV },
        tp: { ...base.tp, value: tpV },
      })
    }
  }

  return variants.slice(0, 10) // máx 10 variantes por arquetipo (reduce carga de backtest)
}

// ─── SCORE COMPUESTO ─────────────────────────────────────────────────────────

function computeScore(r: BacktestResult): number {
  if (r.totalTrades < 10) return 0
  const dd = r.maxDrawdownPct || 1
  return (r.profitFactor * r.sharpeRatio * r.recoveryFactor) / (dd / 10)
}

// ─── GENERADOR PRINCIPAL ─────────────────────────────────────────────────────

export async function generateStrategies(
  candles: Candle[],
  selectedIndicators: IndicatorId[],
  symbol: string,
  timeframe: string,
  config: GenerateConfig
): Promise<GeneratedStrategy[]> {
  const maxResults = config.maxResults ?? 100

  // 1. Calcular indicadores sobre todos los datos
  const indicators = computeIndicators(candles, selectedIndicators)

  // 2. Llamar a la IA con muestra de 500 velas
  const sample = candles.slice(-500)
  const prompt = buildArchetypePrompt(symbol, timeframe, selectedIndicators, sample)

  let archetypes: Archetype[] = []
  try {
    const raw = await callAI(prompt)
    const parsed = JSON.parse(raw)
    archetypes = parsed.archetypes ?? []
  } catch {
    // Fallback: arquetipos genéricos si la IA falla
    archetypes = buildFallbackArchetypes(selectedIndicators)
  }

  // Validar que los arquetipos tengan estructura correcta
  archetypes = archetypes.filter(a => a.entry && a.exit && a.sl && a.tp && a.direction)

  if (archetypes.length === 0) {
    archetypes = buildFallbackArchetypes(selectedIndicators)
  }

  // 3. Generar variantes por arquetipo y hacer backtest
  const allResults: GeneratedStrategy[] = []

  for (const archetype of archetypes) {
    const variants = buildVariants(archetype)
    const backtestResults = await Promise.allSettled(
      variants.map(rule =>
        Promise.resolve(runBacktest(candles, indicators as Record<string, number[]>, rule, config))
      )
    )

    backtestResults.forEach((res, idx) => {
      if (res.status === 'fulfilled' && res.value.totalTrades >= 5) {
        const result = res.value
        const score = computeScore(result)
        const slV = variants[idx].sl.value
        const tpV = variants[idx].tp.value
        allResults.push({
          name: `${archetype.name} SL${slV}×ATR TP${tpV}×ATR`,
          description: archetype.description,
          rules: variants[idx],
          indicators: { selected: selectedIndicators, sl: slV, tp: tpV },
          result,
          score,
        })
      }
    })
  }

  // 4. Ordenar por score y retornar top N
  allResults.sort((a, b) => b.score - a.score)

  // 5. Retornar resultados (descripciones ya incluidas en cada arquetipo)
  return allResults.slice(0, maxResults)
}

// ─── ARQUETIPOS FALLBACK ─────────────────────────────────────────────────────

function buildFallbackArchetypes(indicators: IndicatorId[]): Archetype[] {
  const hasRSI = indicators.includes('RSI')
  const hasMACD = indicators.includes('MACD')
  const hasEMA = indicators.includes('EMA')
  const hasBB = indicators.includes('BB')

  const archetypes: Archetype[] = []

  if (hasRSI) {
    archetypes.push({
      name: 'RSI Sobrevendido',
      description: 'Compra cuando RSI está en zona de sobreventa',
      direction: 'long',
      entry: { indicator: 'RSI_14', operator: 'cross_above', value: 30 },
      exit: { indicator: 'RSI_14', operator: '>=', value: 70 },
      sl: { type: 'atr_multiplier', value: 2.0 },
      tp: { type: 'atr_multiplier', value: 3.0 },
    })
    archetypes.push({
      name: 'RSI Sobrecomprado',
      description: 'Venta cuando RSI está en zona de sobrecompra',
      direction: 'short',
      entry: { indicator: 'RSI_14', operator: 'cross_below', value: 70 },
      exit: { indicator: 'RSI_14', operator: '<=', value: 30 },
      sl: { type: 'atr_multiplier', value: 2.0 },
      tp: { type: 'atr_multiplier', value: 3.0 },
    })
  }

  if (hasMACD) {
    archetypes.push({
      name: 'MACD Crossover Alcista',
      description: 'Entrada cuando MACD cruza por encima de la señal',
      direction: 'long',
      entry: { indicator: 'MACD.macd', operator: 'cross_above', value: 'MACD.signal' },
      exit: { indicator: 'MACD.macd', operator: 'cross_below', value: 'MACD.signal' },
      sl: { type: 'atr_multiplier', value: 2.0 },
      tp: { type: 'atr_multiplier', value: 3.0 },
    })
  }

  if (hasEMA) {
    archetypes.push({
      name: 'Precio sobre EMA',
      description: 'Compra cuando el precio cruza por encima de la EMA',
      direction: 'long',
      entry: { indicator: 'EMA_20', operator: 'cross_below', value: 'EMA_20' },
      exit: { indicator: 'EMA_20', operator: '>', value: 'EMA_20' },
      sl: { type: 'atr_multiplier', value: 1.5 },
      tp: { type: 'atr_multiplier', value: 2.5 },
    })
  }

  if (hasBB) {
    archetypes.push({
      name: 'Rebote Bollinger',
      description: 'Compra en banda inferior, vende en banda superior',
      direction: 'both',
      entry: { indicator: 'BB.pctB', operator: '<=', value: 0.05 },
      exit: { indicator: 'BB.pctB', operator: '>=', value: 0.95 },
      sl: { type: 'atr_multiplier', value: 2.0 },
      tp: { type: 'atr_multiplier', value: 3.0 },
    })
  }

  // Siempre incluir al menos 2 arquetipos
  if (archetypes.length < 2) {
    archetypes.push({
      name: 'Tendencia EMA Simple',
      description: 'Estrategia de seguimiento de tendencia con EMA',
      direction: 'both',
      entry: { indicator: 'EMA_20', operator: 'cross_above', value: 0 },
      exit: { indicator: 'EMA_20', operator: 'cross_below', value: 0 },
      sl: { type: 'atr_multiplier', value: 2.0 },
      tp: { type: 'atr_multiplier', value: 3.0 },
    })
  }

  return archetypes
}

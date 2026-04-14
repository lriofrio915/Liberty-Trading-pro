// lib/algolab-pine-script.ts
// Generador de indicadores Pine Script v5 para patrones de velas
// Produce código listo para pegar en TradingView

export function generatePineScript(
  patternId: string,
  patternName: string,
  direction: 'LONG' | 'SHORT',
): string {
  const dir = direction === 'LONG' ? 'alcista' : 'bajista'
  const arrowCode = direction === 'LONG'
    ? 'label.new(bar_index, low - atr14, "▲", color=color.new(color.green, 0), textcolor=color.white, style=label.style_label_up, size=size.small)'
    : 'label.new(bar_index, high + atr14, "▼", color=color.new(color.red, 0), textcolor=color.white, style=label.style_label_down, size=size.small)'

  const detectionCode = buildDetectionCode(patternId)

  return `//@version=5
indicator("AlgoLab — ${patternName}", overlay=true, max_labels_count=500)

// ─── PARÁMETROS ───────────────────────────────────────────────────────────────
atrPeriod  = input.int(14,   "Período ATR",    minval=1)
tpMult     = input.float(3.0,"TP Multiplicador ATR", step=0.5)
slMult     = input.float(1.0,"SL Multiplicador ATR", step=0.5)
showTP     = input.bool(true, "Mostrar TP/SL")

// ─── CÁLCULOS BASE ────────────────────────────────────────────────────────────
atr14 = ta.atr(atrPeriod)
bodySize   = math.abs(close - open)
totalRange = high - low
upperWick  = high - math.max(open, close)
lowerWick  = math.min(open, close) - low
bodyRatio  = totalRange > 0 ? bodySize / totalRange : 0.0
isBull     = close > open
isBear     = close < open

// ─── DETECCIÓN: ${patternName.toUpperCase()} ──────────────────────────────────
${detectionCode}

// ─── SEÑAL ────────────────────────────────────────────────────────────────────
if signal
    ${arrowCode}
    if showTP
        entryPrice = ${direction === 'LONG' ? 'low' : 'high'}
        tpLevel = ${direction === 'LONG' ? 'entryPrice + tpMult * atr14' : 'entryPrice - tpMult * atr14'}
        slLevel = ${direction === 'LONG' ? 'entryPrice - slMult * atr14' : 'entryPrice + slMult * atr14'}
        line.new(bar_index, tpLevel, bar_index + 5, tpLevel, color=color.new(color.green, 60), width=1)
        line.new(bar_index, slLevel, bar_index + 5, slLevel, color=color.new(color.red, 60), width=1)

// ─── BACKGROUND ───────────────────────────────────────────────────────────────
bgcolor(signal ? color.new(${direction === 'LONG' ? 'color.green' : 'color.red'}, 92) : na)

// ─── INFO ─────────────────────────────────────────────────────────────────────
// Patrón: ${patternName}
// Dirección: ${dir}
// Generado por AlgoLab — Liberty Trading Pro
`
}

// ─── CÓDIGOS DE DETECCIÓN POR PATRÓN ─────────────────────────────────────────

function buildDetectionCode(patternId: string): string {
  const codes: Record<string, string> = {
    DOJI:
      'signal = bodyRatio < 0.1 and totalRange > 0',

    GRAVESTONE_DOJI:
      'signal = bodyRatio < 0.1 and upperWick > totalRange * 0.6 and lowerWick < totalRange * 0.1',

    DRAGONFLY_DOJI:
      'signal = bodyRatio < 0.1 and lowerWick > totalRange * 0.6 and upperWick < totalRange * 0.1',

    DOJI_LONG_LEGGED:
      'signal = bodyRatio < 0.1 and upperWick > bodySize * 1.5 and lowerWick > bodySize * 1.5',

    HAMMER:
      'signal = lowerWick > bodySize * 2 and upperWick < bodySize * 0.5 and bodyRatio > 0.05',

    HANGING_MAN:
      'signal = lowerWick > bodySize * 2 and upperWick < bodySize * 0.5 and bodyRatio > 0.05',

    SHOOTING_STAR:
      'signal = upperWick > bodySize * 2 and lowerWick < bodySize * 0.5 and bodyRatio > 0.05',

    INVERTED_HAMMER:
      'signal = upperWick > bodySize * 2 and lowerWick < bodySize * 0.5 and bodyRatio > 0.05',

    MARUBOZU_BULL:
      'signal = isBull and bodyRatio > 0.9',

    MARUBOZU_BEAR:
      'signal = isBear and bodyRatio > 0.9',

    SPINNING_TOP_BULL:
      'signal = isBull and bodyRatio > 0.1 and bodyRatio < 0.4 and upperWick > bodySize and lowerWick > bodySize',

    SPINNING_TOP_BEAR:
      'signal = isBear and bodyRatio > 0.1 and bodyRatio < 0.4 and upperWick > bodySize and lowerWick > bodySize',

    CLOSE_NEAR_HIGH:
      'signal = totalRange > 0 and (high - close) / totalRange < 0.1 and bodyRatio > 0.3',

    CLOSE_NEAR_LOW:
      'signal = totalRange > 0 and (close - low) / totalRange < 0.1 and bodyRatio > 0.3',

    STRONG_BULL:
      'signal = isBull and bodyRatio > 0.7',

    STRONG_BEAR:
      'signal = isBear and bodyRatio > 0.7',

    UPPER_WICK_DOMINANT:
      'signal = totalRange > 0 and upperWick / totalRange > 0.5 and bodyRatio < 0.35',

    LOWER_WICK_DOMINANT:
      'signal = totalRange > 0 and lowerWick / totalRange > 0.5 and bodyRatio < 0.35',

    GAP_UP:
      'signal = open > high[1]',

    GAP_DOWN:
      'signal = open < low[1]',

    ENGULFING_BULL: `prevBear = close[1] < open[1]
signal = prevBear and isBull and open < close[1] and close > open[1]`,

    ENGULFING_BEAR: `prevBull = close[1] > open[1]
signal = prevBull and isBear and open > close[1] and close < open[1]`,

    HARAMI_BULL: `prevBody = math.abs(close[1] - open[1])
signal = close[1] < open[1] and prevBody > 0 and isBull and open > math.min(open[1], close[1]) and close < math.max(open[1], close[1]) and bodySize < prevBody * 0.6`,

    HARAMI_BEAR: `prevBody = math.abs(close[1] - open[1])
signal = close[1] > open[1] and prevBody > 0 and isBear and open < math.max(open[1], close[1]) and close > math.min(open[1], close[1]) and bodySize < prevBody * 0.6`,

    INSIDE_BAR_LONG:
      'signal = high < high[1] and low > low[1] and isBull',

    INSIDE_BAR_SHORT:
      'signal = high < high[1] and low > low[1] and isBear',

    KICKER_BULL: `prevBody1 = math.abs(close[1] - open[1])
curBody  = bodySize
signal = close[1] < open[1] and isBull and open > open[1] and bodyRatio > 0.6 and prevBody1 / (high[1] - low[1]) > 0.6`,

    KICKER_BEAR: `prevBody1 = math.abs(close[1] - open[1])
signal = close[1] > open[1] and isBear and open < open[1] and bodyRatio > 0.6 and prevBody1 / (high[1] - low[1]) > 0.6`,

    TWEEZER_BOTTOM:
      'signal = close[1] < open[1] and isBull and math.abs(low - low[1]) < atr14 * 0.1',

    TWEEZER_TOP:
      'signal = close[1] > open[1] and isBear and math.abs(high - high[1]) < atr14 * 0.1',

    REJECTION_LONG:
      'signal = isBull and lowerWick > bodySize * 2 and low < low[1]',

    REJECTION_SHORT:
      'signal = isBear and upperWick > bodySize * 2 and high > high[1]',

    FAILED_BREAK_DOWN:
      'signal = low < low[1] and close > low[1] and isBull',

    FAILED_BREAK_UP:
      'signal = high > high[1] and close < high[1] and isBear',

    LOWER_LOW_BULL:
      'signal = low < low[1] and isBull and close > close[1]',

    HIGHER_HIGH_BEAR:
      'signal = high > high[1] and isBear and close < close[1]',

    ON_NECK:
      'signal = close[1] < open[1] and isBull and math.abs(close - low[1]) < atr14 * 0.15',

    ON_NECK_BEAR:
      'signal = close[1] > open[1] and isBear and math.abs(close - high[1]) < atr14 * 0.15',

    '3_WHITE_SOLDIERS': `bull3 = close > open and close[1] > open[1] and close[2] > open[2]
rising = close > close[1] and close[1] > close[2]
openInBody = open > open[1] and open < close[1] and open[1] > open[2] and open[1] < close[2]
br3 = bodySize / (high - low) > 0.5 and math.abs(close[1] - open[1]) / (high[1] - low[1]) > 0.5 and math.abs(close[2] - open[2]) / (high[2] - low[2]) > 0.5
signal = bull3 and rising and openInBody and br3`,

    '3_BLACK_CROWS': `bear3 = close < open and close[1] < open[1] and close[2] < open[2]
falling = close < close[1] and close[1] < close[2]
openInBody = open < open[1] and open > close[1] and open[1] < open[2] and open[1] > close[2]
br3 = bodySize / (high - low) > 0.5 and math.abs(close[1] - open[1]) / (high[1] - low[1]) > 0.5 and math.abs(close[2] - open[2]) / (high[2] - low[2]) > 0.5
signal = bear3 and falling and openInBody and br3`,

    '3_BULL_CONSEC':
      'signal = close > open and close[1] > open[1] and close[2] > open[2] and close > close[1] and close[1] > close[2]',

    '3_BEAR_CONSEC':
      'signal = close < open and close[1] < open[1] and close[2] < open[2] and close < close[1] and close[1] < close[2]',

    MORNING_STAR: `bearBig = close[2] < open[2] and math.abs(close[2] - open[2]) / (high[2] - low[2]) > 0.5
smallMid = math.abs(close[1] - open[1]) < math.abs(close[2] - open[2]) * 0.4
bullConf = close > open and math.abs(close - open) / (high - low) > 0.5
midpoint2 = (open[2] + close[2]) / 2
signal = bearBig and smallMid and bullConf and close > midpoint2`,

    EVENING_STAR: `bullBig = close[2] > open[2] and math.abs(close[2] - open[2]) / (high[2] - low[2]) > 0.5
smallMid = math.abs(close[1] - open[1]) < math.abs(close[2] - open[2]) * 0.4
bearConf = close < open and math.abs(close - open) / (high - low) > 0.5
midpoint2 = (open[2] + close[2]) / 2
signal = bullBig and smallMid and bearConf and close < midpoint2`,

    '3_INSIDE_UP': `bearBig = close[2] < open[2]
bullHar = close[1] > open[1] and open[1] > close[2] and close[1] < open[2]
bullConf = close > open and close > open[2]
signal = bearBig and bullHar and bullConf`,

    '3_INSIDE_DOWN': `bullBig = close[2] > open[2]
bearHar = close[1] < open[1] and open[1] < close[2] and close[1] > open[2]
bearConf = close < open and close < open[2]
signal = bullBig and bearHar and bearConf`,

    HL_HIGHER_LOW:
      'signal = low[1] > low[2] and low > low[1] and isBull and close > high[1]',

    LH_LOWER_HIGH:
      'signal = high[1] < high[2] and high < high[1] and isBear and close < low[1]',

    OUTSIDE_BAR_BULL: `insidePrev = high[1] < high[2] and low[1] > low[2]
signal = insidePrev and high > high[2] and low < low[2] and isBull`,

    OUTSIDE_BAR_BEAR: `insidePrev = high[1] < high[2] and low[1] > low[2]
signal = insidePrev and high > high[2] and low < low[2] and isBear`,

    '2_HIGHS_BULL':
      'signal = math.abs(high[1] - high[2]) < atr14 * 0.2 and isBull and close > math.max(high[1], high[2])',

    '2_LOWS_BEAR':
      'signal = math.abs(low[1] - low[2]) < atr14 * 0.2 and isBear and close < math.min(low[1], low[2])',

    SPINNING_REVERSAL_BULL: `prevBear = close[2] < open[2]
spinBody = math.abs(close[1] - open[1]) / (high[1] - low[1])
spinTop = spinBody > 0.1 and spinBody < 0.4
midpoint2 = (open[2] + close[2]) / 2
signal = prevBear and spinTop and isBull and close > midpoint2 and low[1] < low[2]`,

    SPINNING_REVERSAL_BEAR: `prevBull = close[2] > open[2]
spinBody = math.abs(close[1] - open[1]) / (high[1] - low[1])
spinTop = spinBody > 0.1 and spinBody < 0.4
midpoint2 = (open[2] + close[2]) / 2
signal = prevBull and spinTop and isBear and close < midpoint2 and high[1] > high[2]`,

    BULL_FLAG: `mast = close[3] > open[3] and close[2] > open[2] and close[1] > open[1] and close[2] > close[3] and close[1] > close[2]
flag = close[3] > open[3]
pullbackOk = low > close[3]
signal = mast and pullbackOk and isBull`,

    BEAR_FLAG: `mast = close[3] < open[3] and close[2] < open[2] and close[1] < open[1] and close[2] < close[3] and close[1] < close[2]
pullbackOk = high < close[3]
signal = mast and pullbackOk and isBear`,

    '3_BULL_PULLBACK': `bull3 = close[3] > open[3] and close[2] > open[2] and close[1] > open[1] and close[2] > close[3] and close[1] > close[2]
pullback = isBear and low > low[2] and close > close[3]
signal = bull3 and pullback`,

    '3_BEAR_PULLBACK': `bear3 = close[3] < open[3] and close[2] < open[2] and close[1] < open[1] and close[2] < close[3] and close[1] < close[2]
pullback = isBull and high < high[2] and close < close[3]
signal = bear3 and pullback`,
  }

  return codes[patternId] ?? 'signal = false // patrón no implementado'
}

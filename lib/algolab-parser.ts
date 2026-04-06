// lib/algolab-parser.ts
// Parsea CSV exportado de MetaTrader 5 (TSV sin encabezados)

export interface Candle {
  t: number  // timestamp ms UTC
  o: number
  h: number
  l: number
  c: number
  v: number
}

/**
 * Valida y convierte JsonValue a Candle[].
 * Usado para validar datos de la base de datos que son almacenados como Json.
 */
export function validateCandles(data: unknown): Candle[] {
  if (!Array.isArray(data)) {
    throw new Error('candles debe ser un array')
  }

  const candles: Candle[] = []
  for (let i = 0; i < data.length; i++) {
    const item = data[i]
    if (typeof item !== 'object' || item === null) {
      throw new Error(`candle[${i}] debe ser un objeto`)
    }

    const obj = item as Record<string, unknown>
    const t = obj.t
    const o = obj.o
    const h = obj.h
    const l = obj.l
    const c = obj.c
    const v = obj.v

    // Validar que todas las propiedades existan y sean números
    if (
      typeof t !== 'number' ||
      typeof o !== 'number' ||
      typeof h !== 'number' ||
      typeof l !== 'number' ||
      typeof c !== 'number' ||
      typeof v !== 'number'
    ) {
      throw new Error(
        `candle[${i}] inválido: necesita t, o, h, l, c, v como números. Recibió: ` +
        JSON.stringify({ t, o, h, l, c, v })
      )
    }

    candles.push({ t, o, h, l, c, v })
  }

  return candles
}

/**
 * Parsea el contenido de un archivo CSV/TSV de MT5.
 * Formato esperado: Date\tTime\tOpen\tHigh\tLow\tClose\tTickVolume
 * Ejemplo: 2024.01.01\t00:00\t1950.50\t1952.30\t1949.80\t1951.00\t2500000
 */
export function parseMT5CSV(content: string): Candle[] {
  const lines = content.trim().split('\n')
  const candles: Candle[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    // Separador puede ser tab o coma
    const sep = line.includes('\t') ? '\t' : ','
    const cols = line.split(sep).map(c => c.trim())

    if (cols.length < 6) continue

    // Detectar si la primera columna tiene fecha (YYYY.MM.DD)
    const [datePart, timePart, openStr, highStr, lowStr, closeStr, volStr] = cols

    if (!datePart.match(/^\d{4}\.\d{2}\.\d{2}$/)) continue

    const isoDate = datePart.replace(/\./g, '-') + 'T' + (timePart || '00:00') + ':00Z'
    const ts = new Date(isoDate).getTime()
    if (isNaN(ts)) continue

    const o = parseFloat(openStr)
    const h = parseFloat(highStr)
    const l = parseFloat(lowStr)
    const c = parseFloat(closeStr)
    const v = volStr ? parseFloat(volStr) : 0

    if (isNaN(o) || isNaN(h) || isNaN(l) || isNaN(c)) continue

    candles.push({ t: ts, o, h, l, c, v })
  }

  // Ordenar por timestamp ascendente
  candles.sort((a, b) => a.t - b.t)
  return candles
}

/**
 * Detecta el timeframe automáticamente desde la diferencia entre velas.
 * Retorna string estándar: M1, M5, M15, M30, H1, H4, D1, W1, MN
 */
export function detectTimeframe(candles: Candle[]): string {
  if (candles.length < 2) return 'H1'

  // Calcular diferencias entre primeras 10 velas
  const diffs: number[] = []
  const limit = Math.min(candles.length - 1, 10)
  for (let i = 0; i < limit; i++) {
    diffs.push(candles[i + 1].t - candles[i].t)
  }
  const median = diffs.sort((a, b) => a - b)[Math.floor(diffs.length / 2)]
  const minutes = Math.round(median / 60000)

  if (minutes <= 1) return 'M1'
  if (minutes <= 5) return 'M5'
  if (minutes <= 15) return 'M15'
  if (minutes <= 30) return 'M30'
  if (minutes <= 60) return 'H1'
  if (minutes <= 240) return 'H4'
  if (minutes <= 1440) return 'D1'
  if (minutes <= 10080) return 'W1'
  return 'MN'
}

/**
 * Fusiona velas existentes con nuevas, deduplicando por timestamp.
 * Útil para actualizaciones incrementales del dataset.
 */
export function mergeCandles(existing: Candle[], incoming: Candle[]): Candle[] {
  const map = new Map<number, Candle>()
  for (const c of existing) map.set(c.t, c)
  for (const c of incoming) map.set(c.t, c)
  return Array.from(map.values()).sort((a, b) => a.t - b.t)
}

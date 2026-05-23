export type Plan = 'FREE' | 'CLUB' | 'PRO' | 'PORTFOLIO'

export interface UserProfile {
  id: string
  email: string
  name: string
  phone?: string
  plan: Plan
  active: boolean
  authId?: string
  createdAt: string
}

export interface TradingSession {
  id: string
  userId: string
  date: string
  instrumento: string
  direccion: 'LONG' | 'SHORT'
  resultado: 'WIN' | 'LOSS' | 'BE'
  pnlBruto: number
  comisiones: number
  pnlNeto: number
  contratos: number
  entryPrice?: number
  exitPrice?: number
  stopLoss?: number
  takeProfit?: number
  rrReal?: number
  siguioPlan: boolean
  sentimiento?: string
  notas?: string
  screenshotUrl?: string
}

export interface KPIs {
  rendimiento: number
  winRate: number
  profitFactor: number
  totalTrades: number
  pnlNeto: number
  maxDrawdown: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  links?: { mensual: string }
}

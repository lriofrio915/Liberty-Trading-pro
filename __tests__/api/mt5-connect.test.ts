import { describe, it, expect } from 'vitest'

// Connection form validation
function validateConnectInput(body: {
  metaApiAccountId?: unknown
  login?: unknown
}): { valid: boolean; error?: string } {
  const { metaApiAccountId, login } = body
  if (!metaApiAccountId || typeof metaApiAccountId !== 'string' || metaApiAccountId.trim() === '') {
    return { valid: false, error: 'metaApiAccountId es requerido' }
  }
  if (!login || (typeof login !== 'string' && typeof login !== 'number')) {
    return { valid: false, error: 'login es requerido' }
  }
  return { valid: true }
}

describe('MT5 connection input validation', () => {
  it('accepts valid connection data', () => {
    const result = validateConnectInput({ metaApiAccountId: 'abc123', login: '123456' })
    expect(result.valid).toBe(true)
  })

  it('rejects empty metaApiAccountId', () => {
    const result = validateConnectInput({ metaApiAccountId: '', login: '123456' })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/metaApiAccountId/)
  })

  it('rejects missing metaApiAccountId', () => {
    const result = validateConnectInput({ login: '123456' })
    expect(result.valid).toBe(false)
  })

  it('rejects missing login', () => {
    const result = validateConnectInput({ metaApiAccountId: 'abc123' })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/login/)
  })

  it('accepts numeric login', () => {
    const result = validateConnectInput({ metaApiAccountId: 'abc123', login: 123456 })
    expect(result.valid).toBe(true)
  })
})

// Account name fallback logic
function resolveAccountName(accountName: string | undefined, login: string): string {
  return accountName && accountName.trim() !== '' ? accountName : `MT5 #${login}`
}

describe('MT5 account name resolution', () => {
  it('uses provided accountName when given', () => {
    expect(resolveAccountName('Mi cuenta demo', '123456')).toBe('Mi cuenta demo')
  })

  it('falls back to MT5 #login when accountName is empty', () => {
    expect(resolveAccountName('', '123456')).toBe('MT5 #123456')
  })

  it('falls back when accountName is undefined', () => {
    expect(resolveAccountName(undefined, '654321')).toBe('MT5 #654321')
  })

  it('falls back when accountName is whitespace', () => {
    expect(resolveAccountName('   ', '999')).toBe('MT5 #999')
  })
})

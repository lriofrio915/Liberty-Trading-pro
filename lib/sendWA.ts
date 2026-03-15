const EVO_URL      = process.env.EVOLUTION_API_URL  || 'https://evo.nexus-ia.com.es'
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE || 'vinces'
const EVO_KEY      = process.env.EVOLUTION_API_KEY  || '157B8ABC2B63-46DE-B38C-05C3C3ACAA3A'

export async function sendWA(phone: string, text: string): Promise<void> {
  await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
    method: 'POST',
    headers: { apikey: EVO_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ number: phone, text }),
    signal: AbortSignal.timeout(15000),
  })
}

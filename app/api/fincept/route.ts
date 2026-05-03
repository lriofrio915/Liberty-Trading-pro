import { NextRequest, NextResponse } from 'next/server'

const FINCEPT_BASE_URL = 'https://api.fincept.in'
const API_KEY = process.env.FINCEPT_API_KEY || 'fk_user_NrTr5aPzJ4W2M0kqlQWc8FDo5cYnSR3TzsW9yBwfsnk'

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint') || ''

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 })
  }

  const body = await request.json()

  try {
    const response = await fetch(`${FINCEPT_BASE_URL}/quantlib/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Fincept proxy error:', error)
    return NextResponse.json({ success: false, error: 'Failed to call Fincept API' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') || ''

  try {
    const response = await fetch(`${FINCEPT_BASE_URL}/${path}`, {
      headers: {
        'X-API-Key': API_KEY,
      },
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Fincept proxy error:', error)
    return NextResponse.json({ success: false, error: 'Failed to call Fincept API' }, { status: 500 })
  }
}
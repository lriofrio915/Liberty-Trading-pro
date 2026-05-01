import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Archivo demasiado grande (máx 10 MB)' }, { status: 400 })
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!
    const apiKey = process.env.CLOUDINARY_API_KEY!
    const apiSecret = process.env.CLOUDINARY_API_SECRET!
    const timestamp = Math.floor(Date.now() / 1000)

    // Build signature string (params in alphabetical order)
    const sigStr = `folder=vincesAI&timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash('sha1').update(sigStr).digest('hex')

    const uploadForm = new FormData()
    uploadForm.append('file', file)
    uploadForm.append('api_key', apiKey)
    uploadForm.append('timestamp', timestamp.toString())
    uploadForm.append('signature', signature)
    uploadForm.append('folder', 'vincesAI')

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: uploadForm,
    })

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message ?? 'Upload failed' }, { status: 500 })
    }

    return NextResponse.json({ url: data.secure_url })
  } catch (err: unknown) {
    console.error('[Upload] Error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/jpg',
  'application/pdf',
]

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Formato no permitido. Sube una imagen (JPG, PNG, WEBP) o PDF.' }, { status: 400 })
    }

    const maxSize = 15 * 1024 * 1024 // 15MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'El archivo no puede superar 15MB.' }, { status: 400 })
    }

    const isPdf = file.type === 'application/pdf'
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!
    const apiKey    = process.env.CLOUDINARY_API_KEY!
    const apiSecret = process.env.CLOUDINARY_API_SECRET!
    const timestamp = Math.floor(Date.now() / 1000)
    const folder    = 'liberty-trading/certificates'

    const sigStr  = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash('sha1').update(sigStr).digest('hex')

    const uploadForm = new FormData()
    uploadForm.append('file', file)
    uploadForm.append('api_key', apiKey)
    uploadForm.append('timestamp', timestamp.toString())
    uploadForm.append('signature', signature)
    uploadForm.append('folder', folder)

    const resourceType = isPdf ? 'raw' : 'image'
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      { method: 'POST', body: uploadForm }
    )

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message ?? 'Upload failed' }, { status: 500 })
    }

    return NextResponse.json({ url: data.secure_url, fileType: isPdf ? 'pdf' : 'image' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import type { Metadata } from 'next'
import { CopyLinkButton } from './ShareButtons'

export const revalidate = 1800

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  return m ? m[1] : null
}

function formatSemana(d: Date) {
  return new Date(d).toLocaleDateString('es-EC', {
    timeZone: 'America/Guayaquil',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const video = await prisma.videoSemana.findUnique({ where: { id } })
  if (!video) return {}

  const title = `${video.titulo} · Liberty Trading Pro`
  const description = video.descripcion || `Video de la semana: ${video.titulo}. Trading real, semana del ${formatSemana(video.semana)}.`
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/video-semana/${video.id}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Liberty Trading Pro',
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function PublicVideoSemanaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const video = await prisma.videoSemana.findUnique({ where: { id, publicado: true } })
  if (!video) notFound()

  const ytId = getYouTubeId(video.youtubeUrl)
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/video-semana/${video.id}`
  const shareText = encodeURIComponent(`${video.titulo} — Trading real semana del ${formatSemana(video.semana)} 📈`)

  return (
    <main className="min-h-screen" style={{ background: '#080808' }}>
      {/* Top gold bar */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #C9A84C, #e8c96a, #C9A84C)' }} />

      {/* Header */}
      <div className="border-b border-[#1a1a1a] px-4 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/" className="text-lg font-black" style={{ color: '#C9A84C', fontFamily: 'Georgia, serif' }}>
          Liberty Trading Pro
        </Link>
        <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: '#555' }}>
          Video de la Semana
        </span>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Label + Title */}
        <div className="mb-6">
          <div className="text-[10px] font-mono tracking-widest uppercase mb-2" style={{ color: '#C9A84C' }}>
            Semana del {formatSemana(video.semana)}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            {video.titulo}
          </h1>
          {video.descripcion && (
            <p className="text-sm leading-relaxed" style={{ color: '#888' }}>
              {video.descripcion}
            </p>
          )}
        </div>

        {/* Video embed */}
        <div className="rounded-xl overflow-hidden mb-8" style={{ border: '1px solid rgba(201,168,76,0.2)' }}>
          {ytId ? (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={video.titulo}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center py-20 text-[#555]">
              Video no disponible
            </div>
          )}
        </div>

        {/* Share section */}
        <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-[10px] font-mono tracking-widest uppercase mb-4" style={{ color: '#555' }}>
            Compartir este video
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Copy link */}
            <CopyLinkButton url={shareUrl} />

            {/* X / Twitter */}
            <a
              href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: '#000', color: '#fff', border: '1px solid #333' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X
            </a>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: '#25D366', color: '#fff' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413A11.824 11.824 0 0012.05 0zm0 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884z" />
              </svg>
              WhatsApp
            </a>

            {/* LinkedIn */}
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: '#0A66C2', color: '#fff' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>

            {/* Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: '#1877F2', color: '#fff' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </a>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs font-mono" style={{ color: '#444' }}>
            Contenido en tiempo real ·{' '}
            <Link href="/" className="hover:text-[#C9A84C] transition-colors" style={{ color: '#555' }}>
              Liberty Trading Pro
            </Link>
          </p>
          <Link
            href="/#precios"
            className="text-xs font-mono px-4 py-2 rounded-lg border transition-colors hover:bg-[#C9A84C] hover:text-black"
            style={{ borderColor: '#C9A84C', color: '#C9A84C' }}
          >
            Unirme al Club →
          </Link>
        </div>
      </div>
    </main>
  )
}


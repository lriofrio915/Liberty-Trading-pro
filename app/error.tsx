'use client'

import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="text-center">
        <div className="text-5xl mb-6">⚠️</div>
        <h1
          className="text-2xl font-black mb-2"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}
        >
          Algo salió mal
        </h1>
        {error.digest && (
          <p className="text-xs font-mono text-gray-600 mb-6">
            Digest: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="btn-gold text-sm py-2.5 px-6 rounded-lg"
          >
            Intentar de nuevo
          </button>
          <Link href="/" className="btn-outline text-sm py-2.5 px-6 rounded-lg">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}

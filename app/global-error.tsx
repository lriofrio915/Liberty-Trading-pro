'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body style={{ background: '#080808', color: '#fff', fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ color: '#C9A84C', marginBottom: '0.5rem' }}>Error del servidor</h1>
          {error.digest && (
            <p style={{ color: '#666', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
              Digest: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{ background: '#C9A84C', color: '#000', border: 'none', padding: '0.75rem 1.5rem', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }}
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  )
}

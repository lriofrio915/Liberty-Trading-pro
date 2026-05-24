import Link from 'next/link'

export default function P2PPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Nav */}
      <div className="border-b border-[var(--border)] px-4 h-16 flex items-center">
        <Link href="/" className="text-lg font-black gradient-gold">← Liberty Trading Club</Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-6">💱</div>
        <h1 className="text-4xl font-black mb-4">
          Compra/Vende <span className="gradient-gold">USDT</span> con Luis
        </h1>
        <p className="text-lg text-[var(--text-secondary)] mb-10 max-w-xl mx-auto">
          Servicio P2P directo y confiable. Proceso simple, tarifas competitivas,
          disponible 24/7 para transacciones en Ecuador.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {[
            { icon: '⚡', title: 'Rápido', desc: 'Transacciones completadas en minutos' },
            { icon: '🔒', title: 'Seguro', desc: 'Operaciones con Luis directamente' },
            { icon: '💵', title: 'Competitivo', desc: 'Mejores tasas del mercado local' },
            { icon: '🇪🇨', title: 'Ecuador', desc: 'Depósito/retiro en bancos locales' },
          ].map((f) => (
            <div key={f.title} className="card text-left">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-bold mb-1">{f.title}</div>
              <div className="text-sm text-[var(--text-secondary)]">{f.desc}</div>
            </div>
          ))}
        </div>

        <a
          href={`https://wa.me/${process.env.LUIS_PHONE || ''}?text=Hola%20Luis%2C%20quiero%20hacer%20una%20operaci%C3%B3n%20P2P%20de%20USDT`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold inline-flex items-center gap-3 text-lg py-4 px-8 rounded-xl"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488" />
          </svg>
          Contactar por WhatsApp
        </a>

        <p className="mt-4 text-sm text-[var(--text-muted)]">+593 99 669 1586</p>
      </div>
    </div>
  )
}

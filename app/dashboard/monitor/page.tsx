export default function MonitorMundialPage() {
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="p-4 border-b border-yellow-900/30">
        <h1 className="text-xl font-bold text-yellow-400">
          🌍 Monitor Mundial
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Inteligencia geopolítica en tiempo real —{' '}
          los eventos globales mueven los mercados
        </p>
      </div>
      <iframe
        src="https://worldmonitor.app"
        className="flex-1 w-full border-0"
        title="World Monitor"
      />
    </div>
  )
}

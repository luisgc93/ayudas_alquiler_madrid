import { useState, useEffect } from 'react'
import ExclusionChart from './ExclusionChart'
import CodesTable from './CodesTable'
import OriginPieCharts from './OriginPieCharts'
import DistributionChart from './DistributionChart'

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

export default function App() {
  const [data, setData] = useState(null)
  const [highlighted, setHighlighted] = useState(null)
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data.json`).then(r => r.json()).then(setData)
  }, [])

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-400 text-sm">Cargando datos…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Ayudas al alquiler CAM 2024
          </h1>
          <button
            onClick={() => setDark(d => !d)}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Cambiar tema"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        {/* Pie charts */}
        <OriginPieCharts pie={data.pie} />

        {/* Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Importe de ayuda (€) — admitidos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left pb-2 font-medium">Grupo</th>
                  <th className="pb-2 font-medium">Solicitantes</th>
                  <th className="pb-2 font-medium">Mínimo</th>
                  <th className="pb-2 font-medium">Máximo</th>
                  <th className="pb-2 font-medium">Media</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {[
                  { label: 'Total',      key: 'total' },
                  { label: 'Español',    key: 'español' },
                  { label: 'Extranjero', key: 'extranjero' },
                ].map(({ label, key }) => {
                  const s = data.stats[key]
                  const fmt = (v) => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  return (
                    <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">{label}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{s.count.toLocaleString('es-ES')}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{fmt(s.min)}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{fmt(s.max)}</td>
                      <td className="py-2 font-semibold text-gray-800 dark:text-gray-200">{fmt(s.avg)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Distribución del importe de ayuda</h2>
          <div className="flex flex-wrap gap-6 mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex-1">
              La mayoría de los admitidos recibe entre 3.000–5.400 €. El tramo 4k–5.4k es el más frecuente.
            </p>
            <div className="flex gap-6 text-sm shrink-0">
              {[
                { label: 'Total', key: 'total' },
                { label: 'Español', key: 'español' },
                { label: 'Extranjero', key: 'extranjero' },
              ].map(({ label, key }) => {
                const d = data.distribution[key]
                const fmt = v => v.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                return (
                  <div key={key} className="text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{fmt(d.median)} €</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">mediana</p>
                  </div>
                )
              })}
            </div>
          </div>
          <DistributionChart distribution={data.distribution} dark={dark} />
        </div>

        {/* Funnel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Solicitudes: admitidas vs excluidas</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            2 de cada 3 solicitantes fueron excluidos. La tasa es prácticamente idéntica entre grupos.
          </p>
          <div className="space-y-5">
            {[
              { label: 'Total',      key: 'total' },
              { label: 'Español',    key: 'español' },
              { label: 'Extranjero', key: 'extranjero' },
            ].map(({ label, key }) => {
              const f = data.funnel[key]
              const admPct = (f.admitted / f.total * 100).toFixed(1)
              const excPct = (f.excluded / f.total * 100).toFixed(1)
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
                    <span className="text-gray-400 dark:text-gray-500 text-xs">
                      {f.total.toLocaleString('es-ES')} solicitudes
                    </span>
                  </div>
                  <div className="flex h-6 rounded-full overflow-hidden text-xs font-semibold">
                    <div
                      className="flex items-center justify-center bg-blue-500 text-white"
                      style={{ width: `${admPct}%` }}
                    >
                      {admPct}%
                    </div>
                    <div
                      className="flex items-center justify-center bg-red-400 text-white"
                      style={{ width: `${excPct}%` }}
                    >
                      {excPct}%
                    </div>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-gray-400 dark:text-gray-500">
                    <span><span className="text-blue-500 font-medium">■</span> Admitidos {f.admitted.toLocaleString('es-ES')}</span>
                    <span><span className="text-red-400 font-medium">■</span> Excluidos {f.excluded.toLocaleString('es-ES')}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bar chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Motivos de exclusión por origen</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            % de solicitantes de cada grupo excluidos por cada motivo. Un solicitante puede tener varios motivos.
            <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">
              Español: {data.chart.español.total.toLocaleString('es-ES')}
            </span>
            <span className="mx-1 text-gray-400 dark:text-gray-500">·</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Extranjero: {data.chart.extranjero.total.toLocaleString('es-ES')}
            </span>
            <span className="ml-3 text-gray-400 dark:text-gray-500">Haz clic en una barra para ver el motivo.</span>
          </p>
          <ExclusionChart chart={data.chart} codes={data.codes} onBarClick={setHighlighted} dark={dark} />
        </div>

        {/* Codes table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Clave de motivos de exclusión</h2>
          <CodesTable codes={data.codes} highlighted={highlighted} />
        </div>

      </div>
    </div>
  )
}

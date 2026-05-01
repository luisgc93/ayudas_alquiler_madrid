import { useState, useEffect } from 'react'
import ExclusionChart from './ExclusionChart'
import CodesTable from './CodesTable'
import OriginPieCharts, { ExcluidosPieChart } from './OriginPieCharts'
import DistributionChart from './DistributionChart'
import DataView from './DataView'

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
  const [mainTab, setMainTab] = useState('analisis')
  const [preferenteFilter, setPreferenteFilter] = useState('all')
  const [classificationFilter, setClassificationFilter] = useState('both')
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
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

        {/* Description */}
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p>
            Análisis de la lista definitiva de beneficiarios y excluidos de la convocatoria de{' '}
            <strong className="text-gray-700 dark:text-gray-300">ayudas al alquiler para jóvenes de la Comunidad de Madrid (2024)</strong>,
            regulada por el{' '}
            <a
              href="https://www.boe.es/buscar/act.php?id=BOE-A-2022-802"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Real Decreto 42/2022
            </a>.
          </p>
          <p>
            El origen es un factor social que determina parcialmente nuestra cultura, opiniones y forma de ver el mundo.
            Es por tanto un factor digno de estudio a tener en cuenta en cualquier análisis como lo puede ser el de la concesión de ayudas del estado.
            Un análisis transparente protege a la ciudadanía de discursos del odio, afirmaciones infundadas u opacas,
            y en definitiva contribuye a una discusión política más honesta.
          </p>
          <p>
            La clasificación por origen combina dos criterios: que <strong className="text-gray-700 dark:text-gray-300">todos los nombres de pila</strong> aparezcan
            en un{' '}
            <a
              href="https://github.com/luisgc93/ayudas_alquiler_madrid/blob/main/spanish_names.csv"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              dataset de nombres españoles
            </a>
            , y que el <strong className="text-gray-700 dark:text-gray-300">NIF/NIE tenga estructura de nacional español</strong>{' '}
            (NIF: <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">***NNNN**</code> vs NIE:{' '}
            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">****NNNN*</code>).
            El filtro de clasificación permite ver cada criterio por separado.
          </p>
          <p className="mt-3">
            Fuente:{' '}
            <a
              href="https://sede.comunidad.madrid/ayudas-becas-subvenciones/ayudas-alquiler-vivienda-jovenes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Ayudas al alquiler de vivienda para jóvenes (CAM)
            </a>
          </p>
          <p>
            Repositorio en GitHub:{' '}
            <a
              href="https://github.com/luisgc93/ayudas_alquiler_madrid"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              https://github.com/luisgc93/ayudas_alquiler_madrid
            </a>
          </p>
        </div>

        {/* Main tabs */}
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
          {[
            { key: 'analisis', label: 'Análisis' },
            { key: 'datos',    label: 'Datos' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMainTab(key)}
              className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors ${
                mainTab === key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mainTab === 'datos' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
            <DataView baseUrl={import.meta.env.BASE_URL} />
          </div>
        )}

        {mainTab === 'analisis' && <>

        {/* Filters */}
        <div className="sticky top-0 z-10 space-y-2 py-2 -mt-4 sm:-mt-8 bg-gray-50 dark:bg-gray-900">
          {/* Classification filter */}
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400 dark:text-gray-500 self-center mr-1">Clasificación:</span>
            {[
              { key: 'both', label: 'Nombre + NIF/NIE' },
              { key: 'name', label: 'Solo nombre' },
              { key: 'nif',  label: 'Solo NIF/NIE' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setClassificationFilter(key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  classificationFilter === key
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Preferente filter */}
          <div className="flex gap-1.5 items-center">
            <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">Expedientes:</span>
            {[
              { key: 'all',        label: 'Todos' },
              { key: 'preferente', label: 'Preferentes' },
              { key: 'general',    label: 'General' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPreferenteFilter(key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  preferenteFilter === key
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Pie charts */}
        <OriginPieCharts pie={data[classificationFilter][preferenteFilter].pie} />

        {/* Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Importe de ayuda (€) — admitidos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left pb-2 font-medium">Grupo</th>
                  <th className="pb-2 font-medium">Solicitantes</th>
                  <th className="pb-2 font-medium hidden sm:table-cell">Mínimo</th>
                  <th className="pb-2 font-medium hidden sm:table-cell">Máximo</th>
                  <th className="pb-2 font-medium">Media</th>
                  <th className="pb-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {[
                  { label: 'Total',      key: 'total' },
                  { label: 'Español',    key: 'español' },
                  { label: 'Extranjero', key: 'extranjero' },
                ].map(({ label, key }) => {
                  const s = data[classificationFilter][preferenteFilter].stats[key]
                  const fmt = (v) => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  const fmtTotal = (v) => v.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                  return (
                    <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">{label}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{s.count.toLocaleString('es-ES')}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400 hidden sm:table-cell">{fmt(s.min)}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400 hidden sm:table-cell">{fmt(s.max)}</td>
                      <td className="py-2 font-semibold text-gray-800 dark:text-gray-200">{fmt(s.avg)}</td>
                      <td className="py-2 font-semibold text-gray-800 dark:text-gray-200">{fmtTotal(s.avg * s.count)} €</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Distribución del importe de ayuda</h2>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-6 mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 sm:flex-1">
              La mayoría de los admitidos recibe entre 3.000–5.400 €. El tramo 4k–5.4k es el más frecuente.
            </p>
            <div className="flex gap-6 text-sm">
              {[
                { label: 'Total', key: 'total' },
                { label: 'Español', key: 'español' },
                { label: 'Extranjero', key: 'extranjero' },
              ].map(({ label, key }) => {
                const d = data[classificationFilter][preferenteFilter].distribution[key]
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
          <DistributionChart distribution={data[classificationFilter][preferenteFilter].distribution} dark={dark} />
        </div>

        {/* Funnel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Solicitudes: admitidas vs excluidas</h2>
          <div className="space-y-5 mt-6">
            {[
              { label: 'Total',      key: 'total' },
              { label: 'Español',    key: 'español' },
              { label: 'Extranjero', key: 'extranjero' },
            ].map(({ label, key }) => {
              const f = data[classificationFilter][preferenteFilter].funnel[key]
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

        {/* Excluidos pie */}
        <ExcluidosPieChart pie={data[classificationFilter].excluidos_pie[preferenteFilter]} />

        {/* Bar chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Motivos de exclusión por origen</h2>
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-baseline gap-1 sm:gap-0 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <p className="sm:mr-2">% de solicitantes de cada grupo excluidos por cada motivo. Un solicitante puede tener varios motivos.</p>
            <p className="flex flex-wrap items-baseline gap-x-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Español: {data[classificationFilter].chart.español.total.toLocaleString('es-ES')}
              </span>
              <span className="text-gray-400 dark:text-gray-500">·</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Extranjero: {data[classificationFilter].chart.extranjero.total.toLocaleString('es-ES')}
              </span>
              <span className="ml-1">Haz clic en una barra para ver el motivo.</span>
            </p>
          </div>
          <ExclusionChart chart={data[classificationFilter].chart} codes={data.codes} onBarClick={setHighlighted} dark={dark} />
        </div>

        {/* Codes table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Clave de motivos de exclusión</h2>
          <CodesTable codes={data.codes} highlighted={highlighted} />
        </div>

        </>}

      </div>
    </div>
  )
}

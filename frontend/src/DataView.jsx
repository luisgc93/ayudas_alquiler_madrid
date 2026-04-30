import { useState, useEffect } from 'react'
import DataTable from './DataTable'

const ADMITIDOS_COLS = [
  { accessorKey: 'orden',      header: 'Orden',      meta: { hideOnMobile: true } },
  { accessorKey: 'expediente', header: 'Expediente', meta: { hideOnMobile: true } },
  { accessorKey: 'nombre',     header: 'Nombre',  cell: info => <span className="font-medium">{info.getValue()}</span> },
  { accessorKey: 'nif_nie',    header: 'NIF/NIE',    meta: { hideOnMobile: true } },
  { accessorKey: 'baremo',     header: 'Baremo',     meta: { hideOnMobile: true } },
  {
    accessorKey: 'ayuda',
    header: 'Ayuda (€)',
    cell: info => <span className="tabular-nums">{info.getValue()}</span>,
    sortingFn: (rowA, rowB, columnId) => {
      const parse = v => parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0
      return parse(rowA.getValue(columnId)) - parse(rowB.getValue(columnId))
    },
  },
  {
    accessorKey: 'preferente',
    header: 'Tipo',
    cell: info => info.getValue()
      ? <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">Preferente</span>
      : <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">General</span>,
    meta: { hideOnMobile: true },
  },
  {
    accessorKey: 'español',
    header: 'Origen',
    cell: info => {
      const val = info.getValue()
      if (val === null || val === undefined) return ''
      return (
        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${val ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'}`}>
          {val ? 'Español' : 'Extranjero'}
        </span>
      )
    },
  },
]

const EXCLUIDOS_COLS = [
  { accessorKey: 'expediente', header: 'Expediente', meta: { hideOnMobile: true } },
  { accessorKey: 'nombre',     header: 'Nombre', cell: info => <span className="font-medium">{info.getValue()}</span> },
  { accessorKey: 'dni_nie',    header: 'DNI/NIE',    meta: { hideOnMobile: true } },
  {
    accessorKey: 'motivos',
    header: 'Motivos',
    cell: info => {
      const val = info.getValue()
      if (!val) return '—'
      return (
        <div className="flex flex-wrap gap-1">
          {String(val).split('|').map(m => m.trim()).filter(Boolean).map(m => (
            <span key={m} className="inline-block px-1.5 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-mono">
              {m}
            </span>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: 'preferente',
    header: 'Tipo',
    cell: info => info.getValue()
      ? <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">Preferente</span>
      : <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">General</span>,
    meta: { hideOnMobile: true },
  },
  {
    accessorKey: 'español',
    header: 'Origen',
    cell: info => (
      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${info.getValue() ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'}`}>
        {info.getValue() ? 'Español' : 'Extranjero'}
      </span>
    ),
  },
]

function useTableData(url) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then(setData)
      .catch(setError)
  }, [url])

  return { data, error }
}

const TABS = [
  { key: 'admitidos', label: 'Admitidos' },
  { key: 'excluidos', label: 'Excluidos' },
]

const PREFERENTE_FILTERS = [
  { key: 'all',        label: 'Todos' },
  { key: 'preferente', label: 'Preferentes' },
  { key: 'general',    label: 'General' },
]

export default function DataView({ baseUrl }) {
  const [activeTab, setActiveTab] = useState('admitidos')
  const [preferenteFilter, setPreferenteFilter] = useState('all')

  const admitidos = useTableData(`${baseUrl}admitidos.json`)
  const excluidos = useTableData(`${baseUrl}excluidos.json`)

  const current = activeTab === 'admitidos' ? admitidos : excluidos
  const cols    = activeTab === 'admitidos' ? ADMITIDOS_COLS : EXCLUIDOS_COLS

  const filteredData = (() => {
    if (!current.data) return current.data
    if (preferenteFilter === 'preferente') return current.data.filter(r => r.preferente)
    if (preferenteFilter === 'general')    return current.data.filter(r => !r.preferente)
    return current.data
  })()

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setPreferenteFilter('all') }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Preferente filter pills */}
      <div className="flex gap-1.5">
        {PREFERENTE_FILTERS.map(({ key, label }) => (
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

      {/* Table or loading state */}
      {current.error ? (
        <p className="text-sm text-red-500">Error cargando datos: {current.error.message}</p>
      ) : !current.data ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">Cargando…</p>
      ) : (
        <DataTable columns={cols} data={filteredData} />
      )}
    </div>
  )
}

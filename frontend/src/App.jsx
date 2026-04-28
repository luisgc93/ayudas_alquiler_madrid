import { useState, useEffect } from 'react'
import ExclusionChart from './ExclusionChart'
import CodesTable from './CodesTable'
import OriginPieCharts from './OriginPieCharts'

export default function App() {
  const [data, setData] = useState(null)
  const [highlighted, setHighlighted] = useState(null)

  useEffect(() => {
    fetch('/data.json').then(r => r.json()).then(setData)
  }, [])

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Cargando datos…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Programa Jóvenes CAM 2024
          </h1>
        </div>

        {/* Pie charts */}
        <OriginPieCharts pie={data.pie} />

        {/* Bar chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Motivos de exclusión por origen</h2>
          <p className="text-sm text-gray-500 mb-4">
            % de solicitantes de cada grupo excluidos por cada motivo. Un solicitante puede tener varios motivos.
            <span className="ml-2 font-medium text-gray-700">
              Español: {data.chart.español.total.toLocaleString('es-ES')}
            </span>
            <span className="mx-1 text-gray-400">·</span>
            <span className="font-medium text-gray-700">
              Extranjero: {data.chart.extranjero.total.toLocaleString('es-ES')}
            </span>
            <span className="ml-3 text-gray-400">Haz clic en una barra para ver el motivo.</span>
          </p>
          <ExclusionChart chart={data.chart} codes={data.codes} onBarClick={setHighlighted} />
        </div>

        {/* Codes table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Clave de motivos de exclusión</h2>
          <CodesTable codes={data.codes} highlighted={highlighted} />
        </div>

      </div>
    </div>
  )
}

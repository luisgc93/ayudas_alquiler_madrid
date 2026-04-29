import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'

const COLOR_ES = '#3b82f6'   // blue-500
const COLOR_EX = '#f97316'   // orange-500

function CustomTooltip({ active, payload, label, codes }) {
  if (!active || !payload?.length) return null
  const codeEntry = codes.find(c => c.code === label)
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 text-sm max-w-xs">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Motivo {label}</p>
      {codeEntry && (
        <p className="text-gray-500 dark:text-gray-400 text-xs mb-2 leading-snug">{codeEntry.description}</p>
      )}
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill }} className="font-medium">
          {p.name}: {p.value}%
          <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">
            ({p.payload[p.name === 'Español' ? 'countEs' : 'countEx'].toLocaleString('es-ES')} solicitantes)
          </span>
        </p>
      ))}
    </div>
  )
}

export default function ExclusionChart({ chart, onBarClick, codes = [], dark = false }) {
  const { español: es, extranjero: ex } = chart

  const chartData = es.codes.map((code, i) => ({
    code,
    Español: es.rates[i],
    Extranjero: ex.rates[i],
    countEs: es.counts[i],
    countEx: ex.counts[i],
  }))

  const tickColor  = dark ? '#9ca3af' : '#6b7280'
  const gridColor  = dark ? '#374151' : '#f0f0f0'
  const cursorFill = dark ? '#1f2937' : '#f9fafb'
  const legendColor = dark ? '#d1d5db' : '#374151'

  return (
    <ResponsiveContainer width="100%" height={380}>
      <BarChart
        data={chartData}
        margin={{ top: 4, right: 16, left: 0, bottom: 40 }}
        barCategoryGap="25%"
        barGap={3}
        onClick={e => e?.activeLabel && onBarClick(e.activeLabel)}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis
          dataKey="code"
          tick={{ fontSize: 11, fill: tickColor }}
          axisLine={false}
          tickLine={false}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          tickFormatter={v => `${v}%`}
          tick={{ fontSize: 12, fill: tickColor }}
          axisLine={false}
          tickLine={false}
          width={42}
        />
        <Tooltip content={<CustomTooltip codes={codes} />} cursor={{ fill: cursorFill }} />
        <Legend
          iconType="square"
          iconSize={10}
          wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
          formatter={value => <span style={{ color: legendColor }}>{value}</span>}
        />
        <Bar dataKey="Español" fill={COLOR_ES} radius={[3, 3, 0, 0]} />
        <Bar dataKey="Extranjero" fill={COLOR_EX} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

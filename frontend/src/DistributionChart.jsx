import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'

const COLOR_ES = '#3b82f6'
const COLOR_EX = '#f97316'
const COLOR_SC = '#6b7280'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 text-sm max-w-xs">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{label} €</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill }} className="font-medium">
          {p.name}: {p.value.toLocaleString('es-ES')} beneficiarios
        </p>
      ))}
    </div>
  )
}

export default function DistributionChart({ distribution, dark = false }) {
  const { buckets, español: es, extranjero: ex, sin_clasificar: sc } = distribution

  const chartData = buckets.map((bucket, i) => ({
    bucket,
    Español: es.counts[i],
    Extranjero: ex.counts[i],
    'Sin clasificar': sc.counts[i],
  }))

  const tickColor   = dark ? '#9ca3af' : '#6b7280'
  const gridColor   = dark ? '#374151' : '#f0f0f0'
  const cursorFill  = dark ? '#1f2937' : '#f9fafb'
  const legendColor = dark ? '#d1d5db' : '#374151'

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={chartData}
        margin={{ top: 4, right: 16, left: 0, bottom: 40 }}
        barCategoryGap="25%"
        barGap={3}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis
          dataKey="bucket"
          tick={{ fontSize: 11, fill: tickColor }}
          axisLine={false}
          tickLine={false}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 12, fill: tickColor }}
          axisLine={false}
          tickLine={false}
          width={42}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: cursorFill }} />
        <Legend
          iconType="square"
          iconSize={10}
          wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
          formatter={value => <span style={{ color: legendColor }}>{value}</span>}
        />
        <Bar dataKey="Español" fill={COLOR_ES} radius={[3, 3, 0, 0]} />
        <Bar dataKey="Extranjero" fill={COLOR_EX} radius={[3, 3, 0, 0]} />
        <Bar dataKey="Sin clasificar" fill={COLOR_SC} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

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
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm max-w-xs">
      <p className="font-semibold text-gray-900 mb-1">Motivo {label}</p>
      {codeEntry && (
        <p className="text-gray-500 text-xs mb-2 leading-snug">{codeEntry.description}</p>
      )}
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill }} className="font-medium">
          {p.name}: {p.value}%
          <span className="text-gray-400 font-normal ml-1">
            ({p.payload[p.name === 'Español' ? 'countEs' : 'countEx'].toLocaleString('es-ES')} solicitantes)
          </span>
        </p>
      ))}
    </div>
  )
}

export default function ExclusionChart({ chart, onBarClick, codes = [] }) {
  const { español: es, extranjero: ex } = chart

  const chartData = es.codes.map((code, i) => ({
    code,
    Español: es.rates[i],
    Extranjero: ex.rates[i],
    countEs: es.counts[i],
    countEx: ex.counts[i],
  }))

  return (
    <ResponsiveContainer width="100%" height={380}>
      <BarChart
        data={chartData}
        margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
        barCategoryGap="25%"
        barGap={3}
        onClick={e => e?.activeLabel && onBarClick(e.activeLabel)}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="code"
          tick={{ fontSize: 12, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={v => `${v}%`}
          tick={{ fontSize: 12, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
          width={42}
        />
        <Tooltip content={<CustomTooltip codes={codes} />} cursor={{ fill: '#f9fafb' }} />
        <Legend
          iconType="square"
          iconSize={10}
          wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
        />
        <Bar dataKey="Español" fill={COLOR_ES} radius={[3, 3, 0, 0]} />
        <Bar dataKey="Extranjero" fill={COLOR_EX} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

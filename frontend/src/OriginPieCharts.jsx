import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = { 'Español': '#3b82f6', 'Extranjero': '#f97316' }

function EuroTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 dark:text-gray-100">{name}</p>
      <p className="text-gray-600 dark:text-gray-400">{value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</p>
    </div>
  )
}

function CountTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 dark:text-gray-100">{name}</p>
      <p className="text-gray-600 dark:text-gray-400">{value.toLocaleString('es-ES')} beneficiarios</p>
    </div>
  )
}

function SinglePie({ data, dataKey, title, TooltipComponent }) {
  const total = data.reduce((s, d) => s + d[dataKey], 0)

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, index }) => {
    const RADIAN = Math.PI / 180
    const r = innerRadius + (outerRadius - innerRadius) * 0.55
    const x = cx + r * Math.cos(-midAngle * RADIAN)
    const y = cy + r * Math.sin(-midAngle * RADIAN)
    const pct = ((data[index][dataKey] / total) * 100).toFixed(1)
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
        fontSize={14} fontWeight={600}>
        {pct}%
      </text>
    )
  }

  return (
    <div className="flex-1 min-w-0">
      <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{title}</p>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            labelLine={false}
            label={renderLabel}
            startAngle={90}
            endAngle={-270}
          >
            {data.map(entry => (
              <Cell key={entry.name} fill={COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip content={<TooltipComponent />} />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: '13px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function OriginPieCharts({ pie }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Beneficiarios por origen</h2>
      <div className="flex gap-6 flex-wrap">
        <SinglePie data={pie} dataKey="count"  title="Número de beneficiarios"    TooltipComponent={CountTooltip} />
        <SinglePie data={pie} dataKey="amount" title="Importe total de ayudas (€)" TooltipComponent={EuroTooltip} />
      </div>
    </div>
  )
}

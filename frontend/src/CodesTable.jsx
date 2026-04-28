import { useEffect, useRef } from 'react'

export default function CodesTable({ codes, highlighted }) {
  const rowRefs = useRef({})

  useEffect(() => {
    if (highlighted && rowRefs.current[highlighted]) {
      rowRefs.current[highlighted].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlighted])

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-700">
          <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-400 w-16">Código</th>
          <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-400">Descripción</th>
        </tr>
      </thead>
      <tbody>
        {codes.map(({ code, description }) => {
          const isHighlighted = highlighted === code
          return (
            <tr
              key={code}
              ref={el => (rowRefs.current[code] = el)}
              className={`border-b border-gray-100 dark:border-gray-700 transition-colors duration-300 ${
                isHighlighted ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <td className={`py-2 px-3 font-mono font-bold whitespace-nowrap ${
                isHighlighted ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {code}
              </td>
              <td className="py-2 px-3 text-gray-600 dark:text-gray-400 leading-snug">{description}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

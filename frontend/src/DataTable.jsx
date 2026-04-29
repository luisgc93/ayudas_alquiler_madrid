import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'

function SortIcon({ sorted }) {
  if (sorted === 'asc') return <span className="ml-1 text-blue-500">↑</span>
  if (sorted === 'desc') return <span className="ml-1 text-blue-500">↓</span>
  return <span className="ml-1 text-gray-300 dark:text-gray-600">↕</span>
}

export default function DataTable({ columns, data }) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 100 })

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting, pagination },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const { pageIndex, pageSize } = table.getState().pagination
  const totalRows = table.getFilteredRowModel().rows.length
  const firstRow = pageIndex * pageSize + 1
  const lastRow = Math.min((pageIndex + 1) * pageSize, totalRows)

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={globalFilter}
          onChange={e => { setGlobalFilter(e.target.value); setPagination(p => ({ ...p, pageIndex: 0 })) }}
          placeholder="Buscar en todos los campos…"
          className="w-full max-w-sm px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
          {totalRows.toLocaleString('es-ES')} filas
          {globalFilter ? ` de ${data.length.toLocaleString('es-ES')}` : ''}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
        <table className="w-full text-sm border-collapse">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap ${header.column.getCanSort() ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200' : ''}`}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <SortIcon sorted={header.column.getIsSorted()} />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {totalRows > 0 ? `${firstRow}–${lastRow} de ${totalRows.toLocaleString('es-ES')}` : '0 resultados'}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-2 py-1 rounded disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700"
          >«</button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-2 py-1 rounded disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700"
          >‹</button>
          <span className="px-2">
            Página {pageIndex + 1} / {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-2 py-1 rounded disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700"
          >›</button>
          <button
            onClick={() => table.lastPage()}
            disabled={!table.getCanNextPage()}
            className="px-2 py-1 rounded disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700"
          >»</button>
        </div>
        <select
          value={pageSize}
          onChange={e => table.setPageSize(Number(e.target.value))}
          className="ml-2 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-1 py-0.5"
        >
          {[50, 100, 200].map(s => <option key={s} value={s}>{s} / pág</option>)}
        </select>
      </div>
    </div>
  )
}

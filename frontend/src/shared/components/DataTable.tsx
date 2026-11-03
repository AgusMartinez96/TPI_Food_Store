import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Paginacion } from './Paginacion'

interface DataTableProps<T extends { id: number }> {
  datos: T[]
  columnas: ColumnDef<T>[]
  porPagina?: number
}

/**
 * Tabla del panel con TanStack Table. El panel pide hasta 100 registros al servidor (limit=100)
 * y la paginación se hace acá, del lado del cliente.
 */
export function DataTable<T extends { id: number }>({ datos, columnas, porPagina = 10 }: DataTableProps<T>) {
  const tabla = useReactTable({
    data: datos,
    columns: columnas,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (fila) => String(fila.id),
    initialState: { pagination: { pageSize: porPagina } },
  })

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-600">
            {tabla.getHeaderGroups().map((grupo) => (
              <tr key={grupo.id}>
                {grupo.headers.map((cabecera) => (
                  <th key={cabecera.id} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">
                    {cabecera.isPlaceholder ? null : flexRender(cabecera.column.columnDef.header, cabecera.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-stone-100">
            {tabla.getRowModel().rows.map((fila) => (
              <tr key={fila.id} className="hover:bg-stone-50">
                {fila.getVisibleCells().map((celda) => (
                  <td key={celda.id} className="px-4 py-3 align-middle">
                    {flexRender(celda.column.columnDef.cell, celda.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-stone-500">{datos.length} registros</p>
      <Paginacion
        pagina={tabla.getState().pagination.pageIndex}
        totalPaginas={tabla.getPageCount()}
        onCambiar={(pagina) => tabla.setPageIndex(pagina)}
      />
    </div>
  )
}

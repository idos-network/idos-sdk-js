"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Center all header and cell content */
  center?: boolean;
  /** Show skeleton rows instead of data */
  loading?: boolean;
  /** Number of skeleton rows to render (defaults to data.length or 10) */
  skeletonRows?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  center = false,
  loading = false,
  skeletonRows,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const cellClass = center ? "text-center" : "";
  const rowCount = skeletonRows ?? (data.length > 0 ? data.length : 10);

  return (
    <div className="bg-card min-w-0 overflow-hidden rounded-xl border">
      <Table className="table-fixed">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cellClass}
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: rowCount }, (_, i) => (
              <TableRow key={`skeleton-${i}`} style={{ height: 45 }}>
                {table.getAllColumns().map((col) => (
                  <TableCell
                    key={col.id}
                    className={cellClass}
                    style={{ width: col.getSize() }}
                  >
                    <Skeleton className="mx-auto h-4 w-3/4 rounded" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cellClass}
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext(),
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

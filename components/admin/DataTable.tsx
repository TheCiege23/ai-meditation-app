import type { ReactNode } from "react";

type DataTableProps = {
  columns: string[];
  rows: ReactNode[][];
  emptyMessage?: string;
};

export default function DataTable({ columns, rows, emptyMessage = "No records yet." }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-[1.8rem] border border-slate-200/70 bg-white/80 shadow-[0_24px_70px_rgba(148,163,184,0.14)] dark:border-white/10 dark:bg-slate-950/55">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50/90 text-left dark:bg-white/5">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index} className="border-t border-slate-200/70 align-top dark:border-white/10">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-4 text-slate-700 dark:text-slate-200">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

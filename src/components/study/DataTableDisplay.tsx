import React from 'react';
import type { DataTableData } from '@/types/database';

interface DataTableDisplayProps {
  dataTable: DataTableData;
  className?: string;
}

export const DataTableDisplay: React.FC<DataTableDisplayProps> = ({ dataTable, className = '' }) => {
  if (!dataTable || !dataTable.columns || !dataTable.rows || dataTable.columns.length === 0) {
    return null;
  }

  return (
    <div className={`w-full my-2.5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 shadow-inner ${className}`}>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
              {dataTable.columns.map((col, idx) => (
                <th
                  key={idx}
                  className="py-2 px-3 font-extrabold text-slate-700 dark:text-slate-200 whitespace-nowrap text-center first:text-left"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
            {dataTable.rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors"
              >
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className="py-1.5 px-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap text-center first:text-left first:font-bold"
                  >
                    {cell !== null && cell !== undefined ? String(cell) : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

const DataTable = ({
  columns,
  data = [],
  loading = false,
  searchPlaceholder = 'Search records...',
  searchValue = '',
  onSearchChange,
  pageNumber = 0,
  pageSize = 10,
  totalPages = 1,
  totalElements = 0,
  onPageChange,
  sortBy = 'id',
  sortDir = 'asc',
  onSortChange,
  actions = null,
}) => {
  const handleSort = (columnKey) => {
    if (!onSortChange) return;
    if (sortBy === columnKey) {
      onSortChange(columnKey, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(columnKey, 'asc');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* Top Controls: Search Bar & Custom Actions */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400"
          />
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto min-h-[300px] flex-1">
        {loading ? (
          <LoadingSpinner message="Fetching data..." />
        ) : data.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No records found"
              description="No data matches your search or filter criteria."
            />
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key || col.header}
                    onClick={() => col.sortable && handleSort(col.sortField || col.key)}
                    className={`px-5 py-3.5 ${
                      col.sortable ? 'cursor-pointer select-none hover:text-indigo-600' : ''
                    } ${col.className || ''}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {sortBy === (col.sortField || col.key) ? (
                            sortDir === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key || col.header}
                      className={`px-5 py-3.5 whitespace-nowrap ${col.cellClassName || ''}`}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs text-slate-500">
        <div>
          Showing{' '}
          <span className="font-semibold text-slate-800">
            {totalElements === 0 ? 0 : pageNumber * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-slate-800">
            {Math.min((pageNumber + 1) * pageSize, totalElements)}
          </span>{' '}
          of <span className="font-semibold text-slate-800">{totalElements}</span> results
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange && onPageChange(pageNumber - 1)}
            disabled={pageNumber === 0}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium">
            Page {totalPages === 0 ? 1 : pageNumber + 1} of {Math.max(1, totalPages)}
          </span>
          <button
            type="button"
            onClick={() => onPageChange && onPageChange(pageNumber + 1)}
            disabled={pageNumber + 1 >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;

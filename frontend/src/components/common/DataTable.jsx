import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react";

export default function DataTable({
  columns,
  data,
  rowsPerPage,
  onRowsPerPageChange,
  onEdit,
  onDelete,
}) {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [data, rowsPerPage, currentPage]);

  const sortedData = useMemo(() => {
    const items = [...data];

    if (!sortConfig.key) return items;

    items.sort((a, b) => {
      let first = a[sortConfig.key];
      let second = b[sortConfig.key];

      if (first === null || first === undefined) first = "";
      if (second === null || second === undefined) second = "";

      if (typeof first === "string") {
        const comparison = first.localeCompare(second);

        return sortConfig.direction === "asc" ? comparison : -comparison;
      }

      return sortConfig.direction === "asc" ? first - second : second - first;
    });

    return items;
  }, [data, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));

  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  function handleSort(key) {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }

  const showingFrom =
    sortedData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;

  const showingTo = Math.min(currentPage * rowsPerPage, sortedData.length);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="max-h-[420px] overflow-y-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-slate-100 z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700"
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-2"
                    >
                      {column.label}
                      <ArrowUpDown size={14} />
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}

              <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="py-10 text-center text-slate-500"
                >
                  No records found.
                </td>
              </tr>
            )}

            {paginatedData.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 hover:bg-slate-50"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-3 text-sm text-slate-700"
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}

                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(row.id)}
                      className="text-rose-600 hover:text-rose-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
        <p className="text-sm text-slate-500">
          Showing {showingFrom}-{showingTo} of {sortedData.length}
        </p>

        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

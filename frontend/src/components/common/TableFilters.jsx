export default function TableFilters({
  filters,
  departments,
  disciplines,
  onFilterChange,
}) {
  return (
    <div className="grid grid-cols-5 gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <select
        value={filters.department}
        onChange={(e) => onFilterChange("department", e.target.value)}
        className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
      >
        <option value="">All Departments</option>

        {departments.map((department) => (
          <option key={department.id} value={department.name}>
            {department.name}
          </option>
        ))}
      </select>

      <select
        value={filters.discipline}
        onChange={(e) => onFilterChange("discipline", e.target.value)}
        className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
      >
        <option value="">All Disciplines</option>

        {disciplines.map((discipline) => (
          <option key={discipline.id} value={discipline.name}>
            {discipline.name}
          </option>
        ))}
      </select>

      <select
        value={filters.level}
        onChange={(e) => onFilterChange("level", e.target.value)}
        className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
      >
        <option value="">All Levels</option>

        {Array.from({ length: 8 }, (_, index) => (
          <option key={index + 1} value={index + 1}>
            Level {index + 1}
          </option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) => onFilterChange("status", e.target.value)}
        className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
      >
        <option value="">All Status</option>
        <option value="vacant">Vacant</option>
        <option value="filled">Filled</option>
      </select>

      <select
        value={filters.rowsPerPage}
        onChange={(e) => onFilterChange("rowsPerPage", Number(e.target.value))}
        className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
      >
        <option value={5}>5 Rows</option>
        <option value={10}>10 Rows</option>
        <option value={20}>20 Rows</option>
        <option value={50}>50 Rows</option>
      </select>
    </div>
  );
}

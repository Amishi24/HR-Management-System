import { useState, useMemo } from "react";
import { Eye, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import SectionCard from "../common/SectionCard";

export default function DeptTeamRoster({ team, onViewEmployee }) {
  const [search, setSearch] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "employee_name", direction: "asc" });

  // Get unique disciplines for dropdown filter
  const disciplines = useMemo(() => {
    const unique = new Set(team.map((m) => m.discipline).filter(Boolean));
    return Array.from(unique).sort();
  }, [team]);

  // Filter team
  const filteredTeam = useMemo(() => {
    return team.filter((member) => {
      const matchesSearch = member.employee_name
        ?.toLowerCase()
        .includes(search.toLowerCase());
      
      const matchesDiscipline = !disciplineFilter || member.discipline === disciplineFilter;
      
      const memberStatus = member.is_active ? "active" : "inactive";
      const matchesStatus = !statusFilter || memberStatus === statusFilter;

      return matchesSearch && matchesDiscipline && matchesStatus;
    });
  }, [team, search, disciplineFilter, statusFilter]);

  // Sort team
  const sortedTeam = useMemo(() => {
    const items = [...filteredTeam];
    if (!sortConfig.key) return items;

    items.sort((a, b) => {
      let first = a[sortConfig.key];
      let second = b[sortConfig.key];

      if (sortConfig.key === "status") {
        first = a.is_active ? "Active" : "Inactive";
        second = b.is_active ? "Active" : "Inactive";
      } else if (sortConfig.key === "department") {
        first = a.Assigned_department || "";
        second = b.Assigned_department || "";
      }

      if (first === null || first === undefined) first = "";
      if (second === null || second === undefined) second = "";

      if (typeof first === "string") {
        const comparison = first.localeCompare(second);
        return sortConfig.direction === "asc" ? comparison : -comparison;
      }

      return sortConfig.direction === "asc" ? first - second : second - first;
    });

    return items;
  }, [filteredTeam, sortConfig]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedTeam.length / rowsPerPage));
  
  // Reset page if it exceeds totalPages
  const activePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    return sortedTeam.slice(
      (activePage - 1) * rowsPerPage,
      activePage * rowsPerPage
    );
  }, [sortedTeam, activePage, rowsPerPage]);

  function handleSort(key) {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }

  const showingFrom = sortedTeam.length === 0 ? 0 : (activePage - 1) * rowsPerPage + 1;
  const showingTo = Math.min(activePage * rowsPerPage, sortedTeam.length);

  return (
    <SectionCard title="Team Roster" subtitle="Your active team across the selected department tree.">
      <div className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search team member..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          <select
            value={disciplineFilter}
            onChange={(e) => {
              setDisciplineFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm focus:bg-white focus:outline-none transition-colors"
          >
            <option value="">All Disciplines</option>
            {disciplines.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm focus:bg-white focus:outline-none transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm focus:bg-white focus:outline-none transition-colors"
          >
            <option value={5}>5 Rows per page</option>
            <option value={10}>10 Rows per page</option>
            <option value={20}>20 Rows per page</option>
            <option value={50}>50 Rows per page</option>
          </select>
        </div>

        {/* Scrollable Container with Sticky Header */}
        <div className="rounded-2xl border border-slate-100 bg-white">
          <div className="max-h-[350px] overflow-y-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort("employee_name")}
                      className="flex items-center gap-1.5 hover:text-slate-700"
                    >
                      Employee
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort("discipline")}
                      className="flex items-center gap-1.5 hover:text-slate-700"
                    >
                      Discipline
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort("department")}
                      className="flex items-center gap-1.5 hover:text-slate-700"
                    >
                      Department
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort("status")}
                      className="flex items-center gap-1.5 hover:text-slate-700"
                    >
                      Status
                      <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                      No team members found matching the filters.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((member) => (
                    <tr
                      key={member.employee_id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">
                        {member.employee_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {member.discipline}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {member.Assigned_department}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            member.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {member.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <button
                          type="button"
                          onClick={() => onViewEmployee(member.employee_id)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          title="View Employee Detail"
                        >
                          <Eye size={15} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500">
            Showing {showingFrom} to {showingTo} of {sortedTeam.length} members
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={activePage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-medium text-slate-600">
              Page {activePage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={activePage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getDeptHeadTeam,
  getDeptHeadTeamMember,
  createDeptHeadAssignment,
  deleteDeptHeadAssignment,
  initiateDeptHeadTransfer,
} from "../../api/roleApi";
import EmployeeDetail from "./EmployeeDetail";
import { Search, User, Users } from "lucide-react";

export default function EmployeeDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [assignmentDrafts, setAssignmentDrafts] = useState({});

  const employeeIdParam = searchParams.get("employeeId");

  // Fetch all employees in the department head's scope
  useEffect(() => {
    async function loadDirectory() {
      setLoadingList(true);
      setError("");
      try {
        const res = await getDeptHeadTeam("");
        setEmployees(res.data || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load the employee directory.");
      } finally {
        setLoadingList(false);
      }
    }
    void loadDirectory();
  }, []);

  // Fetch specific employee details when parameter changes
  useEffect(() => {
    if (employeeIdParam) {
      void fetchEmployeeDetail(employeeIdParam);
    } else {
      setSelectedEmployee(null);
    }
  }, [employeeIdParam]);

  async function fetchEmployeeDetail(employeeId) {
    setLoadingDetail(true);
    try {
      const res = await getDeptHeadTeamMember(employeeId);
      setSelectedEmployee(res.data);
    } catch (err) {
      console.error(err);
      setSelectedEmployee({ error: "Unable to load this employee profile." });
    } finally {
      setLoadingDetail(false);
    }
  }

  // Filter list by search query
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const query = searchQuery.toLowerCase();
      return (
        emp.employee_name?.toLowerCase().includes(query) ||
        emp.discipline?.toLowerCase().includes(query) ||
        emp.Assigned_department?.toLowerCase().includes(query)
      );
    });
  }, [employees, searchQuery]);

  function handleSelectEmployee(employeeId) {
    setSearchParams({ employeeId });
  }

  async function handleCreateAssignment(employeeId, tenureId) {
    const draft = assignmentDrafts[`${employeeId}-${tenureId}`] || {
      title: "",
      weightage: 5,
      skills: "",
    };
    if (!draft.title.trim()) {
      alert("Please enter an assignment title before saving.");
      return;
    }
    try {
      await createDeptHeadAssignment(employeeId, tenureId, {
        title: draft.title,
        weightage: Number(draft.weightage || 5),
        skills: draft.skills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setAssignmentDrafts((prev) => ({
        ...prev,
        [`${employeeId}-${tenureId}`]: { title: "", weightage: 5, skills: "" },
      }));
      await fetchEmployeeDetail(employeeId);
    } catch (err) {
      console.error(err);
      alert("The assignment could not be created.");
    }
  }

  async function handleDeleteAssignment(employeeId, assignmentId) {
    try {
      await deleteDeptHeadAssignment(employeeId, assignmentId);
      await fetchEmployeeDetail(employeeId);
    } catch (err) {
      console.error(err);
      alert("The assignment could not be deleted.");
    }
  }

  async function handleInitiateTransfer(employeeId, reason) {
    try {
      const res = await initiateDeptHeadTransfer({
        employee_id: employeeId,
        reason,
      });
      await fetchEmployeeDetail(employeeId);
      return { success: true, message: res.data.message };
    } catch (err) {
      console.error(err);
      const errorMsg =
        err.response?.data?.detail || "The transfer could not be initiated.";
      return { success: false, message: errorMsg };
    }
  }

  const handleAssignmentDraftChange = (key, field, value) =>
    setAssignmentDrafts((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [field]: value },
    }));

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-7rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

      {/* ── LEFT PANEL: Employee Detail (8/12) ── */}
      <div className="flex-1 min-w-0 overflow-y-auto order-2 lg:order-1">
        {error && (
          <div className="m-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loadingDetail ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Loading employee details…</p>
            </div>
          </div>
        ) : selectedEmployee ? (
          <div className="p-4 sm:p-6">
            <EmployeeDetail
              employee={selectedEmployee}
              assignmentDrafts={assignmentDrafts}
              onAssignmentDraftChange={handleAssignmentDraftChange}
              onCreateAssignment={handleCreateAssignment}
              onDeleteAssignment={handleDeleteAssignment}
              onInitiateTransfer={handleInitiateTransfer}
            />
          </div>
        ) : (
          /* Empty state — no employee selected */
          <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-5">
              <Users size={36} className="text-slate-300" />
            </div>
            <h3 className="text-base font-bold text-slate-700 mb-2">
              No Employee Selected
            </h3>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Pick a team member from the directory on the right to view their
              profile, tenure history, and assignments.
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="hidden lg:block w-px bg-slate-100 shrink-0" />
      <div className="lg:hidden h-px bg-slate-100 mx-4 order-2" />

      {/* ── RIGHT PANEL: Search + Directory List (4/12) ── */}
      <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col order-1 lg:order-2 border-b lg:border-b-0 border-slate-100">

        {/* Sticky Header: Title + Search */}
        <div className="p-4 border-b border-slate-100 space-y-3 shrink-0 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Directory
            </h2>
            {!loadingList && (
              <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                {filteredEmployees.length}
                {searchQuery ? ` of ${employees.length}` : ""} employees
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search name, discipline, dept…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs focus:border-blue-400 focus:bg-white focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Scrollable Employee List */}
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <div className="text-center">
                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs">Loading…</p>
              </div>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-slate-400">
              <User size={32} className="text-slate-200 mb-2" />
              <p className="text-xs font-medium">No employees found</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-2 text-xs text-blue-500 hover:text-blue-600 underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredEmployees.map((emp) => {
                const isSelected =
                  Number(emp.employee_id) === Number(employeeIdParam);
                return (
                  <button
                    key={emp.employee_id}
                    onClick={() => handleSelectEmployee(emp.employee_id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all relative ${
                      isSelected
                        ? "bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {/* Selected left-border accent */}
                    {isSelected && (
                      <span className="absolute left-0 top-0 h-full w-0.5 bg-blue-500 rounded-r" />
                    )}

                    {/* Avatar */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-sm transition-colors ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {emp.employee_name?.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + Meta */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-semibold truncate ${
                          isSelected ? "text-blue-700" : "text-slate-800"
                        }`}
                      >
                        {emp.employee_name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {emp.discipline}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {emp.Assigned_department}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

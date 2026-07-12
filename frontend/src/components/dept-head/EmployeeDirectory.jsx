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
import { Search, User } from "lucide-react";

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
      const res = await initiateDeptHeadTransfer({ employee_id: employeeId, reason });
      await fetchEmployeeDetail(employeeId);
      return { success: true, message: res.data.message };
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || "The transfer could not be initiated.";
      return { success: false, message: errorMsg };
    }
  }

  const handleAssignmentDraftChange = (key, field, value) =>
    setAssignmentDrafts((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [field]: value },
    }));

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Directory Search and Listing */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">Directory</h2>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search by name, discipline, or dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            {loadingList ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Loading directory listing…
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No employees found.
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto space-y-2 divide-y divide-slate-100 pr-1">
                {filteredEmployees.map((emp) => {
                  const isSelected = Number(emp.employee_id) === Number(employeeIdParam);
                  return (
                    <button
                      key={emp.employee_id}
                      onClick={() => handleSelectEmployee(emp.employee_id)}
                      className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all ${
                        isSelected
                          ? "bg-blue-50 border border-blue-100"
                          : "border border-transparent hover:bg-slate-50"
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${
                        isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                      }`}>
                        {emp.employee_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {emp.employee_name}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {emp.discipline} • {emp.Assigned_department}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Employee Detail Cards */}
        <div className="lg:col-span-7">
          {loadingDetail ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
              Loading employee details…
            </div>
          ) : selectedEmployee ? (
            <EmployeeDetail
              employee={selectedEmployee}
              assignmentDrafts={assignmentDrafts}
              onAssignmentDraftChange={handleAssignmentDraftChange}
              onCreateAssignment={handleCreateAssignment}
              onDeleteAssignment={handleDeleteAssignment}
              onInitiateTransfer={handleInitiateTransfer}
            />
          ) : (
            <div className="rounded-3xl border border-slate-200 border-dashed bg-slate-50 p-12 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
              <User size={48} className="text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Employee Selected</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Select a team member from the directory listing on the left to view their detailed profile, assignments, and tenure records.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

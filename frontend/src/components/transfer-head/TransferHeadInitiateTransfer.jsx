import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  SendToBack,
  User,
  X,
} from "lucide-react";

import {
  getTransferHeadEligibleEmployees,
  initiateTransferHeadTransfer,
  revokeTransferHeadTransfer,
  getTransferHeadEmployeeDetails,
} from "../../api/roleApi";
import SectionCard from "../common/SectionCard";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function isMandatory(employee) {
  return Number(employee.years_served || 0) >= Number(employee.max_tenure_years || 2);
}

export default function TransferHeadInitiateTransfer() {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [employeeDetailData, setEmployeeDetailData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [reason, setReason] = useState("Initiated by transfer head.");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const selectedEmployee = employees.find(
    (employee) => employee.employee_id === selectedEmployeeId,
  );

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return employees;

    return employees.filter((employee) => {
      const values = [
        employee.employee_name,
        employee.employee_id,
        employee.discipline,
        employee.department_name,
        employee.location,
      ];
      return values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(term),
      );
    });
  }, [employees, searchTerm]);

  async function refreshEmployees(clearMessage = true) {
    setLoading(true);
    if (clearMessage) {
      setMessage(null);
    }

    try {
      const res = await getTransferHeadEligibleEmployees();
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: "Unable to load eligible employees.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshEmployees();
  }, []);

  async function handleSelectEmployee(empId) {
    setSelectedEmployeeId(empId);
    setEmployeeDetailData(null);
    setLoadingDetails(true);
    try {
      const res = await getTransferHeadEmployeeDetails(empId);
      setEmployeeDetailData(res.data);
    } catch (err) {
      console.error("Failed to load employee details", err);
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handleInitiateTransfer() {
    if (!selectedEmployeeId) {
      setMessage({ type: "error", text: "Select an employee first." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await initiateTransferHeadTransfer({
        employee_id: selectedEmployeeId,
        reason: reason.trim() || "Initiated by transfer head.",
      });
      setMessage({
        type: "success",
        text: res.data?.message || "Transfer successfully initiated.",
      });
      setSelectedEmployeeId(null);
      setEmployeeDetailData(null);
      await refreshEmployees(false);
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text:
          err.response?.data?.detail || "The transfer could not be initiated.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`flex items-center gap-3 rounded-2xl border p-4 text-sm font-medium ${
            message.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {message.type === "error" ? (
            <AlertTriangle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          {message.text}
        </div>
      )}

      <SectionCard
        title="Initiate Transfer"
        subtitle="Start a global transfer request for employees who have completed tenure."
        action={
          <button
            type="button"
            onClick={() => refreshEmployees()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      >
        <div className="space-y-4">
          <label className="relative block">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              placeholder="Search by name, ID, discipline, department, or location"
            />
          </label>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Loading eligible employees...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No eligible employees match your filters.
            </div>
          ) : (
            <div className="max-h-[24rem] overflow-y-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Level</th>
                    <th className="px-4 py-3">Start Date</th>
                    <th className="px-4 py-3">Tenure</th>
                    <th className="px-4 py-3">Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredEmployees.map((employee) => {
                    const mandatory = isMandatory(employee);
                    const selected =
                      selectedEmployeeId === employee.employee_id;

                    return (
                      <tr
                        key={employee.employee_id}
                        onClick={() => handleSelectEmployee(employee.employee_id)}
                        className={`cursor-pointer transition hover:bg-blue-50/60 ${
                          selected ? "bg-blue-50 font-medium" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">
                            {employee.employee_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            ID {employee.employee_id} -{" "}
                            {employee.discipline || "Unassigned"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {employee.department_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {employee.location || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {employee.level ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatDate(employee.start_date)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {employee.years_served} years
                        </td>
                        <td className="px-4 py-3">
                          {mandatory && (
                            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                              Mandatory
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Selected Employee Details & Action Box */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {selectedEmployee
                  ? selectedEmployee.employee_name
                  : "No Employee Selected"}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedEmployee
                  ? `${selectedEmployee.department_name || "Unassigned"} · ${
                      selectedEmployee.location || "Unknown location"
                    } · Level ${selectedEmployee.level ?? "N/A"}`
                  : "Click on any row in the table above to view details and initiate a transfer."}
              </p>
            </div>

            {selectedEmployee && (
              <>
                {/* Employee Full Profile Details Card */}
                {loadingDetails ? (
                  <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-400 animate-pulse text-center">
                    Loading complete employee profile details...
                  </div>
                ) : employeeDetailData ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Email</span>
                        <span className="font-semibold text-slate-700">{employeeDetailData.email || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">State Domicile</span>
                        <span className="font-semibold text-slate-700">{employeeDetailData.domicile_state || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Date of Birth</span>
                        <span className="font-semibold text-slate-700">{formatDate(employeeDetailData.DoB)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Retirement Date</span>
                        <span className="font-semibold text-slate-700">{formatDate(employeeDetailData.DoRetirement)}</span>
                      </div>
                    </div>

                    {/* Past Tenures Summary */}
                    {(employeeDetailData.tenures || []).length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Tenure History & Assignments
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {employeeDetailData.tenures.map((t) => (
                            <div key={t.id} className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-[11px] flex-1 min-w-[200px]">
                              <p className="font-bold text-slate-700">{t.department_name} ({t.location})</p>
                              <p className="text-slate-500 text-[10px]">Time Served: {t.time_served_days} days</p>
                              {(t.assignments || []).length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {t.assignments.map((a) => (
                                    <span key={a.id} className="bg-white border text-slate-600 px-1.5 py-0.5 rounded text-[9px]">
                                      {a.role_title || a.title || "Assignment"}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Initiate Reason & Action Button */}
                <div className="grid gap-3 pt-2 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-600">
                      Transfer Justification / Reason
                    </label>
                    <textarea
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                      rows="2"
                      placeholder="Reason for initiating transfer"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleInitiateTransfer}
                    disabled={!selectedEmployeeId || submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3b82f6] px-5 py-3 text-sm font-bold text-white shadow-sm shadow-blue-100 transition hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer h-fit"
                  >
                    {submitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <SendToBack size={16} />
                    )}
                    {submitting ? "Initiating..." : "Initiate Transfer"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

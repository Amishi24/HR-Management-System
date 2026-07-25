import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  SendToBack,
} from "lucide-react";

import {
  getTransferHeadEligibleEmployees,
  initiateTransferHeadTransfer,
  revokeTransferHeadTransfer,
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

  async function handleRevokeTransfer(employeeId, transferId, e) {
    e.stopPropagation();
    if (!transferId) return;
    
    if (!window.confirm("Are you sure you want to revoke this transfer request?")) {
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await revokeTransferHeadTransfer(transferId);
      setMessage({
        type: "success",
        text: "Transfer request revoked successfully.",
      });
      if (selectedEmployeeId === employeeId) {
        setSelectedEmployeeId(null);
      }
      await refreshEmployees(false);
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: err.response?.data?.detail || "Could not revoke the transfer.",
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
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
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
            <div className="max-h-[28rem] overflow-y-auto rounded-2xl border border-slate-200">
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
                        onClick={() =>
                          setSelectedEmployeeId(employee.employee_id)
                        }
                        className={`cursor-pointer transition hover:bg-blue-50/60 ${
                          selected ? "bg-blue-50" : ""
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
                          {employee.active_transfer_status === "PROPOSED" ? (
                            <button
                              type="button"
                              onClick={(e) => handleRevokeTransfer(employee.employee_id, employee.active_transfer_id, e)}
                              className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
                            >
                              Revoke
                            </button>
                          ) : employee.active_transfer_status ? (
                            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                              {employee.active_transfer_status}
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${
                                mandatory
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {mandatory ? "Mandatory" : "Completed"}
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

          <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {selectedEmployee
                    ? selectedEmployee.employee_name
                    : "No employee selected"}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedEmployee
                    ? `${selectedEmployee.department_name || "Unassigned"} - ${
                        selectedEmployee.location || "Unknown location"
                      }`
                    : "Choose one row from the eligible employee table."}
                </p>
              </div>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={selectedEmployee?.active_transfer_status != null}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
                rows="2"
                placeholder={selectedEmployee?.active_transfer_status ? `Active transfer exists (${selectedEmployee.active_transfer_status})` : "Reason for initiating transfer"}
              />
            </div>
            <button
              type="button"
              onClick={handleInitiateTransfer}
              disabled={!selectedEmployeeId || submitting || selectedEmployee?.active_transfer_status != null}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3b82f6] px-5 py-3 text-sm font-bold text-white shadow-sm shadow-blue-100 transition hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <SendToBack size={16} />
              )}
              {submitting ? "Initiating..." : "Initiate Transfer"}
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

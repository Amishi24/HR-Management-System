import { useState, useEffect } from "react";
import { CheckCircle, Eye, User, X, RefreshCw } from "lucide-react";
import SectionCard from "../components/common/SectionCard";
import {
  getTransferHeadVoluntaryTransfers,
  approveTransferHeadVoluntaryTransfer,
  getTransferHeadEmployeeDetails,
} from "../api/roleApi";
import { getLocations } from "../api/employeeApi";

export default function TransferHeadVoluntaryRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [locations, setLocations] = useState([]);
  const [locationMap, setLocationMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  // Profile modal state
  const [viewingEmployeeId, setViewingEmployeeId] = useState(null);
  const [employeeDetailData, setEmployeeDetailData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  function refreshData() {
    setLoading(true);
    setActionMessage(null);
    Promise.all([getLocations(), getTransferHeadVoluntaryTransfers()])
      .then(([locRes, reqRes]) => {
        const rawLocations = locRes.data || [];
        setLocations(rawLocations);
        const map = {};
        rawLocations.forEach((l) => {
          map[l.id] = `${l.city}, ${l.state}`;
        });
        setLocationMap(map);
        setRequests(reqRes.data || []);
      })
      .catch((err) => {
        console.error(err);
        setActionMessage({
          type: "error",
          text: "Failed to load voluntary transfer requests.",
        });
      })
      .finally(() => setLoading(false));
  }

  async function handleApprove(transferId, empName) {
    if (
      !window.confirm(
        `Approve voluntary request for ${empName} and shift to Approved Pool?`
      )
    )
      return;

    try {
      await approveTransferHeadVoluntaryTransfer(transferId);
      setActionMessage({
        type: "success",
        text: `Request for ${empName} approved and added to Approved Pool!`,
      });
      refreshData();
    } catch (err) {
      console.error(err);
      setActionMessage({
        type: "error",
        text: err.response?.data?.detail || "Failed to approve voluntary request.",
      });
    }
  }

  async function openEmployeeProfile(empId) {
    setViewingEmployeeId(empId);
    setEmployeeDetailData(null);
    setLoadingDetails(true);
    try {
      const res = await getTransferHeadEmployeeDetails(empId);
      setEmployeeDetailData(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load employee details.");
    } finally {
      setLoadingDetails(false);
    }
  }

  function formatDate(val) {
    if (!val) return "—";
    return new Date(val).toLocaleDateString();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
          Voluntary Transfer Requests
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review employee-initiated transfer applications and accept them to move them into the Approved Pool.
        </p>
      </div>

      {actionMessage && (
        <div
          className={`rounded-2xl border p-4 text-sm font-semibold animate-in fade-in ${
            actionMessage.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      <SectionCard
        title="Employee Self-Service Requests"
        subtitle="These requests were submitted by eligible employees seeking proactive transfer."
        action={
          <button
            type="button"
            onClick={refreshData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      >
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400 animate-pulse">
            Loading voluntary transfer requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400 italic">
            No pending voluntary transfer requests.
          </div>
        ) : (
          <div className="max-h-[28rem] overflow-y-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="sticky top-0 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 z-10">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Location Preferences</th>
                  <th className="px-4 py-3">Created Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {requests.map((r) => {
                  const hasPreferences = (r.location_preferences || []).length > 0;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-800">
                          {r.employee_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          ID: {r.employee_id}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-slate-600 font-medium">
                        {r.current_department || "Unassigned"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {!hasPreferences ? (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 italic">
                              Awaiting Preferences
                            </span>
                          ) : (
                            r.location_preferences.map((locId, idx) => (
                              <span
                                key={locId}
                                className="text-[11px] bg-slate-100 border border-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded"
                              >
                                {idx + 1}. {locationMap[locId] || `City ID ${locId}`}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-500 text-xs">
                        {formatDate(r.created_at)}
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEmployeeProfile(r.employee_id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            <Eye size={14} /> Profile
                          </button>
                          <button
                            type="button"
                            disabled={!hasPreferences}
                            onClick={() => handleApprove(r.id, r.employee_name)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition cursor-pointer shadow-sm"
                            title={
                              !hasPreferences
                                ? "Employee must submit location preferences first"
                                : "Accept and move to approved pool"
                            }
                          >
                            <CheckCircle size={14} /> Accept Request
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Employee Profile Modal */}
      {viewingEmployeeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">
                    {employeeDetailData ? employeeDetailData.name : "Employee Profile"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Employee ID: {viewingEmployeeId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setViewingEmployeeId(null);
                  setEmployeeDetailData(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-12 text-center text-sm text-slate-400 animate-pulse">
                Fetching employee profile details...
              </div>
            ) : employeeDetailData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase block text-[10px]">Email</span>
                    <span className="font-semibold text-slate-700">{employeeDetailData.email || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase block text-[10px]">Discipline</span>
                    <span className="font-semibold text-slate-700">{employeeDetailData.discipline_name || "Unassigned"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase block text-[10px]">State Domicile</span>
                    <span className="font-semibold text-slate-700">{employeeDetailData.domicile_state || "N/A"}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Tenure History & Assignments
                  </h4>
                  {(employeeDetailData.tenures || []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No past tenure records available.</p>
                  ) : (
                    <div className="space-y-3">
                      {employeeDetailData.tenures.map((t) => (
                        <div key={t.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                          <div className="flex justify-between font-semibold text-slate-800">
                            <span>{t.department_name} ({t.location})</span>
                            <span className="text-blue-600">Level {t.level}</span>
                          </div>
                          <div className="flex gap-4 text-slate-500 text-[11px]">
                            <span>Period: {formatDate(t.start_date)} - {t.end_date ? formatDate(t.end_date) : "Present"}</span>
                            <span>Time Served: {t.time_served_days} days</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-slate-400">
                No data available.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

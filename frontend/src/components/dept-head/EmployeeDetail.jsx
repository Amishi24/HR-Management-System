import { useState } from "react";
import { Plus, XCircle, CheckCircle, AlertCircle, RefreshCw, Lock } from "lucide-react";
import SectionCard from "../common/SectionCard";

export default function EmployeeDetail({
  employee,
  assignmentDrafts,
  onAssignmentDraftChange,
  onCreateAssignment,
  onDeleteAssignment,
  onInitiateTransfer,
}) {
  const [showModal, setShowModal] = useState(false);
  const [transferReason, setTransferReason] = useState("Initiated by your department head.");
  const [submittingTransfer, setSubmittingTransfer] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', text: '' }

  if (!employee) return null;

  if (employee.error) {
    return (
      <SectionCard
        title="Employee Detail"
        subtitle="Unable to load the selected team member."
      >
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {employee.error}
        </div>
      </SectionCard>
    );
  }

  const handleInitiateSubmit = async (e) => {
    e.preventDefault();
    setSubmittingTransfer(true);
    setStatus(null);
    const result = await onInitiateTransfer(employee.id, transferReason);
    if (result.success) {
      setStatus({ type: "success", text: result.message || "Transfer successfully initiated." });
      setTimeout(() => {
        setShowModal(false);
        setStatus(null);
      }, 2000);
    } else {
      setStatus({ type: "error", text: result.message || "Could not initiate transfer." });
    }
    setSubmittingTransfer(false);
  };

  const hasActiveTransfer = employee.active_transfers && employee.active_transfers.length > 0;

  return (
    <SectionCard
      title="Employee Detail"
      subtitle="Tenure record summary and task assignments for the selected team member."
    >
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 font-bold text-lg border border-blue-100 shadow-2xs">
              {employee.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">{employee.name}</h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {employee.discipline_name || "Discipline not assigned"}
              </p>
            </div>
          </div>
          <div className="sm:self-center">
            {hasActiveTransfer ? (
              <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-700 font-bold">
                Transfer Pending
              </span>
            ) : (
              <button
                onClick={() => {
                  setTransferReason("Initiated by your department head.");
                  setStatus(null);
                  setShowModal(true);
                }}
                className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-2xs hover:shadow-sm cursor-pointer"
              >
                Initiate Transfer
              </button>
            )}
          </div>
        </div>

        {/* Tenure Records */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tenure History &amp; Assignments
          </h4>

          {(employee.tenures || []).length === 0 ? (
            <p className="text-sm text-slate-400 italic">No tenure records found.</p>
          ) : (
            <div className="space-y-4">
              {(employee.tenures || []).map((tenure) => {
                // A tenure is "active" (current) when it has no end_date
                const isActiveTenure = !tenure.end_date;
                const draftKey = `${employee.id}-${tenure.id}`;
                const draft = assignmentDrafts[draftKey] || {
                  title: "",
                  weightage: 5,
                  skills: "",
                };

                return (
                  <div
                    key={tenure.id}
                    className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
                      isActiveTenure
                        ? "border-blue-100 bg-blue-50/30 hover:bg-blue-50/50"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                    }`}
                  >
                    {/* Tenure Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-800 text-sm">
                            {tenure.department_name}
                          </h5>
                          {isActiveTenure ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              Current
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                              <Lock size={9} />
                              Past
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          📍 {tenure.location}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs text-slate-700 font-semibold">
                          {tenure.start_date} → {tenure.end_date || "Active"}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">
                          Remaining: {tenure.remaining_days} days
                        </p>
                      </div>
                    </div>

                    {/* Assignments List */}
                    <div className="mt-4 space-y-2.5">
                      <h6 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Assignments
                      </h6>
                      {(tenure.assignments || []).length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No assignments registered.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(tenure.assignments || []).map((assignment) => (
                            <div
                              key={assignment.id}
                              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs hover:shadow-xs transition-shadow"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <span className="text-xs font-bold text-slate-700 leading-snug">
                                  {assignment.title}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="inline-flex rounded-full bg-slate-100 border border-slate-150 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                    Wt: {assignment.weightage}
                                  </span>
                                  {/* Delete button — only shown for active (current) tenure */}
                                  {isActiveTenure && (
                                    <button
                                      onClick={() => onDeleteAssignment(employee.id, assignment.id)}
                                      className="text-rose-500 hover:text-rose-700 transition-colors p-0.5 rounded-lg hover:bg-rose-50"
                                      title="Remove assignment"
                                    >
                                      <XCircle size={15} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Skills */}
                              {assignment.skills && assignment.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2.5">
                                  {assignment.skills.map((skill, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="text-[9px] bg-slate-50 text-slate-600 border border-slate-100 px-1.5 py-0.5 rounded font-medium"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Create Assignment Form — only shown for active (current) tenure */}
                    {isActiveTenure && (
                      <div className="mt-5 rounded-2xl border border-dashed border-blue-200 bg-white p-4">
                        <h6 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                          Create New Assignment
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Assignment Title
                            </label>
                            <input
                              type="text"
                              value={draft.title}
                              onChange={(e) =>
                                onAssignmentDraftChange(draftKey, "title", e.target.value)
                              }
                              placeholder="e.g. Lead System Architect"
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Weightage (1-10)
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={draft.weightage}
                              onChange={(e) =>
                                onAssignmentDraftChange(draftKey, "weightage", e.target.value)
                              }
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Skills (comma-separated)
                            </label>
                            <input
                              type="text"
                              value={draft.skills}
                              onChange={(e) =>
                                onAssignmentDraftChange(draftKey, "skills", e.target.value)
                              }
                              placeholder="React, AWS, Node.js"
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => onCreateAssignment(employee.id, tenure.id)}
                          className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm hover:shadow transition-all"
                        >
                          <Plus size={14} />
                          <span>Add Assignment</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Transfer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">Initiate Transfer</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setStatus(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>

            {status && (
              <div
                className={`mb-4 flex items-start gap-2 rounded-2xl border p-4 text-xs font-semibold ${
                  status.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {status.type === "success" ? (
                  <CheckCircle size={16} className="shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                )}
                <span>{status.text}</span>
              </div>
            )}

            <p className="text-xs text-slate-600 mb-4">
              Are you sure you want to initiate a transfer request for{" "}
              <strong className="text-slate-800">{employee.name}</strong>?
              This will flag the employee to select their preferred locations.
            </p>

            <form onSubmit={handleInitiateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Reason for Transfer
                </label>
                <textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="Provide audit notes or reasons for this transfer request..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs focus:border-blue-500 focus:bg-white focus:outline-none transition-all resize-none h-24"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setStatus(null);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  disabled={submittingTransfer}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-60 shadow-sm"
                  disabled={submittingTransfer}
                >
                  {submittingTransfer ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Initiating...</span>
                    </>
                  ) : (
                    <span>Confirm &amp; Initiate</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
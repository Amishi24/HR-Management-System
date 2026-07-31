import { useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Lock,
  RefreshCw,
  XCircle,
} from "lucide-react";
import SectionCard from "../common/SectionCard";

export default function LocHeadEmployeeDetail({ employee, onInitiateTransfer }) {
  const [showModal, setShowModal] = useState(false);
  const [transferReason, setTransferReason] = useState(
    "Initiated by your location head.",
  );
  const [submittingTransfer, setSubmittingTransfer] = useState(false);
  const [status, setStatus] = useState(null);

  if (!employee) return null;

  if (employee.error) {
    return (
      <SectionCard
        title="Department Head Detail"
        subtitle="Unable to load the selected department head."
      >
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {employee.error}
        </div>
      </SectionCard>
    );
  }

  const hasActiveTransfer =
    employee.active_transfers && employee.active_transfers.length > 0;

  async function handleInitiateSubmit(event) {
    event.preventDefault();
    setSubmittingTransfer(true);
    setStatus(null);

    const result = await onInitiateTransfer(employee.id, transferReason);

    if (result.success) {
      setStatus({
        type: "success",
        text: result.message || "Transfer successfully initiated.",
      });
      setTimeout(() => {
        setShowModal(false);
        setStatus(null);
      }, 2000);
    } else {
      setStatus({
        type: "error",
        text: result.message || "Could not initiate transfer.",
      });
    }

    setSubmittingTransfer(false);
  }

  return (
    <SectionCard
      title="Department Head Detail"
      subtitle="Tenure history, assignment context, and transfer status for the selected department head."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-lg font-bold text-blue-600 shadow-2xs">
              {employee.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {employee.name}
              </h3>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {employee.discipline_name || "Discipline not assigned"}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            {hasActiveTransfer ? (
              <>
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                  Active Transfer
                </span>
                <div className="space-y-1 text-left text-xs text-slate-500 sm:text-right">
                  {employee.active_transfers.map((transfer) => (
                    <p key={transfer.id}>
                      #{transfer.id} - {transfer.status}
                    </p>
                  ))}
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTransferReason("Initiated by your location head.");
                  setStatus(null);
                  setShowModal(true);
                }}
                className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-600 shadow-2xs transition-all hover:bg-blue-600 hover:text-white hover:shadow-sm"
              >
                Initiate Transfer
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tenure History &amp; Assignments
          </h4>

          {(employee.tenures || []).length === 0 ? (
            <p className="text-sm italic text-slate-400">
              No tenure records found.
            </p>
          ) : (
            <div className="space-y-4">
              {(employee.tenures || []).map((tenure) => {
                const isActiveTenure = !tenure.end_date;

                return (
                  <div
                    key={tenure.id}
                    className={`rounded-2xl border p-4 transition-colors sm:p-5 ${
                      isActiveTenure
                        ? "border-blue-100 bg-blue-50/30 hover:bg-blue-50/50"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-slate-800">
                            {tenure.department_name}
                          </h5>
                          {isActiveTenure ? (
                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              Current
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                              <Lock size={9} />
                              Past
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs font-medium text-slate-500">
                          {tenure.location}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          {tenure.start_date} to {tenure.end_date || "Active"}
                        </span>
                        <p className="mt-1 text-[10px] font-medium text-slate-400">
                          Remaining: {tenure.remaining_days} days
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2.5">
                      <h6 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Assignments
                      </h6>
                      {(tenure.assignments || []).length === 0 ? (
                        <p className="text-xs italic text-slate-400">
                          No assignments registered.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {(tenure.assignments || []).map((assignment) => (
                            <div
                              key={assignment.id}
                              className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs transition-shadow hover:shadow-xs"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <span className="text-xs font-bold leading-snug text-slate-700">
                                  {assignment.title}
                                </span>
                                <span className="inline-flex shrink-0 rounded-full border border-slate-150 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                  Wt: {assignment.weightage}
                                </span>
                              </div>

                              {assignment.skills?.length > 0 && (
                                <div className="mt-2.5 flex flex-wrap gap-1">
                                  {assignment.skills.map((skill, index) => (
                                    <span
                                      key={`${assignment.id}-${skill}-${index}`}
                                      className="rounded border border-slate-100 bg-slate-50 px-1.5 py-0.5 text-[9px] font-medium text-slate-600"
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                Initiate Transfer
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setStatus(null);
                }}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
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
                  <CheckCircle size={16} className="mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                )}
                <span>{status.text}</span>
              </div>
            )}

            <p className="mb-4 text-xs text-slate-600">
              Initiate a transfer request for{" "}
              <strong className="text-slate-800">{employee.name}</strong>.
              This applies only to department heads in your location.
            </p>

            <form onSubmit={handleInitiateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Reason for Transfer
                </label>
                <textarea
                  value={transferReason}
                  onChange={(event) => setTransferReason(event.target.value)}
                  placeholder="Provide audit notes or reasons for this transfer request..."
                  className="h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setStatus(null);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  disabled={submittingTransfer}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
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

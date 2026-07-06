import SectionCard from "../employee/SectionCard";

export default function TransferReviewQueue({ transfers, submitting, reviewNotes, onReviewNotesChange, onReviewTransfer, onViewAppealContext }) {
    return (
        <SectionCard title="Transfer Review Queue" subtitle="Approve, cancel, or reject pending transfer requests.">
            {transfers.length === 0 ? (
                <p className="text-slate-500">No transfer requests are currently pending review.</p>
            ) : (
                <div className="space-y-4">
                    {transfers.map((transfer) => (
                        <div key={transfer.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <p className="font-semibold text-slate-800">{transfer.employee_name}</p>
                                    <p className="text-sm text-slate-500">{transfer.current_department}</p>
                                    <p className="mt-2 text-sm text-slate-600">{transfer.audit_notes || "No review notes yet."}</p>
                                </div>
                                <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    {transfer.status}
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                {transfer.status?.toUpperCase() === "APPEALED" ? (
                                    <button onClick={() => onViewAppealContext(transfer.id)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                                        View Appeal Context
                                    </button>
                                ) : null}
                                <button onClick={() => onReviewTransfer(transfer.id, "APPROVED")} disabled={submitting} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white">
                                    Approve
                                </button>
                                <button onClick={() => onReviewTransfer(transfer.id, "CANCELLED")} disabled={submitting} className="rounded-xl bg-slate-700 px-3 py-2 text-sm font-medium text-white">
                                    Cancel
                                </button>
                                <button onClick={() => onReviewTransfer(transfer.id, "REJECTED")} disabled={submitting} className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white">
                                    Reject
                                </button>
                            </div>
                            <div className="mt-4">
                                <label className="mb-2 block text-sm font-medium text-slate-700">Review Notes</label>
                                <textarea
                                    value={reviewNotes[transfer.id] || ""}
                                    onChange={(e) => onReviewNotesChange(transfer.id, e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                                    rows="2"
                                    placeholder="Add your decision notes"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </SectionCard>
    );
}
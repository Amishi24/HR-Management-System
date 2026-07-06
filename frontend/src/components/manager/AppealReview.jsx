import SectionCard from "../employee/SectionCard";

export default function AppealReview({ appealContext, onAppealDecision, reviewNotes, onReviewNotesChange, submitting }) {
    if (!appealContext) return null;

    const appealTransferId = `appeal-${appealContext.transferId}`;

    return (
        <SectionCard title="Appeal Review" subtitle="Exemption context for a transfer appeal.">
            {appealContext.error ? (
                <p className="text-slate-500">{appealContext.error}</p>
            ) : (
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-semibold text-slate-700">Medical issues</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                            {(appealContext.medical_issues || []).length > 0 ? appealContext.medical_issues.map((item) => <li key={item}>{item}</li>) : <li>No approved medical issues recorded.</li>}
                        </ul>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-700">Board exam children</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                            {(appealContext.board_exam_children || []).length > 0 ? appealContext.board_exam_children.map((item) => <li key={item}>{item}</li>) : <li>No board-exam children are currently linked to this request.</li>}
                        </ul>
                    </div>
                    <div className="mt-4">
                        <label className="mb-2 block text-sm font-medium text-slate-700">Manager Notes for Appeal</label>
                        <textarea
                            value={reviewNotes[appealTransferId] || ""}
                            onChange={(e) => onReviewNotesChange(appealTransferId, e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                            rows="2"
                            placeholder="Add your notes for the appeal decision"
                        />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={() => onAppealDecision(appealContext.transferId, "ACCEPT_APPEAL")} disabled={submitting} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
                            Accept Appeal
                        </button>
                        <button onClick={() => onAppealDecision(appealContext.transferId, "REJECT_APPEAL")} disabled={submitting} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white">
                            Reject Appeal
                        </button>
                    </div>
                </div>
            )}
        </SectionCard>
    );
}
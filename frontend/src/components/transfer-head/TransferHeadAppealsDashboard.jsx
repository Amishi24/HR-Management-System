import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  decideTransferHeadAppeal,
  getTransferHeadAppealContext,
  getTransferHeadEducationalAppeals,
} from "../../api/roleApi";
import SectionCard from "../common/SectionCard";
import AppealReview from "../manager/AppealReview";

function statusClasses(status) {
  const value = status?.toUpperCase();
  if (value === "APPEALED") return "border-amber-200 bg-amber-50 text-amber-700";
  if (value === "APPROVED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (value === "CANCELLED") {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }
  return "border-slate-200 bg-white text-slate-600";
}

export default function TransferHeadAppealsDashboard() {
  const [appeals, setAppeals] = useState([]);
  const [selectedTransferId, setSelectedTransferId] = useState(null);
  const [appealContext, setAppealContext] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [reviewNotes, setReviewNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [contextLoading, setContextLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const filteredAppeals = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return appeals;

    return appeals.filter((appeal) => {
      const values = [
        appeal.employee_name,
        appeal.employee_id,
        appeal.current_department,
        appeal.audit_notes,
      ];
      return values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(term),
      );
    });
  }, [appeals, searchTerm]);

  async function refreshAppeals(clearMessage = true) {
    setLoading(true);
    if (clearMessage) {
      setMessage(null);
    }

    try {
      const res = await getTransferHeadEducationalAppeals();
      setAppeals(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: "Unable to load educational appeals.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshAppeals();
  }, []);

  async function handleSelectAppeal(transferId) {
    setSelectedTransferId(transferId);
    setContextLoading(true);
    setMessage(null);

    try {
      const res = await getTransferHeadAppealContext(transferId);
      setAppealContext({ transferId, ...res.data });
    } catch (err) {
      console.error(err);
      setAppealContext({
        transferId,
        error: "No education context is available for this appeal.",
      });
    } finally {
      setContextLoading(false);
    }
  }

  async function handleAppealDecision(transferId, decision) {
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await decideTransferHeadAppeal(transferId, {
        decision,
        manager_notes:
          reviewNotes[`appeal-${transferId}`] ||
          "Reviewed from the transfer head workspace.",
      });
      setReviewNotes((prev) => ({ ...prev, [`appeal-${transferId}`]: "" }));
      setSelectedTransferId(null);
      setAppealContext(null);
      setMessage({
        type: "success",
        text: res.data?.message || "Appeal decision saved.",
      });
      await refreshAppeals(false);
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: "The appeal decision could not be saved.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const handleReviewNotesChange = (id, value) => {
    setReviewNotes((prev) => ({ ...prev, [id]: value }));
  };

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
        title="Educational Appeals"
        subtitle="Review transfer appeals with education-related context."
        action={
          <button
            type="button"
            onClick={() => refreshAppeals()}
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
              placeholder="Search by employee, ID, department, or appeal notes"
            />
          </label>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Loading educational appeals...
            </div>
          ) : filteredAppeals.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No educational appeals match your filters.
            </div>
          ) : (
            <div className="max-h-[24rem] overflow-y-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500 z-10">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Appeal Notes</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredAppeals.map((appeal) => {
                    const selected = selectedTransferId === appeal.id;

                    return (
                      <tr
                        key={appeal.id}
                        className={selected ? "bg-blue-50 font-medium" : undefined}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">
                            {appeal.employee_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            ID {appeal.employee_id}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {appeal.current_department || "Unassigned"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses(
                              appeal.status,
                            )}`}
                          >
                            {appeal.status}
                          </span>
                        </td>
                        <td className="max-w-sm px-4 py-3 text-slate-600">
                          <p className="line-clamp-2">
                            {appeal.audit_notes || "No notes recorded."}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleSelectAppeal(appeal.id)}
                            disabled={contextLoading && selected}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
                          >
                            {contextLoading && selected ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <GraduationCap size={15} />
                            )}
                            Context
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SectionCard>

      {contextLoading && !appealContext ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Loading appeal context...
        </div>
      ) : appealContext ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 max-h-[30rem] overflow-y-auto">
          <AppealReview
            appealContext={appealContext}
            submitting={submitting}
            reviewNotes={reviewNotes}
            onReviewNotesChange={handleReviewNotesChange}
            onAppealDecision={handleAppealDecision}
          />
        </div>
      ) : null}
    </div>
  );
}

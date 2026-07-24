import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import api from "../../api/axios";
import SectionCard from "../common/SectionCard";
import AppealReview from "../manager/AppealReview";

export default function MedicalOfficerManagerView() {
  const [transfers, setTransfers] = useState([]);
  const [selectedTransferId, setSelectedTransferId] = useState(null);
  const [appealContext, setAppealContext] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [reviewNotes, setReviewNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [contextLoading, setContextLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const filteredTransfers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return transfers;
    }

    return transfers.filter((transfer) => {
      const employeeName = transfer.employee_name || "";
      const employeeId = String(transfer.employee_id || "");
      return (
        employeeName.toLowerCase().includes(term) || employeeId.includes(term)
      );
    });
  }, [searchTerm, transfers]);

  async function refreshTransfers() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/med-officer/transfers");
      setTransfers(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load medical appeal transfers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshTransfers();
  }, []);

  async function handleSelectTransfer(transferId) {
    setSelectedTransferId(transferId);
    setContextLoading(true);
    setError("");
    try {
      const res = await api.get(`/med-officer/transfers/${transferId}/context`);
      setAppealContext({ transferId, ...res.data });
    } catch (err) {
      console.error(err);
      setAppealContext({
        transferId,
        error: "No medical context is available for this appeal.",
      });
    } finally {
      setContextLoading(false);
    }
  }

  async function handleAppealDecision(transferId, decision) {
    setSubmitting(true);
    setError("");
    try {
      await api.patch(`/med-officer/transfers/${transferId}/appeal-decision`, {
        decision,
        manager_notes:
          reviewNotes[`appeal-${transferId}`] ||
          "Reviewed from the medical appeals workspace.",
      });
      setReviewNotes((prev) => ({ ...prev, [`appeal-${transferId}`]: "" }));
      setSelectedTransferId(null);
      setAppealContext(null);
      await refreshTransfers();
    } catch (err) {
      console.error(err);
      setError("The medical appeal decision could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  const handleReviewNotesChange = (id, value) => {
    setReviewNotes((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <SectionCard
        title="Medical Transfer Appeals"
        subtitle="Review appealed transfer requests submitted on medical grounds."
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
              placeholder="Search by employee name or ID"
            />
          </label>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Loading medical appeals...
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No medical appeals match your filters.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Employee ID</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredTransfers.map((transfer) => {
                    const isSelected = selectedTransferId === transfer.id;
                    return (
                      <tr
                        key={transfer.id}
                        onClick={() => handleSelectTransfer(transfer.id)}
                        className={`cursor-pointer transition hover:bg-blue-50 ${
                          isSelected ? "bg-blue-50" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {transfer.employee_name}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {transfer.employee_id}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {transfer.current_department || "Unassigned"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
                            {transfer.status}
                          </span>
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

      {contextLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
          Loading appeal context...
        </div>
      ) : (
        <AppealReview
          appealContext={appealContext}
          submitting={submitting}
          reviewNotes={reviewNotes}
          onReviewNotesChange={handleReviewNotesChange}
          onAppealDecision={handleAppealDecision}
        />
      )}
    </div>
  );
}

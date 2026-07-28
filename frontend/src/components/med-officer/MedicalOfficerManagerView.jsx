import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, Search, XCircle } from "lucide-react";

import {
  decideMedicalOfficerAppeal,
  decideMedicalOfficerRecord,
  getMedicalOfficerAppealContext,
  getMedicalOfficerAppeals,
  getMedicalOfficerRecords,
} from "../../api/roleApi";
import SectionCard from "../common/SectionCard";
import AppealReview from "../manager/AppealReview";

export default function MedicalOfficerManagerView() {
  const [records, setRecords] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [selectedTransferId, setSelectedTransferId] = useState(null);
  const [appealContext, setAppealContext] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [reviewNotes, setReviewNotes] = useState({});
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [appealsLoading, setAppealsLoading] = useState(true);
  const [contextLoading, setContextLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingRecordId, setReviewingRecordId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return records;
    }

    return records.filter((record) => {
      const employeeName = record.employee_name || "";
      const employeeId = String(record.employee_id || "");
      const issue = record.issue || "";
      return (
        employeeName.toLowerCase().includes(term) ||
        employeeId.includes(term) ||
        issue.toLowerCase().includes(term)
      );
    });
  }, [records, searchTerm]);

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

  async function refreshRecords(clearMessage = true) {
    setRecordsLoading(true);
    setError("");
    if (clearMessage) {
      setMessage("");
    }
    try {
      const res = await getMedicalOfficerRecords();
      setRecords(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load employee medical records.");
    } finally {
      setRecordsLoading(false);
    }
  }

  async function refreshTransfers() {
    setAppealsLoading(true);
    setError("");
    try {
      const res = await getMedicalOfficerAppeals();
      setTransfers(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load medical appeal transfers.");
    } finally {
      setAppealsLoading(false);
    }
  }

  useEffect(() => {
    void refreshRecords();
    void refreshTransfers();
  }, []);

  async function handleRecordDecision(medicalId, isApprove) {
    setReviewingRecordId(medicalId);
    setError("");
    setMessage("");
    try {
      const res = await decideMedicalOfficerRecord(medicalId, {
        is_approve: isApprove,
      });
      setMessage(res.data?.message || "Medical record review saved.");
      await refreshRecords(false);
    } catch (err) {
      console.error(err);
      setError("The medical record decision could not be saved.");
    } finally {
      setReviewingRecordId(null);
    }
  }

  async function handleSelectTransfer(transferId) {
    setSelectedTransferId(transferId);
    setContextLoading(true);
    setError("");
    try {
      const res = await getMedicalOfficerAppealContext(transferId);
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
      await decideMedicalOfficerAppeal(transferId, {
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
      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <SectionCard
        title="Employee Medical Records"
        subtitle="Approve or reopen employee medical submissions used for transfer consideration."
        action={
          <button
            type="button"
            onClick={() => refreshRecords()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw size={16} />
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
              placeholder="Search by employee, ID, or issue"
            />
          </label>

          {recordsLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Loading medical records...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No employee medical records match your filters.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Issue</th>
                    <th className="px-4 py-3">Year</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRecords.map((record) => {
                    const isApproved = Boolean(record.is_approve);
                    const isBusy = reviewingRecordId === record.id;
                    return (
                      <tr key={record.id}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">
                            {record.employee_name}
                          </div>
                          <div className="text-xs text-slate-500">
                            ID {record.employee_id} -{" "}
                            {record.current_department || "Unassigned"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {record.issue || "Not specified"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {record.issue_year || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                              isApproved
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }`}
                          >
                            {isApproved ? "Approved" : "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleRecordDecision(record.id, true)}
                              disabled={isBusy || isApproved}
                              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
                            >
                              <CheckCircle2 size={16} />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRecordDecision(record.id, false)}
                              disabled={isBusy || !isApproved}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:text-slate-300"
                            >
                              <XCircle size={16} />
                              Reopen
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
        </div>
      </SectionCard>

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

          {appealsLoading ? (
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

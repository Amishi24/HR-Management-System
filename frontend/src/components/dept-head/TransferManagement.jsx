import { useEffect, useState, useMemo } from "react";
import {
  getDeptHeadTransfers,
  reviewDeptHeadTransfer,
  getDeptHeadAppealContext,
  decideDeptHeadAppeal,
} from "../../api/roleApi";
import TransferReviewQueue from "../manager/TransferReviewQueue";
import AppealReview from "../manager/AppealReview";

export default function TransferManagement() {
  const [transfers, setTransfers] = useState([]);
  const [appealContext, setAppealContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewNotes, setReviewNotes] = useState({});

  const filteredTransfers = useMemo(
    () =>
      transfers.filter(
        (transfer) =>
          transfer.status?.toUpperCase() === "APPEALED" ||
          transfer.status?.toUpperCase() === "PROPOSED",
      ),
    [transfers],
  );

  async function refreshTransfers() {
    setLoading(true);
    setError("");
    try {
      const res = await getDeptHeadTransfers("");
      setTransfers(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load transfer requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshTransfers();
  }, []);

  async function handleReviewTransfer(transferId, decision) {
    setSubmitting(true);
    try {
      await reviewDeptHeadTransfer(transferId, {
        status: decision,
        review_notes:
          reviewNotes[transferId] ||
          "Reviewed from the department head workspace.",
      });
      setReviewNotes((prev) => ({ ...prev, [transferId]: "" }));
      await refreshTransfers();
    } catch (err) {
      console.error(err);
      setError("Review action could not be completed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleViewAppealContext(transferId) {
    try {
      const res = await getDeptHeadAppealContext(transferId);
      setAppealContext({ transferId, ...res.data });
    } catch (err) {
      console.error(err);
      setAppealContext({
        transferId,
        error: "No exemption context is available for this request.",
      });
    }
  }

  async function handleAppealDecision(transferId, decision) {
    setSubmitting(true);
    try {
      await decideDeptHeadAppeal(transferId, {
        decision,
        manager_notes:
          reviewNotes[`appeal-${transferId}`] ||
          "Reviewed from the department head workspace.",
      });
      setReviewNotes((prev) => ({ ...prev, [`appeal-${transferId}`]: "" }));
      setAppealContext(null);
      await refreshTransfers();
    } catch (err) {
      console.error(err);
      setError("The appeal decision could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  const handleReviewNotesChange = (id, value) =>
    setReviewNotes((prev) => ({ ...prev, [id]: value }));

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
          Loading transfer requests…
        </div>
      ) : (
        <div className="space-y-6">
          <TransferReviewQueue
            transfers={filteredTransfers}
            submitting={submitting}
            reviewNotes={reviewNotes}
            onReviewNotesChange={handleReviewNotesChange}
            onReviewTransfer={handleReviewTransfer}
            onViewAppealContext={handleViewAppealContext}
          />

          <AppealReview
            appealContext={appealContext}
            submitting={submitting}
            reviewNotes={reviewNotes}
            onReviewNotesChange={handleReviewNotesChange}
            onAppealDecision={handleAppealDecision}
          />
        </div>
      )}
    </div>
  );
}

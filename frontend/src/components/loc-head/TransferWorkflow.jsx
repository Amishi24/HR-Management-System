import { useEffect, useState } from "react";

import {
  decideLocHeadAppeal,
  getLocHeadAppealContext,
  getLocHeadTeam,
  getLocHeadTransfers,
  reviewLocHeadTransfer,
} from "../../api/roleApi";
import LocTeamRoster from "./LocTeamRoster";
import TransferReviewQueue from "../manager/TransferReviewQueue";
import AppealReview from "../manager/AppealReview";

export default function TransferWorkflow() {
  const [transfers, setTransfers] = useState([]);
  const [team, setTeam] = useState([]);
  const [appealContext, setAppealContext] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void refreshDashboard();
  }, []);

  async function refreshDashboard() {
    setLoading(true);
    setError("");

    try {
      const [transfersRes, teamRes] = await Promise.all([
        getLocHeadTransfers(),
        getLocHeadTeam(),
      ]);
      setTransfers(transfersRes.data || []);
      setTeam(teamRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load the transfer workflow right now.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReviewTransfer(transferId, decision) {
    setSubmitting(true);

    try {
      await reviewLocHeadTransfer(transferId, {
        status: decision,
        review_notes:
          reviewNotes[transferId] ||
          "Reviewed from the location head workspace.",
      });
      setReviewNotes((prev) => ({ ...prev, [transferId]: "" }));
      await refreshDashboard();
    } catch (err) {
      console.error(err);
      setError("The transfer review could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleViewAppealContext(transferId) {
    try {
      const res = await getLocHeadAppealContext(transferId);
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
      await decideLocHeadAppeal(transferId, {
        decision,
        manager_notes:
          reviewNotes[`appeal-${transferId}`] ||
          "Reviewed from the location head workspace.",
      });
      setReviewNotes((prev) => ({ ...prev, [`appeal-${transferId}`]: "" }));
      setAppealContext(null);
      await refreshDashboard();
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
          Loading transfer workflow…
        </div>
      ) : (
        <div className="space-y-6">
          <LocTeamRoster team={team} />

          <TransferReviewQueue
            transfers={transfers.filter((transfer) =>
              ["PROPOSED", "APPEALED"].includes(transfer.status?.toUpperCase()),
            )}
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

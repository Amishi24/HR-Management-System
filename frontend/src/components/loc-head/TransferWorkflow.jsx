import { useEffect, useState } from "react";

import {
  decideLocHeadAppeal,
  getLocHeadAlerts,
  getLocHeadAppealContext,
  getLocHeadTeam,
  getLocHeadTeamMember,
  getLocHeadTransfers,
  initiateLocHeadTransfer,
  reviewLocHeadTransfer,
} from "../../api/roleApi";
import LocTeamRoster from "./LocTeamRoster";
import LocHeadEmployeeDetail from "./LocHeadEmployeeDetail";
import TransferReviewQueue from "../manager/TransferReviewQueue";
import AppealReview from "../manager/AppealReview";
import MandatoryTransferAlerts from "../dept-head/MandatoryTransferAlerts";

export default function TransferWorkflow() {
  const [transfers, setTransfers] = useState([]);
  const [team, setTeam] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [appealContext, setAppealContext] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void refreshDashboard();
  }, []);

  async function refreshDashboard(showLoading = true) {
    if (showLoading) {
      setLoading(true);
    }
    setError("");

    try {
      const [transfersRes, teamRes, alertsRes] = await Promise.all([
        getLocHeadTransfers(),
        getLocHeadTeam(),
        getLocHeadAlerts(),
      ]);
      setTransfers(transfersRes.data || []);
      setTeam(teamRes.data || []);
      setAlerts(alertsRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load the transfer workflow right now.");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  async function fetchEmployeeDetail(employeeId) {
    setLoadingDetail(true);

    try {
      const res = await getLocHeadTeamMember(employeeId);
      setSelectedEmployee(res.data);
    } catch (err) {
      console.error(err);
      setSelectedEmployee({
        error: "Unable to load this department head profile.",
      });
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleInitiateTransfer(employeeId, reason) {
    try {
      const res = await initiateLocHeadTransfer({
        employee_id: employeeId,
        reason,
      });
      await fetchEmployeeDetail(employeeId);
      await refreshDashboard(false);
      return { success: true, message: res.data.message };
    } catch (err) {
      console.error(err);
      const errorMsg =
        err.response?.data?.detail || "The transfer could not be initiated.";
      return { success: false, message: errorMsg };
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
          <MandatoryTransferAlerts alerts={alerts} />

          <LocTeamRoster team={team} onViewEmployee={fetchEmployeeDetail} />

          {loadingDetail ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              Loading department head profile…
            </div>
          ) : (
            <LocHeadEmployeeDetail
              employee={selectedEmployee}
              onInitiateTransfer={handleInitiateTransfer}
            />
          )}

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

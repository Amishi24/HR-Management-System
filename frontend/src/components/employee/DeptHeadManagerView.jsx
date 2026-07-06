import { useCallback, useEffect, useMemo, useState } from "react";
import {
    createDeptHeadAssignment,
    decideDeptHeadAppeal,
    deleteDeptHeadAssignment,
    getDeptHeadAlerts,
    getDeptHeadAppealContext,
    getDeptHeadCapacity,
    getDeptHeadDepartments,
    getDeptHeadTeam,
    getDeptHeadTeamMember,
    getDeptHeadTransfers,
    reviewDeptHeadTransfer,
} from "../../api/roleApi";
import DeptScopeSelector from "./DeptScopeSelector";
import DeptTeamRoster from "./DeptTeamRoster";
import MandatoryTransferAlerts from "../manager/MandatoryTransferAlerts";
import TransferReviewQueue from "../manager/TransferReviewQueue";
import AppealReview from "../manager/AppealReview";
import DeptCapacityDashboard from "./DeptCapacityDashboard";
import EmployeeDetail from "./EmployeeDetail";

export default function DeptHeadManagerView() {
    const [departments, setDepartments] = useState([]);
    const [team, setTeam] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [capacity, setCapacity] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [appealContext, setAppealContext] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [reviewNotes, setReviewNotes] = useState({});
    const [assignmentDrafts, setAssignmentDrafts] = useState({});

    const filteredTransfers = useMemo(
        () => transfers.filter((transfer) => transfer.status?.toUpperCase() === "APPEALED" || transfer.status?.toUpperCase() === "PROPOSED"),
        [transfers]
    );

    const refreshDashboard = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [deptRes, teamRes, alertRes, transferRes, capacityRes] = await Promise.all([
                getDeptHeadDepartments(),
                getDeptHeadTeam(selectedDepartment || ""),
                getDeptHeadAlerts(),
                getDeptHeadTransfers(selectedDepartment || ""),
                getDeptHeadCapacity(),
            ]);

            setDepartments(deptRes.data || []);
            setTeam(teamRes.data || []);
            setAlerts(alertRes.data || []);
            setTransfers(transferRes.data || []);
            setCapacity(capacityRes.data || []);
        } catch (err) {
            console.error(err);
            setError("Unable to load the department head dashboard right now.");
        } finally {
            setLoading(false);
        }
    }, [selectedDepartment]);

    useEffect(() => {
        void refreshDashboard();
    }, [refreshDashboard]);

    async function handleViewEmployee(employeeId) {
        try {
            const res = await getDeptHeadTeamMember(employeeId);
            setSelectedEmployee(res.data);
        } catch (err) {
            console.error(err);
            setSelectedEmployee({ error: "Unable to load this employee profile." });
        }
    }

    async function handleReviewTransfer(transferId, decision) {
        setSubmitting(true);
        try {
            await reviewDeptHeadTransfer(transferId, {
                status: decision,
                review_notes: reviewNotes[transferId] || "Reviewed from the department head workspace.",
            });
            setReviewNotes((prev) => ({ ...prev, [transferId]: "" }));
            await refreshDashboard();
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
            setAppealContext({ transferId, error: "No exemption context is available for this request." });
        }
    }

    async function handleAppealDecision(transferId, decision) {
        setSubmitting(true);
        try {
            await decideDeptHeadAppeal(transferId, {
                decision,
                manager_notes: reviewNotes[`appeal-${transferId}`] || "Reviewed from the department head workspace.",
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

    async function handleCreateAssignment(employeeId, tenureId) {
        const draft = assignmentDrafts[`${employeeId}-${tenureId}`] || { title: "", weightage: 5, skills: "" };
        if (!draft.title.trim()) {
            setError("Please enter an assignment title before saving.");
            return;
        }
        try {
            await createDeptHeadAssignment(employeeId, tenureId, {
                title: draft.title,
                weightage: Number(draft.weightage || 5),
                skills: draft.skills.split(",").map((item) => item.trim()).filter(Boolean),
            });
            setAssignmentDrafts((prev) => ({ ...prev, [`${employeeId}-${tenureId}`]: { title: "", weightage: 5, skills: "" } }));
            await handleViewEmployee(employeeId);
        } catch (err) {
            console.error(err);
            setError("The assignment could not be created.");
        }
    }

    async function handleDeleteAssignment(employeeId, assignmentId) {
        try {
            await deleteDeptHeadAssignment(employeeId, assignmentId);
            await handleViewEmployee(employeeId);
        } catch (err) {
            console.error(err);
            setError("The assignment could not be deleted.");
        }
    }

    const handleReviewNotesChange = (id, value) => setReviewNotes((prev) => ({ ...prev, [id]: value }));
    const handleAssignmentDraftChange = (key, field, value) => setAssignmentDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: value } }));

    return (
        <div className="space-y-6">
            {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

            <DeptScopeSelector departments={departments} selectedDepartment={selectedDepartment} setSelectedDepartment={setSelectedDepartment} />

            {loading ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading department head insights…</div>
            ) : (
                <div className="grid gap-6 xl:grid-cols-2">
                    <DeptTeamRoster team={team} onViewEmployee={handleViewEmployee} />
                    <MandatoryTransferAlerts alerts={alerts} />
                </div>
            )}

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

            <DeptCapacityDashboard capacity={capacity} />

            <EmployeeDetail
                employee={selectedEmployee}
                assignmentDrafts={assignmentDrafts}
                onAssignmentDraftChange={handleAssignmentDraftChange}
                onCreateAssignment={handleCreateAssignment}
                onDeleteAssignment={handleDeleteAssignment}
            />
        </div>
    );
}
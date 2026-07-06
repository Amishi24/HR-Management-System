import { useEffect, useState } from "react";
import {
    createLocHeadPolicy,
    createLocHeadPosition,
    decideLocHeadAppeal,
    deleteLocHeadPolicy,
    deleteLocHeadPosition,
    getLocHeadAlerts,
    getLocHeadAppealContext,
    getLocHeadDepartments,
    getLocHeadDisciplines,
    getLocHeadLocation,
    getLocHeadPolicies,
    getLocHeadPositions,
    getLocHeadTeam,
    getLocHeadTransfers,
    reviewLocHeadTransfer,
    updateLocHeadLocationRequirements,
} from "../../api/roleApi";
import LocationRequirements from "./LocationRequirements";
import LocationPositions from "./LocationPositions";
import LocationRotationPolicies from "./LocationRotationPolicies";
import LocTeamRoster from "./LocTeamRoster";
import TransferReviewQueue from "./TransferReviewQueue";
import AppealReview from "./AppealReview";

export default function LocationHeadManagerView() {
    const [location, setLocation] = useState(null);
    const [positions, setPositions] = useState([]);
    const [policies, setPolicies] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [disciplines, setDisciplines] = useState([]);
    const [team, setTeam] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [appealContext, setAppealContext] = useState(null);
    const [requirements, setRequirements] = useState({ required_tenure_years: "", required_working_days_per_year: "" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ department_id: "", discipline_id: "", level: "", is_vacant: true });
    const [policyForm, setPolicyForm] = useState({ rules_config: "{}" });
    const [reviewNotes, setReviewNotes] = useState({});

    useEffect(() => {
        void refreshDashboard();
    }, []);

    async function refreshDashboard() {
        setLoading(true);
        setError("");
        try {
            const [locationRes, positionsRes, policiesRes, departmentsRes, disciplinesRes, teamRes, alertsRes, transfersRes] = await Promise.all([
                getLocHeadLocation(),
                getLocHeadPositions(),
                getLocHeadPolicies(),
                getLocHeadDepartments(),
                getLocHeadDisciplines(),
                getLocHeadTeam(),
                getLocHeadAlerts(),
                getLocHeadTransfers(),
            ]);
            setLocation(locationRes.data || null);
            setPositions(positionsRes.data || []);
            setPolicies(policiesRes.data || []);
            setDepartments(departmentsRes.data || []);
            setDisciplines(disciplinesRes.data || []);
            setTeam(teamRes.data || []);
            setAlerts(alertsRes.data || []);
            setTransfers(transfersRes.data || []);
            setRequirements({
                required_tenure_years: locationRes.data?.required_tenure_years ?? "",
                required_working_days_per_year: locationRes.data?.required_working_days_per_year ?? "",
            });
        } catch (err) {
            console.error(err);
            setError("Unable to load the location head workspace right now.");
        } finally {
            setLoading(false);
        }
    }

    async function handleRequirementsSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            await updateLocHeadLocationRequirements({
                required_tenure_years: Number(requirements.required_tenure_years),
                required_working_days_per_year: Number(requirements.required_working_days_per_year),
            });
            await refreshDashboard();
        } catch (err) {
            console.error(err);
            setError("The location requirements could not be updated.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleCreatePosition(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createLocHeadPosition({
                department_id: Number(form.department_id),
                discipline_id: form.discipline_id ? Number(form.discipline_id) : null,
                level: Number(form.level),
                is_vacant: form.is_vacant,
            });
            setForm({ department_id: "", discipline_id: "", level: "", is_vacant: true });
            await refreshDashboard();
        } catch (err) {
            console.error(err);
            setError("The position could not be created.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeletePosition(positionId) {
        try {
            await deleteLocHeadPosition(positionId);
            await refreshDashboard();
        } catch (err) {
            console.error(err);
            setError("The position could not be deleted.");
        }
    }

    async function handleCreatePolicy(e) {
        e.preventDefault();
        try {
            await createLocHeadPolicy({ rules_config: JSON.parse(policyForm.rules_config) });
            setPolicyForm({ rules_config: "{}" });
            await refreshDashboard();
        } catch (err) {
            console.error(err);
            setError("The rotation policy could not be created.");
        }
    }

    async function handleDeletePolicy(policyId) {
        try {
            await deleteLocHeadPolicy(policyId);
            await refreshDashboard();
        } catch (err) {
            console.error(err);
            setError("The rotation policy could not be deleted.");
        }
    }

    async function handleReviewTransfer(transferId, decision) {
        setSubmitting(true);
        try {
            await reviewLocHeadTransfer(transferId, {
                status: decision,
                review_notes: reviewNotes[transferId] || "Reviewed from the location head workspace.",
            });
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
            setAppealContext({ transferId, error: "No exemption context is available for this request." });
        }
    }

    async function handleAppealDecision(transferId, decision) {
        setSubmitting(true);
        try {
            await decideLocHeadAppeal(transferId, {
                decision,
                manager_notes: reviewNotes[`appeal-${transferId}`] || "Reviewed from the location head workspace.",
            });
            setAppealContext(null);
            await refreshDashboard();
        } catch (err) {
            console.error(err);
            setError("The appeal decision could not be saved.");
        } finally {
            setSubmitting(false);
        }
    }

    const handleRequirementsChange = (field, value) => setRequirements((prev) => ({ ...prev, [field]: value }));
    const handleFormChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
    const handlePolicyFormChange = (field, value) => setPolicyForm((prev) => ({ ...prev, [field]: value }));
    const handleReviewNotesChange = (id, value) => setReviewNotes((prev) => ({ ...prev, [id]: value }));

    return (
        <div className="space-y-6">
            {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

            {loading ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading location head workspace…</div>
            ) : (
                <div className="space-y-6">
                    <LocationRequirements location={location} requirements={requirements} onRequirementsChange={handleRequirementsChange} onRequirementsSubmit={handleRequirementsSubmit} />
                    <LocationPositions positions={positions} departments={departments} disciplines={disciplines} form={form} onFormChange={handleFormChange} onCreatePosition={handleCreatePosition} onDeletePosition={handleDeletePosition} />
                    <LocationRotationPolicies policies={policies} policyForm={policyForm} onPolicyFormChange={handlePolicyFormChange} onCreatePolicy={handleCreatePolicy} onDeletePolicy={handleDeletePolicy} />
                    <LocTeamRoster team={team} />
                    <TransferReviewQueue
                        transfers={transfers.filter((t) => ["PROPOSED", "APPEALED"].includes(t.status?.toUpperCase()))}
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
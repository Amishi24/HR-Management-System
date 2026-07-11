import { useState, useEffect } from "react";
import { Plus, Trash2, X } from "lucide-react";
import SectionCard from "../common/SectionCard";
import { 
    getTransferRequests, 
    getLocations, 
    addTransferRequest, 
    deleteTransferRequest 
} from "../../api/employeeApi";

const PORTAL_INITIATED_TEXT = "Initiated by employee via self-service portal.";

export default function TransferRequestsCard() {
    const [transfers, setTransfers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [locationMap, setLocationMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionMessage, setActionMessage] = useState("");

    // Form/Workspace State
    const [showForm, setShowForm] = useState(false);
    const [selectedPreferences, setSelectedPreferences] = useState([{ state: "", cityId: "" }]);

    useEffect(() => {
        refreshData();
    }, []);

    function refreshData() {
        setLoading(true);
        Promise.all([getLocations(), getTransferRequests()])
            .then(([locationRes, transferRes]) => {
                const rawLocations = locationRes.data || [];
                setLocations(rawLocations);

                const locMap = {};
                rawLocations.forEach((loc) => {
                    locMap[loc.id] = `${loc.city}, ${loc.state}`;
                });
                setLocationMap(locMap);
                setTransfers(transferRes.data || []);
            })
            .catch((err) => {
                console.error("Error loading transfer records:", err);
                setError("Failed to retrieve transfer history or location catalogs.");
            })
            .finally(() => {
                setLoading(false);
            });
    }

    // Dynamic filtering data lookups
    const availableStates = Array.from(new Set(locations.map(l => l.state))).sort();
    const getCitiesByState = (stateName) => locations.filter(l => l.state === stateName);

    const handleAddPreferenceRow = () => {
        if (selectedPreferences.length < 3) {
            setSelectedPreferences([...selectedPreferences, { state: "", cityId: "" }]);
        }
    };

    const handleRemovePreferenceRow = (index) => {
        setSelectedPreferences(selectedPreferences.filter((_, i) => i !== index));
    };

    const handlePreferenceChange = (index, field, value) => {
        const updated = [...selectedPreferences];
        if (field === "state") {
            updated[index] = { state: value, cityId: "" }; // Reset city selection if state changes
        } else {
            updated[index][field] = value;
        }
        setSelectedPreferences(updated);
    };

    const openCreateWorkspace = () => {
        setSelectedPreferences([{ state: "", cityId: "" }]);
        setShowForm(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const finalCityIds = selectedPreferences
            .map(p => Number(p.cityId))
            .filter(id => !isNaN(id) && id > 0);

        if (finalCityIds.length === 0) {
            alert("Please pick at least one valid destination city preference.");
            return;
        }

        try {
            await addTransferRequest({ location_preferences: finalCityIds });
            setActionMessage("Transfer request submitted successfully!");
            setShowForm(false);
            refreshData();
            setTimeout(() => setActionMessage(""), 4000);
        } catch (err) {
            console.error(err);
            alert("Failed saving transfer options. Check configuration.");
        }
    };

    const handleDelete = async (transferId) => {
        if (!window.confirm("Are you sure you want to cancel this transfer request?")) return;
        try {
            await deleteTransferRequest(transferId);
            setActionMessage("Transfer request cancelled successfully!");
            refreshData();
            setTimeout(() => setActionMessage(""), 4000);
        } catch (err) {
            console.error(err);
            alert("Error removing transfer entry.");
        }
    };

    // Checks if status is PROPOSED and was created via employee self-service portal
    const canDelete = (request) => {
        const isProposed = request.status?.toUpperCase() === "PROPOSED";
        const isUserGenerated = request.audit_notes?.trim() === PORTAL_INITIATED_TEXT;
        return isProposed && isUserGenerated;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric"
        });
    };

    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case "COMPLETED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "PENDING": case "PROPOSED": return "bg-amber-50 text-amber-700 border-amber-200";
            case "REJECTED": return "bg-rose-50 text-rose-700 border-rose-200";
            default: return "bg-slate-50 text-slate-700 border-slate-200";
        }
    };

    if (loading && transfers.length === 0) {
        return <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center text-slate-400 animate-pulse">Syncing application logs...</div>;
    }

    if (error) {
        return <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-3xl p-6 text-center">{error}</div>;
    }

    return (
        <div className="space-y-6">
            <SectionCard
                title="Transfer Request Logs"
                subtitle="Review your registered preferences, destination records, and administrative timeline tracks."
            >
                <div className="overflow-x-auto">
                    {/* Added table-fixed and min-w to prevent shrinking columns from bunching up text */}
                    <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase font-bold tracking-wider">
                                {/* Enforced dedicated percentage widths and uniform horizontal padding */}
                                <th className="pb-4 pt-1 px-4 font-semibold w-[14%]">Created At</th>
                                <th className="pb-4 pt-1 px-4 font-semibold w-[14%]">Updated At</th>
                                <th className="pb-4 pt-1 px-4 font-semibold w-[36%]">Location Preferences</th>
                                <th className="pb-4 pt-1 px-4 font-semibold w-[22%]">Audit Notes</th>
                                <th className="pb-4 pt-1 px-4 font-semibold w-[14%]">Status</th>
                                <th className="pb-4 pt-1 px-4 font-semibold text-right w-[10%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {transfers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-slate-400 italic">No transfer records found.</td>
                                </tr>
                            ) : (
                                transfers.map((request) => (
                                    <tr key={request.id} className="hover:bg-slate-50/60 transition-colors align-middle">
                                        {/* Applied matching px-4 padding to all data cells */}
                                        <td className="py-4 px-4 font-medium text-slate-900 whitespace-nowrap">
                                            {formatDate(request.created_at)}
                                        </td>
                                        <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                                            {formatDate(request.updated_at)}
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex flex-wrap gap-1.5 max-w-full">
                                                {request.location_preferences?.map((locId, idx) => (
                                                    <span key={locId} className="text-[11px] bg-slate-100 border border-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded-md truncate max-w-full" title={locationMap[locId]}>
                                                        {idx + 1}. {locationMap[locId] || `ID ${locId}`}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-slate-500 text-xs break-words" title={request.audit_notes}>
                                            {request.audit_notes || <span className="text-slate-300 italic">None</span>}
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <span className={`inline-block border text-[11px] font-bold px-2.5 py-0.5 rounded-full ${getStatusStyle(request.status)}`}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right whitespace-nowrap">
                                            {canDelete(request) ? (
                                                <button 
                                                    onClick={() => handleDelete(request.id)} 
                                                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors inline-flex items-center justify-center" 
                                                    title="Cancel Request"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic select-none">Locked</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>                  

                {/* Create Trigger below table */}
                {!showForm && (
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                        {actionMessage && <span className="text-sm font-medium text-emerald-600">{actionMessage}</span>}
                        <button
                            onClick={openCreateWorkspace}
                            className="flex items-center gap-2 text-sm font-medium bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-black transition-colors ml-auto"
                        >
                            <Plus size={16} />
                            Request New Transfer
                        </button>
                    </div>
                )}
            </SectionCard>

            {/* Creation Form Workspace Box below the log table */}
            {showForm && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">New Transfer Application</h3>
                            <p className="text-xs text-slate-500">Provide up to 3 location preferences in rank order</p>
                        </div>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        {selectedPreferences.map((pref, index) => (
                            <div key={index} className="flex flex-col md:flex-row items-end gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Priority {index + 1} State</label>
                                    <select
                                        value={pref.state}
                                        onChange={(e) => handlePreferenceChange(index, "state", e.target.value)}
                                        className="w-full bg-white rounded-xl border border-slate-200 p-2.5 text-sm"
                                        required
                                    >
                                        <option value="">Select State...</option>
                                        {availableStates.map(st => <option key={st} value={st}>{st}</option>)}
                                    </select>
                                </div>

                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Priority {index + 1} City</label>
                                    <select
                                        value={pref.cityId}
                                        disabled={!pref.state}
                                        onChange={(e) => handlePreferenceChange(index, "cityId", e.target.value)}
                                        className="w-full bg-white rounded-xl border border-slate-200 p-2.5 text-sm disabled:bg-slate-100"
                                        required
                                    >
                                        <option value="">Select City...</option>
                                        {getCitiesByState(pref.state).map(c => <option key={c.id} value={c.id}>{c.city}</option>)}
                                    </select>
                                </div>

                                {selectedPreferences.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePreferenceRow(index)}
                                        className="text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all mb-0.5"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}

                        <div className="flex items-center justify-between pt-2">
                            {selectedPreferences.length < 3 ? (
                                <button
                                    type="button"
                                    onClick={handleAddPreferenceRow}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-black border border-slate-200 bg-white px-3 py-1.5 rounded-lg"
                                >
                                    <Plus size={14} /> Add Preference Rank
                                </button>
                            ) : <div />}

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-slate-950 text-white rounded-xl text-sm font-medium hover:bg-black"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
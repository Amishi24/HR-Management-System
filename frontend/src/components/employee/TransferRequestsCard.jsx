import { useState, useEffect } from "react";
import { Plus, Trash2, X, CheckCircle, AlertTriangle } from "lucide-react";
import SectionCard from "../common/SectionCard";
import {
  getTransferRequests,
  getLocations,
  getProfile,
  addTransferRequest,
  deleteTransferRequest,
  appealTransferRequest,
  checkTransferEligibility,
  acceptTransfer,
} from "../../api/employeeApi";

const PORTAL_INITIATED_TEXT = "Initiated by employee via self-service portal.";
const TERMINAL_TRANSFER_STATUSES = new Set(["COMPLETED", "CANCELLED", "REJECTED"]);

export default function TransferRequestsCard() {
  const [transfers, setTransfers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [locationMap, setLocationMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [isEligible, setIsEligible] = useState(false);
  const [currentLocationId, setCurrentLocationId] = useState(null);

  // Form/Workspace State
  const [showForm, setShowForm] = useState(false);
  const [selectedPreferences, setSelectedPreferences] = useState([
    { state: "", cityId: "" },
  ]);
  const [acceptingTransfer, setAcceptingTransfer] = useState(null);
  const [appealingTransfer, setAppealingTransfer] = useState(null);
  const [appealType, setAppealType] = useState("MEDICAL");
  const [appealNotes, setAppealNotes] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  function refreshData() {
    setLoading(true);
    setError(null);
    Promise.all([
      getLocations(),
      getProfile(),
      getTransferRequests(),
      checkTransferEligibility().catch(() => ({ data: { is_eligible: false } })),
    ])
      .then(([locationRes, profileRes, transferRes, eligibilityRes]) => {
        const rawLocations = locationRes.data || [];
        setLocations(rawLocations);
        setCurrentLocationId(profileRes.data?.current_location_id || null);

        const locMap = {};
        rawLocations.forEach((loc) => {
          locMap[loc.id] = `${loc.city}, ${loc.state}`;
        });
        setLocationMap(locMap);
        setTransfers(
          [...(transferRes.data || [])].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at),
          ),
        );
        setIsEligible(eligibilityRes.data?.is_eligible || false);
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
  const availableStates = Array.from(
    new Set(locations.map((l) => l.state)),
  ).sort();
  const getCitiesByState = (stateName) =>
    locations.filter(
      (l) => l.state === stateName && l.id !== currentLocationId,
    );

  const handleAddPreferenceRow = () => {
    if (selectedPreferences.length < 3) {
      setSelectedPreferences([
        ...selectedPreferences,
        { state: "", cityId: "" },
      ]);
    }
  };

  const handleRemovePreferenceRow = (index) => {
    setSelectedPreferences(selectedPreferences.filter((_, i) => i !== index));
  };

  const handlePreferenceChange = (index, field, value) => {
    const updated = [...selectedPreferences];
    if (field === "state") {
      updated[index] = { state: value, cityId: "" };
    } else {
      updated[index][field] = value;
    }
    setSelectedPreferences(updated);
  };

  const openCreateWorkspace = () => {
    setSelectedPreferences([{ state: "", cityId: "" }]);
    setShowForm(true);
    setAcceptingTransfer(null);
    setAppealingTransfer(null);
  };

  const getSelectedLocationIds = () => {
    const locationIds = selectedPreferences
      .map((preference) => Number(preference.cityId))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (locationIds.length === 0) {
      alert("Please pick at least one valid destination city preference.");
      return null;
    }

    if (new Set(locationIds).size !== locationIds.length) {
      alert("Each location preference must be different.");
      return null;
    }

    if (currentLocationId && locationIds.includes(currentLocationId)) {
      alert("Current location cannot be included in location preferences.");
      return null;
    }

    return locationIds;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const finalCityIds = getSelectedLocationIds();
    if (!finalCityIds) return;

    try {
      await addTransferRequest({ location_preferences: finalCityIds });
      setActionMessage("Transfer request submitted successfully!");
      setShowForm(false);
      refreshData();
      setTimeout(() => setActionMessage(""), 4000);
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.detail || "Failed to create the transfer request.",
      );
    }
  };

  const handleAcceptSubmit = async (e) => {
    e.preventDefault();
    const finalCityIds = getSelectedLocationIds();
    if (!finalCityIds) return;

    setSubmittingAction(true);
    try {
      await acceptTransfer(acceptingTransfer.id, {
        location_preferences: finalCityIds,
      });
      setActionMessage("Transfer request accepted and preferences submitted!");
      setAcceptingTransfer(null);
      refreshData();
      setTimeout(() => setActionMessage(""), 4000);
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.detail || "Failed to accept transfer request.",
      );
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDelete = async (transferId) => {
    if (!window.confirm("Cancel this transfer request?")) return;

    try {
      await deleteTransferRequest(transferId);
      setActionMessage("Transfer request cancelled successfully!");
      refreshData();
      setTimeout(() => setActionMessage(""), 4000);
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.detail || "Failed to cancel the transfer request.",
      );
    }
  };

  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    if (!appealNotes.trim()) {
      alert("Please enter appeal notes.");
      return;
    }
    const finalCityIds = getSelectedLocationIds();
    if (!finalCityIds) return;

    setSubmittingAction(true);
    try {
      await appealTransferRequest(appealingTransfer.id, {
        appeal_type: appealType,
        appeal_notes: appealNotes,
        location_preferences: finalCityIds,
      });
      setActionMessage("Transfer appeal and preferences submitted successfully!");
      setAppealingTransfer(null);
      setAppealNotes("");
      refreshData();
      setTimeout(() => setActionMessage(""), 4000);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || "Failed to submit appeal.";
      alert(errorMsg);
    } finally {
      setSubmittingAction(false);
    }
  };

  const isSelfInitiated = (request) => {
    return request.audit_notes?.trim() === PORTAL_INITIATED_TEXT;
  };

  const canRequestNewTransfer = transfers.every((request) =>
    TERMINAL_TRANSFER_STATUSES.has(request.status?.toUpperCase()),
  );

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusStyle = (status) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PENDING":
      case "PROPOSED":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "REJECTED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "APPEALED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  if (loading && transfers.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center text-slate-400 animate-pulse">
        Syncing application logs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-3xl p-6 text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Transfer Request Logs"
        subtitle="Review every transfer request and its current status."
      >
        {actionMessage && (
          <div className="mb-4 rounded-2xl border border-emerald-250 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 animate-in fade-in">
            {actionMessage}
          </div>
        )}

        <div className="overflow-x-auto">
          {/* Added table-fixed and min-w to prevent shrinking columns from bunching up text */}
          <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase font-bold tracking-wider">
                {/* Enforced dedicated percentage widths and uniform horizontal padding */}
                <th className="pb-4 pt-1 px-4 font-semibold w-[14%]">
                  Created At
                </th>
                <th className="pb-4 pt-1 px-4 font-semibold w-[14%]">
                  Updated At
                </th>
                <th className="pb-4 pt-1 px-4 font-semibold w-[36%]">
                  Location Preferences
                </th>
                <th className="pb-4 pt-1 px-4 font-semibold w-[22%]">
                  Audit Notes
                </th>
                <th className="pb-4 pt-1 px-4 font-semibold w-[14%]">Status</th>
                <th className="pb-4 pt-1 px-4 font-semibold text-right w-[10%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {transfers.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="py-8 text-center text-slate-400 italic"
                  >
                    No transfer records found.
                  </td>
                </tr>
              ) : (
                transfers.map((request) => {
                  const isProposed =
                    request.status?.toUpperCase() === "PROPOSED";
                  const isSelf = isSelfInitiated(request);

                  return (
                    <tr
                      key={request.id}
                      className="hover:bg-slate-50/60 transition-colors align-middle"
                    >
                      {/* Applied matching px-4 padding to all data cells */}
                      <td className="py-4 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {formatDate(request.created_at)}
                      </td>
                      <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(request.updated_at)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-full">
                          {(request.location_preferences || []).length === 0 ? (
                            <span className="text-xs text-slate-405 italic">
                              No preferences set
                            </span>
                          ) : (
                            request.location_preferences.map((locId, idx) => (
                              <span
                                key={locId}
                                className="text-[11px] bg-slate-100 border border-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded-md truncate max-w-full"
                                title={locationMap[locId]}
                              >
                                {idx + 1}. {locationMap[locId] || `ID ${locId}`}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td
                        className="py-4 px-4 text-slate-500 text-xs break-words"
                        title={request.audit_notes}
                      >
                        {request.audit_notes || (
                          <span className="text-slate-300 italic">None</span>
                        )}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block border text-[11px] font-bold px-2.5 py-0.5 rounded-full ${getStatusStyle(request.status)}`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        {isProposed ? (
                          <div className="flex justify-end gap-1.5">
                            {isSelf ? (
                              <button
                                onClick={() => handleDelete(request.id)}
                                className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                                title="Cancel Request"
                                aria-label="Cancel self-initiated transfer request"
                              >
                                <Trash2 size={16} />
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setAcceptingTransfer(request);
                                    setSelectedPreferences([
                                      { state: "", cityId: "" },
                                    ]);
                                    setShowForm(false);
                                    setAppealingTransfer(null);
                                  }}
                                  className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                  title="Accept Transfer"
                                >
                                  <CheckCircle size={14} /> Accept
                                </button>
                                <button
                                  onClick={() => {
                                    setAppealingTransfer(request);
                                    setSelectedPreferences([
                                      { state: "", cityId: "" },
                                    ]);
                                    setAppealType("MEDICAL");
                                    setAppealNotes("");
                                    setShowForm(false);
                                    setAcceptingTransfer(null);
                                  }}
                                  className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                  title="Decline & Appeal"
                                >
                                  <AlertTriangle size={14} /> Appeal
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic select-none">
                            Locked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Create Trigger below table */}
        {!showForm &&
          !acceptingTransfer &&
          !appealingTransfer &&
          isEligible &&
          canRequestNewTransfer && (
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={openCreateWorkspace}
                className="flex items-center gap-2 text-sm font-medium bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-black transition-colors ml-auto cursor-pointer shadow-sm hover:shadow"
              >
                <Plus size={16} />
                Request New Transfer
              </button>
            </div>
          )}
      </SectionCard>

      {/* Creation or Acceptance Form Workspace Box */}
      {(showForm || acceptingTransfer) && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {showForm
                  ? "New Transfer Application"
                  : "Accept Proposed Transfer"}
              </h3>
              <p className="text-xs text-slate-500">
                {showForm
                  ? "Provide up to 3 location preferences in rank order."
                  : "Submit your preferred location choices to accept the transfer."}
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(false);
                setAcceptingTransfer(null);
              }}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={showForm ? handleFormSubmit : handleAcceptSubmit}
            className="space-y-4"
          >
            {selectedPreferences.map((pref, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row items-end gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100"
              >
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Priority {index + 1} State
                  </label>
                  <select
                    value={pref.state}
                    onChange={(e) =>
                      handlePreferenceChange(index, "state", e.target.value)
                    }
                    className="w-full bg-white rounded-xl border border-slate-200 p-2.5 text-sm"
                    required
                  >
                    <option value="">Select State...</option>
                    {availableStates.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Priority {index + 1} City
                  </label>
                  <select
                    value={pref.cityId}
                    disabled={!pref.state}
                    onChange={(e) =>
                      handlePreferenceChange(index, "cityId", e.target.value)
                    }
                    className="w-full bg-white rounded-xl border border-slate-200 p-2.5 text-sm disabled:bg-slate-100"
                    required
                  >
                    <option value="">Select City...</option>
                    {getCitiesByState(pref.state).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.city}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPreferences.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePreferenceRow(index)}
                    className="text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all mb-0.5 cursor-pointer"
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
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-black border border-slate-200 bg-white px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  <Plus size={14} /> Add Preference Rank
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setAcceptingTransfer(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 bg-slate-950 text-white rounded-xl text-sm font-medium hover:bg-black cursor-pointer shadow-sm hover:shadow disabled:opacity-50"
                >
                  {submittingAction
                    ? "Submitting..."
                    : showForm
                      ? "Submit Request"
                      : "Accept & Submit Preferences"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Appeal Form Workspace Box */}
      {appealingTransfer && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Decline & Appeal Transfer
              </h3>
              <p className="text-xs text-slate-500">
                Provide medical or educational grounds and submit your preferred locations for future consideration.
              </p>
            </div>
            <button
              onClick={() => {
                setAppealingTransfer(null);
                setAppealNotes("");
              }}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleAppealSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Appeal Category
              </label>
              <select
                value={appealType}
                onChange={(e) => setAppealType(e.target.value)}
                className="w-full bg-white rounded-xl border border-slate-200 p-2.5 text-sm focus:outline-none focus:border-blue-500"
                required
              >
                <option value="MEDICAL">
                  Medical Appeal (Requires approved medical record)
                </option>
                <option value="EDUCATION">
                  Education Appeal (Requires children in Board Exam Class 9 /
                  11)
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Appeal Notes / Justification
              </label>
              <textarea
                value={appealNotes}
                onChange={(e) => setAppealNotes(e.target.value)}
                placeholder="Explain the context or grounds for declining this transfer..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs focus:border-blue-500 focus:bg-white focus:outline-none transition-all resize-none h-24"
                required
              />
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Location Preferences
              </h4>
              {selectedPreferences.map((pref, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row items-end gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100"
                >
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                      Priority {index + 1} State
                    </label>
                    <select
                      value={pref.state}
                      onChange={(e) =>
                        handlePreferenceChange(index, "state", e.target.value)
                      }
                      className="w-full bg-white rounded-xl border border-slate-200 p-2.5 text-sm"
                      required
                    >
                      <option value="">Select State...</option>
                      {availableStates.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                      Priority {index + 1} City
                    </label>
                    <select
                      value={pref.cityId}
                      disabled={!pref.state}
                      onChange={(e) =>
                        handlePreferenceChange(index, "cityId", e.target.value)
                      }
                      className="w-full bg-white rounded-xl border border-slate-200 p-2.5 text-sm disabled:bg-slate-100"
                      required
                    >
                      <option value="">Select City...</option>
                      {getCitiesByState(pref.state).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.city}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedPreferences.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePreferenceRow(index)}
                      className="text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all mb-0.5 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}

              {selectedPreferences.length < 3 && (
                <button
                  type="button"
                  onClick={handleAddPreferenceRow}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-black border border-slate-200 bg-white px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  <Plus size={14} /> Add Preference Rank
                </button>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setAppealingTransfer(null);
                  setAppealNotes("");
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                disabled={submittingAction}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 cursor-pointer disabled:opacity-60 shadow-sm hover:shadow"
                disabled={submittingAction}
              >
                {submittingAction ? "Submitting..." : "Submit Appeal & Preferences"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

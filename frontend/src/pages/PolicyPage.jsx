import { useState, useEffect } from "react";
import { getRotationPolicies, createRotationPolicy, updateRotationPolicy } from "../api/policyApi";

export default function PolicyPage() {
    const [policies, setPolicies] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form state
    const [scopeType, setScopeType] = useState("GLOBAL");
    const [scopeId, setScopeId] = useState("");
    const [minTenureYears, setMinTenureYears] = useState(3);
    const [maxTenureYears, setMaxTenureYears] = useState(10);
    const [editingPolicyId, setEditingPolicyId] = useState(null);

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        setIsLoading(true);
        try {
            const data = await getRotationPolicies();
            setPolicies(data);
        } catch (err) {
            setError("Failed to fetch policies");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (policy) => {
        setEditingPolicyId(policy.id);
        setScopeType(policy.scope_type);
        setScopeId(policy.scope_id || "");
        setMinTenureYears(policy.rules_config.tenure_rules.min_tenure_years);
        setMaxTenureYears(policy.rules_config.tenure_rules.max_tenure_years);
    };

    const handleCancelEdit = () => {
        setEditingPolicyId(null);
        // Reset form
        setScopeType("GLOBAL");
        setScopeId("");
        setMinTenureYears(3);
        setMaxTenureYears(10);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (editingPolicyId) {
                // PATCH REQUEST: Only send the specific rules we are updating.
                // We OMIT level_gating entirely so the backend preserves whatever is already in the DB!
                const patchData = {
                    scope_type: scopeType,
                    scope_id: scopeType === "LOCAL" ? parseInt(scopeId, 10) : null,
                    rules_config: {
                        tenure_rules: {
                            min_tenure_years: parseInt(minTenureYears, 10),
                            max_tenure_years: parseInt(maxTenureYears, 10),
                        }
                    }
                };
                await updateRotationPolicy(editingPolicyId, patchData);
            } else {
                // POST REQUEST: We send the full structure for a brand new policy
                const postData = {
                    scope_type: scopeType,
                    scope_id: scopeType === "LOCAL" ? parseInt(scopeId, 10) : null,
                    rules_config: {
                        level_gating: {
                            lateral_only: [],
                            promotions_allowed: []
                        },
                        tenure_rules: {
                            min_tenure_years: parseInt(minTenureYears, 10),
                            max_tenure_years: parseInt(maxTenureYears, 10),
                        },
                    },
                };
                await createRotationPolicy(postData);
            }
            
            fetchPolicies();
            handleCancelEdit();

        } catch (err) {
            console.log("Full backend error response:", err.response?.data);

            // Safely extract the message string to prevent React from crashing
            const backendError = err.response?.data?.detail;
            
            if (Array.isArray(backendError)) {
                // If it's a FastAPI validation array, grab the first error message string
                setError(backendError[0]?.msg || "Validation error occurred.");
            } else if (typeof backendError === 'object' && backendError !== null) {
                // If it's a single error object, grab its message string
                setError(backendError.msg || "Invalid form data.");
            } else {
                setError(backendError || "An error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Rotation Policies</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-semibold mb-4">{editingPolicyId ? "Edit Policy" : "Create Policy"}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
                        {error && <div className="p-3 text-xs bg-rose-50 border border-rose-100 text-rose-600 rounded-lg">{error}</div>}
                        
                        <div>
                            <label htmlFor="scopeType" className="block text-sm font-semibold text-slate-700 mb-1.5">Scope Type</label>
                            <select id="scopeType" value={scopeType} onChange={(e) => setScopeType(e.target.value)} className="w-full bg-[#f1f5f9] border-transparent rounded-lg px-4 py-2">
                                <option value="GLOBAL">Global</option>
                                <option value="LOCAL">Local</option>
                            </select>
                        </div>

                        {scopeType === 'LOCAL' && (
                             <div>
                                <label htmlFor="scopeId" className="block text-sm font-semibold text-slate-700 mb-1.5">Location ID</label>
                                 <input
                                     id="scopeId"
                                     type="number"
                                     value={scopeId}
                                     onChange={(e) => setScopeId(e.target.value)}
                                     className="w-full bg-[#f1f5f9] border-transparent rounded-lg px-4 py-2"
                                     placeholder="Enter Location ID"
                                     required
                                 />
                             </div>
                        )}

                        <div>
                            <label htmlFor="minTenure" className="block text-sm font-semibold text-slate-700 mb-1.5">Minimum Tenure (Years)</label>
                            <input
                                id="minTenure"
                                type="number"
                                value={minTenureYears}
                                onChange={(e) => setMinTenureYears(e.target.value)}
                                className="w-full bg-[#f1f5f9] border-transparent rounded-lg px-4 py-2"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="maxTenure" className="block text-sm font-semibold text-slate-700 mb-1.5">Maximum Tenure (Years)</label>
                            <input
                                id="maxTenure"
                                type="number"
                                value={maxTenureYears}
                                onChange={(e) => setMaxTenureYears(e.target.value)}
                                className="w-full bg-[#f1f5f9] border-transparent rounded-lg px-4 py-2"
                                required
                            />
                        </div>
                        
                        <div className="flex gap-4">
                            <button type="submit" disabled={isLoading} className="bg-blue-500 text-white px-4 py-2 rounded-lg">
                                {isLoading ? "Saving..." : (editingPolicyId ? "Update Policy" : "Create Policy")}
                            </button>
                            {editingPolicyId && (
                                <button type="button" onClick={handleCancelEdit} className="bg-gray-300 text-black px-4 py-2 rounded-lg">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4">Existing Policies</h2>
                    {isLoading && <p>Loading policies...</p>}
                    <div className="space-y-4">
                        {policies.map(policy => (
                            <div key={policy.id} className="p-4 border rounded-lg">
                                <p><strong>ID:</strong> {policy.id}</p>
                                <p><strong>Scope:</strong> {policy.scope_type} {policy.scope_type === 'LOCAL' && `(Location ID: ${policy.scope_id})`}</p>
                                <p><strong>Min Tenure:</strong> {policy.rules_config?.tenure_rules?.min_tenure_years} years</p>
                                <p><strong>Max Tenure:</strong> {policy.rules_config?.tenure_rules?.max_tenure_years} years</p>
                                <button onClick={() => handleEditClick(policy)} className="mt-2 bg-gray-200 px-3 py-1 rounded-md text-sm">Edit</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

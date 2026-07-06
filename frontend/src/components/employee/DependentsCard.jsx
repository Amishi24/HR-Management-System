import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import SectionCard from "./SectionCard";

import {
    getDependents,
    addDependent,
    updateDependent,
    deleteDependent,
} from "../../api/employeeApi";

const RELATIONS = ["Spouse", "Child"];

export default function DependentsCard({ onDependentsChange }) {
    const [dependents, setDependents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    
    // Track IDs of elements targeted for deletion on the client-side
    const [deletedIds, setDeletedIds] = useState([]);

    const fetchDependents = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getDependents();
            const data = res.data.map((d) => ({
                ...d,
                relationship: d.relationship ?? d.relation,
            }));
            setDependents(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDependents();
    }, [fetchDependents]);

    useEffect(() => {
        onDependentsChange?.(dependents);
    }, [dependents, onDependentsChange]);

    function handleAdd() {
        const newDependent = {
            id: `temp-${Date.now()}`,
            full_name: "",
            relationship: "Spouse",
        };
        setDependents((prev) => [...prev, newDependent]);
    }

    function handleChange(index, field, value) {
        setDependents((prev) => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                [field]: value,
            };
            return updated;
        });
    }

    function handleDeleteClick(index, id) {
        if (!String(id).startsWith("temp-")) {
            setDeletedIds((prev) => [...prev, id]);
        }
        setDependents((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleMasterSave() {
        setIsSaving(true);
        setSaveMessage("");
        try {
            // 1. Process Deletions
            for (const id of deletedIds) {
                await deleteDependent(id);
            }

            // 2. Process Upserts (Creates & Updates)
            for (const dep of dependents) {
                if (String(dep.id).startsWith("temp-")) {
                    await addDependent({
                        full_name: dep.full_name,
                        relation: dep.relationship,
                    });
                } else {
                    await updateDependent(dep.id, {
                        full_name: dep.full_name,
                        relation: dep.relationship,
                    });
                }
            }

            setDeletedIds([]);
            await fetchDependents();
            
            setSaveMessage("Changes saved successfully!");
            setTimeout(() => setSaveMessage(""), 4000);
        } catch (err) {
            console.error(err);
            setSaveMessage("Failed to save changes. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <SectionCard
            title="Dependents"
            subtitle="Family details that may be considered during transfer planning."
            action={
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-black"
                >
                    <Plus size={18} />
                    Add Dependent
                </button>
            }
        >
            {loading ? (
                <p className="text-slate-500">Loading...</p>
            ) : dependents.length === 0 ? (
                <p className="text-slate-500">No dependents added.</p>
            ) : (
                <div className="space-y-6">
                    {/* Dependents list container */}
                    <div className="space-y-4">
                        {dependents.map((dep, index) => (
                            <div
                                key={dep.id}
                                className="border border-slate-200 rounded-2xl p-5"
                            >
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            value={dep.full_name}
                                            onChange={(e) =>
                                                handleChange(
                                                    index,
                                                    "full_name",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Relationship
                                        </label>
                                        <select
                                            value={dep.relationship}
                                            onChange={(e) =>
                                                handleChange(
                                                    index,
                                                    "relationship",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3"
                                        >
                                            {RELATIONS.map((r) => (
                                                <option key={r} value={r}>
                                                    {r}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end items-center mt-5">
                                    <button
                                        onClick={() => handleDeleteClick(index, dep.id)}
                                        className="text-red-500 hover:text-red-700 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Integrated Save Action Section inside the card */}
                    <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
                        {saveMessage && (
                            <span className={`text-sm font-medium ${saveMessage.includes("Failed") ? "text-red-500" : "text-emerald-600"}`}>
                                {saveMessage}
                            </span>
                        )}
                        <button
                            onClick={handleMasterSave}
                            disabled={isSaving || loading}
                            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-black disabled:bg-slate-300 transition-all"
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            )}
        </SectionCard>
    );
}
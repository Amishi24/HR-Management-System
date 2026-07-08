import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import SectionCard from "../common/SectionCard";

import {
    getMedicalHistory,
    addMedical,
    updateMedical,
    deleteMedical,
} from "../../api/employeeApi";

export default function MedicalCard() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    
    // Track IDs flagged for removal from the database on save
    const [deletedIds, setDeletedIds] = useState([]);

    useEffect(() => {
        fetchMedical();
    }, []);

    async function fetchMedical() {
        try {
            setLoading(true);
            const res = await getMedicalHistory();
            setRecords(res.data);
            setDeletedIds([]); // Flush state on initial data pull
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // Appends an empty placeholder locally using a safe client-side temporary ID
    function handleAdd() {
        const newRecord = {
            id: `temp-${Date.now()}`,
            issue: "",
            issue_year: new Date().getFullYear(),
            is_approve: false,
        };
        setRecords((prev) => [...prev, newRecord]);
    }

    function handleChange(index, field, value) {
        setRecords((prev) => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                [field]: value,
            };
            return updated;
        });
    }

    // Removes the card view dynamically and adds actual backend targets to the deletion pipeline
    function handleDeleteClick(index, id) {
        if (!String(id).startsWith("temp-")) {
            setDeletedIds((prev) => [...prev, id]);
        }
        setRecords((prev) => prev.filter((_, i) => i !== index));
    }

    // Explicitly process all buffered changes
    async function handleMasterSave() {
        setIsSaving(true);
        setSaveMessage("");
        try {
            // 1. Process Deletions
            for (const id of deletedIds) {
                await deleteMedical(id);
            }

            // 2. Process Upserts (Creates & Updates)
            for (const record of records) {
                const payload = {
                    issue: record.issue,
                    issue_year: Number(record.issue_year),
                };

                if (String(record.id).startsWith("temp-")) {
                    await addMedical(payload);
                } else {
                    await updateMedical(record.id, payload);
                }
            }

            await fetchMedical();
            setSaveMessage("Changes saved successfully!");
            setTimeout(() => setSaveMessage(""), 4000);
        } catch (err) {
            console.error(err);
            setSaveMessage("Failed to save changes. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }

    if (loading) {
        return (
            <SectionCard
                title="Medical"
                subtitle="Medical requests considered during transfers."
            >
                <p className="text-slate-500">Loading...</p>
            </SectionCard>
        );
    }

    return (
        <SectionCard
            title="Medical"
            subtitle="Medical requests that may influence transfer decisions."
            action={
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-black"
                >
                    <Plus size={18} />
                    Add Record
                </button>
            }
        >
            {records.length === 0 ? (
                <p className="text-slate-500">No medical records.</p>
            ) : (
                <div className="space-y-6">
                    {/* Records List */}
                    <div className="space-y-4">
                        {records.map((record, index) => (
                            <div
                                key={record.id}
                                className="border border-slate-200 rounded-2xl p-5"
                            >
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-slate-700">
                                            Medical Issue
                                        </label>
                                        <input
                                            value={record.issue}
                                            onChange={(e) =>
                                                handleChange(index, "issue", e.target.value)
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-slate-700">
                                            Issue Year
                                        </label>
                                        <input
                                            type="number"
                                            value={record.issue_year}
                                            onChange={(e) =>
                                                handleChange(index, "issue_year", e.target.value)
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3"
                                        />
                                    </div>
                                </div>
                                <div className="mt-5 flex justify-between items-center">
                                    <div className="text-sm">
                                        {record.is_approve ? (
                                            <span className="text-green-600 font-medium">
                                                Approved
                                            </span>
                                        ) : (
                                            <span className="text-amber-600 font-medium">
                                                Pending Approval
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleDeleteClick(index, record.id)}
                                        className="text-red-500 hover:text-red-700 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Integrated Save Action Section */}
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
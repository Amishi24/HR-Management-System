import { useEffect, useRef, useState } from "react";
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

    const [saving, setSaving] = useState({});

    const [deleting, setDeleting] = useState({});

    const debounceTimers = useRef({});

    useEffect(() => {
        fetchDependents();
    }, []);

    useEffect(() => {
        onDependentsChange?.(dependents);
    }, [dependents]);

    async function fetchDependents() {

        try {

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

    }

    async function handleAdd() {

        try {

            await addDependent({
                full_name: "",
                relation: "Spouse",
            });

            fetchDependents();

        } catch (err) {

            console.error(err);

        }

    }

    async function saveDependent(dep) {

        setSaving((prev) => ({
            ...prev,
            [dep.id]: true,
        }));

        try {

            await updateDependent(dep.id, {

                full_name: dep.full_name,

                relation: dep.relationship,

            });

        } catch (err) {

            console.error(err);

        } finally {

            setSaving((prev) => ({
                ...prev,
                [dep.id]: false,
            }));

        }

    }

    function handleChange(index, field, value) {

        setDependents((prev) => {

            const updated = [...prev];

            updated[index] = {

                ...updated[index],

                [field]: value,

            };

            const current = updated[index];

            if (debounceTimers.current[current.id]) {

                clearTimeout(debounceTimers.current[current.id]);

            }

            debounceTimers.current[current.id] = setTimeout(() => {

                saveDependent(current);

            }, 500);

            return updated;

        });

    }

    async function handleDelete(id) {

        setDeleting((prev) => ({
            ...prev,
            [id]: true,
        }));

        try {

            await deleteDependent(id);

            fetchDependents();

        } catch (err) {

            console.error(err);

        } finally {

            setDeleting((prev) => ({
                ...prev,
                [id]: false,
            }));

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

                <p className="text-slate-500">

                    Loading...

                </p>

            ) : dependents.length === 0 ? (

                <p className="text-slate-500">

                    No dependents added.

                </p>

            ) : (

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

                                            <option

                                                key={r}

                                                value={r}

                                            >

                                                {r}

                                            </option>

                                        ))}

                                    </select>

                                </div>

                            </div>

                            <div className="flex justify-between items-center mt-5">

                                <span className="text-sm text-slate-400">

                                    {saving[dep.id]

                                        ? "Saving..."

                                        : "Saved"}

                                </span>

                                <button

                                    onClick={() => handleDelete(dep.id)}

                                    disabled={deleting[dep.id]}

                                    className="text-red-500 hover:text-red-700"

                                >

                                    <Trash2 size={18} />

                                </button>

                            </div>

                        </div>

                    ))}

                </div>

            )}

        </SectionCard>

    );

}
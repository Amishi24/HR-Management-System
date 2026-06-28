import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import SectionCard from "./SectionCard";

import {
    getMedicalHistory,
    addMedical,
    updateMedical,
    deleteMedical,
} from "../../api/employeeApi";

export default function MedicalCard() {

    const [records, setRecords] = useState([]);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState({});

    const [deleting, setDeleting] = useState({});

    const debounceTimers = useRef({});

    useEffect(() => {
        fetchMedical();
    }, []);

    async function fetchMedical() {

        try {

            const res = await getMedicalHistory();

            setRecords(res.data);

        } catch (err) {

            console.error(err);

        } finally {

            setLoading(false);

        }

    }

    async function handleAdd() {

        try {

            await addMedical({

                issue: "",

                issue_year: new Date().getFullYear(),

            });

            fetchMedical();

        } catch (err) {

            console.error(err);

        }

    }

    async function saveRecord(record) {

        setSaving(prev => ({
            ...prev,
            [record.id]: true,
        }));

        try {

            await updateMedical(record.id, {

                issue: record.issue,

                issue_year: Number(record.issue_year),

            });

        } catch (err) {

            console.error(err);

        } finally {

            setSaving(prev => ({
                ...prev,
                [record.id]: false,
            }));

        }

    }

    function handleChange(index, field, value) {

        setRecords(prev => {

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

                saveRecord(current);

            }, 500);

            return updated;

        });

    }

    async function handleDelete(id) {

        setDeleting(prev => ({
            ...prev,
            [id]: true,
        }));

        try {

            await deleteMedical(id);

            fetchMedical();

        } catch (err) {

            console.error(err);

        } finally {

            setDeleting(prev => ({
                ...prev,
                [id]: false,
            }));

        }

    }

    if (loading) {

        return (

            <SectionCard

                title="Medical"

                subtitle="Medical requests considered during transfers."

            >

                Loading...

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

            {

                records.length === 0 ?

                (

                    <p className="text-slate-500">

                        No medical records.

                    </p>

                )

                :

                (

                    <div className="space-y-4">

                        {

                            records.map((record,index)=>(

                                <div

                                    key={record.id}

                                    className="border rounded-2xl p-5"

                                >

                                    <div className="grid md:grid-cols-2 gap-6">

                                        <div>

                                            <label className="block mb-2 text-sm font-medium">

                                                Medical Issue

                                            </label>

                                            <input

                                                value={record.issue}

                                                onChange={(e)=>

                                                    handleChange(

                                                        index,

                                                        "issue",

                                                        e.target.value

                                                    )

                                                }

                                                className="w-full rounded-xl border bg-slate-50 p-3"

                                            />

                                        </div>

                                        <div>

                                            <label className="block mb-2 text-sm font-medium">

                                                Issue Year

                                            </label>

                                            <input

                                                type="number"

                                                value={record.issue_year}

                                                onChange={(e)=>

                                                    handleChange(

                                                        index,

                                                        "issue_year",

                                                        e.target.value

                                                    )

                                                }

                                                className="w-full rounded-xl border bg-slate-50 p-3"

                                            />

                                        </div>

                                    </div>

                                    <div className="mt-5 flex justify-between items-center">

                                        <div className="text-sm">

                                            {

                                                record.is_approve ?

                                                <span className="text-green-600 font-medium">

                                                    Approved

                                                </span>

                                                :

                                                <span className="text-amber-600 font-medium">

                                                    Pending Approval

                                                </span>

                                            }
                                        </div>

                                        <div className="flex items-center gap-4">

                                            <span className="text-sm text-slate-400">

                                                {

                                                    saving[record.id]

                                                    ?

                                                    "Saving..."

                                                    :

                                                    "Saved"

                                                }

                                            </span>

                                            <button

                                                onClick={()=>handleDelete(record.id)}

                                                disabled={deleting[record.id]}

                                                className="text-red-600 hover:text-red-700"

                                            >

                                                <Trash2 size={18}/>

                                            </button>

                                        </div>

                                    </div>

                                </div>

                            ))

                        }

                    </div>

                )

            }

        </SectionCard>

    );

}
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import SectionCard from "./SectionCard";

import {
    getChildEducation,
    addEducation,
    updateEducation,
    deleteEducation,
} from "../../api/employeeApi";

export default function ChildEducationCard({ dependents = [] }) {

    const [children, setChildren] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        fetchChildren();

    }, [dependents]);

    async function fetchChildren() {

        try {

            const childDependents = dependents.filter(
                d => d.relationship === "Child"
            );

            const responses = await Promise.all(

                childDependents.map(child =>
                    getChildEducation(child.id)
                )

            );

            const education = [];

            responses.forEach(res => {

                if (res.data.length > 0)
                    education.push(res.data[0]);

            });

            setChildren(education);

        }

        catch (err) {

            console.error(err);

        }

        finally {

            setLoading(false);

        }

    }

    async function createRecord(childId) {

        try {

            await addEducation(childId, {

                curr_class: 1,

                academic_year: "",

            });

            fetchChildren();

        }

        catch (err) {

            console.error(err);

        }

    }

    async function updateRecord(id, field, value) {

        const child = children.find(c => c.dependent_id === id);

        if (!child) {
            return;
        }

        const payload = {

            curr_class: child.curr_class,

            academic_year: child.academic_year,

        };

        payload[field] = value;

        try {

            await updateEducation(id, payload);

        }

        catch (err) {

            console.error(err);

        }

    }

    async function removeRecord(id) {

        try {

            await deleteEducation(id);

            fetchChildren();

        }

        catch (err) {

            console.error(err);

        }

    }

    function handleChange(index, field, value) {

        if (index < 0) {
            return;
        }

        const updated = [...children];

        updated[index][field] = value;

        setChildren(updated);

        updateRecord(
            updated[index].dependent_id,
            field,
            value
        );

    }

    if (loading)

        return (
            <SectionCard
                title="Child Education"
                subtitle="Education details of children."
            >
                Loading...
            </SectionCard>
        );

    return (

        <SectionCard

            title="Child Education"

            subtitle="Education details used while evaluating transfer requests."

        >

            {

                dependents.filter(
                    d => d.relationship === "Child"
                ).length === 0 ?

                (

                    <p className="text-slate-500">

                        No child dependents found.

                    </p>

                )

                :

                <div className="space-y-4">

                    {

                        dependents

                        .filter(
                            d => d.relationship === "Child"
                        )

                        .map(child=>{

                            const edu = children.find(

                                e=>e.dependent_id===child.id

                            );

                            return(

                                <div

                                    key={child.id}

                                    className="border rounded-2xl p-5"

                                >

                                    <div className="grid md:grid-cols-3 gap-6">

                                        <div>

                                            <label className="block mb-2">

                                                Child

                                            </label>

                                            <input

                                                readOnly

                                                value={child.full_name}

                                                className="w-full rounded-xl border bg-slate-50 p-3"

                                            />

                                        </div>

                                        <div>

                                            <label className="block mb-2">

                                                Class

                                            </label>

                                            <input

                                                value={edu?.curr_class ?? ""}
                                                disabled={!edu}

                                                onChange={(e)=>handleChange(

                                                    children.findIndex(

                                                        c=>c.dependent_id===child.id

                                                    ),

                                                    "curr_class",

                                                    e.target.value

                                                )}

                                                className="w-full rounded-xl border bg-slate-50 p-3"

                                            />

                                        </div>

                                        <div>

                                            <label className="block mb-2">

                                                Academic Year

                                            </label>

                                            <input

                                                value={edu?.academic_year ?? ""}
                                                disabled={!edu}

                                                onChange={(e)=>handleChange(

                                                    children.findIndex(

                                                        c=>c.dependent_id===child.id

                                                    ),

                                                    "academic_year",

                                                    e.target.value

                                                )}

                                                className="w-full rounded-xl border bg-slate-50 p-3"

                                            />

                                        </div>

                                    </div>

                                    <div className="flex justify-end mt-5 gap-3">

                                        {

                                            !edu ?

                                            (

                                                <button

                                                    onClick={()=>createRecord(child.id)}

                                                    className="flex items-center gap-2 text-blue-600"

                                                >

                                                    <Plus size={16}/>

                                                    Add Education

                                                </button>

                                            )

                                            :

                                            (

                                                <button

                                                    onClick={()=>removeRecord(child.id)}

                                                    className="text-red-600"

                                                >

                                                    <Trash2 size={18}/>

                                                </button>

                                            )

                                        }

                                    </div>

                                </div>

                            );

                        })

                    }

                </div>

            }

        </SectionCard>

    );

}

import { useEffect, useState } from "react";
import { getProfile } from "../../api/employeeApi";
import SectionCard from "./SectionCard";

export default function IdentityCard() {

    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const fetchProfile = async () => {

            try {

                const res = await getProfile();
                setEmployee(res.data);

            } catch (err) {

                console.error(err);

            } finally {

                setLoading(false);

            }

        };

        fetchProfile();

    }, []);

    if (loading) {

        return (

            <SectionCard
                title="Identity"
                subtitle="Basic employee details."
            >

                <p className="text-slate-500">
                    Loading...
                </p>

            </SectionCard>

        );

    }

    if (!employee) {

        return (

            <SectionCard
                title="Identity"
                subtitle="Basic employee details."
            >

                <p className="text-red-500">
                    Unable to load employee.
                </p>

            </SectionCard>

        );

    }

    return (

        <SectionCard
            title="Identity"
            subtitle="Basic employee details and service information."
        >

            <div className="grid md:grid-cols-3 gap-6">

                <Field
                    label="Employee ID"
                    value={employee.id}
                />

                <Field
                    label="Name"
                    value={employee.name}
                />

                <Field
                    label="Email"
                    value={employee.email}
                />

                <Field
                    label="Date of Birth"
                    value={employee.DoB}
                />

                <Field
                    label="Retirement"
                    value={employee.DoRetirement}
                />

                <Field
                    label="Domicile State"
                    value={employee.domicile_state}
                />

                <Field
                    label="Discipline"
                    value={employee.discipline_name}
                />

            </div>

        </SectionCard>

    );

}

function Field({ label, value }) {

    return (

        <div>

            <label className="block text-sm font-medium text-slate-700 mb-2">

                {label}

            </label>

            <input
                readOnly
                value={value ?? ""}
                className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    p-3
                    text-slate-700
                    focus:outline-none
                "
            />

        </div>

    );

}
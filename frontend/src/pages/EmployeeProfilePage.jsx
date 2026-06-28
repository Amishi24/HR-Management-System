import { useState } from "react";
import IdentityCard from "../components/employee/IdentityCard";
import PositionCard from "../components/employee/PositionCard";
import DependentsCard from "../components/employee/DependentsCard";
import ChildEducationCard from "../components/employee/ChildEducationCard";
import MedicalCard from "../components/employee/MedicalCard";

export default function EmployeeProfilePage() {
    const [dependents, setDependents] = useState([]);

    return (

        <div className="max-w-6xl mx-auto py-8 px-6 space-y-8">

            <div>

                <h1 className="text-4xl font-bold text-slate-800">

                    Profile

                </h1>

                <p className="text-slate-500 mt-2">

                    Edit the details that travel with you during transfer planning.

                </p>

            </div>

            <IdentityCard />

            <PositionCard />

            <DependentsCard onDependentsChange={setDependents} />

            <ChildEducationCard dependents={dependents} />

            <MedicalCard />

        </div>

    );

}

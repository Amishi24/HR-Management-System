import { useState } from "react";
import { User, Users, GraduationCap, HeartPulse } from "lucide-react";
import Tabs from "../components/common/Tabs";
import IdentityCard from "../components/employee/IdentityCard";
import DependentsCard from "../components/employee/DependentsCard";
import ChildEducationCard from "../components/employee/ChildEducationCard";
import MedicalCard from "../components/employee/MedicalCard";


export default function EmployeeProfilePage() {
    const [dependents, setDependents] = useState([]);
    const profileTabs = [
        {
            id: "identity",
            label: "Identity Info",
            icon: User,
            component: <IdentityCard />,
        },
        {
            id: "dependents",
            label: "Dependents",
            icon: Users,
            component: <DependentsCard onDependentsChange={setDependents} />,
        },
        {
            id: "education",
            label: "Child Education",
            icon: GraduationCap,
            component: <ChildEducationCard dependents={dependents} />,
        },
        {
            id: "medical",
            label: "Medical History",
            icon: HeartPulse,
            component: <MedicalCard />,
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Profile</h1>
                <p className="text-slate-500 text-sm mt-1">Your personal and family details...</p>
            </div>

            <Tabs items={profileTabs} defaultTab="identity" />
        </div>
    );
}

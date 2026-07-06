import { useState } from "react";
import RoleDashboardSwitcher from "../components/shared/RoleDashboardSwitcher";
import PersonalDashboardView from "../components/shared/PersonalDashboardView";
import DeptHeadManagerDashboard from "../components/manager/DeptHeadManagerDashboard";

export default function DepartmentHeadDashboardPage() {
    const [activeView, setActiveView] = useState("personal");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Department Head Workspace</h1>
                <p className="text-slate-500 text-sm mt-1">Switch between your personal dashboard and the department management workspace.</p>
            </div>

            <RoleDashboardSwitcher
                activeView={activeView}
                onChange={setActiveView}
                personalLabel="My Personal Dashboard"
                managerLabel="Team Dashboard"
            />

            {activeView === "manager" ? <DeptHeadManagerDashboard /> : <PersonalDashboardView />}
        </div>
    );
}

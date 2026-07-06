import { useState } from "react";
import RoleDashboardSwitcher from "../components/shared/RoleDashboardSwitcher";
import PersonalDashboardView from "../components/shared/PersonalDashboardView";
import LocationHeadManagerDashboard from "../components/manager/LocationHeadManagerDashboard";

export default function LocationHeadDashboardPage() {
    const [activeView, setActiveView] = useState("personal");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Location Head Workspace</h1>
                <p className="text-slate-500 text-sm mt-1">Switch between your personal dashboard and the location management workspace.</p>
            </div>

            <RoleDashboardSwitcher
                activeView={activeView}
                onChange={setActiveView}
                personalLabel="My Personal Dashboard"
                managerLabel="Location Dashboard"
            />

            {activeView === "manager" ? <LocationHeadManagerDashboard /> : <PersonalDashboardView />}
        </div>
    );
}

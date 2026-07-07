import { useLocation } from "react-router-dom";
import PersonalDashboardView from "../components/shared/PersonalDashboardView";
import DeptHeadManagerDashboard from "../components/manager/DeptHeadManagerDashboard";

export default function DepartmentHeadDashboardPage() {
    const location = useLocation();
    const activeView = location.pathname.includes("/manager") ? "manager" : "personal";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Department Head Workspace</h1>
                <p className="text-slate-500 text-sm mt-1">Switch between your personal dashboard and the department management workspace.</p>
            </div>

            {activeView === "manager" ? <DeptHeadManagerDashboard /> : <PersonalDashboardView />}
        </div>
    );
}

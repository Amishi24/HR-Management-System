import { useLocation } from "react-router-dom";
import { getRole } from "../utils/auth";
import PersonalDashboardView from "../components/shared/PersonalDashboardView";
import DeptHeadManagerDashboard from "../components/manager/DeptHeadManagerDashboard";
import LocationHeadManagerDashboard from "../components/manager/LocationHeadManagerDashboard";

export default function ManagerDashboardPage() {
  const location = useLocation();
  const role = (getRole() || "").toUpperCase();
  const activeView = location.pathname.includes("/manager")
    ? "manager"
    : "personal";

  const config = {
    DEPT_HEAD: {
      title: "Department Head Workspace",
      managerComponent: <DeptHeadManagerDashboard />,
    },
    LOC_HEAD: {
      title: "Location Head Workspace",
      managerComponent: <LocationHeadManagerDashboard />,
    },
  };

  const currentConfig = config[role] || config.LOC_HEAD;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          {currentConfig.title}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Switch between your personal dashboard and the location management
          workspace.
        </p>
      </div>

      {activeView === "manager" ? (
        currentConfig.managerComponent
      ) : (
        <PersonalDashboardView />
      )}
    </div>
  );
}

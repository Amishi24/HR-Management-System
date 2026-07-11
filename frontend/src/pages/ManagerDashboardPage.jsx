import { useLocation } from "react-router-dom";
import { getRole } from "../utils/auth";
import EmployeeDashboard from "./EmployeeDashboard";
import DeptHeadManagerView from "../components/dept-head/DeptHeadManagerView";
import LocationHeadManagerView from "../components/loc-head/LocationHeadManagerView";

export default function ManagerDashboardPage() {
  const location = useLocation();
  const path = location.pathname;
  const role = (getRole() || "").toUpperCase();

  const activeView = location.pathname.includes("/manager")
    ? "manager"
    : "personal";

  const config = {
    DEPT_HEAD: {
      title: "Department Head Workspace",
      managerComponent: <DeptHeadManagerView />,
    },

    LOC_HEAD: {
      title: "Location Head Workspace",
      managerComponent: <LocationHeadManagerView />,
    },
  };

  const currentConfig = config[role] || config.LOC_HEAD;

  let pageTitle = currentConfig.title;

  if (role === "LOC_HEAD") {
    if (path.includes("/manage-location")) {
      pageTitle = "Manage Location";
    } else if (path.includes("/manage-positions")) {
      pageTitle = "Manage Positions";
    } else if (path.includes("/transfer-workflow")) {
      pageTitle = "Transfer Workflow";
    }
  } else if (role === "DEPT_HEAD") {
    if (path.includes("/dashboard")) {
      pageTitle = "Dashboard";
    } else if (path.includes("/team-management")) {
      pageTitle = "Team Management";
    } else if (path.includes("/transfer-management")) {
      pageTitle = "Transfer Management";
    } else if (path.includes("/employee-directory")) {
      pageTitle = "Employee Directory";
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">{pageTitle}</h1>
      </div>

      {activeView === "manager" ? (
        currentConfig.managerComponent
      ) : (
        <EmployeeDashboard />
      )}
    </div>
  );
}

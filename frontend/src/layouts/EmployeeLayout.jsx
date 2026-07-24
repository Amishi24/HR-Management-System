import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";
import SideBar from "../components/SideBar";
import RoleDashboardSwitcher from "../components/shared/RoleDashboardSwitcher";
import { getRole } from "../utils/auth";

export default function EmployeeLayout() {
  const location = useLocation();
  const [isSideBarCollapsed, setIsSideBarCollapsed] = useState(false);
  const role = (getRole() || "EMPLOYEE").toUpperCase();

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  const isManagerRole =
    role === "DEPT_HEAD" ||
    role === "LOC_HEAD" ||
    role === "TRANSFER_HEAD" ||
    role === "MED_OFFICER";
  const isManagerRoute =
    location.pathname.startsWith("/dept-head/manager") ||
    location.pathname.startsWith("/loc-head/manager") ||
    location.pathname.startsWith("/transfer-head/manager") ||
    location.pathname.startsWith("/med-officer/manager");
  const activeView = isManagerRoute ? "manager" : "personal";

  const handleViewChange = (selectedView) => {
    if (role === "DEPT_HEAD") {
      window.location.assign(
        selectedView === "manager"
          ? "/dept-head/manager"
          : "/dept-head/personal",
      );
      return;
    }

    if (role === "LOC_HEAD") {
      window.location.assign(
        selectedView === "manager" ? "/loc-head/manager" : "/loc-head/personal",
      );
      return;
    }

    if (role === "TRANSFER_HEAD") {
      window.location.assign(
        selectedView === "manager"
          ? "/transfer-head/manager"
          : "/transfer-head/personal",
      );
      return;
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#f8fafc]">
      <div
        className={`hidden lg:block h-screen sticky top-0 border-r border-slate-200 bg-white transition-all duration-200 ${isSideBarCollapsed ? "w-20" : "w-72"}`}
      >
        <SideBar
          isCollapsed={isSideBarCollapsed}
          onToggleCollapse={() => setIsSideBarCollapsed((prev) => !prev)}
        />
      </div>

      <div className="block lg:hidden w-full border-b border-slate-200 bg-white">
        <SideBar
          isCollapsed={false}
          onToggleCollapse={() => setIsSideBarCollapsed((prev) => !prev)}
        />
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 lg:px-12">
        {isManagerRole && role !== "MED_OFFICER" && (
          <div className="mb-6 flex justify-end">
            <RoleDashboardSwitcher
              activeView={activeView}
              onChange={handleViewChange}
              personalLabel="My Personal Dashboard"
              managerLabel={
                role === "LOC_HEAD" ? "Location Dashboard" : "Team Dashboard"
              }
            />
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}

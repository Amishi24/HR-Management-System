import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  LayoutDashboard,
  UserCircle2,
  SendToBack,
  LogOut,
  ShieldCheck,
  MapPinned,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Stethoscope,
} from "lucide-react";
import { getEmployeeId, getEmployeeName, getRole, logout } from "../utils/auth";

const roleConfigs = {
  EMPLOYEE: {
    personalBasePath: "/employee",
    managerBasePath: null,
  },
  DEPT_HEAD: {
    personalBasePath: "/dept-head/personal",
    managerBasePath: "/dept-head/manager",
    managerLabel: "Department Head Workspace",
    managerIcon: ShieldCheck,
  },
  LOC_HEAD: {
    personalBasePath: "/loc-head/personal",
    managerBasePath: "/loc-head/manager",
    managerLabel: "Location Head Workspace",
    managerIcon: MapPinned,
  },
  TRANSFER_HEAD: {
    personalBasePath: "/transfer-head/personal",
    managerBasePath: "/transfer-head/manager",
    managerLabel: "Transfer Head Workspace",
    managerIcon: RotateCcw,
  },
  MED_OFFICER: {
    personalBasePath: null,
    managerBasePath: "/med-officer/manager",
    managerLabel: "Medical Appeals Workspace",
    managerIcon: Stethoscope,
  },
};

const personalNavItems = [
  {
    key: "profile",
    label: "Profile",
    icon: UserCircle2,
    getPath: (config) => `${config.personalBasePath}/profile`,
  },
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    getPath: (config) => config.personalBasePath,
  },
  {
    key: "transfers",
    label: "Transfer Requests",
    icon: SendToBack,
    getPath: (config) => `${config.personalBasePath}/transfers`,
  },
];

const getNavigationItems = (role, view) => {
  const config = roleConfigs[role] || roleConfigs.EMPLOYEE;

  if (view === "manager") {
    if (!config.managerBasePath) {
      return [];
    }
    if (role === "LOC_HEAD") {
      return [
        {
          key: "manage-location",
          label: "Manage Location",
          icon: MapPinned,
          to: "/loc-head/manager/manage-location",
        },
        {
          key: "manage-positions",
          label: "Manage Positions",
          icon: Building2,
          to: "/loc-head/manager/manage-positions",
        },
        {
          key: "transfer-workflow",
          label: "Transfer Workflow",
          icon: SendToBack,
          to: "/loc-head/manager/transfer-workflow",
        },
      ];
    }

    if (role === "DEPT_HEAD") {
      return [
        {
          key: "dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          to: "/dept-head/manager/dashboard",
        },
        {
          key: "team-management",
          label: "Team Management",
          icon: Building2,
          to: "/dept-head/manager/team-management",
        },
        {
          key: "employee-directory",
          label: "Employee Directory",
          icon: UserCircle2,
          to: "/dept-head/manager/employee-directory",
        },
        {
          key: "transfer-management",
          label: "Transfer Management",
          icon: SendToBack,
          to: "/dept-head/manager/transfer-management",
        },
      ];
    }

    if (role === "TRANSFER_HEAD") {
      return [
        {
          key: "cycle-dashboard",
          label: "Cycle Dashboard",
          icon: RotateCcw,
          to: "/transfer-head/manager/dashboard",
        },
      ];
    }

    if (role === "MED_OFFICER") {
      return [
        {
          key: "appeals-dashboard",
          label: "Appeals Dashboard",
          icon: Stethoscope,
          to: "/med-officer/manager/dashboard",
        },
      ];
    }

    return [];
  }

  return personalNavItems.map((item) => ({
    ...item,
    to: item.getPath(config),
  }));
};

const isItemActive = (item, pathname) => {
  if (!item?.to) {
    return false;
  }

  if (item.key === "dashboard") {
    return pathname === item.to || pathname === "/employee/dashboard";
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`);
};

export default function SideBar({ isCollapsed, onToggleCollapse }) {
  const navigate = useNavigate();
  const location = useLocation();
  const role = (getRole() || "EMPLOYEE").toUpperCase();
  const employeeName = getEmployeeName() || "Employee";
  const employeeId = getEmployeeId() || "N/A";
  const isManagerRoute =
    location.pathname.startsWith("/dept-head/manager") ||
    location.pathname.startsWith("/loc-head/manager") ||
    location.pathname.startsWith("/transfer-head/manager") ||
    location.pathname.startsWith("/med-officer/manager");
  const view = isManagerRoute ? "manager" : "personal";
  const navItems = getNavigationItems(role, view);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="flex h-full w-full flex-col bg-white p-5 lg:p-6 justify-between">
      {/* Top Navigation Links Group */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Building2 size={18} />
            </div>
            {!isCollapsed && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">
                  ONGC
                </p>
                <h2 className="text-sm font-bold text-slate-800">
                  Employee Portal
                </h2>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
            aria-label={isCollapsed ? "Expand sideBar" : "Collapse sideBar"}
          >
            {isCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </button>
        </div>

        {!isCollapsed && (
          <>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-sm font-bold text-slate-800">{employeeName}</p>
              <p className="mt-0.5 text-xs text-slate-400 font-medium">
                ID: {employeeId}
              </p>
            </div>

            {/* Main Link Action Navigation Roster */}
            <nav className="space-y-1">
              {navItems.map(({ to, label, icon: Icon, key }) => {
                const isCurrentRoute = isItemActive(
                  { key, to },
                  location.pathname,
                );

                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition-all duration-150 ${
                      isCurrentRoute
                        ? "bg-[#3b82f6] text-white shadow-md shadow-blue-100"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </>
        )}
      </div>

      {/* Bottom Sticky Logout Interaction Frame */}
      <button
        type="button"
        onClick={handleLogout}
        className={`mt-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 cursor-pointer ${isCollapsed ? "p-2" : "gap-2 px-4 py-2.5 text-sm font-bold"}`}
        aria-label="Logout"
      >
        <LogOut size={16} />
        {!isCollapsed && <span>Logout</span>}
      </button>
    </aside>
  );
}

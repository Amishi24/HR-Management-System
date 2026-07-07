import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Building2, LayoutDashboard, UserCircle2, SendToBack, LogOut, ShieldCheck, MapPinned, ChevronLeft, ChevronRight } from "lucide-react";
import { getEmployeeId, getEmployeeName, getRole, logout } from "../utils/auth";

const navigationByRole = {
    EMPLOYEE: {
        personal: [
            {
                to: "/employee/profile",
                label: "Profile",
                icon: UserCircle2,
            },
            {
                to: "/employee/dashboard",
                label: "Dashboard",
                icon: LayoutDashboard,
            },
            {
                to: "/employee/transfers",
                label: "Transfer Requests",
                icon: SendToBack,
            },
        ],
    },
    DEPT_HEAD: {
        personal: [
            {
                to: "/employee/profile",
                label: "Profile",
                icon: UserCircle2,
            },
            {
                to: "/employee/dashboard",
                label: "Dashboard",
                icon: LayoutDashboard,
            },
            {
                to: "/employee/transfers",
                label: "Transfer Requests",
                icon: SendToBack,
            },
        ],
        manager: [
            {
                to: "/dept-head/manager",
                label: "Department Head Workspace",
                icon: ShieldCheck,
            },
        ],
    },
    LOC_HEAD: {
        personal: [
            {
                to: "/employee/profile",
                label: "Profile",
                icon: UserCircle2,
            },
            {
                to: "/employee/dashboard",
                label: "Dashboard",
                icon: LayoutDashboard,
            },
            {
                to: "/employee/transfers",
                label: "Transfer Requests",
                icon: SendToBack,
            },
        ],
        manager: [
            {
                to: "/loc-head/manager",
                label: "Location Head Workspace",
                icon: MapPinned,
            },
        ],
    },
};

export default function Sidebar({ isCollapsed, onToggleCollapse }) {
    const navigate = useNavigate();
    const location = useLocation();
    const role = (getRole() || "EMPLOYEE").toUpperCase();
    const employeeName = getEmployeeName() || "Employee";
    const employeeId = getEmployeeId() || "N/A";
    const isManagerRoute = location.pathname.startsWith("/dept-head/manager") || location.pathname.startsWith("/loc-head/manager");
    const view = isManagerRoute ? "manager" : "personal";
    const navItems = navigationByRole[role]?.[view] || navigationByRole.EMPLOYEE.personal;

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
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">ONGC</p>
                                <h2 className="text-sm font-bold text-slate-800">Employee Portal</h2>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                {!isCollapsed && (
                    <>
                        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                            <p className="text-sm font-bold text-slate-800">{employeeName}</p>
                            <p className="mt-0.5 text-xs text-slate-400 font-medium">ID: {employeeId}</p>
                        </div>

                        {/* Main Link Action Navigation Roster */}
                        <nav className="space-y-1">
                            {navItems.map(({ to, label, icon: Icon }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition-all duration-150 ${
                                            isActive
                                                ? "bg-[#3b82f6] text-white shadow-md shadow-blue-100"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }`
                                    }
                                >
                                    <Icon size={18} className="shrink-0" />
                                    <span>{label}</span>
                                </NavLink>
                            ))}
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
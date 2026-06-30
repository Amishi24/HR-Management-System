import { NavLink, useNavigate } from "react-router-dom";
import { Building2, LayoutDashboard, UserCircle2, SendToBack, LogOut, ShieldCheck } from "lucide-react";
import { getEmployeeId, getEmployeeName, getRole, logout } from "../utils/auth";

const navigationByRole = {
    EMPLOYEE: [
        {
            to: "/employee/dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
        },
        {
            to: "/employee/profile",
            label: "Profile",
            icon: UserCircle2,
        },
        {
            to: "/employee/transfers",
            label: "Transfer Requests",
            icon: SendToBack,
        },
    ],
    ADMIN: [
        {
            to: "/employee/dashboard",
            label: "Admin Dashboard",
            icon: ShieldCheck,
        },
    ],
};

export default function SideBar() {
    const navigate = useNavigate();
    const role = (getRole() || "EMPLOYEE").toUpperCase();
    const employeeName = getEmployeeName() || "Employee";
    const employeeId = getEmployeeId() || "N/A";
    const navItems = navigationByRole[role] || navigationByRole.EMPLOYEE;

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <aside className="flex h-full w-full flex-col bg-white p-5 lg:p-6 justify-between">
            {/* Top Navigation Links Group */}
            <div className="space-y-6">
                {/* Brand Header Group */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <Building2 size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">ONGC</p>
                        <h2 className="text-sm font-bold text-slate-800">Employee Portal</h2>
                    </div>
                </div>

                {/* Identity Badging Card block */}
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
            </div>

            {/* Bottom Sticky Logout Interaction Frame */}
            <button
                type="button"
                onClick={handleLogout}
                className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
            >
                <LogOut size={16} />
                Logout
            </button>
        </aside>
    );
}

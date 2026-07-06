import { Navigate, useNavigate } from "react-router-dom";
import { getRole } from "../utils/auth";

const roleCopy = {
    DEPT_HEAD: {
        title: "Department Head Workspace",
        description: "Choose whether to open your department workspace or review your personal profile.",
        primaryLabel: "Open Department Workspace",
        primaryRoute: "/dept-head/dashboard",
        secondaryLabel: "Open My Profile",
        secondaryRoute: "/employee/profile",
    },
    LOC_HEAD: {
        title: "Location Head Workspace",
        description: "Choose whether to manage your location operations or view your personal profile.",
        primaryLabel: "Open Location Workspace",
        primaryRoute: "/loc-head/dashboard",
        secondaryLabel: "Open My Profile",
        secondaryRoute: "/employee/profile",
    },
};

export default function RoleLandingPage() {
    const navigate = useNavigate();
    const role = getRole();
    const content = roleCopy[role] || null;

    if (!content) {
        return <Navigate to="/employee/dashboard" replace />;
    }

    return (
        <div className="min-h-screen w-full bg-[#f8fafc] px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-4xl flex-col gap-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#4472c4]">Welcome back</p>
                    <h1 className="mt-2 text-3xl font-bold text-slate-800">{content.title}</h1>
                    <p className="mt-3 max-w-2xl text-sm text-slate-600">{content.description}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => navigate(content.primaryRoute, { replace: true })}
                        className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <p className="text-lg font-semibold text-slate-800">{content.primaryLabel}</p>
                        <p className="mt-2 text-sm text-slate-500">Continue to the manager workspace for approvals, transfers, and team oversight.</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate(content.secondaryRoute, { replace: true })}
                        className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <p className="text-lg font-semibold text-slate-800">{content.secondaryLabel}</p>
                        <p className="mt-2 text-sm text-slate-500">Open your profile and personal employee information.</p>
                    </button>
                </div>
            </div>
        </div>
    );
}

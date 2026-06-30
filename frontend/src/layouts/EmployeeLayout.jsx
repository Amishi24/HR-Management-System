import { Navigate, Outlet } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";
import SideBar from "../components/SideBar";

export default function EmployeeLayout() {
    if (!isLoggedIn()) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex min-h-screen w-full bg-[#f8fafc]">
            {/* Sidebar anchored left at a fixed viewport frame */}
            <div className="hidden lg:block w-72 shrink-0 h-screen sticky top-0 bg-white border-r border-slate-200">
                <SideBar />
            </div>

            {/* Mobile Sidebar display handler fallback container */}
            <div className="block lg:hidden w-full border-b border-slate-200 bg-white">
                <SideBar />
            </div>

            {/* Main Content Area view panel */}
            <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 lg:px-12">
                <Outlet />
            </main>
        </div>
        
    );
}
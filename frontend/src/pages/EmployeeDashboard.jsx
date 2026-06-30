import TenureTimeline from "../components/employee/TenureTimeline";
import SectionCard from "../components/employee/SectionCard";
import { getEmployeeId, getEmployeeName } from "../utils/auth";

export default function EmployeeDashboard() {
    const employeeName = getEmployeeName() || "Employee";
    const employeeId = getEmployeeId() || "N/A";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Welcome back, {employeeName}</h1>
                <p className="text-slate-500 text-sm mt-1">Track your current tenure, assignments, and transfer activity in one place.</p>
                
            </div>

            <TenureTimeline />
        </div>
    );
}
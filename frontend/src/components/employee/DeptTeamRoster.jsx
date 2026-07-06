import { Eye } from "lucide-react";
import SectionCard from "./SectionCard";

export default function DeptTeamRoster({ team, onViewEmployee }) {
    return (
        <SectionCard title="Team Roster" subtitle="Your active team across the selected department tree.">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 text-slate-400">
                            <th className="pb-3">Employee</th>
                            <th className="pb-3">Discipline</th>
                            <th className="pb-3">Department</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3 text-right">View</th>
                        </tr>
                    </thead>
                    <tbody>
                        {team.map((member) => (
                            <tr key={member.employee_id} className="border-b border-slate-100">
                                <td className="py-3 font-medium text-slate-700">{member.employee_name}</td>
                                <td className="py-3 text-slate-500">{member.discipline}</td>
                                <td className="py-3 text-slate-500">{member.Assigned_department}</td>
                                <td className="py-3">
                                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${member.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                        {member.is_active ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td className="py-3 text-right">
                                    <button onClick={() => onViewEmployee(member.employee_id)} className="text-slate-600 hover:text-slate-900">
                                        <Eye size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </SectionCard>
    );
}
import SectionCard from "../common/SectionCard";

export default function LocTeamRoster({ team }) {
    return (
        <SectionCard title="Department Head Team" subtitle="Department heads at this location that are eligible for transfer review.">
            <div className="space-y-3">
                {team.map((member) => (
                    <div key={member.employee_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="font-semibold text-slate-800">{member.employee_name}</p>
                        <p className="text-sm text-slate-500">{member.discipline} • {member.Assigned_department}</p>
                    </div>
                ))}
            </div>
        </SectionCard>
    );
}
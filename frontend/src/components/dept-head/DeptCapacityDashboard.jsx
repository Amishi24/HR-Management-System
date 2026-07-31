import SectionCard from "../common/SectionCard";

export default function DeptCapacityDashboard({ capacity }) {
    return (
        <SectionCard title="Capacity Dashboard" subtitle="Department, discipline, and level-based capacity against current strength.">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 text-slate-400">
                            <th className="pb-3">Department</th>
                            <th className="pb-3">Discipline</th>
                            <th className="pb-3">Level</th>
                            <th className="pb-3">Max</th>
                            <th className="pb-3">Current</th>
                            <th className="pb-3">Vacancies</th>
                        </tr>
                    </thead>
                    <tbody>
                        {capacity.map((row) => (
                            <tr key={`${row.department_name}-${row.discipline_name}-${row.level}`} className="border-b border-slate-100">
                                <td className="py-3 font-medium text-slate-700">{row.department_name}</td>
                                <td className="py-3 text-slate-600">{row.discipline_name}</td>
                                <td className="py-3 text-slate-600">{row.level}</td>
                                <td className="py-3 text-slate-600">{row.max_strength}</td>
                                <td className="py-3 text-slate-600">{row.current_active}</td>
                                <td className="py-3 text-slate-600">{row.vacancies}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </SectionCard>
    );
}
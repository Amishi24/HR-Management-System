import SectionCard from "../common/SectionCard";

export default function DeptScopeSelector({ departments, selectedDepartment, setSelectedDepartment }) {
    return (
        <SectionCard title="Department Scope" subtitle="Choose a department branch to scope the roster and transfer review view.">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Department</label>
                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                        <option value="">All departments in my jurisdiction</option>
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                                {dept.name} {dept.parent_dept ? `(${dept.parent_dept})` : ""}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </SectionCard>
    );
}
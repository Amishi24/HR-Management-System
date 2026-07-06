import { Plus, Trash2 } from "lucide-react";
import SectionCard from "../employee/SectionCard";

export default function LocationPositions({ positions, departments, disciplines, form, onFormChange, onCreatePosition, onDeletePosition }) {
    return (
        <SectionCard title="Positions at this Location" subtitle="Create or remove positions that belong to your location.">
            <form onSubmit={onCreatePosition} className="mb-4 grid gap-3 md:grid-cols-4">
                <select value={form.department_id} onChange={(e) => onFormChange("department_id", e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 p-3" required>
                    <option value="">Select department</option>
                    {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                </select>
                <select value={form.discipline_id} onChange={(e) => onFormChange("discipline_id", e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <option value="">Optional discipline</option>
                    {disciplines.map((discipline) => <option key={discipline.id} value={discipline.id}>{discipline.name}</option>)}
                </select>
                <input type="number" value={form.level} onChange={(e) => onFormChange("level", e.target.value)} placeholder="Level" className="rounded-xl border border-slate-200 bg-slate-50 p-3" required />
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <input type="checkbox" checked={form.is_vacant} onChange={(e) => onFormChange("is_vacant", e.target.checked)} />
                    Vacant
                </label>
                <button type="submit" className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white md:col-span-4">
                    <Plus size={16} /> Create position
                </button>
            </form>
            <div className="space-y-3">
                {positions.map((position) => (
                    <div key={position.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                            <p className="font-semibold text-slate-800">{position.department_name}</p>
                            <p className="text-sm text-slate-500">{position.discipline_name || "No discipline"} • level {position.level} • {position.is_vacant ? "Vacant" : "Filled"}</p>
                        </div>
                        <button onClick={() => onDeletePosition(position.id)} className="text-rose-500">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </SectionCard>
    );
}
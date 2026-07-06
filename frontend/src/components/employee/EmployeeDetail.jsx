import { Plus, XCircle } from "lucide-react";
import SectionCard from "./SectionCard";

export default function EmployeeDetail({ employee, assignmentDrafts, onAssignmentDraftChange, onCreateAssignment, onDeleteAssignment }) {
    if (!employee) return null;

    if (employee.error) {
        return (
            <SectionCard title="Employee Detail" subtitle="Unable to load the selected team member.">
                <p className="text-slate-500">{employee.error}</p>
            </SectionCard>
        );
    }

    return (
        <SectionCard title="Employee Detail" subtitle="Tenure record summary and task assignments for the selected team member.">
            <div className="space-y-4">
                <div>
                    <p className="text-sm font-semibold text-slate-700">{employee.name}</p>
                    <p className="text-sm text-slate-500">{employee.discipline_name || "Discipline not assigned"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-700">Tenure records</h3>
                    <div className="mt-3 space-y-2">
                        {(employee.tenures || []).map((tenure) => {
                            const draftKey = `${employee.id}-${tenure.id}`;
                            const draft = assignmentDrafts[draftKey] || { title: "", weightage: 5, skills: "" };

                            return (
                                <div key={tenure.id} className="rounded-xl border border-slate-200 bg-white p-3">
                                    <p className="text-sm font-medium text-slate-700">{tenure.department_name}</p>
                                    <p className="text-xs text-slate-500">{tenure.location} • {tenure.start_date} → {tenure.end_date || "Active"}</p>
                                    <p className="mt-1 text-xs text-slate-500">Remaining days: {tenure.remaining_days}</p>
                                    <div className="mt-3 space-y-2">
                                        {(tenure.assignments || []).map((assignment) => (
                                            <div key={`${tenure.id}-${assignment.title}`} className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-sm">
                                                <span>{assignment.title}</span>
                                                <button onClick={() => onDeleteAssignment(employee.id, assignment.id)} className="text-rose-500">
                                                    <XCircle size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3 rounded-xl border border-dashed border-slate-200 p-3">
                                        <input
                                            type="text"
                                            value={draft.title}
                                            onChange={(e) => onAssignmentDraftChange(draftKey, "title", e.target.value)}
                                            placeholder="Assignment title"
                                            className="mb-2 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm"
                                        />
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={draft.weightage}
                                            onChange={(e) => onAssignmentDraftChange(draftKey, "weightage", e.target.value)}
                                            className="mb-2 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm"
                                        />
                                        <input
                                            type="text"
                                            value={draft.skills}
                                            onChange={(e) => onAssignmentDraftChange(draftKey, "skills", e.target.value)}
                                            placeholder="skills, comma separated"
                                            className="mb-2 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm"
                                        />
                                        <button onClick={() => onCreateAssignment(employee.id, tenure.id)} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <Plus size={16} /> Create assignment
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </SectionCard>
    );
}
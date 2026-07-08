import { Plus, XCircle } from "lucide-react";
import SectionCard from "../common/SectionCard";

export default function EmployeeDetail({
  employee,
  assignmentDrafts,
  onAssignmentDraftChange,
  onCreateAssignment,
  onDeleteAssignment,
}) {
  if (!employee) return null;

  if (employee.error) {
    return (
      <SectionCard
        title="Employee Detail"
        subtitle="Unable to load the selected team member."
      >
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {employee.error}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Employee Detail"
      subtitle="Tenure record summary and task assignments for the selected team member."
    >
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4 border-b border-slate-105 pb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 font-bold text-lg border border-blue-100 shadow-2xs">
            {employee.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">{employee.name}</h3>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {employee.discipline_name || "Discipline not assigned"}
            </p>
          </div>
        </div>

        {/* Tenure Records Timeline / Cards */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tenure History & Assignments
          </h4>
          
          {(employee.tenures || []).length === 0 ? (
            <p className="text-sm text-slate-400 italic">No tenure records found.</p>
          ) : (
            <div className="space-y-4">
              {(employee.tenures || []).map((tenure) => {
                const draftKey = `${employee.id}-${tenure.id}`;
                const draft = assignmentDrafts[draftKey] || {
                  title: "",
                  weightage: 5,
                  skills: "",
                };

                return (
                  <div
                    key={tenure.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 hover:bg-slate-50 transition-colors"
                  >
                    {/* Tenure Header Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">
                          {tenure.department_name}
                        </h5>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          📍 {tenure.location}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs text-slate-700 font-semibold">
                          {tenure.start_date} → {tenure.end_date || "Active"}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">
                          Remaining: {tenure.remaining_days} days
                        </p>
                      </div>
                    </div>

                    {/* Active Assignments */}
                    <div className="mt-4 space-y-2.5">
                      <h6 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Assignments
                      </h6>
                      {(tenure.assignments || []).length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No assignments registered.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(tenure.assignments || []).map((assignment) => (
                            <div
                              key={`${tenure.id}-${assignment.title}`}
                              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs hover:shadow-xs transition-shadow"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <span className="text-xs font-bold text-slate-700 leading-snug">
                                  {assignment.title}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="inline-flex rounded-full bg-slate-100 border border-slate-150 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                    Wt: {assignment.weightage}
                                  </span>
                                  <button
                                    onClick={() =>
                                      onDeleteAssignment(employee.id, assignment.id)
                                    }
                                    className="text-rose-500 hover:text-rose-700 transition-colors p-0.5 rounded-lg hover:bg-rose-50"
                                    title="Remove assignment"
                                  >
                                    <XCircle size={15} />
                                  </button>
                                </div>
                              </div>

                              {/* Skills */}
                              {assignment.skills && assignment.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2.5">
                                  {assignment.skills.map((skill, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="text-[9px] bg-slate-50 text-slate-600 border border-slate-100 px-1.5 py-0.5 rounded font-medium"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Create Assignment Form */}
                    <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white p-4">
                      <h6 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                        Create New Assignment
                      </h6>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Assignment Title
                          </label>
                          <input
                            type="text"
                            value={draft.title}
                            onChange={(e) =>
                              onAssignmentDraftChange(draftKey, "title", e.target.value)
                            }
                            placeholder="e.g. Lead System Architect"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Weightage (1-10)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={draft.weightage}
                            onChange={(e) =>
                              onAssignmentDraftChange(draftKey, "weightage", e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Skills (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={draft.skills}
                            onChange={(e) =>
                              onAssignmentDraftChange(draftKey, "skills", e.target.value)
                            }
                            placeholder="React, AWS, Node.js"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => onCreateAssignment(employee.id, tenure.id)}
                        className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4.5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm hover:shadow transition-all"
                      >
                        <Plus size={14} />
                        <span>Add Assignment</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
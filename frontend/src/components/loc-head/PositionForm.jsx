import { Plus, Save, X } from "lucide-react";
import SectionCard from "../common/SectionCard";

export default function PositionForm({
  form,
  departments,
  disciplines,
  editingPosition,
  submitting,
  onFormChange,
  onSubmit,
  onCancelEdit,
}) {
  return (
    <div id="position-form">
      <SectionCard
        title={editingPosition ? "Edit Position" : "Create New Position"}
        subtitle={
          editingPosition
            ? `Updating Position ID: ${editingPosition.id}`
            : "Create a new position for your location."
        }
      >
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {/* Department */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Department
              </label>

              <select
                required
                value={form.department_id}
                onChange={(e) => onFormChange("department_id", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <option value="">Select Department</option>

                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Discipline */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Discipline
              </label>

              <select
                value={form.discipline_id}
                onChange={(e) => onFormChange("discipline_id", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <option value="">Select Discipline</option>

                {disciplines.map((discipline) => (
                  <option key={discipline.id} value={discipline.id}>
                    {discipline.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Level
              </label>

              <select
                required
                value={form.level}
                onChange={(e) => onFormChange("level", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <option value="">Select Level</option>

                {Array.from({ length: 8 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    Level {index + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Vacancy */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>

              <label className="flex h-[48px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4">
                <input
                  type="checkbox"
                  checked={form.is_vacant}
                  onChange={(e) => onFormChange("is_vacant", e.target.checked)}
                />

                <span className="text-sm text-slate-700">Vacant Position</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {editingPosition && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <X size={16} />
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editingPosition ? (
                <>
                  <Save size={16} />
                  Update Position
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Create Position
                </>
              )}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}

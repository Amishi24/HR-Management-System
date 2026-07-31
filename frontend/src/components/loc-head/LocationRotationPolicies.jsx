import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import SectionCard from "../common/SectionCard";

const LEVEL_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

function ToggleLevelGroup({
  title,
  selectedLevels,
  disabledLevels,
  isEditing,
  submitting,
  onChange,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-slate-700">{title}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {LEVEL_OPTIONS.map((level) => {
          const checked = selectedLevels.includes(level);
          const disabled =
            !isEditing || submitting || disabledLevels.includes(level);

          return (
            <label
              key={level}
              className={`flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm ${
                disabled
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : "text-slate-600"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(level)}
              />
              <span>Level {level}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function LocationRotationPolicies({
  hasLocalPolicy,
  policyForm,
  onPolicyFormChange,
  onSavePolicy,
  onDeletePolicy,
  onEditPolicy,
  onCancelEdit,
  onResetToGlobal,
  isEditing,
  submitting,
}) {
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', text: '' }

  const rulesConfig = policyForm.rules_config || {};
  const levelGating = rulesConfig.level_gating || {
    lateral_only: [],
    promotions_allowed: [],
  };
  const tenureRules = rulesConfig.tenure_rules || {
    max_tenure_years: 10,
    min_tenure_years: 3,
  };

  function handleLevelToggle(section, level) {
    setStatus(null);
    const currentValues = [...(levelGating[section] || [])];
    const nextValues = currentValues.includes(level)
      ? currentValues.filter((item) => item !== level)
      : [...currentValues, level].sort((a, b) => a - b);

    onPolicyFormChange("level_gating", section, nextValues);
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setStatus(null);
    const success = await onSavePolicy(e);
    if (success) {
      setStatus({ type: "success", text: "Policy saved successfully." });
    } else {
      setStatus({ type: "error", text: "Could not save changes." });
    }
  };

  const handleDelete = async () => {
    setStatus(null);
    const success = await onDeletePolicy();
    if (success) {
      setStatus({ type: "success", text: "Policy deleted successfully." });
    } else {
      setStatus({ type: "error", text: "Could not delete policy." });
    }
  };

  const handleReset = async () => {
    setStatus(null);
    const success = await onResetToGlobal();
    if (success) {
      setStatus({ type: "success", text: "Policy reset to global settings." });
    } else {
      setStatus({ type: "error", text: "Could not reset policy." });
    }
  };

  const handleEdit = () => {
    setStatus(null);
    onEditPolicy();
  };

  const handleCancel = async () => {
    setStatus(null);
    await onCancelEdit();
  };

  return (
    <SectionCard
      title="Rotation Policies"
      subtitle="Set simple rules for lateral moves and promotions for this location."
    >
      {status && (
        <div
          className={`mb-4 rounded-2xl border p-4 text-sm font-medium ${
            status.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {status.text}
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="mb-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
      >
        <div className="space-y-3">
          <ToggleLevelGroup
            title="Lateral-only levels"
            selectedLevels={levelGating.lateral_only || []}
            disabledLevels={levelGating.promotions_allowed || []}
            isEditing={isEditing}
            submitting={submitting}
            onChange={(level) => handleLevelToggle("lateral_only", level)}
          />

          <ToggleLevelGroup
            title="Promotions allowed"
            selectedLevels={levelGating.promotions_allowed || []}
            disabledLevels={levelGating.lateral_only || []}
            isEditing={isEditing}
            submitting={submitting}
            onChange={(level) => handleLevelToggle("promotions_allowed", level)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <span className="mb-2 block font-semibold">
              Minimum tenure years
            </span>
            <input
              type="number"
              min="0"
              value={tenureRules.min_tenure_years ?? 3}
              disabled={!isEditing || submitting}
              onChange={(e) => {
                setStatus(null);
                onPolicyFormChange(
                  "tenure_rules",
                  "min_tenure_years",
                  Number(e.target.value),
                );
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <span className="mb-2 block font-semibold">
              Maximum tenure years
            </span>
            <input
              type="number"
              min="0"
              value={tenureRules.max_tenure_years ?? 10}
              disabled={!isEditing || submitting}
              onChange={(e) => {
                setStatus(null);
                onPolicyFormChange(
                  "tenure_rules",
                  "max_tenure_years",
                  Number(e.target.value),
                );
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          {isEditing ? (
            <>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save policy
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw size={16} />
                Reset to global
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleEdit}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Edit policy
            </button>
          )}
          {hasLocalPolicy && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={16} />
              Delete local policy
            </button>
          )}
        </div>
      </form>
    </SectionCard>
  );
}

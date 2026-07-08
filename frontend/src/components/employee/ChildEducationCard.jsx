import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import SectionCard from "../common/SectionCard";

import {
  getChildEducation,
  addEducation,
  updateEducation,
  deleteEducation,
} from "../../api/employeeApi";

export default function ChildEducationCard({ dependents = [] }) {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 1 }, (_, i) => {
    const start = currentYear + i;
    const end = String(start + 1).slice(-2);
    return `${start}-${end}`;
  });

  // Track records queued for backend deletion
  const [pendingDeletes, setPendingDeletes] = useState([]);

  const fetchChildren = useCallback(async () => {
    try {
      setLoading(true);
      const childDependents = dependents.filter(
        (d) => d.relationship === "Child",
      );

      const responses = await Promise.all(
        childDependents.map((child) => getChildEducation(child.id)),
      );

      const education = [];
      responses.forEach((res) => {
        if (res.data && res.data.length > 0) {
          education.push(res.data[0]);
        }
      });

      setChildren(education);
      setPendingDeletes([]); // Clear deletions on a fresh fetch
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dependents]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  // Instantly initializes an item locally without triggering a network call
  function handleLocalCreate(childId) {
    const localNewRecord = {
      dependent_id: childId,
      curr_class: 1,
      academic_year: "",
      has_education: false, // Marker to indicate this needs addEducation instead of updateEducation
    };
    setChildren((prev) => [...prev, localNewRecord]);
  }

  // Removes the record locally and flags existing database entries for a bulk backend delete
  function handleLocalRemove(childId, hasEducation) {
    if (hasEducation) {
      setPendingDeletes((prev) => [...prev, childId]);
    }
    setChildren((prev) => prev.filter((c) => c.dependent_id !== childId));
  }

  function handleChange(childId, field, value) {
    setChildren((prev) => {
      const index = prev.findIndex((c) => c.dependent_id === childId);
      if (index === -1) return prev;

      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  }

  // Process all additions, updates, and removals in one master click
  async function handleMasterSave() {
    setIsSaving(true);
    setSaveMessage("");
    try {
      // 1. Process Deletions
      for (const childId of pendingDeletes) {
        await deleteEducation(childId);
      }

      // 2. Process Upserts (Additions & Updates)
      for (const edu of children) {
        const payload = {
          curr_class: edu.curr_class,
          academic_year: edu.academic_year,
        };

        if (edu.has_education === false) {
          await addEducation(edu.dependent_id, payload);
        } else {
          await updateEducation(edu.dependent_id, payload);
        }
      }

      await fetchChildren();
      setSaveMessage("Changes saved successfully!");
      setTimeout(() => setSaveMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setSaveMessage("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <SectionCard
        title="Child Education"
        subtitle="Education details of children."
      >
        <p className="text-slate-500">Loading...</p>
      </SectionCard>
    );
  }

  const childDependents = dependents.filter((d) => d.relationship === "Child");

  return (
    <SectionCard
      title="Child Education"
      subtitle="Education details used while evaluating transfer requests."
    >
      {childDependents.length === 0 ? (
        <p className="text-slate-500">No child dependents found.</p>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            {childDependents.map((child) => {
              const edu = children.find((e) => e.dependent_id === child.id);

              return (
                <div
                  key={child.id}
                  className="border border-slate-200 rounded-2xl p-5"
                >
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Child
                      </label>
                      <input
                        readOnly
                        value={child.full_name}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Class
                      </label>
                      <select
                        value={edu?.curr_class ?? ""}
                        disabled={!edu}
                        onChange={(e) =>
                          handleChange(
                            child.id,
                            "curr_class",
                            e.target.value === "" ? "" : Number(e.target.value),
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 disabled:opacity-50"
                      >
                        <option value="">Select Class</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Academic Year
                      </label>
                      <select
                        value={edu?.academic_year ?? ""}
                        disabled={!edu}
                        onChange={(e) =>
                          handleChange(
                            child.id,
                            "academic_year",
                            e.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 disabled:opacity-50"
                      >
                        <option value="">Select Academic Year</option>

                        {academicYears.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end mt-5">
                    {!edu ? (
                      <button
                        onClick={() => handleLocalCreate(child.id)}
                        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Plus size={16} />
                        Add Education
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handleLocalRemove(child.id, edu.has_education)
                        }
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Integrated Save Action Section */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
            {saveMessage && (
              <span
                className={`text-sm font-medium ${saveMessage.includes("Failed") ? "text-red-500" : "text-emerald-600"}`}
              >
                {saveMessage}
              </span>
            )}
            <button
              onClick={handleMasterSave}
              disabled={isSaving || loading}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-black disabled:bg-slate-300 transition-all"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

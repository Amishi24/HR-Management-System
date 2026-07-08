import { useEffect, useMemo, useState } from "react";

import {
  createLocHeadPosition,
  deleteLocHeadPosition,
  getLocHeadDepartments,
  getLocHeadDisciplines,
  getLocHeadPositions,
  updateLocHeadPosition,
} from "../../api/roleApi";
import LocationPositions from "./LocationPositions";

export default function ManagePositions() {
  const emptyPositionForm = {
    department_id: "",
    discipline_id: "",
    level: "",
    is_vacant: true,
  };

  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [editingPosition, setEditingPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyPositionForm);
  const [filters, setFilters] = useState({
    department: "",
    discipline: "",
    level: "",
    status: "",
    rowsPerPage: 10,
  });

  useEffect(() => {
    void refreshDashboard();
  }, []);

  async function refreshDashboard() {
    setLoading(true);
    setError("");

    try {
      const [positionsRes, departmentsRes, disciplinesRes] =
        await Promise.all([
          getLocHeadPositions(),
          getLocHeadDepartments(),
          getLocHeadDisciplines(),
        ]);

      setPositions(positionsRes.data || []);
      setDepartments(departmentsRes.data || []);
      setDisciplines(disciplinesRes.data || []);

      if (editingPosition) {
        setEditingPosition(null);
        setForm(emptyPositionForm);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load positions right now.");
    } finally {
      setLoading(false);
    }
  }

  const filteredPositions = useMemo(() => {
    return positions.filter((position) => {
      if (
        filters.department &&
        position.department_name !== filters.department
      ) {
        return false;
      }

      if (
        filters.discipline &&
        position.discipline_name !== filters.discipline
      ) {
        return false;
      }

      if (filters.level && Number(position.level) !== Number(filters.level)) {
        return false;
      }

      if (filters.status === "vacant" && !position.is_vacant) {
        return false;
      }

      if (filters.status === "filled" && position.is_vacant) {
        return false;
      }

      return true;
    });
  }, [positions, filters]);

  async function handleSavePosition(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        department_id: Number(form.department_id),
        discipline_id: form.discipline_id ? Number(form.discipline_id) : null,
        level: Number(form.level),
        is_vacant: form.is_vacant,
      };

      if (editingPosition) {
        await updateLocHeadPosition(editingPosition.id, payload);
      } else {
        await createLocHeadPosition(payload);
      }

      setEditingPosition(null);
      setForm(emptyPositionForm);
      await refreshDashboard();
    } catch (err) {
      console.error(err);
      setError(
        editingPosition
          ? "The position could not be updated."
          : "The position could not be created.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditPosition(position) {
    setEditingPosition(position);

    const department = departments.find(
      (dept) => dept.name === position.department_name,
    );

    const discipline = disciplines.find(
      (disc) => disc.name === position.discipline_name,
    );

    setForm({
      department_id: department?.id || "",
      discipline_id: discipline?.id || "",
      level: position.level,
      is_vacant: position.is_vacant,
    });

    document.getElementById("position-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function handleCancelEdit() {
    setEditingPosition(null);
    setForm(emptyPositionForm);
  }

  async function handleDeletePosition(positionId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this position?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteLocHeadPosition(positionId);

      if (editingPosition?.id === positionId) {
        setEditingPosition(null);
        setForm(emptyPositionForm);
      }

      await refreshDashboard();
    } catch (err) {
      console.error(err);
      setError("The position could not be deleted.");
    }
  }

  function handleFilterChange(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  const handleFormChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
          Loading positions…
        </div>
      ) : (
        <div className="space-y-6">
          <LocationPositions
            positions={filteredPositions}
            departments={departments}
            disciplines={disciplines}
            filters={filters}
            form={form}
            editingPosition={editingPosition}
            submitting={submitting}
            onFilterChange={handleFilterChange}
            onFormChange={handleFormChange}
            onSavePosition={handleSavePosition}
            onCancelEdit={handleCancelEdit}
            onEditPosition={handleEditPosition}
            onDeletePosition={handleDeletePosition}
          />
        </div>
      )}
    </div>
  );
}

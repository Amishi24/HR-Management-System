import DataTable from "../common/DataTable";
import TableFilters from "../common/TableFilters";
import PositionForm from "./PositionForm";

export default function LocationPositions({
  positions,
  departments,
  disciplines,

  filters,

  form,

  editingPosition,

  submitting,

  onFilterChange,

  onFormChange,

  onSavePosition,

  onCancelEdit,

  onEditPosition,

  onDeletePosition,
}) {
  const columns = [
    {
      key: "id",
      label: "Position ID",
      sortable: true,
    },
    {
      key: "department_name",
      label: "Department",
      sortable: true,
    },
    {
      key: "discipline_name",
      label: "Discipline",
      sortable: true,
      render: (row) => row.discipline_name || "-",
    },
    {
      key: "level",
      label: "Level",
      sortable: true,
      render: (row) => row.level,
    },
    {
      key: "is_vacant",
      label: "Status",
      sortable: true,
      render: (row) => (
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            row.is_vacant
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-200 text-slate-700"
          }`}
        >
          {row.is_vacant ? "Vacant" : "Filled"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <TableFilters
        filters={filters}
        departments={departments}
        disciplines={disciplines}
        onFilterChange={onFilterChange}
      />

      <DataTable
        columns={columns}
        data={positions}
        rowsPerPage={filters.rowsPerPage}
        onRowsPerPageChange={(rows) => onFilterChange("rowsPerPage", rows)}
        onEdit={onEditPosition}
        onDelete={onDeletePosition}
      />

      <PositionForm
        form={form}
        departments={departments}
        disciplines={disciplines}
        editingPosition={editingPosition}
        submitting={submitting}
        onFormChange={onFormChange}
        onSubmit={onSavePosition}
        onCancelEdit={onCancelEdit}
      />
    </div>
  );
}

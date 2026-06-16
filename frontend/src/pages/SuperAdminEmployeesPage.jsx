import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { mockEmployees } from '../data/mockDb'
import '../styles/dashboard.css'

const emptyEmployee = {
  name: '',
  location: '',
  department: '',
  discipline: '',
  position_level: 1,
  is_active: true,
}

export default function SuperAdminEmployeesPage() {
  const [employees, setEmployees] = useState(mockEmployees)
  const [form, setForm] = useState(emptyEmployee)
  const [editingId, setEditingId] = useState(null)

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const resetForm = () => {
    setForm(emptyEmployee)
    setEditingId(null)
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (editingId) {
      setEmployees((current) =>
        current.map((employee) =>
          employee.id === editingId
            ? { ...employee, ...form, position_level: Number(form.position_level) }
            : employee
        )
      )
    } else {
      setEmployees((current) => [
        ...current,
        {
          ...form,
          id: Date.now(),
          position_level: Number(form.position_level),
          DoB: '',
          DoRetirement: '',
          is_critical: false,
          dependents: [],
          medical: [],
        },
      ])
    }

    resetForm()
  }

  const editEmployee = (employee) => {
    setEditingId(employee.id)
    setForm({
      name: employee.name,
      location: employee.location,
      department: employee.department,
      discipline: employee.discipline,
      position_level: employee.position_level,
      is_active: employee.is_active,
    })
  }

  const deleteEmployee = (employeeId) => {
    setEmployees((current) => current.filter((employee) => employee.id !== employeeId))
    if (editingId === employeeId) resetForm()
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Manage Employees</h1>
        <p className="muted">Add, update, deactivate or remove employee records.</p>
      </header>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>
            Name
            <input value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
          </label>
          <label>
            Location
            <input value={form.location} onChange={(e) => updateField('location', e.target.value)} required />
          </label>
          <label>
            Department
            <input value={form.department} onChange={(e) => updateField('department', e.target.value)} required />
          </label>
        </div>

        <div className="form-row">
          <label>
            Discipline
            <input value={form.discipline} onChange={(e) => updateField('discipline', e.target.value)} required />
          </label>
          <label>
            Position Level
            <input
              min="1"
              max="5"
              type="number"
              value={form.position_level}
              onChange={(e) => updateField('position_level', e.target.value)}
              required
            />
          </label>
          <label>
            Status
            <select
              value={form.is_active ? 'active' : 'inactive'}
              onChange={(e) => updateField('is_active', e.target.value === 'active')}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>

        <div className="admin-actions">
          <button className="primary-action" type="submit">
            <Plus size={16} />
            {editingId ? 'Update Employee' : 'Add Employee'}
          </button>
          {editingId && (
            <button className="secondary-action" type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="table-wrap">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Department</th>
              <th>Level</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className={employee.is_active ? '' : 'row-inactive'}>
                <td>
                  <div className="employee-name">{employee.name}</div>
                  <div className="employee-sub">{employee.discipline}</div>
                </td>
                <td>{employee.location}</td>
                <td>{employee.department}</td>
                <td>E{employee.position_level}</td>
                <td>{employee.is_active ? <span className="badge-active">Active</span> : <span className="badge-inactive">Inactive</span>}</td>
                <td>
                  <div className="table-actions">
                    <button type="button" onClick={() => editEmployee(employee)} aria-label={`Edit ${employee.name}`}>
                      <Pencil size={16} />
                    </button>
                    <button type="button" onClick={() => deleteEmployee(employee.id)} aria-label={`Delete ${employee.name}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

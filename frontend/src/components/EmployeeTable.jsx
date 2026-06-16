import { useMemo, useState } from 'react'
import { useEmployees } from '../hooks/useEmployees'
import '../styles/dashboard.css'

function formatDate(d) {
  try {
    const dt = new Date(d)
    return dt.toLocaleDateString()
  } catch {
    return d
  }
}

export default function EmployeeTable() {
  const { employees } = useEmployees()
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [filters, setFilters] = useState({ name: '', location: '', department: '', active: 'all' })

  const visible = useMemo(() => {
    let list = employees.slice()
    // filtering
    list = list.filter((e) => {
      const nameMatch = e.name.toLowerCase().includes(filters.name.toLowerCase())
      const locMatch = e.location.toLowerCase().includes(filters.location.toLowerCase())
      const depMatch = e.department.toLowerCase().includes(filters.department.toLowerCase())
      const activeMatch =
        filters.active === 'all' ? true : filters.active === 'active' ? e.is_active === true : e.is_active === false
      return nameMatch && locMatch && depMatch && activeMatch
    })

    // sorting
    list.sort((a, b) => {
      const aVal = (a[sortKey] || '').toString().toLowerCase()
      const bVal = (b[sortKey] || '').toString().toLowerCase()
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return list
  }, [employees, sortKey, sortDir, filters])

  const toggleSort = (key) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className="table-wrap">
      <table className="employee-table">
        <thead>
          <tr>
            <th>
              <div className="col-head" onClick={() => toggleSort('name')}>
                Name <span className="sort-indicator">{sortKey === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
              </div>
              <input
                className="col-filter"
                placeholder="Filter name"
                value={filters.name}
                onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
              />
            </th>

            <th>
              <div className="col-head" onClick={() => toggleSort('location')}>
                Location <span className="sort-indicator">{sortKey === 'location' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
              </div>
              <input
                className="col-filter"
                placeholder="Filter location"
                value={filters.location}
                onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
              />
            </th>

            <th>
              <div className="col-head" onClick={() => toggleSort('department')}>
                Department <span className="sort-indicator">{sortKey === 'department' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
              </div>
              <input
                className="col-filter"
                placeholder="Filter department"
                value={filters.department}
                onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
              />
            </th>

            <th>
              <div className="col-head" onClick={() => toggleSort('DoRetirement')}>
                Retirement Date <span className="sort-indicator">{sortKey === 'DoRetirement' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
              </div>
            </th>

            <th>
              <div className="col-head">
                Active
              </div>
              <select
                className="col-filter"
                value={filters.active}
                onChange={(e) => setFilters((f) => ({ ...f, active: e.target.value }))}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </th>
          </tr>
        </thead>
        <tbody>
          {visible.map((e) => (
            <tr key={e.id} className={e.is_active ? '' : 'row-inactive'}>
              <td>
                <div className="employee-name">{e.name}</div>
                <div className="employee-sub">Level {e.position_level} • {e.discipline}</div>
              </td>
              <td>{e.location}</td>
              <td>{e.department}</td>
              <td>{formatDate(e.DoRetirement)}</td>
              <td>{e.is_active ? <span className="badge-active">Active</span> : <span className="badge-inactive">Inactive</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { Settings, Users } from 'lucide-react'
import { mockEmployees, mockTransferRules } from '../data/mockDb'
import '../styles/dashboard.css'

export default function SuperAdminDashboard() {
  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Super Admin Dashboard</h1>
        <p className="muted">Manage employee records and transfer policy settings.</p>
      </header>

      <section className="metric-grid">
        <div className="metric-card">
          <p>Employees</p>
          <strong>{mockEmployees.length}</strong>
        </div>
        <div className="metric-card">
          <p>Min Stay</p>
          <strong>{mockTransferRules.minStayYears} Years</strong>
        </div>
        <div className="metric-card">
          <p>Max Stay</p>
          <strong>{mockTransferRules.maxStayYears} Years</strong>
        </div>
      </section>

      <section className="admin-option-grid">
        <Link className="admin-option-card" to="/super/employees">
          <Users size={28} />
          <div>
            <h2>Manage Employees</h2>
            <p>Perform basic create, edit, delete and status updates.</p>
          </div>
        </Link>
        <Link className="admin-option-card" to="/super/rules">
          <Settings size={28} />
          <div>
            <h2>Configure Transfer Rules</h2>
            <p>Set stay duration limits and level replacement rules.</p>
          </div>
        </Link>
      </section>
    </div>
  )
}

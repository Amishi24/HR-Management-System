import EmployeeTable from '../components/EmployeeTable'
import '../styles/dashboard.css'
import { mockEmployees, mockTransfers } from '../data/mockDb'

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
        <div>
            <h2 className="page-title">System Overview</h2>
            <div className="metric-grid">
                <div className="metric-card">
                    <p>Active Employees</p>
                    <strong>{mockEmployees.length}</strong>
                </div>
                <div className="metric-card">
                    <p>Pending Transfers</p>
                    <strong>{mockTransfers.length}</strong>
                </div>
                <div className="metric-card">
                    <p>Medical Requests</p>
                    <strong>1</strong>
                </div>
            </div>
        </div>
        
      <main>
        <EmployeeTable />
      </main>
    </div>
  )
}

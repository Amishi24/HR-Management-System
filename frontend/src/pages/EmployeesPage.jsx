import EmployeeTable from '../components/EmployeeTable'
import '../styles/dashboard.css'

export default function EmployeesPage() {
  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Employee Directory</h1>
        <p className="muted">Browse all employees with filters and sorting.</p>
      </header>

      <main>
        <EmployeeTable />
      </main>
    </div>
  )
}

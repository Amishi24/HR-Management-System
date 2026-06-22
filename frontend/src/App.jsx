import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import EmployeesPage from './pages/EmployeesPage'
import TransfersPage from './pages/TransfersPage'
import MedicalPage from './pages/MedicalPage'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import SuperAdminEmployeesPage from './pages/SuperAdminEmployeesPage'
import SuperAdminRulesPage from './pages/SuperAdminRulesPage'
import EmployeeDashboardPage from './pages/EmployeeDashboardPage'
import EmployeeProfilePage from './pages/EmployeeProfilePage'
import EmployeeCareNotesPage from './pages/EmployeeCareNotesPage'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [role, setRole] = useState('hr-admin')

  const handleLogin = (selectedRole) => {
    setRole(selectedRole || 'hr-admin')
    setLoggedIn(true)
    window.history.replaceState(null, '', '/')
  }

  const handleLogout = () => {
    setLoggedIn(false)
    setRole('hr-admin')
    window.history.replaceState(null, '', '/')
  }

  if (!loggedIn) return <LoginPage onLogin={handleLogin} />

  const isSuperAdmin = role === 'super-admin'
  const isEmployee = role === 'employee'

  return (
    <Router>
      <div className="app-shell">
        <Sidebar role={role} onLogout={handleLogout} />
        <main className="app-main">
          {isEmployee ? (
            <Routes>
              <Route path="/" element={<EmployeeDashboardPage />} />
              <Route path="/profile" element={<EmployeeProfilePage />} />
              <Route path="/care-notes" element={<EmployeeCareNotesPage />} />
              <Route path="*" element={<EmployeeDashboardPage />} />
            </Routes>
          ) : isSuperAdmin ? (
            <Routes>
              <Route path="/" element={<SuperAdminDashboard />} />
              <Route path="/super/employees" element={<SuperAdminEmployeesPage />} />
              <Route path="/super/rules" element={<SuperAdminRulesPage />} />
              <Route path="*" element={<SuperAdminDashboard />} />
            </Routes>
          ) : (
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/transfers" element={<TransfersPage />} />
              <Route path="/medical" element={<MedicalPage />} />
              <Route path="*" element={<DashboardPage />} />
            </Routes>
          )}
        </main>
      </div>
    </Router>
  )
}

import { Link, useLocation } from 'react-router-dom'
import { ArrowLeftRight, HeartPulse, LayoutDashboard, LogOut, Settings, UserRound, Users } from 'lucide-react'

export default function Sidebar({ role = 'hr-admin', onLogout }) {
  const location = useLocation()

  const isEmployee = role === 'employee'
  const isSuperAdmin = role === 'super-admin'
  const navItems = isEmployee
    ? [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
        { name: 'Profile', path: '/profile', icon: <UserRound size={20} /> },
        { name: 'Care Notes', path: '/care-notes', icon: <HeartPulse size={20} /> },
      ]
    : isSuperAdmin
      ? [
          { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
          { name: 'Manage Employees', path: '/super/employees', icon: <Users size={20} /> },
          { name: 'Configure Rules', path: '/super/rules', icon: <Settings size={20} /> },
        ]
      : [
          { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
          { name: 'Directory', path: '/employees', icon: <Users size={20} /> },
          { name: 'Transfer Board', path: '/transfers', icon: <ArrowLeftRight size={20} /> },
          { name: 'Medical Approvals', path: '/medical', icon: <HeartPulse size={20} /> },
        ]

  return (
    <div className="app-sidebar">
      <div className="sidebar-brand">
        <h1>
          {isEmployee ? 'EMPLOYEE' : isSuperAdmin ? 'SUPER ADMIN' : 'HR ADMIN'}
        </h1>
        <p>
          {isEmployee
            ? 'Personal profile and care information'
            : isSuperAdmin
              ? 'Policy and employee control'
              : 'Manpower Rotation Engine'}
        </p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={onLogout}
        className="sidebar-link sidebar-logout"
      >
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </div>
  )
}

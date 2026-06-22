import { CalendarDays, ClipboardList, MapPin, ShieldCheck, TimerReset } from 'lucide-react'
import { loadEmployeeCareNotes, loadEmployeeProfile } from '../services/employeeStorage'
import '../styles/dashboard.css'

function yearsBetween(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = end.getTime() - start.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)))
}

function formatDate(dateValue) {
  return new Date(dateValue).toLocaleDateString()
}

export default function EmployeeDashboardPage() {
  const profile = loadEmployeeProfile()
  const notes = loadEmployeeCareNotes()
  const today = new Date()
  const yearsServed = yearsBetween(profile.joiningDate, today)
  const yearsToRetirement = yearsBetween(today, profile.doRetirement)
  const serviceSpan = Math.max(1, yearsBetween(profile.joiningDate, profile.doRetirement))
  const progress = Math.min(100, Math.round((yearsServed / serviceSpan) * 100))

  return (
    <div className="dashboard-page employee-dashboard">
      <header className="dashboard-header">
        <h1>Employee Dashboard</h1>
        <p className="muted">A minimal snapshot of your service, current assignment, and care notes.</p>
      </header>

      <section className="metric-grid employee-metric-grid">
        <div className="metric-card">
          <p>Years of Service</p>
          <strong>{yearsServed}</strong>
        </div>
        <div className="metric-card">
          <p>Years to Retirement</p>
          <strong>{yearsToRetirement}</strong>
        </div>
        <div className="metric-card">
          <p>Open Care Notes</p>
          <strong>{notes.filter((note) => note.status !== 'Closed').length}</strong>
        </div>
      </section>

      <section className="employee-panel">
        <div className="employee-panel-head">
          <h2>Tenure</h2>
          <span className="muted">{formatDate(profile.joiningDate)} to {formatDate(profile.doRetirement)}</span>
        </div>
        <div className="tenure-bar" aria-hidden="true">
          <div className="tenure-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="tenure-labels">
          <span>
            <TimerReset size={14} /> {yearsServed} years served
          </span>
          <span>
            <ShieldCheck size={14} /> {progress}% of service window
          </span>
        </div>
      </section>

      <section className="employee-dual-grid">
        <div className="employee-panel">
          <div className="employee-panel-head">
            <h2>Current Assignment</h2>
            <MapPin size={16} />
          </div>
          <div className="assignment-stack">
            <div className="assignment-pill">
              <span>Location</span>
              <strong>{profile.currentPosition.location}</strong>
            </div>
            <div className="assignment-pill">
              <span>Department</span>
              <strong>{profile.currentPosition.department}</strong>
            </div>
            <div className="assignment-pill">
              <span>Section</span>
              <strong>{profile.currentPosition.section}</strong>
            </div>
          </div>
        </div>

        <div className="employee-panel">
          <div className="employee-panel-head">
            <h2>Assignments</h2>
            <ClipboardList size={16} />
          </div>
          <div className="assignment-list">
            {profile.assignments.map((assignment) => (
              <div key={assignment.id} className="assignment-row">
                <div>
                  <strong>{assignment.title}</strong>
                  <p>{assignment.detail}</p>
                </div>
                <span className={`status-chip ${assignment.status === 'Active' ? 'status-active' : 'status-muted'}`}>
                  {assignment.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="employee-panel">
        <div className="employee-panel-head">
          <h2>Timeline</h2>
          <CalendarDays size={16} />
        </div>
        <div className="timeline">
          <div className="timeline-item">
            <strong>Joined</strong>
            <span>{formatDate(profile.joiningDate)}</span>
          </div>
          <div className="timeline-item">
            <strong>Current Level</strong>
            <span>{profile.level}</span>
          </div>
          <div className="timeline-item">
            <strong>Retirement</strong>
            <span>{formatDate(profile.doRetirement)}</span>
          </div>
        </div>
      </section>
    </div>
  )
}

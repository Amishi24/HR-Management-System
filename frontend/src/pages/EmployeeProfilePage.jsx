import { useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import { employeeLevels } from '../data/mockDb'
import { loadEmployeeProfile, saveEmployeeProfile } from '../services/employeeStorage'
import '../styles/dashboard.css'

const relationshipOptions = ['Spouse', 'Child', 'Other']

function createDependent() {
  return {
    id: Date.now(),
    name: '',
    relationship: 'Spouse',
    occupation: '',
  }
}

function createChildEducation() {
  return {
    id: Date.now(),
    childName: '',
    schoolName: '',
    currentClass: '',
  }
}

export default function EmployeeProfilePage() {
  const [profile, setProfile] = useState(loadEmployeeProfile)
  const [saved, setSaved] = useState(false)

  const updateField = (field, value) => {
    setSaved(false)
    setProfile((current) => ({ ...current, [field]: value }))
  }

  const updatePositionField = (field, value) => {
    setSaved(false)
    setProfile((current) => ({
      ...current,
      currentPosition: {
        ...current.currentPosition,
        [field]: value,
      },
    }))
  }

  const updateDependent = (id, field, value) => {
    setSaved(false)
    setProfile((current) => ({
      ...current,
      dependents: current.dependents.map((dependent) =>
        dependent.id === id ? { ...dependent, [field]: value } : dependent
      ),
    }))
  }

  const addDependent = () => {
    setSaved(false)
    setProfile((current) => ({
      ...current,
      dependents: [...current.dependents, createDependent()],
    }))
  }

  const removeDependent = (id) => {
    setSaved(false)
    setProfile((current) => ({
      ...current,
      dependents: current.dependents.filter((dependent) => dependent.id !== id),
    }))
  }

  const updateChildEducation = (id, field, value) => {
    setSaved(false)
    setProfile((current) => ({
      ...current,
      childrenEducation: current.childrenEducation.map((child) =>
        child.id === id ? { ...child, [field]: value } : child
      ),
    }))
  }

  const addChildEducation = () => {
    setSaved(false)
    setProfile((current) => ({
      ...current,
      childrenEducation: [...current.childrenEducation, createChildEducation()],
    }))
  }

  const removeChildEducation = (id) => {
    setSaved(false)
    setProfile((current) => ({
      ...current,
      childrenEducation: current.childrenEducation.filter((child) => child.id !== id),
    }))
  }

  const handleSave = (event) => {
    event.preventDefault()
    saveEmployeeProfile(profile)
    setSaved(true)
  }

  return (
    <div className="dashboard-page employee-profile-page">
      <header className="dashboard-header">
        <h1>Profile</h1>
        <p className="muted">Edit the details that travel with you when transfer decisions are made.</p>
      </header>

      <form className="admin-form" onSubmit={handleSave}>
        <section className="profile-section">
          <div className="section-title">
            <h2>Identity</h2>
            <p>Basic employee details and service level.</p>
          </div>
          <div className="form-row">
            <label>
              Employee ID
              <input value={profile.employeeId} onChange={(e) => updateField('employeeId', e.target.value)} />
            </label>
            <label>
              Name
              <input value={profile.name} onChange={(e) => updateField('name', e.target.value)} />
            </label>
            <label>
              DOB
              <input type="date" value={profile.dob} onChange={(e) => updateField('dob', e.target.value)} />
            </label>
          </div>
          <div className="form-row">
            <label>
              Do Retirement
              <input type="date" value={profile.doRetirement} disabled />
            </label>
            <label>
              Discipline
              <input value={profile.discipline} onChange={(e) => updateField('discipline', e.target.value)} />
            </label>
            <label>
              Level
              <select value={profile.level} onChange={(e) => updateField('level', e.target.value)}>
                {employeeLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              Domicile State
              <input value={profile.domicileState} onChange={(e) => updateField('domicileState', e.target.value)} />
            </label>
            <label>
              Joining Date
              <input type="date" value={profile.joiningDate} onChange={(e) => updateField('joiningDate', e.target.value)} />
            </label>
          </div>
        </section>

        <section className="profile-section">
          <div className="section-title">
            <h2>Current Position</h2>
            <p>Where you are placed right now.</p>
          </div>
          <div className="form-row">
            <label>
              Location
              <input
                value={profile.currentPosition.location}
                onChange={(e) => updatePositionField('location', e.target.value)}
              />
            </label>
            <label>
              Department
              <input
                value={profile.currentPosition.department}
                onChange={(e) => updatePositionField('department', e.target.value)}
              />
            </label>
            <label>
              Section
              <input
                value={profile.currentPosition.section}
                onChange={(e) => updatePositionField('section', e.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="profile-section">
          <div className="section-title section-title-row">
            <div>
              <h2>Dependents</h2>
              <p>Spouse and other dependents that should be considered during transfer planning.</p>
            </div>
            <button type="button" className="secondary-action" onClick={addDependent}>
              <Plus size={16} />
              Add Dependent
            </button>
          </div>

          <div className="repeat-stack">
            {profile.dependents.map((dependent) => (
              <div className="repeat-card" key={dependent.id}>
                <div className="form-row">
                  <label>
                    Name
                    <input
                      value={dependent.name}
                      onChange={(e) => updateDependent(dependent.id, 'name', e.target.value)}
                    />
                  </label>
                  <label>
                    Relationship
                    <select
                      value={dependent.relationship}
                      onChange={(e) => updateDependent(dependent.id, 'relationship', e.target.value)}
                    >
                      {relationshipOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Occupation
                    <input
                      value={dependent.occupation}
                      onChange={(e) => updateDependent(dependent.id, 'occupation', e.target.value)}
                    />
                  </label>
                </div>
                <button type="button" className="icon-action" onClick={() => removeDependent(dependent.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="profile-section">
          <div className="section-title section-title-row">
            <div>
              <h2>Child Education</h2>
              <p>Capture education details if you want them considered in transfer planning.</p>
            </div>
            <button type="button" className="secondary-action" onClick={addChildEducation}>
              <Plus size={16} />
              Add Child
            </button>
          </div>

          <div className="repeat-stack">
            {profile.childrenEducation.map((child) => (
              <div className="repeat-card" key={child.id}>
                <div className="form-row">
                  <label>
                    Child Name
                    <input
                      value={child.childName}
                      onChange={(e) => updateChildEducation(child.id, 'childName', e.target.value)}
                    />
                  </label>
                  <label>
                    School Name
                    <input
                      value={child.schoolName}
                      onChange={(e) => updateChildEducation(child.id, 'schoolName', e.target.value)}
                    />
                  </label>
                  <label>
                    Current Class
                    <input
                      value={child.currentClass}
                      onChange={(e) => updateChildEducation(child.id, 'currentClass', e.target.value)}
                    />
                  </label>
                </div>
                <button type="button" className="icon-action" onClick={() => removeChildEducation(child.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="admin-actions">
          <button className="primary-action" type="submit">
            <Save size={16} />
            Save Profile
          </button>
          {saved && <span className="save-note">Profile saved for this employee.</span>}
        </div>
      </form>
    </div>
  )
}

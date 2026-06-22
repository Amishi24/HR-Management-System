import { useState } from 'react'
import { Plus, Save } from 'lucide-react'
import { loadEmployeeCareNotes, saveEmployeeCareNotes } from '../services/employeeStorage'
import '../styles/dashboard.css'

function createNote() {
  return {
    id: Date.now(),
    title: '',
    details: '',
    status: 'Open',
    updatedAt: new Date().toISOString().slice(0, 10),
  }
}

export default function EmployeeCareNotesPage() {
  const [notes, setNotes] = useState(loadEmployeeCareNotes)
  const [draft, setDraft] = useState(createNote)
  const [saved, setSaved] = useState(false)

  const updateDraft = (field, value) => {
    setSaved(false)
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const addNote = () => {
    if (!draft.title.trim()) return

    setSaved(false)
    setNotes((current) => [
      { ...draft, id: Date.now(), updatedAt: new Date().toISOString().slice(0, 10) },
      ...current,
    ])
    setDraft(createNote())
  }

  const updateNoteStatus = (id, status) => {
    setSaved(false)
    setNotes((current) =>
      current.map((note) => (note.id === id ? { ...note, status, updatedAt: new Date().toISOString().slice(0, 10) } : note))
    )
  }

  const saveNotes = (event) => {
    event.preventDefault()
    saveEmployeeCareNotes(notes)
    setSaved(true)
  }

  return (
    <div className="dashboard-page employee-care-page">
      <header className="dashboard-header">
        <h1>Care Notes</h1>
        <p className="muted">Short medical or family constraints that the board should keep in mind.</p>
      </header>

      <form className="admin-form" onSubmit={saveNotes}>
        <section className="profile-section">
          <div className="section-title">
            <h2>Add Note</h2>
            <p>Use one line for the concern and a short detail below.</p>
          </div>
          <div className="form-row">
            <label>
              Title
              <input
                value={draft.title}
                onChange={(e) => updateDraft('title', e.target.value)}
                placeholder="Ongoing cancer treatment at AIIMS Delhi"
              />
            </label>
            <label>
              Status
              <select value={draft.status} onChange={(e) => updateDraft('status', e.target.value)}>
                <option value="Open">Open</option>
                <option value="Under Review">Under Review</option>
                <option value="Closed">Closed</option>
              </select>
            </label>
          </div>
          <label className="stacked-field">
            Details
            <textarea
              rows="3"
              value={draft.details}
              onChange={(e) => updateDraft('details', e.target.value)}
              placeholder="Add the transfer-sensitive context here."
            />
          </label>
          <button type="button" className="secondary-action" onClick={addNote}>
            <Plus size={16} />
            Add to List
          </button>
        </section>

        <section className="profile-section">
          <div className="section-title">
            <h2>Saved Notes</h2>
            <p>These are the entries the board sees while reviewing transfers.</p>
          </div>

          <div className="note-stack">
            {notes.map((note) => (
              <div className="note-card" key={note.id}>
                <div className="note-card-head">
                  <div>
                    <strong>{note.title}</strong>
                    <p>{note.details}</p>
                  </div>
                  <span className={`status-chip ${note.status === 'Closed' ? 'status-muted' : 'status-active'}`}>
                    {note.status}
                  </span>
                </div>
                <div className="note-card-foot">
                  <label>
                    Update Status
                    <select value={note.status} onChange={(e) => updateNoteStatus(note.id, e.target.value)}>
                      <option value="Open">Open</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </label>
                  <span className="note-date">Updated {note.updatedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="admin-actions">
          <button className="primary-action" type="submit">
            <Save size={16} />
            Save Care Notes
          </button>
          {saved && <span className="save-note">Care notes saved for this employee.</span>}
        </div>
      </form>
    </div>
  )
}

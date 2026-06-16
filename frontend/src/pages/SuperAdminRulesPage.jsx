import { useState, useMemo } from 'react'
import { Save } from 'lucide-react'
import { employeeLevels, mockTransferRules, mockEmployees } from '../data/mockDb'
import '../styles/dashboard.css'

const TRANSFER_RULES_STORAGE_KEY = 'ongc-transfer-rules'

const getUniqueDepartments = () => {
  const departments = mockEmployees.map(emp => emp.department)
  return [...new Set(departments)].sort()
}

const replacementPolicyOptions = [
  { value: 'same', label: 'Same level only' },
  { value: 'same-or-lower', label: 'Same or one level lower' },
  { value: 'custom', label: 'Custom' },
]

function getLevelsForPolicy(level, policy, currentLevels = []) {
  if (policy === 'custom') return currentLevels.length ? currentLevels : [level]

  const levelIndex = employeeLevels.indexOf(level)
  if (policy === 'same-or-lower' && levelIndex > 0) {
    return [employeeLevels[levelIndex - 1], level]
  }

  return [level]
}

function normalizeRules(savedRules) {
  const savedMatrix = savedRules?.replacementMatrix || []

  return {
    ...mockTransferRules,
    ...savedRules,
    replacementMatrix: employeeLevels.map((level) => {
      const savedRule = savedMatrix.find((rule) => rule.level === level)
      if (!savedRule) {
        return {
          level,
          policy: 'same',
          canBeReplacedBy: [level],
        }
      }

      return {
        ...savedRule,
        canBeReplacedBy: savedRule.canBeReplacedBy?.length ? savedRule.canBeReplacedBy : [level],
      }
    }),
  }
}

function getStorageKey(scope, department) {
  if (scope === 'global') return TRANSFER_RULES_STORAGE_KEY
  return `${TRANSFER_RULES_STORAGE_KEY}-${department}`
}

function getInitialRules(scope, department) {
  const key = getStorageKey(scope, department)
  const savedRules = localStorage.getItem(key)
  if (!savedRules) return mockTransferRules

  try {
    return normalizeRules(JSON.parse(savedRules))
  } catch {
    return mockTransferRules
  }
}

export default function SuperAdminRulesPage() {
  const departments = useMemo(() => getUniqueDepartments(), [])
  const [scope, setScope] = useState('global')
  const [selectedDepartment, setSelectedDepartment] = useState(departments[0] || '')
  const [rules, setRules] = useState(() => getInitialRules(scope, selectedDepartment))
  const [saved, setSaved] = useState(false)

  const handleScopeChange = (newScope) => {
    setScope(newScope)
    setSaved(false)
    setRules(getInitialRules(newScope, selectedDepartment))
  }

  const handleDepartmentChange = (newDepartment) => {
    setSelectedDepartment(newDepartment)
    setSaved(false)
    setRules(getInitialRules(scope, newDepartment))
  }

  const updateStayRule = (field, value) => {
    setSaved(false)
    setRules((current) => ({ ...current, [field]: Number(value) }))
  }

  const updateReplacementPolicy = (level, policy) => {
    setSaved(false)
    setRules((current) => ({
      ...current,
      replacementMatrix: current.replacementMatrix.map((rule) =>
        rule.level === level
          ? {
              ...rule,
              policy,
              canBeReplacedBy: getLevelsForPolicy(level, policy, rule.canBeReplacedBy),
            }
          : rule
      ),
    }))
  }

  const toggleReplacementLevel = (level, replacementLevel) => {
    setSaved(false)
    setRules((current) => ({
      ...current,
      replacementMatrix: current.replacementMatrix.map((rule) => {
        if (rule.level !== level) return rule

        const exists = rule.canBeReplacedBy.includes(replacementLevel)
        const nextLevels = exists
          ? rule.canBeReplacedBy.filter((item) => item !== replacementLevel)
          : [...rule.canBeReplacedBy, replacementLevel].sort()

        return {
          ...rule,
          canBeReplacedBy: nextLevels.length ? nextLevels : [rule.level],
        }
      }),
    }))
  }

  const handleSave = (event) => {
    event.preventDefault()
    const key = getStorageKey(scope, selectedDepartment)
    localStorage.setItem(key, JSON.stringify(rules))
    setSaved(true)
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Configure Transfer Rules</h1>
        <p className="muted">
          Set stay limits and define which employee levels can replace each level.
          {scope === 'local' && ` Currently editing rules for ${selectedDepartment} department.`}
        </p>
      </header>

      <form className="admin-form" onSubmit={handleSave}>
        <section className="scope-selector">
          <h2>Rule Scope</h2>
          <div className="scope-controls">
            <label className="scope-option">
              <input
                type="radio"
                name="scope"
                value="global"
                checked={scope === 'global'}
                onChange={(e) => handleScopeChange(e.target.value)}
              />
              <span>Global (Apply to entire enterprise)</span>
            </label>
            <label className="scope-option">
              <input
                type="radio"
                name="scope"
                value="local"
                checked={scope === 'local'}
                onChange={(e) => handleScopeChange(e.target.value)}
              />
              <span>Local (Department specific)</span>
            </label>
          </div>

          {scope === 'local' && (
            <div className="department-selector">
              <label>
                Select Department
                <select
                  value={selectedDepartment}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </section>

        <div className="form-row stay-rule-row">
          <label>
            Min Stay
            <input
              min="1"
              type="number"
              value={rules.minStayYears}
              onChange={(e) => updateStayRule('minStayYears', e.target.value)}
            />
            <span className="field-hint">Years</span>
          </label>
          <label>
            Max Stay
            <input
              min={rules.minStayYears}
              type="number"
              value={rules.maxStayYears}
              onChange={(e) => updateStayRule('maxStayYears', e.target.value)}
            />
            <span className="field-hint">Years</span>
          </label>
        </div>

        <section className="rules-matrix">
          <div className="rules-matrix-header">
            <h2>Replacement Levels</h2>
            <p>Choose a simple policy for each level. Use Custom only when a level needs exception rules.</p>
          </div>

          <div className="rules-scroll">
            {rules.replacementMatrix.map((rule) => (
              <div className="matrix-row" key={rule.level}>
                <div className="matrix-level">{rule.level}</div>
                <div className="policy-control">
                  <label>
                    Replacement Policy
                    <select
                      value={rule.policy}
                      onChange={(e) => updateReplacementPolicy(rule.level, e.target.value)}
                    >
                      {replacementPolicyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="allowed-level-summary">
                    <span>Allowed:</span>
                    <strong>{rule.canBeReplacedBy.join(', ')}</strong>
                  </div>

                  {rule.policy === 'custom' && (
                    <div className="custom-level-panel">
                      <p>Choose allowed replacement levels</p>
                      <div className="level-options">
                        {employeeLevels.map((level) => {
                          const isSelected = rule.canBeReplacedBy.includes(level)

                          return (
                            <button
                              className={`level-chip ${isSelected ? 'selected' : ''}`}
                              key={level}
                              type="button"
                              onClick={() => toggleReplacementLevel(rule.level, level)}
                            >
                              {level}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="admin-actions">
          <button className="primary-action" type="submit">
            <Save size={16} />
            Save Rules
          </button>
          {saved && <span className="save-note">Rules saved in mock configuration.</span>}
        </div>
      </form>
    </div>
  )
}

import { mockEmployeeCareNotes, mockEmployeeProfile } from '../data/mockDb'

const EMPLOYEE_PROFILE_KEY = 'ongc-employee-profile'
const EMPLOYEE_CARE_NOTES_KEY = 'ongc-employee-care-notes'

function safeParse(jsonValue, fallback) {
  if (!jsonValue) return fallback

  try {
    return JSON.parse(jsonValue)
  } catch {
    return fallback
  }
}

function normalizeProfile(profile) {
  return {
    ...mockEmployeeProfile,
    ...profile,
    currentPosition: {
      ...mockEmployeeProfile.currentPosition,
      ...(profile?.currentPosition || {}),
    },
    dependents: Array.isArray(profile?.dependents) ? profile.dependents : mockEmployeeProfile.dependents,
    childrenEducation: Array.isArray(profile?.childrenEducation)
      ? profile.childrenEducation
      : mockEmployeeProfile.childrenEducation,
    assignments: Array.isArray(profile?.assignments) ? profile.assignments : mockEmployeeProfile.assignments,
  }
}

export function loadEmployeeProfile() {
  return normalizeProfile(safeParse(localStorage.getItem(EMPLOYEE_PROFILE_KEY), mockEmployeeProfile))
}

export function saveEmployeeProfile(profile) {
  localStorage.setItem(EMPLOYEE_PROFILE_KEY, JSON.stringify(normalizeProfile(profile)))
}

export function loadEmployeeCareNotes() {
  return safeParse(localStorage.getItem(EMPLOYEE_CARE_NOTES_KEY), mockEmployeeCareNotes)
}

export function saveEmployeeCareNotes(notes) {
  localStorage.setItem(EMPLOYEE_CARE_NOTES_KEY, JSON.stringify(notes))
}

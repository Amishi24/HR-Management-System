import { mockEmployees } from '../data/mockDb'

export async function fetchEmployees() {
  // In future, replace with real API call: fetch('/api/employees')
  return new Promise((resolve) => setTimeout(() => resolve(mockEmployees), 120))
}

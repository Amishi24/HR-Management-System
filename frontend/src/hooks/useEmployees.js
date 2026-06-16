import { useEffect, useState } from 'react'
import { fetchEmployees } from '../services/employeeService'

export function useEmployees() {
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    let mounted = true
    fetchEmployees().then((data) => {
      if (mounted) setEmployees(data || [])
    })
    return () => {
      mounted = false
    }
  }, [])

  return { employees }
}

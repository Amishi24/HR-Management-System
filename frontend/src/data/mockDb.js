// src/data/mockDb.js

export const mockEmployees = [
  {
    id: 1,
    name: "Aarav Sharma",
    is_active: true,
    DoB: "1985-06-15",
    DoRetirement: "2045-06-15",
    location: "Bengaluru Tech Park",
    department: "Engineering",
    discipline: "Software Development",
    position_level: 4,
    is_critical: true,
    dependents: [
      { id: 101, full_name: "Riya Sharma", relationship: "CHILD", education: { curr_class: "10th Grade" } }
    ],
    medical: [
      { id: 201, issue: "Chronic Back Pain - Requires ergonomic chair", is_approve: true }
    ]
  },
  {
    id: 2,
    name: "Priya Patel",
    is_active: true,
    DoB: "1990-11-22",
    DoRetirement: "2050-11-22",
    location: "Delhi NCR Base",
    department: "Finance",
    discipline: "Auditing",
    position_level: 2,
    is_critical: false,
    dependents: [],
    medical: []
  }
];

export const mockTransfers = [
  {
    id: 1001,
    employee_name: "Aarav Sharma",
    to_position_level: 4,
    to_location: "Pune IT Hub",
    status: "PROPOSED",
    location_preference: 1, // ⭐ Top Choice
    audit_notes: "Lateral move requested. Note: Child in 10th grade, assess school mid-year transfer impact."
  }
];
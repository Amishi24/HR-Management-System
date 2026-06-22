// src/data/mockDb.js

export const mockRoles = [
  { id: "hr-admin", label: "HR admin" },
  { id: "super-admin", label: "Super admin" },
  { id: "employee", label: "Employee" },
];

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
  },
  {
    id: 3,
    name: "Kriti ",
    is_active: false,
    DoB: "1990-11-22",
    DoRetirement: "2050-11-22",
    location: "Mumbai",
    department: "Engineering",
    discipline: "Networking",
    position_level: 2,
    is_critical: false,
    dependents: [],
    medical: []
  },
  {
    id: 4,
    name: "Tushar",
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
  },
  {
    id: 5,
    name: "Jeetu",
    is_active: false,
    DoB: "1990-11-22",
    DoRetirement: "2050-11-22",
    location: "Mumbai",
    department: "Engineering",
    discipline: "Networking",
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
  },
  {
    id: 1002,
    employee_name: "Kriti",
    to_position_level: 4,
    to_location: "Goa",
    status: "PROPOSED",
    location_preference: 1, // ⭐ Top Choice
    audit_notes: "Promotion"
  }
];

export const employeeLevels = ["E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8"];

export const mockTransferRules = {
  minStayYears: 3,
  maxStayYears: 10,
  replacementMatrix: employeeLevels.map((level) => ({
    level,
    policy: "same",
    canBeReplacedBy: [level]
  }))
};

export const mockEmployeeProfile = {
  employeeId: 'ONGC-1027',
  name: 'Aarav Sharma',
  dob: '1985-06-15',
  doRetirement: '2045-06-15',
  joiningDate: '2012-04-01',
  discipline: 'Software Development',
  level: 'E4',
  domicileState: 'Karnataka',
  currentPosition: {
    location: 'Bengaluru Tech Park',
    department: 'Engineering',
    section: 'Platform',
  },
  dependents: [
    {
      id: 1,
      name: 'Ananya Sharma',
      relationship: 'Spouse',
      occupation: 'Homemaker',
    },
  ],
  childrenEducation: [
    {
      id: 1,
      childName: 'Riya Sharma',
      schoolName: 'Delhi Public School',
      currentClass: '10th Grade',
    },
  ],
  assignments: [
    {
      id: 1,
      title: 'Platform Reliability',
      detail: 'Core system stability and release checks',
      status: 'Active',
    },
    {
      id: 2,
      title: 'Cloud Migration Support',
      detail: 'Assist migration planning for shared services',
      status: 'Planned',
    },
  ],
};

export const mockEmployeeCareNotes = [
  {
    id: 1,
    title: 'Ongoing cancer treatment at AIIMS Delhi',
    details: 'Please consider this while planning relocation or travel-heavy assignments.',
    status: 'Open',
    updatedAt: '2026-06-21',
  },
];

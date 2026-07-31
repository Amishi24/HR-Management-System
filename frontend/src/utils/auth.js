// utils/auth.js

export const login = (data) => {
    localStorage.setItem("employeeId", data.employee_id);
    localStorage.setItem("employeeName", data.employee_name);
    localStorage.setItem("role", data.role);
};

export const logout = () => {
    localStorage.clear();
};

export const getEmployeeId = () => {
    return localStorage.getItem("employeeId");
};

export const getEmployeeName = () => {
    return localStorage.getItem("employeeName");
};

export const getRole = () => {
    return localStorage.getItem("role");
};

export const isLoggedIn = () => {
    return !!localStorage.getItem("employeeId");
};
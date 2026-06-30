// api/authApi.js

import api from "./axios";

export const loginEmployee = async (employee_id, password) => {
    const response = await api.post("/auth/login", {
        employee_id,
        password
    });

    return response.data;
};
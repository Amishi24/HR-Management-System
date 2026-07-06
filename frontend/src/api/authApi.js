// api/authApi.js

import api from "./axios";

export const loginEmployee = async (employee_id) => {
    const response = await api.post("/auth/login", {
        employee_id,
    });

    return response.data;
};
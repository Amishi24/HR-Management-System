import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const employeeId = localStorage.getItem("employeeId");
    if (employeeId) {
        config.headers["employee-id"] = employeeId;
    }
    return config;
});

export default api;
// api/policyApi.js
import api from "./axios";

export const getRotationPolicies = async () => {
    const response = await api.get("/api/policy/rotation");
    return response.data;
};

export const createRotationPolicy = async (policyData) => {
    const response = await api.post("/api/policy/rotation", policyData);
    return response.data;
};

export const updateRotationPolicy = async (policyId, policyData) => {
    const response = await api.patch(`/api/policy/rotation/${policyId}`, policyData);
    return response.data;
};

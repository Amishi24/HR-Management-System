import api from "./axios";

export const getProfile = () => {
    return api.get("/me");
};

export const getDependents = () => {
    return api.get("/me/dependents");
};

export const addDependent = (data) => {
    return api.post("/me/dependents", data);
};

export const updateDependent = (id, data) => {
    return api.patch(`/me/dependents/${id}`, data);
};

export const deleteDependent = (id) => {
    return api.delete(`/me/dependents/${id}`);
};

export const getChildEducation = (dependentId) => {
    return api.get(`/me/dependents/${dependentId}/children`);
};

export const addEducation = (dependentId, data) => {
    return api.post(`/me/dependents/${dependentId}/education`, data);
};

export const updateEducation = (dependentId, data) => {
    return api.patch(`/me/dependents/${dependentId}/education`, data);
};

export const deleteEducation = (dependentId) => {
    return api.delete(`/me/dependents/${dependentId}/education`);
};

export const getMedicalHistory = () => {
    return api.get("/me/medical");
};

export const addMedical = (data) => {
    return api.post("/me/medical", data);
};

export const updateMedical = (medicalId, data) => {
    return api.patch(`/me/medical/${medicalId}`, data);
};

export const deleteMedical = (medicalId) => {
    return api.delete(`/me/medical/${medicalId}`);
};
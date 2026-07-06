import api from "./axios";

export const getDeptHeadDepartments = () => api.get("/dept-head/departments");
export const getDeptHeadTeam = (departmentId) =>
    api.get("/dept-head/team", { params: departmentId ? { department_id: departmentId } : {} });
export const getDeptHeadTeamMember = (employeeId) => api.get(`/dept-head/team/${employeeId}`);
export const getDeptHeadAlerts = () => api.get("/dept-head/transfers/alerts");
export const getDeptHeadTransfers = (departmentId) =>
    api.get("/dept-head/transfers", { params: departmentId ? { department_id: departmentId } : {} });
export const reviewDeptHeadTransfer = (transferId, payload) =>
    api.patch(`/dept-head/transfers/${transferId}/review`, payload);
export const getDeptHeadAppealContext = (transferId) =>
    api.get(`/dept-head/transfers/${transferId}/context`);
export const decideDeptHeadAppeal = (transferId, payload) =>
    api.patch(`/dept-head/transfers/${transferId}/appeal-decision`, payload);
export const getDeptHeadCapacity = () => api.get("/dept-head/capacity-dashboard");
export const createDeptHeadAssignment = (employeeId, tenureId, payload) =>
    api.post(`/dept-head/team/${employeeId}/tenures/${tenureId}/assignments`, payload);
export const deleteDeptHeadAssignment = (employeeId, assignmentId) =>
    api.delete(`/dept-head/team/${employeeId}/assignments/${assignmentId}`);

export const getLocHeadLocation = () => api.get("/loc-head/my-location");
export const updateLocHeadLocationRequirements = (payload) =>
    api.patch("/loc-head/my-location/requirements", payload);
export const getLocHeadPositions = () => api.get("/loc-head/my-location/positions");
export const createLocHeadPosition = (payload) => api.post("/loc-head/my-location/positions", payload);
export const updateLocHeadPosition = (positionId, payload) =>
    api.patch(`/loc-head/my-location/positions/${positionId}`, payload);
export const deleteLocHeadPosition = (positionId) => api.delete(`/loc-head/my-location/positions/${positionId}`);
export const getLocHeadDepartments = () => api.get("/loc-head/departments");
export const getLocHeadDisciplines = () => api.get("/loc-head/disciplines");
export const getLocHeadPolicies = () => api.get("/loc-head/my-location/rotation-policies");
export const createLocHeadPolicy = (payload) => api.post("/loc-head/my-location/rotation-policy", payload);
export const updateLocHeadPolicy = (policyId, payload) => api.patch(`/loc-head/my-location/${policyId}`, payload);
export const deleteLocHeadPolicy = (policyId) => api.delete(`/loc-head/my-location/${policyId}`);
export const getLocHeadTeam = () => api.get("/loc-head/team");
export const getLocHeadAlerts = () => api.get("/loc-head/transfers/alerts");
export const getLocHeadTransfers = () => api.get("/loc-head/transfers");
export const reviewLocHeadTransfer = (transferId, payload) =>
    api.patch(`/loc-head/transfers/${transferId}/review`, payload);
export const getLocHeadAppealContext = (transferId) => api.get(`/loc-head/transfers/${transferId}/context`);
export const decideLocHeadAppeal = (transferId, payload) =>
    api.patch(`/loc-head/transfers/${transferId}/appeal-decision`, payload);

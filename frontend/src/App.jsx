import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import EmployeeLayout from "./layouts/EmployeeLayout";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeProfilePage from "./pages/EmployeeProfilePage";
import TransferRequestsPage from "./pages/TransferRequestsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import DepartmentHeadDashboardPage from "./pages/DepartmentHeadDashboardPage";
import LocationHeadDashboardPage from "./pages/LocationHeadDashboardPage";
import RoleLandingPage from "./pages/RoleLandingPage";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}> 
                <Route path="/employee" element={<EmployeeLayout />}>
                    <Route index element={<Navigate to="/employee/dashboard" replace />} />
                    <Route path="dashboard" element={<EmployeeDashboard />} />
                    <Route path="profile" element={<EmployeeProfilePage />} />
                    <Route path="transfers" element={<TransferRequestsPage />} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["DEPT_HEAD", "LOC_HEAD", "dept_head", "loc_head"]} />}>
                <Route path="/role-landing" element={<RoleLandingPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["DEPT_HEAD", "dept_head"]} />}>
                <Route path="/dept-head" element={<EmployeeLayout />}>
                    <Route index element={<Navigate to="/dept-head/personal" replace />} />
                    <Route path="personal" element={<DepartmentHeadDashboardPage />} />
                    <Route path="manager" element={<DepartmentHeadDashboardPage />} />
                    <Route path="dashboard" element={<Navigate to="/dept-head/personal" replace />} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["LOC_HEAD", "loc_head"]} />}>
                <Route path="/loc-head" element={<EmployeeLayout />}>
                    <Route index element={<Navigate to="/loc-head/personal" replace />} />
                    <Route path="personal" element={<LocationHeadDashboardPage />} />
                    <Route path="manager" element={<LocationHeadDashboardPage />} />
                    <Route path="dashboard" element={<Navigate to="/loc-head/personal" replace />} />
                </Route>
            </Route>
        </Routes>
    );
}

export default App;
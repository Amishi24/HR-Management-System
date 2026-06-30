import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import EmployeeLayout from "./layouts/EmployeeLayout";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeProfilePage from "./pages/EmployeeProfilePage";
import TransferRequestsPage from "./pages/TransferRequestsPage";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />

            <Route path="/employee" element={<EmployeeLayout />}>
                <Route index element={<Navigate to="/employee/dashboard" replace />} />
                <Route path="dashboard" element={<EmployeeDashboard />} />
                <Route path="profile" element={<EmployeeProfilePage />} />
                <Route path="transfers" element={<TransferRequestsPage />} />
            </Route>
        </Routes>
    );
}

export default App;
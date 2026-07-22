import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import EmployeeLayout from "./layouts/EmployeeLayout";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeProfilePage from "./pages/EmployeeProfilePage";
import TransferRequestsPage from "./pages/TransferRequestsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ManagerDashboardPage from "./pages/ManagerDashboardPage";
import TransferHeadDashboardPage from "./pages/TransferHeadDashboardPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/employee" element={<EmployeeLayout />}>
          <Route
            index
            element={<Navigate to="/employee/dashboard" replace />}
          />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="profile" element={<EmployeeProfilePage />} />
          <Route path="transfers" element={<TransferRequestsPage />} />
        </Route>
      </Route>

      <Route
        element={<ProtectedRoute allowedRoles={["DEPT_HEAD", "dept_head"]} />}
      >
        <Route path="/dept-head" element={<EmployeeLayout />}>
          <Route
            index
            element={<Navigate to="/dept-head/personal" replace />}
          />
          <Route path="personal" element={<EmployeeDashboard />} />
          <Route path="personal/profile" element={<EmployeeProfilePage />} />
          <Route path="personal/transfers" element={<TransferRequestsPage />} />
          <Route
            path="manager"
            element={
              <Navigate to="/dept-head/manager/dashboard" replace />
            }
          />
          <Route
            path="manager/dashboard"
            element={<ManagerDashboardPage />}
          />
          <Route
            path="manager/team-management"
            element={<ManagerDashboardPage />}
          />
          <Route
            path="manager/transfer-management"
            element={<ManagerDashboardPage />}
          />
          <Route
            path="manager/employee-directory"
            element={<ManagerDashboardPage />}
          />
          <Route
            path="dashboard"
            element={<Navigate to="/dept-head/personal" replace />}
          />
        </Route>
      </Route>

      <Route
        element={<ProtectedRoute allowedRoles={["LOC_HEAD", "loc_head"]} />}
      >
        <Route path="/loc-head" element={<EmployeeLayout />}>
          <Route index element={<Navigate to="/loc-head/personal" replace />} />
          <Route path="personal" element={<EmployeeDashboard />} />
          <Route path="personal/profile" element={<EmployeeProfilePage />} />
          <Route path="personal/transfers" element={<TransferRequestsPage />} />
          <Route
            path="manager"
            element={
              <Navigate to="/loc-head/manager/manage-location" replace />
            }
          />
          <Route
            path="manager/manage-location"
            element={<ManagerDashboardPage />}
          />
          <Route
            path="manager/manage-positions"
            element={<ManagerDashboardPage />}
          />
          <Route
            path="manager/transfer-workflow"
            element={<ManagerDashboardPage />}
          />
          <Route
            path="dashboard"
            element={<Navigate to="/loc-head/personal" replace />}
          />
        </Route>
      </Route>

      <Route
        element={<ProtectedRoute allowedRoles={["TRANSFER_HEAD", "transfer_head"]} />}
      >
        <Route path="/transfer-head" element={<EmployeeLayout />}>
          <Route index element={<Navigate to="/transfer-head/manager" replace />} />
          <Route path="personal" element={<EmployeeDashboard />} />
          <Route path="personal/profile" element={<EmployeeProfilePage />} />
          <Route path="personal/transfers" element={<TransferRequestsPage />} />
          <Route
            path="manager"
            element={
              <Navigate to="/transfer-head/manager/dashboard" replace />
            }
          />
          <Route
            path="manager/dashboard"
            element={<TransferHeadDashboardPage />}
          />
          <Route
            path="dashboard"
            element={<Navigate to="/transfer-head/personal" replace />}
          />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getRole, isLoggedIn } from "../utils/auth";

export default function ProtectedRoute({ allowedRoles = [] }) {
    const location = useLocation();

    if (!isLoggedIn()) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (allowedRoles.length > 0) {
        const role = (getRole() || "EMPLOYEE").toUpperCase();
        const normalizedAllowedRoles = allowedRoles.map((item) => item.toUpperCase());
        if (!normalizedAllowedRoles.includes(role)) {
            return <Navigate to="/employee/dashboard" replace />;
        }
    }

    return <Outlet />;
}

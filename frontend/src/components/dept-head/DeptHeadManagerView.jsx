import { useLocation } from "react-router-dom";
import Dashboard from "./Dashboard";
import TeamManagement from "./TeamManagement";
import TransferManagement from "./TransferManagement";
import EmployeeDirectory from "./EmployeeDirectory";

export default function DeptHeadManagerView() {
  const route = useLocation();
  const currentSection = route.pathname.split("/").pop();

  if (currentSection === "dashboard") {
    return <Dashboard />;
  }

  if (currentSection === "team-management") {
    return <TeamManagement />;
  }

  if (currentSection === "transfer-management") {
    return <TransferManagement />;
  }

  if (currentSection === "employee-directory") {
    return <EmployeeDirectory />;
  }

  return null;
}

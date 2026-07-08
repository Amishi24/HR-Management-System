import { useLocation } from "react-router-dom";

import ManageLocation from "./ManageLocation";
import ManagePositions from "./ManagePositions";
import TransferWorkflow from "./TransferWorkflow";

export default function LocationHeadManagerView() {
  const route = useLocation();
  const currentSection = route.pathname.split("/").pop();

  if (currentSection === "manage-location") {
    return <ManageLocation />;
  }

  if (currentSection === "manage-positions") {
    return <ManagePositions />;
  }

  if (currentSection === "transfer-workflow") {
    return <TransferWorkflow />;
  }

  return null;
}

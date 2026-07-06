import ProfileCard from "./ProfileCard"; // Assuming this component exists and fetches its own data
import DependentsCard from "./DependentsCard"; // Assuming this component exists and fetches its own data
import MedicalCard from "./MedicalCard"; // Assuming this component exists and fetches its own data
import TransferRequestsCard from "./TransferRequestsCard"; // Assuming this component exists and fetches its own data

/**
 * PersonalDashboard serves as a single, reusable view for an employee's personal information.
 * It is composed of modular cards, each responsible for its own data fetching and display.
 * This component is used for the "Employee" role and is reused for the "My Personal Dashboard"
 * view for "Dept Head" and "Loc Head" roles.
 */
export default function PersonalDashboard() {
    return (
        <div className="space-y-6">
            <ProfileCard />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <DependentsCard />
                <MedicalCard />
            </div>
            <TransferRequestsCard />
        </div>
    );
}
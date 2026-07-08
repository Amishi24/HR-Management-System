import IdentityCard from "../employee/IdentityCard";
import DependentsCard from "../employee/DependentsCard";
import MedicalCard from "../employee/MedicalCard";
import TransferRequestsCard from "../employee/TransferRequestsCard";

export default function PersonalDashboardView() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800">
          My Personal Dashboard
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Your personal profile, family details, medical records, and transfer
          history.
        </p>
      </div>
      <IdentityCard />
      <DependentsCard />
      <MedicalCard />
      <TransferRequestsCard />
    </div>
  );
}

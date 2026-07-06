import TransferRequestsCard from "../components/employee/TransferRequestsCard";

export default function TransferRequestsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Transfer Requests</h1>
                <p className="text-slate-500 text-sm mt-1">
                    View your request history and current status. 
                    View all transfer requests tied to your employee profile.
                </p>
            </div>

            <TransferRequestsCard />
        </div>
    );
}

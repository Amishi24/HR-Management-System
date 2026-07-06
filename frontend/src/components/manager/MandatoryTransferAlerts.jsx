import SectionCard from "../employee/SectionCard";

export default function MandatoryTransferAlerts({ alerts }) {
    return (
        <SectionCard title="Mandatory Transfer Alerts" subtitle="Employees approaching the transfer threshold.">
            {alerts.length === 0 ? (
                <p className="text-slate-500">No mandatory transfer alerts at the moment.</p>
            ) : (
                <div className="space-y-3">
                    {alerts.map((alert) => (
                        <div key={`${alert.employee_id}-${alert.alert_type}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-semibold text-slate-800">{alert.employee_name}</p>
                                    <p className="text-sm text-slate-500">{alert.department_name} • {alert.current_city}, {alert.current_state}</p>
                                </div>
                                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">{alert.years_served} years</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </SectionCard>
    );
}
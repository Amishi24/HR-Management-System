import { useEffect, useState } from "react";
import { getDeptHeadAlerts, getDeptHeadCapacity } from "../../api/roleApi";
import MandatoryTransferAlerts from "./MandatoryTransferAlerts";
import DeptCapacityDashboard from "./DeptCapacityDashboard";

export default function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [capacity, setCapacity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void refreshDashboard();
  }, []);

  async function refreshDashboard() {
    setLoading(true);
    setError("");
    try {
      const [alertRes, capacityRes] = await Promise.all([
        getDeptHeadAlerts(),
        getDeptHeadCapacity(),
      ]);
      setAlerts(alertRes.data || []);
      setCapacity(capacityRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load the department head dashboard right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
          Loading dashboard insights…
        </div>
      ) : (
        <div className="space-y-6">
          <MandatoryTransferAlerts alerts={alerts} />
          <DeptCapacityDashboard capacity={capacity} />
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getDeptHeadDepartments,
  getDeptHeadTeam,
} from "../../api/roleApi";
import DeptScopeSelector from "./DeptScopeSelector";
import DeptTeamRoster from "./DeptTeamRoster";

export default function TeamManagement() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [team, setTeam] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDepartments() {
      try {
        const res = await getDeptHeadDepartments();
        setDepartments(res.data || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load departments.");
      }
    }
    void loadDepartments();
  }, []);

  const refreshTeam = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const teamRes = await getDeptHeadTeam(selectedDepartment || "");
      setTeam(teamRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load the team roster right now.");
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    void refreshTeam();
  }, [refreshTeam]);

  function handleViewEmployee(employeeId) {
    navigate(`/dept-head/manager/employee-directory?employeeId=${employeeId}`);
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <DeptScopeSelector
        departments={departments}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={setSelectedDepartment}
      />

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
          Loading team roster…
        </div>
      ) : (
        <div className="grid gap-6">
          <DeptTeamRoster team={team} onViewEmployee={handleViewEmployee} />
        </div>
      )}
    </div>
  );
}

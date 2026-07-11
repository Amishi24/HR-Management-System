import { useEffect, useState } from "react";

import {
  createLocHeadPolicy,
  deleteLocHeadPolicy,
  getLocHeadLocation,
  getLocHeadPolicies,
  updateLocHeadLocationRequirements,
} from "../../api/roleApi";
import LocationRequirements from "./LocationRequirements";
import LocationRotationPolicies from "./LocationRotationPolicies";

export default function ManageLocation() {
  const [location, setLocation] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [requirements, setRequirements] = useState({
    required_tenure_years: "",
    required_working_days_per_year: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [policyForm, setPolicyForm] = useState({ rules_config: "{}" });

  useEffect(() => {
    void refreshDashboard();
  }, []);

  async function refreshDashboard() {
    setLoading(true);
    setError("");

    try {
      const [locationRes, policiesRes] = await Promise.all([
        getLocHeadLocation(),
        getLocHeadPolicies(),
      ]);

      setLocation(locationRes.data || null);
      setPolicies(policiesRes.data || []);
      setRequirements({
        required_tenure_years: locationRes.data?.required_tenure_years ?? "",
        required_working_days_per_year:
          locationRes.data?.required_working_days_per_year ?? "",
      });
    } catch (err) {
      console.error(err);
      setError("Unable to load your location workspace right now.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequirementsSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      await updateLocHeadLocationRequirements({
        required_tenure_years: Number(requirements.required_tenure_years),
        required_working_days_per_year: Number(
          requirements.required_working_days_per_year,
        ),
      });
      await refreshDashboard();
    } catch (err) {
      console.error(err);
      setError("The location requirements could not be updated.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreatePolicy(e) {
    e.preventDefault();

    try {
      await createLocHeadPolicy({
        rules_config: JSON.parse(policyForm.rules_config),
      });
      setPolicyForm({ rules_config: "{}" });
      await refreshDashboard();
    } catch (err) {
      console.error(err);
      setError("The rotation policy could not be created.");
    }
  }

  async function handleDeletePolicy(policyId) {
    try {
      await deleteLocHeadPolicy(policyId);
      await refreshDashboard();
    } catch (err) {
      console.error(err);
      setError("The rotation policy could not be deleted.");
    }
  }

  const handleRequirementsChange = (field, value) =>
    setRequirements((prev) => ({ ...prev, [field]: value }));
  const handlePolicyFormChange = (field, value) =>
    setPolicyForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
          Loading location details…
        </div>
      ) : (
        <div className="space-y-6">
          <LocationRequirements
            location={location}
            requirements={requirements}
            onRequirementsChange={handleRequirementsChange}
            onRequirementsSubmit={handleRequirementsSubmit}
          />

          <LocationRotationPolicies
            policies={policies}
            policyForm={policyForm}
            onPolicyFormChange={handlePolicyFormChange}
            onCreatePolicy={handleCreatePolicy}
            onDeletePolicy={handleDeletePolicy}
          />
        </div>
      )}
    </div>
  );
}

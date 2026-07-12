import { useEffect, useState } from "react";

import {
  createLocHeadPolicy,
  deleteLocHeadPolicy,
  getGlobalPolicy,
  getLocHeadLocation,
  getLocHeadPolicy,
  updateLocHeadPolicy,
  updateLocHeadLocationRequirements,
} from "../../api/roleApi";
import LocationRequirements from "./LocationRequirements";
import LocationRotationPolicies from "./LocationRotationPolicies";

function createEmptyPolicyConfig() {
  return {
    level_gating: {
      lateral_only: [],
      promotions_allowed: [],
    },
    tenure_rules: {
      max_tenure_years: 10,
      min_tenure_years: 3,
    },
  };
}

export default function ManageLocation() {
  const [location, setLocation] = useState(null);
  const [localPolicy, setLocalPolicy] = useState(null);
  const [requirements, setRequirements] = useState({
    required_tenure_years: "",
    required_working_days_per_year: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditingPolicy, setIsEditingPolicy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [policyForm, setPolicyForm] = useState({
    rules_config: createEmptyPolicyConfig(),
  });

  useEffect(() => {
    void refreshDashboard();
  }, []);

  async function refreshDashboard() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const locationRes = await getLocHeadLocation();

      setLocation(locationRes.data || null);
      setRequirements({
        required_tenure_years: locationRes.data?.required_tenure_years ?? "",
        required_working_days_per_year:
          locationRes.data?.required_working_days_per_year ?? "",
      });
      await loadPolicy();
    } catch (err) {
      console.error(err);
      setError("Unable to load your location workspace right now.");
    } finally {
      setLoading(false);
    }
  }

  function setPolicyConfig(policy) {
    setPolicyForm({
      rules_config: policy?.rules_config || createEmptyPolicyConfig(),
    });
  }

  async function loadGlobalPolicy() {
    const globalPolicyRes = await getGlobalPolicy();
    setPolicyConfig(globalPolicyRes.data);
  }

  async function loadPolicy() {
    const localPolicyRes = await getLocHeadPolicy();
    const policy = localPolicyRes.data;

    setLocalPolicy(policy || null);
    if (policy) {
      setPolicyConfig(policy);
      return;
    }

    await loadGlobalPolicy();
  }

  function handleEditPolicy() {
    setError("");
    setSuccess("");
    setIsEditingPolicy(true);
  }

  async function handleCancelPolicyEdit() {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await loadPolicy();
      setIsEditingPolicy(false);
    } catch (err) {
      console.error(err);
      setError("The current rotation policy could not be reloaded.");
    } finally {
      setSubmitting(false);
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

  async function handleSavePolicy(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        rules_config: policyForm.rules_config,
      };
      const response = localPolicy
        ? await updateLocHeadPolicy(localPolicy.id, payload)
        : await createLocHeadPolicy(payload);

      setLocalPolicy(response.data);
      setPolicyConfig(response.data);
      setSuccess("Rotation policy saved successfully.");
      setIsEditingPolicy(false);
      return true;
    } catch (err) {
      console.error(err);
      setError("The rotation policy could not be saved.");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePolicy() {
    if (!localPolicy) return false;

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await deleteLocHeadPolicy(localPolicy.id);
      setLocalPolicy(null);
      await loadGlobalPolicy();
      setIsEditingPolicy(false);
      setSuccess("Local rotation policy deleted. Global policy values are now loaded.");
      return true;
    } catch (err) {
      console.error(err);
      setError("The rotation policy could not be deleted.");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetToGlobal() {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await loadGlobalPolicy();
      setSuccess("Global policy values loaded.");
      return true;
    } catch (err) {
      console.error(err);
      setError("The global rotation policy could not be loaded.");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  const handleRequirementsChange = (field, value) =>
    setRequirements((prev) => ({ ...prev, [field]: value }));

  const handlePolicyFormChange = (section, field, value) =>
    setPolicyForm((prev) => ({
      ...prev,
      rules_config: {
        ...prev.rules_config,
        [section]: {
          ...(prev.rules_config?.[section] || {}),
          [field]: value,
        },
      },
    }));

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
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
            hasLocalPolicy={Boolean(localPolicy)}
            policyForm={policyForm}
            onPolicyFormChange={handlePolicyFormChange}
            onSavePolicy={handleSavePolicy}
            onDeletePolicy={handleDeletePolicy}
            onEditPolicy={handleEditPolicy}
            onCancelEdit={handleCancelPolicyEdit}
            onResetToGlobal={handleResetToGlobal}
            isEditing={isEditingPolicy}
            submitting={submitting}
          />
        </div>
      )}
    </div>
  );
}

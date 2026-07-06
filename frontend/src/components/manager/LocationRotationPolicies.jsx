import { Trash2 } from "lucide-react";


export default function LocationRotationPolicies({ policies, policyForm, onPolicyFormChange, onCreatePolicy, onDeletePolicy }) {
    return (
        <SectionCard title="Rotation Policies" subtitle="Manage local rotation rules for this location.">
            <form onSubmit={onCreatePolicy} className="mb-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="block text-sm font-medium text-slate-700">Policy config (JSON)</label>
                <textarea value={policyForm.rules_config} onChange={(e) => onPolicyFormChange("rules_config", e.target.value)} rows="4" className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm" />
                <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">Create policy</button>
            </form>
            <div className="space-y-3">
                {policies.map((policy) => (
                    <div key={policy.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="font-semibold text-slate-800">Policy #{policy.id}</p>
                                <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{JSON.stringify(policy.rules_config, null, 2)}</pre>
                            </div>
                            <button onClick={() => onDeletePolicy(policy.id)} className="text-rose-500">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </SectionCard>
    );
}
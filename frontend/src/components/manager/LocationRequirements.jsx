import SectionCard from "../employee/SectionCard";

export default function LocationRequirements({ location, requirements, onRequirementsChange, onRequirementsSubmit }) {
    return (
        <SectionCard title="My Location" subtitle="Current location requirements and operating expectations.">
            {location ? (
                <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-700">{location.city}, {location.state}</p>
                        <p className="mt-2 text-sm text-slate-500">Required tenure years: {location.required_tenure_years}</p>
                        <p className="text-sm text-slate-500">Working days per year: {location.required_working_days_per_year}</p>
                    </div>
                    <form onSubmit={onRequirementsSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Required tenure years</label>
                            <input type="number" value={requirements.required_tenure_years} onChange={(e) => onRequirementsChange("required_tenure_years", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-3" />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Required working days per year</label>
                            <input type="number" value={requirements.required_working_days_per_year} onChange={(e) => onRequirementsChange("required_working_days_per_year", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-3" />
                        </div>
                        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">Save requirements</button>
                    </form>
                </div>
            ) : <p className="text-slate-500">Location details are unavailable.</p>}
        </SectionCard>
    );
}
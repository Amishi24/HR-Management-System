// src/components/employee/PositionCard.jsx

import SectionCard from "./SectionCard";
import { Info } from "lucide-react";

export default function PositionCard() {
    return (
        <SectionCard
            title="Current Position"
            subtitle="Current posting details. This section will be connected once the backend endpoint is available."
        >
            <div className="grid md:grid-cols-2 gap-6">

                <Field
                    label="Location"
                    value="Coming Soon"
                />

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Department
                    </label>

                    <div className="relative">

                        <input
                            readOnly
                            value="Coming Soon"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 pr-12"
                        />

                        <button
                            type="button"
                            disabled
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                            <Info size={18} />
                        </button>

                    </div>
                </div>

                <Field
                    label="Discipline"
                    value="Coming Soon"
                />

                <Field
                    label="Level"
                    value="Coming Soon"
                />

            </div>
        </SectionCard>
    );
}

function Field({ label, value }) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
                {label}
            </label>

            <input
                readOnly
                value={value}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3"
            />
        </div>
    );
}

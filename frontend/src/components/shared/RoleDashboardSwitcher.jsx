export default function RoleDashboardSwitcher({ activeView, onChange, personalLabel = "My Personal Dashboard", managerLabel = "Team Dashboard" }) {
    const options = [
        { value: "personal", label: personalLabel },
        { value: "manager", label: managerLabel },
    ];

    return (
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            {options.map((option) => {
                const isActive = activeView === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                            isActive
                                ? "bg-[#4472c4] text-white shadow-sm"
                                : "text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

export default function ManagerViewToggle({ currentView, setCurrentView, personalLabel, managerialLabel }) {
    const baseClasses = "rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200";
    const activeClasses = "bg-slate-800 text-white";
    const inactiveClasses = "bg-slate-100 text-slate-600 hover:bg-slate-200";

    return (
        <div className="flex items-center justify-center">
            <div className="inline-flex rounded-full bg-slate-100 p-1">
                <button
                    onClick={() => setCurrentView("personal")}
                    className={`${baseClasses} ${currentView === "personal" ? activeClasses : inactiveClasses}`}
                >
                    {personalLabel}
                </button>
                <button
                    onClick={() => setCurrentView("managerial")}
                    className={`${baseClasses} ${currentView === "managerial" ? activeClasses : inactiveClasses}`}
                >
                    {managerialLabel}
                </button>
            </div>
        </div>
    );
}
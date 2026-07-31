import { useState, useEffect } from "react";
import SectionCard from "../common/SectionCard";
import { getTenures, getTenureDetails } from "../../api/employeeApi";

export default function TenureTimeline() {
    const [tenures, setTenures] = useState([]);
    const [selectedTenure, setSelectedTenure] = useState(null);
    const [loadingTimeline, setLoadingTimeline] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [error, setError] = useState(null);

    // Fetch the list of tenures on initial load
    useEffect(() => {
        getTenures()
            .then((response) => {
                // Ensure historical chronological order (oldest to newest)
                const sorted = (response.data || []).sort(
                    (a, b) => new Date(a.start_date) - new Date(b.start_date)
                );
                setTenures(sorted);

                // Auto-select the latest tenure if records exist
                if (sorted.length > 0) {
                    handleTenureSelection(sorted[sorted.length - 1].id);
                } else {
                    setLoadingTimeline(false);
                }
            })
            .catch((err) => {
                console.error("Error fetching tenures:", err);
                setError("Failed to load timeline records.");
                setLoadingTimeline(false);
            });
    }, []);

    const handleTenureSelection = (id) => {
        setLoadingDetails(true);
        getTenureDetails(id)
            .then((response) => {
                setSelectedTenure(response.data);
            })
            .catch((err) => {
                console.error(`Error fetching tenure details for ID ${id}:`, err);
            })
            .finally(() => {
                setLoadingTimeline(false);
                setLoadingDetails(false);
            });
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Present";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (loadingTimeline) {
        return (
            <div className="bg-slate-100 border border-slate-200 rounded-3xl p-12 text-center text-slate-500 animate-pulse">
                Loading your tenure track details...
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-3xl p-6 text-center">
                {error}
            </div>
        );
    }

    return (
        <SectionCard
            title="Employment Timeline"
            subtitle="Track your professional journey, assignment weightage metrics, and dynamic historical station logs."
        >
            {/* Timeline Track Graphic Grid */}
            <div className="relative flex items-center justify-between mb-16 px-12 pt-4">
                {/* Visual Line Anchor Behind Nodes */}
                <div className="absolute left-12 right-12 top-1/2 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />

                {tenures.map((tenure, index) => {
                    const isSelected = selectedTenure?.id === tenure.id;
                    return (
                        <button
                            key={tenure.id}
                            type="button"
                            className="relative z-10 flex flex-col items-center focus:outline-hidden group"
                            onClick={() => handleTenureSelection(tenure.id)}
                        >
                            {/* Node Interaction Circle */}
                            <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center border-4 transition-all duration-200 ${
                                    isSelected
                                        ? "bg-slate-800 border-slate-200 scale-125 shadow-md"
                                        : "bg-white border-slate-300 group-hover:border-slate-500"
                                }`}
                            >
                                <div
                                    className={`w-1.5 h-1.5 rounded-full ${
                                        isSelected ? "bg-white" : "bg-slate-300 group-hover:bg-slate-500"
                                    }`}
                                />
                            </div>

                            {/* Node Floating Context Labels */}
                            <div className="absolute top-9 flex flex-col items-center text-center w-36">
                                <span
                                    className={`text-xs font-semibold tracking-wide uppercase ${
                                        isSelected ? "text-slate-800" : "text-slate-400 group-hover:text-slate-600"
                                    }`}
                                >
                                    Tenure {index + 1}
                                </span>
                                <span className="text-[11px] text-slate-500 truncate w-full mt-0.5">
                                    {tenure.location}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Dynamic Detail Card Drawer Area */}
            <div className="border-t border-slate-100 pt-6">
                {loadingDetails ? (
                    <div className="h-44 flex items-center justify-center text-slate-400 text-sm animate-pulse">
                        Fetching tenure details...
                    </div>
                ) : selectedTenure ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-6">
                        {/* Header Details Panel */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-200 pb-5 mb-5">
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <h3 className="text-xl font-bold text-slate-800">
                                        {selectedTenure.department_name}
                                    </h3>
                                    <span className="bg-slate-200 text-slate-800 text-xs font-bold px-2 py-0.5 rounded-md">
                                        Lvl {selectedTenure.level}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 font-medium">
                                    📍 Location: <span className="text-slate-700">{selectedTenure.location}</span>
                                </p>
                            </div>
                            
                            <div className="text-left md:text-right md:min-w-[220px]">
                                <span className="text-sm font-semibold text-slate-800 bg-white border border-slate-200 px-3 py-1 rounded-lg inline-block">
                                    {formatDate(selectedTenure.start_date)} – {formatDate(selectedTenure.end_date)}
                                </span>
                                <p className="text-xs text-slate-500 mt-2 font-medium">
                                    ⏱️ {selectedTenure.time_served_days} Days Served
                                    {!selectedTenure.is_tenure_complete && (
                                        <span className="text-emerald-600 font-semibold">
                                            {" "}({selectedTenure.remaining_days} days left)
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Assignments Render Map Block */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                                Registered Project Assignments
                            </h4>
                            {selectedTenure.assignments && selectedTenure.assignments.length > 0 ? (
                                selectedTenure.assignments.map((assignment, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                                        <div className="flex justify-between items-start gap-4">
                                            <h5 className="font-semibold text-slate-800 text-sm">
                                                {assignment.title}
                                            </h5>
                                            <span className="shrink-0 text-xs bg-slate-100 border border-slate-200 text-slate-700 font-medium px-2.5 py-0.5 rounded-full">
                                                Weightage: {assignment.weightage}
                                            </span>
                                        </div>
                                        
                                        {/* Skill Tags */}
                                        {assignment.skills && assignment.skills.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                {assignment.skills.map((skill, sIdx) => (
                                                    <span 
                                                        key={sIdx} 
                                                        className="text-[11px] bg-slate-50 text-slate-600 border border-slate-100 px-2 py-0.5 rounded-md font-medium"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic">No historical assignments listed for this tenure window.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-slate-400 text-sm py-6">
                        Select a track segment milestone node to inspect internal records.
                    </p>
                )}
            </div>
        </SectionCard>
    );
}
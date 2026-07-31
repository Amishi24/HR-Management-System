import { useState } from "react";

export default function Tabs({ items, defaultTab }) {
    const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id);

    const activeItem = items.find((item) => item.id === activeTab);

    return (
        <div className="space-y-6">
            {/* Minimal Underlined Navigation Header Header Bar */}
            <div className="border-b border-slate-200">
                <nav className="flex gap-8 -mb-px" aria-label="Tabs">
                    {items.map((item) => {
                        const isSelected = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setActiveTab(item.id)}
                                className={`py-4 px-1 inline-flex items-center border-b-2 text-sm font-semibold transition-all duration-150 cursor-pointer focus:outline-hidden ${
                                    isSelected
                                        ? "border-[#3b82f6] text-[#3b82f6]"
                                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                }`}
                            >
                                {item.icon && (
                                    <item.icon 
                                        size={16} 
                                        className={`mr-2 shrink-0 ${isSelected ? "text-[#3b82f6]" : "text-slate-400"}`} 
                                    />
                                )}
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Render Slot For Active Component Section View */}
            <div className="transition-opacity duration-200 animate-fadeIn">
                {activeItem ? activeItem.component : null}
            </div>
        </div>
    );
}
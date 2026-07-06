import { useEffect, useState } from "react";
import SectionCard from "./SectionCard";
import { getProfile } from "../../api/employeeApi";

export default function ProfileCard() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchProfile() {
            try {
                setLoading(true);
                const res = await getProfile();
                setProfile(res.data);
            } catch (err) {
                console.error(err);
                setError("Failed to load profile information.");
            } finally {
                setLoading(false);
            }
        }
        void fetchProfile();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <SectionCard title="My Profile" subtitle="Core personal and employment details.">
            {loading ? (
                <p className="text-slate-500">Loading profile...</p>
            ) : error ? (
                <p className="text-rose-500">{error}</p>
            ) : profile ? (
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Name</p>
                        <p className="font-medium text-slate-700">{profile.name}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Employee ID</p>
                        <p className="font-medium text-slate-700">{profile.id}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email</p>
                        <p className="font-medium text-slate-700">{profile.email}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Discipline</p>
                        <p className="font-medium text-slate-700">{profile.discipline_name || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Date of Birth</p>
                        <p className="font-medium text-slate-700">{formatDate(profile.DoB)}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Retirement Date</p>
                        <p className="font-medium text-slate-700">{formatDate(profile.DoRetirement)}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Domicile State</p>
                        <p className="font-medium text-slate-700">{profile.domicile_state}</p>
                    </div>
                </div>
            ) : (
                <p className="text-slate-500">No profile information available.</p>
            )}
        </SectionCard>
    );
}
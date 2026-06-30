export default function SectionCard({
    title,
    subtitle,
    action,
    children,
}) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-slate-100 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
                    {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
                </div>
                {action}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                {children}
            </div>
        </section>
    );
}

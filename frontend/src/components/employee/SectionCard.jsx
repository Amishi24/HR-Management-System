export default function SectionCard({
    title,
    subtitle,
    action,
    children,
}) {
    return (
        <section className="bg-slate-100 border border-slate-200 rounded-3xl p-6">

            <div className="flex items-start justify-between">

                <div>
                    <h2 className="text-2xl font-semibold text-slate-800">
                        {title}
                    </h2>

                    {subtitle && (
                        <p className="text-slate-500 mt-2">
                            {subtitle}
                        </p>
                    )}
                </div>

                {action}

            </div>

            <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6">

                {children}

            </div>

        </section>
    );
}

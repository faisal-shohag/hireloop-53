// Sidebar "Company Overview" card from the Figma job details page:
// heading, banner, key-value rows, and a full-width "Visit Website"
// action.
//
// The Figma shows SIZE / INDUSTRY rows backed by company data; the
// data model has only per-job fields, so the rows use what JobRow
// provides today.

import type { JobRow } from "@/lib/types/jobs"

const rowClass = "flex items-center justify-between gap-4 py-3.5"

export function CompanyOverviewCard({ job }: { job: JobRow }) {
    const rows = [
        { label: "Company", value: job.companyName },
        { label: "Location", value: `${job.location}${job.isRemote ? " (Remote)" : ""}` },
        { label: "Posted", value: job.posted },
    ]

    return (
        <aside className="border border-white/10 bg-[#141418] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.35)] shadow-[inset_0_1px_rgba(255,255,255,0.035)]">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#EDEDEF]">
                Company Overview
            </h2>

            {/* Banner — a gradient placeholder until a company image field exists */}
            <div className="mt-3 flex h-[204px] items-center justify-center rounded-xl bg-gradient-to-br from-[#5C53FE]/40 via-[#5C53FE]/10 to-transparent">
                <span className="font-heading text-5xl font-semibold text-white/60">
                    {job.companyName.charAt(0)}
                </span>
            </div>

            <dl className="mt-6 divide-y divide-white/10">
                {rows.map(({ label, value }) => (
                    <div key={label} className={rowClass}>
                        <dt className="text-[13px] text-[#A0A0AB]">{label}</dt>
                        <dd className="max-w-[65%] truncate text-right text-base text-[#EDEDEF]">
                            {value}
                        </dd>
                    </div>
                ))}
            </dl>

            <button
                type="button"
                // TODO: point at the company's website when the URL is in the data.
                className="mt-5 h-11 w-full rounded-[10px] bg-white text-[13px] font-medium text-[#0B0B0C] shadow-[0_1px_2px_rgba(0,0,0,0.35)] transition-colors hover:bg-white/90"
            >
                Visit Website
            </button>
        </aside>
    )
}

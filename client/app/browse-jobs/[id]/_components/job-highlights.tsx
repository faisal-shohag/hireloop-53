// The "Bento Info Grid" from the Figma job details page: four square
// corner info tiles with icon, uppercase label, and semibold value.

import { formatCompensation, formatDeadline } from "@/lib/formatters"
import type { JobRow } from "@/lib/types/jobs"
import { Banknote, Briefcase, CalendarDays, MapPin } from "lucide-react"

export function JobHighlights({ job }: { job: JobRow }) {
    const cells = [
        { label: "Salary range", value: formatCompensation(job), Icon: Banknote },
        {
            label: "Location",
            value: `${job.location}${job.isRemote ? " (Remote)" : ""}`,
            Icon: MapPin,
        },
        { label: "Job type", value: job.jobType, Icon: Briefcase },
        // Figma shows an "Experience" tile; the data model has no such
        // field yet, so the apply-by date takes the fourth slot.
        { label: "Apply by", value: formatDeadline(job.deadline), Icon: CalendarDays },
    ]

    return (
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cells.map(({ label, value, Icon }) => (
                <div
                    key={label}
                    className="border border-white/10 bg-[#141418] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.35)] shadow-[inset_0_1px_rgba(255,255,255,0.035)]"
                >
                    <Icon aria-hidden className="size-[22px] text-[#C4C7C8]" />
                    <dt className="mt-2.5 text-[13px] font-medium text-[#A0A0AB]">{label}</dt>
                    <dd className="mt-1 text-base font-semibold capitalize text-[#EDEDEF]">
                        {value}
                    </dd>
                </div>
            ))}
        </dl>
    )
}

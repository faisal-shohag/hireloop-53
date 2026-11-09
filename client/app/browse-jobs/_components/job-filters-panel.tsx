// Sidebar filters for the Browse Jobs page — from the Figma
// "Aside - Sidebar Filters" (labels 13px #A0A0AB, counts #6E6E78,
// filter groups stacked in one #141418 card).
//
// Job Type and Job Category are single-select (radio inputs); Work
// Arrangement is a multi-select checkbox. Counts are computed at render
// from the current job list. Selection only flips visually — no query
// params, no list filtering (wired up separately).

import { FilterChecklist, type FilterOption } from "@/components/shared/filter-checklist"
import { JOB_CATEGORIES, JOB_TYPES, type JobRow } from "@/lib/types/jobs"

/** Job counts per facet, mirrored in the Figma sidebar ("Full-time  1.2k"). */
const countOptions = (
    facet: (job: JobRow) => string,
    allOptions: readonly string[],
    jobs: readonly JobRow[],
): FilterOption[] =>
    allOptions.map((option) => ({
        value: option,
        label: option,
        count: jobs.filter((job) => facet(job) === option).length,
    }))

export function JobFiltersPanel({ jobs }: { jobs: readonly JobRow[] }) {
    return (
        <section className="surface-card p-6">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#EDEDEF]">Filters</h2>

            <div className="mt-7 flex flex-col gap-6">
                <FilterChecklist
                    legend="Job Type"
                    name="jobType"
                    multiple={false}
                    options={countOptions((job) => job.jobType, JOB_TYPES, jobs)}
                />
                <FilterChecklist
                    legend="Job Category"
                    name="category"
                    multiple={false}
                    options={countOptions((job) => job.category, JOB_CATEGORIES, jobs)}
                />
                <FilterChecklist
                    legend="Work Arrangement"
                    name="isRemote"
                    options={[
                        { value: "remote", label: "Remote only", count: jobs.filter((job) => job.isRemote).length },
                    ]}
                />
            </div>
        </section>
    )
}

import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { PageContainer, PageHeader } from "@/components/dashboard/page-shell"
import { cn } from "@/lib/utils"
import { Eye, Pencil, MoreHorizontal, Plus, Users } from "lucide-react"
import type { JobRow, JobStatus } from "@/lib/types/jobs"
import { formatCompensation, formatDeadline } from "@/lib/formatters"
import { getJobs } from "@/lib/api/jobs"
import { DeleteJobDialog } from "@/app/components/DeleteJobDialog"

const badgeClass =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize"
const statusStyles: Record<JobStatus, string> = {
    active: "border-emerald-400/30 bg-emerald-400/15 text-emerald-300",
    expired: "border-white/10 bg-white/5 text-white/50",
}
const typePillClass =
    "inline-flex items-center whitespace-nowrap rounded-lg border surface-field px-2.5 py-0.5 text-xs capitalize text-white/80"

const iconButtonClass =
    "flex size-8 items-center justify-center rounded-md border border-white/10 bg-[#1A1A1F] text-white/60 transition-colors hover:border-white/25 hover:text-white"

// Responsive column visibility — shared by <th> and <td> so they always agree.
const cellVis = {
    company: "hidden md:table-cell",
    type: "hidden lg:table-cell",
    compensation: "hidden lg:table-cell",
    applicants: "hidden lg:table-cell",
    deadline: "hidden lg:table-cell",
} satisfies Record<string, string>

const headingClass = "px-3 py-3.5 text-xs font-medium tracking-wide text-white/50 uppercase"
const cellClass = "px-3 py-3.5"

export default async function RecruiterJobsPage() {

    const jobs: JobRow[] = await getJobs();

    return (
        <PageContainer width="wide">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm">
                <span className="text-white/50">Manage Jobs</span>
                <span aria-hidden className="text-white/30">/</span>
                <span className="text-white/90">Job Listings &amp; Postings</span>
            </nav>

            {/* Page heading + primary action */}
            <PageHeader
                title="Manage Job Posts"
                subtitle="Review live listings, monitor applicants, and update job details across your organization."
                action={
                    <Link
                        href="/dashboard/recruiter/jobs/new"
                        className={cn(buttonVariants(), "btn-brand")}
                    >
                        <Plus aria-hidden />
                        New Job Post
                    </Link>
                }
            />

            {/* Postings table — columns collapse away on smaller screens instead of scrolling */}
            <section className="surface-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table-fixed w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th scope="col" className={cn(headingClass, "px-5", "lg:w-[20%]")}>
                                    Job title &amp; dept
                                </th>
                                <th scope="col" className={cn(headingClass, cellVis.company, "lg:w-[16%]")}>
                                    Company &amp; location
                                </th>
                                <th scope="col" className={cn(headingClass, cellVis.type, "lg:w-[9%]")}>
                                    Type
                                </th>
                                <th scope="col" className={cn(headingClass, cellVis.compensation, "lg:w-[12%]")}>
                                    Compensation
                                </th>
                                <th scope="col" className={cn(headingClass, cellVis.applicants, "lg:w-[12%]")}>
                                    Applicants
                                </th>
                                <th scope="col" className={cn(headingClass, "lg:w-[9%]")}>
                                    Status
                                </th>
                                <th scope="col" className={cn(headingClass, cellVis.deadline, "lg:w-[11%]")}>
                                    Deadline
                                </th>
                                <th scope="col" className={cn(headingClass, "px-5", "lg:w-[11%]")}>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map((job) => (
                                <tr
                                    key={job._id}
                                    className="border-b border-white/5 transition-colors last:border-b-0 hover:bg-white/[0.03]"
                                >
                                    {/* Job title & dept */}
                                    <td className={cn(cellClass, "px-5")}>
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="brand-chip hidden size-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold sm:flex"
                                                aria-hidden
                                            >
                                                {job.title.charAt(0)}
                                            </span>
                                            <div className="flex min-w-0 flex-col">
                                                <span className="truncate font-medium text-[#EDEDEF]">
                                                    {job.title}
                                                </span>
                                                <span className="truncate text-xs text-white/50">
                                                    {job.category}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Company & location */}
                                    <td className={cn(cellClass, cellVis.company)}>
                                        <div className="flex min-w-0 flex-col">
                                            <span className="truncate text-[#EDEDEF]">{job.companyName}</span>
                                            <span className="truncate text-xs text-white/50">
                                                {job.isRemote ? `Remote (${job.location})` : job.location}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Type */}
                                    <td className={cn(cellClass, cellVis.type)}>
                                        <span className={typePillClass}>{job.jobType}</span>
                                    </td>

                                    {/* Compensation */}
                                    <td className={cn(cellClass, cellVis.compensation)}>
                                        <span className="whitespace-nowrap text-white/80">
                                            {formatCompensation(job)}
                                        </span>
                                    </td>

                                    {/* Applicants */}
                                    <td className={cn(cellClass, cellVis.applicants)}>
                                        <span className="flex items-center gap-2 whitespace-nowrap text-white/80">
                                            <Users aria-hidden className="size-4 text-white/40" />
                                            {job.applicants} candidates
                                        </span>
                                    </td>

                                    {/* Status */}
                                    <td className={cellClass}>
                                        <span className={cn(badgeClass, statusStyles[job.status])}>
                                            {job.status}
                                        </span>
                                    </td>

                                    {/* Deadline */}
                                    <td className={cn(cellClass, cellVis.deadline)}>
                                        <div className="flex flex-col whitespace-nowrap">
                                            <span className="text-[#EDEDEF]">{formatDeadline(job.deadline)}</span>
                                            <span className="text-xs text-white/50">{job.posted}</span>
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className={cn(cellClass, "px-5")}>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                aria-label={`View ${job.title}`}
                                                className={iconButtonClass}
                                            >
                                                <Eye aria-hidden className="size-4" />
                                            </button>
                                            <button
                                                type="button"
                                                aria-label={`Edit ${job.title}`}
                                                className={iconButtonClass}
                                            >
                                                <Pencil aria-hidden className="size-4" />
                                            </button>
                                            <DeleteJobDialog job={job}></DeleteJobDialog>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </PageContainer>
    )
}

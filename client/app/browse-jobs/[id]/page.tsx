// Job details — public page under Browse Jobs, from the Figma
// "Public / Job Details" (header card, bento info grid, content
// sections, company overview sidebar).
//
// The backend has no GET /jobs/:id yet, so the detail page resolves
// the job out of the jobs list; swap in a dedicated endpoint when it
// exists.

import { notFound } from "next/navigation"
import { SiteNavbar } from "@/components/site-navbar"
import { getJobById } from "@/lib/api/jobs"

import { JobHeaderCard } from "./_components/job-header-card"
import { JobHighlights } from "./_components/job-highlights"
import { JobContentCard } from "./_components/job-content-card"
import { CompanyOverviewCard } from "./_components/company-overview-card"

export default async function JobDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const job = await getJobById(id);

    if (!job) notFound()

    return (
        <>
            <SiteNavbar />

            <main className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6">
                <JobHeaderCard job={job} />

                <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_397px] lg:gap-6">
                    <div className="flex min-w-0 flex-col gap-6">
                        <JobHighlights job={job} />
                        <JobContentCard job={job} />
                    </div>

                    <div>
                        <CompanyOverviewCard job={job} />
                    </div>
                </div>
            </main>
        </>
    )
}

// Browse Jobs — public listing of available jobs.
//
// Server component: jobs are fetched server-side, filtered by the URL
// search params (q, type, category, salary, remote). The filter UI does
// not touch the URL yet — that wiring is intentionally left for later.


import { SiteNavbar } from "@/components/site-navbar"
import { getJobs } from "@/lib/api/jobs"

import { JobSearchBar } from "./_components/job-search-bar"
import { JobFiltersPanel } from "./_components/job-filters-panel"
import JobCard from "../components/JobCard"


const resultsHeadingClass = "text-[22px] font-semibold tracking-[-0.02em] text-[#EDEDEF]"

export default async function BrowseJobsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const search = await searchParams
    const urlSearch = new URLSearchParams(search as Record<string, string>)
    const query = urlSearch.toString()

    console.log("Search params:", query)
    // TODO: implement the query-param wiring from the filter UI here.
    const jobs = await getJobs(query)

    return (
        <>
            <SiteNavbar />

            <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
                {/* Search & primary action */}
                <JobSearchBar />

                {/* Sidebar filters + job list */}
                <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-[296px_minmax(0,1fr)] lg:gap-8">
                    <aside>
                        <JobFiltersPanel jobs={jobs} />
                    </aside>

                    <section>
                        {/* Results heading */}
                        <h2 className={resultsHeadingClass}>
                            Found {jobs.length} Professional Jobs
                        </h2>

                        {/* Job list (replaced by the Figma job card when wired) */}
                        <ul className="mt-4 flex list-none flex-col gap-3">
                            {jobs.map((job) => <JobCard key={job._id} job={job} />)}
                            {jobs.length === 0 ? (
                                <li className="surface-card p-10 text-center text-sm text-[#6E6E78]">
                                    No jobs match your current search.
                                </li>
                            ) : null}
                        </ul>
                    </section>
                </div>
            </main>
        </>
    )
}

// https://www.linkedin.com/jobs/search-results/?currentJobId=4472942002&keywords=nextjs&origin=JOB_SEARCH_PAGE_JOB_FILTER&referralSearchId=j6ngejDhx5wA2DZwixWr0Q%3D%3D&f_SAL=f_SA_id_227001%3A277001%24f_SA_id_226001%3A273001

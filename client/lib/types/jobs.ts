// Shared job domain types + option lists — single source of truth for the
// new-job form (`dashboard/recruiter/jobs/new`), the manage-jobs table
// (`dashboard/recruiter/jobs`), and the jobs API layer (`lib/api/jobs`).

export type JobType = "full-time" | "part-time" | "contract" | "internship"
export type JobStatus = "active" | "expired"

// Flat form data, keys mirror the Figma layer names (isRemote, deadline, minSalary…).
export type JobFormData = {
    title: string
    companyName: string
    category: string
    jobType: JobType
    isRemote: boolean
    location: string
    deadline: string
    minSalary: string
    maxSalary: string
    salaryFrequency: string
    responsibilities: string
    requirements: string
    applicants: number
    status: JobStatus
}

export const JOB_TYPES: JobType[] = ["full-time", "part-time", "contract", "internship"]

export const JOB_CATEGORIES = [
    "Engineering & Tech",
    "Design",
    "Product",
    "Marketing",
    "Infrastructure",
    "Quality",
]

export const SALARY_FREQUENCIES = ["per hour", "per day", "per week", "per month", "per year"]

// Table row: form data + the fields only the jobs table needs.
export type JobRow = JobFormData & {
    _id: string
    /** Relativized post date, e.g. "Posted 4d ago". */
    posted: string
}

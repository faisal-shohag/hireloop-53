// Shared application domain types — single source of truth for the
// "Apply Now" flow (`browse-jobs/[id]` / `lib/api/applications`) and the
// seeker My Applications page (`dashboard/seeker/applications`).
//
// The fields are the full My Applications table's needs (title, type •
// arrangement, company, relative applied time, status) plus salary/deadline
// context — applied jobs are saved as a snapshot of the job at apply time,
// so the applications page renders with no joins.

import type { JobType } from "@/lib/types/jobs"

export type ApplicationStatus =
  "applied" | "review" | "interview" | "shortlisted" | "rejected" | "offered"

export type CreateApplicationInput = { jobId: string }

/** Status pill labels + Figma "Seeker / My Applications" palette. */
export const STATUS_META: Record<
  ApplicationStatus,
  { label: string; color: string }
> = {
  applied: { label: "Applied", color: "#A1A4AA" },
  review: { label: "Review", color: "#F59E0B" },
  interview: { label: "Interview", color: "#5C53FE" },
  shortlisted: { label: "Shortlisted", color: "#60A5FA" },
  rejected: { label: "Rejected", color: "#EF4444" },
  offered: { label: "Offered", color: "#22C55E" },
}

// Flat payload posted to POST /applications.
export type ApplicationFormData = {
  jobId: string
  userId: string
  email: string

  // Job snapshot (what the My Applications table renders).
  jobTitle: string
  companyName: string
  jobType: JobType
  isRemote: boolean
  location: string
  minSalary: string
  maxSalary: string
  salaryFrequency: string
  deadline: string

  // Lifecycle.
  /** ISO timestamp — rendered as relative time ("2 hours ago"). */
  appliedAt: string
  status: ApplicationStatus
  /** Soft delete for the Active/Archived toggle. */
  archived: boolean
}

// Saved document: payload + the fields only the applications table needs.
export type ApplicationRow = ApplicationFormData & {
  _id: string
}

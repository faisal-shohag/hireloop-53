// Display formatters shared between dashboard pages (jobs table already uses
// them; seeker-facing job cards can reuse them later).

import type { JobFormData } from "@/lib/types/jobs"

/** "25", "40", "per hour" → "€25 – €40 / hr" (as in the Figma rows). */
export const formatCompensation = (job: JobFormData) =>
    `€${job.minSalary} – €${job.maxSalary} / ${job.salaryFrequency.replace("per ", "")}`

/** "2025-05-30" → "May 30, 2025". Fixed en-US so SSR and client agree. */
export const formatDeadline = (deadline: string) =>
    new Date(deadline).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })

/** ISO timestamp → "2 hours ago". Fixed en-US so SSR and client agree. */
export const formatRelativeTime = (appliedAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(appliedAt).getTime()) / 60000)
    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`
    const weeks = Math.floor(days / 7)
    if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`
    return formatDeadline(appliedAt)
}

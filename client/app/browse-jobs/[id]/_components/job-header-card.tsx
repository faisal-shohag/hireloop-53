// Header card for the job details page — from the Figma
// "Public / Job Details › Header Section": logo tile, title, company
// line, and the bookmark + Apply Now actions.
"use client"
import type { JobRow } from "@/lib/types/jobs"
import { Bookmark } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useRef, useState } from "react"
import { useSession } from "@/lib/auth-client"
import { createApplication } from "@/lib/api/applications"
import { ApiError } from "@/lib/api/http"
export function JobHeaderCard({ job }: { job: JobRow }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const user = session?.user
  const busy = useRef(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limitReached, setLimitReached] = useState(false)

  const handleApplyNow = async () => {
    if (busy.current) return
    setError(null)
    setLimitReached(false)
    if (!user) {
      router.push(`/sign-in?redirectTo=/browse-jobs/${job._id}`)
      return
    } else if (user.role === "seeker") {
      busy.current = true
      setSubmitting(true)
      try {
        await createApplication({ jobId: job._id })
        router.push("/dashboard/seeker/applications")
        router.refresh()
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.push(`/sign-in?redirectTo=/browse-jobs/${job._id}`)
        } else {
          setError(
            error instanceof Error
              ? error.message
              : "Your application could not be submitted."
          )
          setLimitReached(
            error instanceof ApiError &&
              error.code === "FREE_PLAN_LIMIT_REACHED"
          )
        }
      } finally {
        busy.current = false
        setSubmitting(false)
      }
    } else {
      setError("Sign in with a job seeker account to apply.")
    }
  }

  return (
    <section className="flex flex-wrap items-start justify-between gap-6 border border-white/10 bg-[#141418] p-8 shadow-[0_1px_2px_rgba(0,0,0,0.35)] shadow-[inset_0_1px_rgba(255,255,255,0.035)]">
      <div className="flex min-w-0 flex-wrap items-start gap-6">
        {/* Company logo tile: 80px tile, 70px inner logo (Figma) */}
        <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-[#1A1A1F]">
          <span className="brand-chip flex size-[70px] items-center justify-center rounded-xl text-2xl font-semibold">
            {job.companyName.charAt(0)}
          </span>
        </div>

        <div className="min-w-0">
          <h1 className="text-[32px] leading-10 font-semibold tracking-[-0.02em] text-[#EDEDEF]">
            {job.title}
          </h1>

          {/* Company line with dot separator */}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-[22px] font-semibold text-[#A0A0AB]">
              {job.companyName}
            </span>
            <span aria-hidden className="size-1 rounded-full bg-[#8E9192]" />
            <span className="text-base text-[#EDEDEF] capitalize">
              {job.location}
              {job.isRemote ? " (Remote)" : ""}
            </span>
            <span aria-hidden className="size-1 rounded-full bg-[#8E9192]" />
            <span className="text-base text-[#EDEDEF] capitalize">
              {job.jobType}
            </span>

            {/* Placeholder for a "Verified Employer" badge when the
                            data model gains an employer verification flag. */}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Bookmark ${job.title}`}
          // TODO: wire saving/bookmarking.
          className="flex size-12 items-center justify-center rounded-lg border border-white/10 bg-[#222228] text-[#E5E2E3] transition-colors hover:border-white/25 hover:text-white"
        >
          <Bookmark aria-hidden className="size-5" />
        </button>
        <button
          type="button"
          onClick={handleApplyNow}
          disabled={submitting || isPending}
          className="h-12 rounded-lg bg-[#FAFAFA] px-4 text-base font-medium text-[#0B0B0C] shadow-[0_1px_2px_rgba(0,0,0,0.35)] transition-colors hover:bg-white disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Apply Now"}
        </button>
      </div>
      {error && (
        <div
          role="alert"
          className="w-full rounded-lg border border-[#5C53FE]/30 bg-[#5C53FE]/10 p-4 text-sm"
        >
          <p>{error}</p>
          {limitReached && (
            <Link
              href="/pricing"
              className="mt-2 inline-block font-semibold text-[#B8B3FF] underline underline-offset-4"
            >
              Upgrade to Seeker Pro →
            </Link>
          )}
        </div>
      )}
    </section>
  )
}

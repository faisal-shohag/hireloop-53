// Single data-access module for the jobs API (Express on :5000).
// Replaces the old split between `lib/api/jobs.ts` and `lib/actions/jobs.ts`.

import type { JobFormData, JobRow } from "@/lib/types/jobs"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

export const getJobs = async (query = ''): Promise<JobRow[]> => {
    const res = await fetch(`${BASE_URL}/jobs?${query}`)
    return res.json()
}

export const getJobById = async (jobId: string): Promise<JobRow> => {
    const res = await fetch(`${BASE_URL}/jobs/${jobId}`)
    return res.json()
}

export const createJob = async (data: JobFormData) => {
    const res = await fetch(`${BASE_URL}/jobs`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(data),
    })
    return res.json()
}

export const deleteJob = async (jobId: string) => {
    const res = await fetch(`${BASE_URL}/jobs/${jobId}`, {
        method: "DELETE",
    })
    return res.json()
}

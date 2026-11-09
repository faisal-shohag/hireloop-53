// Data-access module for the applications API (Express on :5000).
// Follows the `lib/api/jobs.ts` pattern.

import type {
  CreateApplicationInput,
  ApplicationRow,
} from "@/lib/types/applications"
import { apiRequest } from "@/lib/api/http"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

// GET /applications?userId=… — placeholder until loading is wired.
export const getApplications = async (
  query = ""
): Promise<ApplicationRow[]> => {
  const res = await fetch(`${BASE_URL}/applications?${query}`)
  return res.json()
}

export const createApplication = (data: CreateApplicationInput) =>
  apiRequest<{ insertedId: string }>("/applications", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(data),
  })

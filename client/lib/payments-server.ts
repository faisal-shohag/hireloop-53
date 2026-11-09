import "server-only"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { apiRequest } from "@/lib/api/http"
import type { BillingState, PaymentVerification } from "@/lib/types/payments"

export async function requireSeekerSession(returnTo: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  })
  if (!session) redirect(`/sign-in?redirectTo=${encodeURIComponent(returnTo)}`)
  if (session.user.role !== "seeker")
    redirect(`/dashboard/${session.user.role}`)
  return session
}

async function authenticatedRequest<T>(path: string) {
  const requestHeaders = await headers()
  return apiRequest<T>(path, {
    headers: { cookie: requestHeaders.get("cookie") || "" },
  })
}

export const getBillingState = () =>
  authenticatedRequest<BillingState>("/payments/me")

export const verifyPayment = (sessionId: string) =>
  authenticatedRequest<PaymentVerification>(
    `/payments/verify?session_id=${encodeURIComponent(sessionId)}`
  )

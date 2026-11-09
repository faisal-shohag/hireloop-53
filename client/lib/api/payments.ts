import { apiRequest } from "@/lib/api/http"
import type { SeekerPlan } from "@/lib/types/payments"

export const getSeekerPlan = () =>
  apiRequest<SeekerPlan>("/payments/seeker-plan")

export const createCheckoutSession = () =>
  apiRequest<{ url: string }>("/create-checkout-session", { method: "POST" })

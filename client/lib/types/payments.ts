export type UserPlan = "free" | "pro"

export type SeekerPlan = {
  name: string
  amountMinor: number
  currency: string
  interval: "month"
  freeApplicationLimit: number
}

export type BillingState = {
  plan: UserPlan
  subscriptionStatus: string | null
  planValidUntil: string | null
  cancelAtPeriodEnd: boolean
  usage: { used: number; limit: number | null; resetAt: string }
  transactions: {
    id: string
    planName: string
    amountMinor: number
    currency: string
    paymentStatus: string
    createdAt: string
  }[]
}

export type PaymentVerification = {
  plan: UserPlan
  planName: string
  subscriptionStatus: string
  planValidUntil: string | null
}

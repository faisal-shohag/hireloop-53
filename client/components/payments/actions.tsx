"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth-client"
import { ApiError } from "@/lib/api/http"
import { createCheckoutSession } from "@/lib/api/payments"
import type { UserPlan } from "@/lib/types/payments"

export function UpgradeButton({ currentPlan }: { currentPlan?: UserPlan }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const busy = useRef(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [billingAttention, setBillingAttention] = useState(false)
  const otherRole = !!session && session.user.role !== "seeker"

  async function handleUpgrade() {
    if (busy.current) return
    if (!session) {
      router.push("/sign-in?redirectTo=%2Fpricing")
      return
    }
    busy.current = true
    setLoading(true)
    setError(null)
    setBillingAttention(false)
    try {
      const { url } = await createCheckoutSession()
      const checkoutUrl = new URL(url)
      if (
        checkoutUrl.protocol !== "https:" ||
        checkoutUrl.hostname !== "checkout.stripe.com"
      ) {
        throw new Error("Checkout returned an invalid URL. Please retry.")
      }
      window.location.assign(checkoutUrl.href)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push("/sign-in?redirectTo=%2Fpricing")
      } else if (error instanceof ApiError && error.code === "ALREADY_PRO") {
        router.push("/dashboard/seeker/billing")
      } else {
        setBillingAttention(
          error instanceof ApiError &&
            error.code === "SUBSCRIPTION_REQUIRES_ATTENTION"
        )
        setError(
          error instanceof Error ? error.message : "Checkout is unavailable."
        )
      }
      busy.current = false
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        className="btn-brand h-12 w-full text-base"
        onClick={handleUpgrade}
        disabled={loading || isPending || currentPlan === "pro" || otherRole}
      >
        {loading && <Loader2 aria-hidden className="size-4 animate-spin" />}
        {currentPlan === "pro"
          ? "Current plan"
          : otherRole
            ? "For job seekers"
            : loading
              ? "Opening secure checkout…"
              : "Upgrade to Seeker Pro"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
      {billingAttention && (
        <Link
          href="/dashboard/seeker/billing"
          className="text-sm text-[#B8B3FF] underline"
        >
          View billing & subscription status
        </Link>
      )}
    </div>
  )
}

export function RetryButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="outline"
      className="bg-[#FAFAFA] text-[#0B0B0F] hover:bg-[#EDEDEF] hover:text-[#0B0B0F]"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {pending ? "Retrying…" : "Try again"}
    </Button>
  )
}

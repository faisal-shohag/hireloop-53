import Link from "next/link"
import { ArrowUpRight, CalendarDays, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatBillingDate } from "@/lib/payment-formatters"
import type { BillingState } from "@/lib/types/payments"

export function BillingSummary({ billing }: { billing: BillingState }) {
  const isPro = billing.plan === "pro"
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <section className="surface-card space-y-4 p-6">
        <p className="text-sm text-white/60">Current plan</p>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">
            {isPro ? "Seeker Pro" : "Free"}
          </h2>
          <span className="rounded-full bg-[#5C53FE]/20 px-3 py-1 text-xs font-semibold text-[#B8B3FF]">
            {isPro ? "Pro" : "Free"}
          </span>
        </div>
        {isPro ? (
          <p className="text-sm text-white/60">
            Unlimited applications while your subscription is active.
          </p>
        ) : (
          <Button
            render={<Link href="/pricing" />}
            nativeButton={false}
            variant="link"
            className="p-0 text-[#B8B3FF]"
          >
            Explore Seeker Pro <ArrowUpRight aria-hidden />
          </Button>
        )}
        {billing.subscriptionStatus && (
          <p className="text-xs text-white/50 capitalize">
            Subscription: {billing.subscriptionStatus.replaceAll("_", " ")}
          </p>
        )}
      </section>
      <section className="surface-card space-y-4 p-6">
        <p className="flex items-center gap-2 text-sm text-white/60">
          <FileText aria-hidden className="size-4" /> Applications this month
        </p>
        <h2 className="text-2xl font-semibold">
          {billing.usage.used}
          <span className="ml-2 text-base font-normal text-white/50">
            / {isPro ? "unlimited" : billing.usage.limit}
          </span>
        </h2>
        <p className="text-sm text-white/60">
          {isPro
            ? "Keep applying to the roles you love."
            : `${Math.max(0, (billing.usage.limit ?? 5) - billing.usage.used)} free applications remaining.`}
        </p>
      </section>
      <section className="surface-card space-y-4 p-6">
        <p className="flex items-center gap-2 text-sm text-white/60">
          <CalendarDays aria-hidden className="size-4" />{" "}
          {isPro
            ? billing.cancelAtPeriodEnd
              ? "Pro access ends"
              : "Next renewal"
            : "Application limit resets"}
        </p>
        <h2 className="text-xl font-semibold">
          {formatBillingDate(
            isPro && billing.planValidUntil
              ? billing.planValidUntil
              : billing.usage.resetAt
          )}
        </h2>
        <p className="text-sm text-white/60">
          {isPro
            ? billing.cancelAtPeriodEnd
              ? "Your subscription is scheduled to cancel."
              : "Your plan renews automatically each month."
            : "On the first of each month, at 00:00 UTC."}
        </p>
      </section>
    </div>
  )
}

import Link from "next/link"
import { headers } from "next/headers"
import { Check, ShieldCheck } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { Button } from "@/components/ui/button"
import { UpgradeButton } from "@/components/payments/actions"
import { PaymentLoadError } from "@/components/payments/load-error"
import { auth } from "@/lib/auth"
import { getSeekerPlan } from "@/lib/api/payments"
import { getBillingState } from "@/lib/payments-server"
import { formatMoney } from "@/lib/payment-formatters"

export default async function PricingPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const result = await getSeekerPlan().then(
    (plan) => ({ plan, error: null }),
    (error: Error) => ({ plan: null, error: error.message })
  )
  const billing =
    session?.user.role === "seeker"
      ? await getBillingState().then(
          (data) => ({ data, error: null }),
          (error: Error) => ({ data: null, error: error.message })
        )
      : null

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-[#EDEDEF]">
      <SiteNavbar />
      <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <header className="mx-auto mb-10 max-w-2xl text-center">
          <p className="overline-label mb-3">BUILT FOR YOUR NEXT CHAPTER</p>
          <h1 className="page-title text-4xl sm:text-5xl">
            More opportunities. One simple plan.
          </h1>
          <p className="mt-5 text-base leading-7 text-white/60">
            Start your job search for free. Upgrade to Seeker Pro when you want
            to apply without a monthly limit.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          <section className="surface-card flex flex-col gap-6 p-8">
            <div>
              <h2 className="text-2xl font-semibold">Free</h2>
              <p className="mt-2 text-white/60">A great place to start.</p>
            </div>
            <p className="text-4xl font-semibold">
              $0
              <span className="ml-2 text-sm font-normal text-white/50">
                / month
              </span>
            </p>
            <ul className="space-y-4 text-sm text-white/80">
              <li className="flex gap-3">
                <Check aria-hidden className="size-5 text-[#AFA9FF]" /> 5 job
                applications per month
              </li>
              <li className="flex gap-3">
                <Check aria-hidden className="size-5 text-[#AFA9FF]" /> Browse
                jobs and track your applications
              </li>
              <li className="flex gap-3">
                <Check aria-hidden className="size-5 text-[#AFA9FF]" /> Limit
                resets on the first of each month (UTC)
              </li>
            </ul>
            <Button
              render={
                <Link
                  href={
                    session ? `/dashboard/${session.user.role}` : "/sign-up"
                  }
                />
              }
              nativeButton={false}
              variant="outline"
              className="mt-auto h-12 w-full bg-[#FAFAFA] text-base text-[#0B0B0F] hover:bg-[#EDEDEF] hover:text-[#0B0B0F]"
            >
              {session ? "Go to dashboard" : "Get started for free"}
            </Button>
          </section>
          <section className="surface-card flex flex-col gap-6 border-[#5C53FE]/60 p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold">Seeker Pro</h2>
              <span className="rounded-full bg-[#5C53FE]/20 px-3 py-1 text-xs font-medium text-[#B8B3FF]">
                GO FURTHER
              </span>
            </div>
            {result.plan ? (
              <>
                <p className="text-4xl font-semibold">
                  {formatMoney(result.plan.amountMinor, result.plan.currency)}
                  <span className="ml-2 text-sm font-normal text-white/50">
                    / month
                  </span>
                </p>
                <ul className="space-y-4 text-sm text-white/80">
                  <li className="flex gap-3">
                    <Check aria-hidden className="size-5 text-[#AFA9FF]" />{" "}
                    Unlimited applications with an active plan
                  </li>
                  <li className="flex gap-3">
                    <Check aria-hidden className="size-5 text-[#AFA9FF]" />{" "}
                    Monthly subscription, billed automatically
                  </li>
                  <li className="flex gap-3">
                    <Check aria-hidden className="size-5 text-[#AFA9FF]" />{" "}
                    Payment history in your dashboard
                  </li>
                </ul>
                <div className="mt-auto">
                  {billing?.error ? (
                    <PaymentLoadError message={billing.error} />
                  ) : (
                    <UpgradeButton currentPlan={billing?.data?.plan} />
                  )}
                </div>
              </>
            ) : (
              <PaymentLoadError
                message={result.error || "Pricing is unavailable."}
              />
            )}
          </section>
        </div>
        <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-white/50">
          <ShieldCheck aria-hidden className="size-4 shrink-0" /> Secure
          checkout powered by Stripe. Card details stay with Stripe.
        </p>
      </main>
    </div>
  )
}

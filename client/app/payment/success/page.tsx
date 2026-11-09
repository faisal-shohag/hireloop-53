import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RetryButton } from "@/components/payments/actions"
import { PaymentResult } from "@/components/payments/payment-result"
import { requireSeekerSession, verifyPayment } from "@/lib/payments-server"

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string | string[] }>
}) {
  const { session_id } = await searchParams
  if (
    typeof session_id !== "string" ||
    !/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(session_id) ||
    session_id.length > 255
  ) {
    return (
      <PaymentResult success={false} title="Invalid payment session">
        <p className="text-white/60">
          A valid Checkout session is needed to confirm your payment.
        </p>
        <Button render={<Link href="/pricing" />} nativeButton={false}>
          View plans
        </Button>
      </PaymentResult>
    )
  }
  await requireSeekerSession(
    `/payment/success?session_id=${encodeURIComponent(session_id)}`
  )
  const result = await verifyPayment(session_id).then(
    (payment) => ({ payment, error: null }),
    (error: Error) => ({ payment: null, error: error.message })
  )
  return (
    <PaymentResult
      success={!!result.payment}
      title={result.payment ? "Payment confirmed" : "Payment not confirmed"}
    >
      {result.payment ? (
        <>
          <p className="text-white/60">
            {result.payment.plan === "pro"
              ? "Welcome to Seeker Pro. You can now apply without a monthly limit."
              : "Your payment was received. This subscription is currently inactive; open Billing to view your current plan."}
          </p>
          <Button
            render={<Link href="/dashboard/seeker/billing" />}
            nativeButton={false}
            className="btn-brand h-12 w-full"
          >
            View billing & plan
          </Button>
        </>
      ) : (
        <>
          <p role="alert" className="text-white/60">
            {result.error}
          </p>
          <RetryButton />
        </>
      )}
    </PaymentResult>
  )
}

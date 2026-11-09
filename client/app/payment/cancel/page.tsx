import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PaymentResult } from "@/components/payments/payment-result"

export default function PaymentCancelPage() {
  return (
    <PaymentResult success={false} title="Checkout cancelled">
      <p className="text-white/60">
        Your checkout was cancelled. Your plan has not changed. You can return
        to pricing whenever you are ready.
      </p>
      <Button
        render={<Link href="/pricing" />}
        nativeButton={false}
        className="btn-brand h-12 w-full"
      >
        Return to pricing
      </Button>
    </PaymentResult>
  )
}

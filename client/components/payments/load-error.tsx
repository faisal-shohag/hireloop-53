import { RetryButton } from "@/components/payments/actions"

export function PaymentLoadError({ message }: { message: string }) {
  return (
    <div role="alert" className="surface-card space-y-4 p-6">
      <h2 className="text-lg font-semibold">Unable to load payment details</h2>
      <p className="text-sm text-white/60">{message}</p>
      <RetryButton />
    </div>
  )
}

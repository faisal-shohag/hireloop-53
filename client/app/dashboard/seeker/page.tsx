import Link from "next/link"
import { PageContainer, PageHeader } from "@/components/dashboard/page-shell"
import { BillingSummary } from "@/components/payments/billing-summary"
import { PaymentLoadError } from "@/components/payments/load-error"
import { Button } from "@/components/ui/button"
import { getBillingState, requireSeekerSession } from "@/lib/payments-server"

export default async function SeekerDashboardPage() {
  const session = await requireSeekerSession("/dashboard/seeker")
  const result = await getBillingState().then(
    (billing) => ({ billing, error: null }),
    (error: Error) => ({ billing: null, error: error.message })
  )
  return (
    <div className="min-h-screen bg-[#0B0B0F] text-[#EDEDEF]">
      <PageContainer width="wide">
        <PageHeader
          overline="SEEKER DASHBOARD"
          title={`Welcome, ${session.user.name}`}
          subtitle="Your next opportunity starts here."
          action={
            <Button
              render={<Link href="/browse-jobs" />}
              nativeButton={false}
              className="btn-brand"
            >
              Browse jobs
            </Button>
          }
        />
        {result.billing ? (
          <BillingSummary billing={result.billing} />
        ) : (
          <PaymentLoadError
            message={result.error || "Your plan could not be loaded."}
          />
        )}
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-[#B8B3FF]">
          <Link href="/dashboard/seeker/applications">My applications →</Link>
          <Link href="/dashboard/seeker/billing">
            Billing & payment history →
          </Link>
        </div>
      </PageContainer>
    </div>
  )
}

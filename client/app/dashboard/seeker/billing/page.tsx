import { PageContainer, PageHeader } from "@/components/dashboard/page-shell"
import { BillingSummary } from "@/components/payments/billing-summary"
import { PaymentLoadError } from "@/components/payments/load-error"
import { getBillingState, requireSeekerSession } from "@/lib/payments-server"
import { formatBillingDate, formatMoney } from "@/lib/payment-formatters"

export default async function SeekerBillingPage() {
  await requireSeekerSession("/dashboard/seeker/billing")
  const result = await getBillingState().then(
    (billing) => ({ billing, error: null }),
    (error: Error) => ({ billing: null, error: error.message })
  )
  return (
    <div className="min-h-screen bg-[#0B0B0F] text-[#EDEDEF]">
      <PageContainer width="wide">
        <PageHeader
          overline="YOUR ACCOUNT"
          title="Billing & plan"
          subtitle="View your plan, monthly applications, and payment history."
        />
        {result.billing ? (
          <div className="space-y-8">
            <BillingSummary billing={result.billing} />
            <section className="surface-card overflow-hidden">
              <div className="border-b border-white/10 p-6">
                <h2 className="text-lg font-semibold">Payment history</h2>
                <p className="mt-1 text-sm text-white/50">
                  Verified Checkout payments for your account.
                </p>
              </div>
              {result.billing.transactions.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-white/50">
                      <tr>
                        {["Plan", "Amount", "Date (UTC)", "Status"].map(
                          (label) => (
                            <th
                              key={label}
                              scope="col"
                              className="px-6 py-4 font-medium"
                            >
                              {label}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {result.billing.transactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-t border-white/10"
                        >
                          <td className="px-6 py-4">{transaction.planName}</td>
                          <td className="px-6 py-4">
                            {formatMoney(
                              transaction.amountMinor,
                              transaction.currency
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-white/60">
                            {formatBillingDate(transaction.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 capitalize">
                              {transaction.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="p-8 text-sm text-white/50">
                  No payments yet. Your verified payments will appear here.
                </p>
              )}
            </section>
          </div>
        ) : (
          <PaymentLoadError
            message={result.error || "Billing is unavailable."}
          />
        )}
      </PageContainer>
    </div>
  )
}

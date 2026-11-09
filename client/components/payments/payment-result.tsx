import Link from "next/link"
import { CircleCheck, CircleX } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { Button } from "@/components/ui/button"

export function PaymentResult({
  success,
  title,
  children,
}: {
  success: boolean
  title: string
  children: React.ReactNode
}) {
  const Icon = success ? CircleCheck : CircleX
  return (
    <div className="min-h-screen bg-[#0B0B0F] text-[#EDEDEF]">
      <SiteNavbar />
      <main className="mx-auto max-w-xl px-4 py-20 sm:px-6">
        <div className="surface-card space-y-6 p-8 text-center sm:p-10">
          <Icon
            aria-hidden
            className={`mx-auto size-14 ${success ? "text-emerald-400" : "text-[#AFA9FF]"}`}
          />
          <h1 className="page-title">{title}</h1>
          {children}
          <Button
            render={<Link href="/dashboard/seeker" />}
            nativeButton={false}
            variant="link"
            className="text-white/60"
          >
            Back to dashboard
          </Button>
        </div>
      </main>
    </div>
  )
}

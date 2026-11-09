import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"

// Shared shell for the sign-in / sign-up pages: dark canvas with the brand
// purple glow behind a centered auth card. Pages inside this group render the
// card contents only.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-svh overflow-hidden bg-[#010103] text-white">
      {/* Ambient purple glow behind the card */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 h-[560px] w-[min(980px,150vw)] max-w-none -translate-x-1/2 -translate-y-1/2 [background:radial-gradient(closest-side,rgba(92,83,254,0.38)_0%,rgba(92,83,254,0.16)_48%,transparent_78%)]"
      />

      <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-lg flex-col items-center px-4 py-6 sm:px-6">
        <Link href="/" aria-label="HireLoop home" className="block shrink-0">
          <Image
            src="/logo.png"
            alt="HireLoop"
            width={160}
            height={44}
            priority
            className="h-11 w-auto"
          />
        </Link>

        <main className="mt-10 flex w-full flex-1 flex-col justify-center pb-10 sm:justify-start">
          {children}
        </main>
      </div>
    </div>
  )
}

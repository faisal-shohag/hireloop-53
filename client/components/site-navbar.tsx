"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSession, signOut } from "@/lib/auth-client"


export function SiteNavbar() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false);
  const { data: session } = useSession();


  const NAV_LINKS = [
    { label: "Browse Jobs", href: "/browse-jobs" },
    { label: "Company", href: "/company" },
    { label: "Pricing", href: "/pricing" },
    { label: "Dashboard", href: `/dashboard/${session?.user.role || 'seeker'}` },
  ] as const

  React.useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])


  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="sticky top-4 z-50 px-4 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
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

        {/* Desktop */}
        <nav
          aria-label="Main navigation"
          className="hidden h-[68px] items-center gap-6 rounded-lg border border-white/10 bg-[#1A1A1F] px-6 pt-2 pb-2 lg:flex"
        >
          <ul className="flex items-center gap-5">
            {NAV_LINKS.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(link.href + "/")

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "text-base tracking-[-0.0125rem] transition-colors hover:text-white",
                      active
                        ? "font-bold text-[#EDEDEF] underline underline-offset-3"
                        : "text-[#EDEDEF]/90"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Separator */}
          <div aria-hidden className="h-px w-6 bg-[#A8A8A8]/40" />

          <div className="flex items-center gap-4">
            {session?.user ?
              <>
                <span className="text-[#EDEDEF]">Welcome, {session.user.name}!</span>
                <Button
                  onClick={handleSignOut}
                  nativeButton={false}
                  className="h-[38px] rounded-[8px] bg-transparent px-4 text-lg font-semibold text-[#645AFF] hover:bg-white/5 hover:text-[#645AFF]"
                >
                  Sign Out
                </Button>
              </>
              : <>
                <Button
                  render={<Link href="/sign-in" />}
                  nativeButton={false}
                  className="h-[38px] rounded-[8px] bg-transparent px-4 text-lg font-semibold text-[#645AFF] hover:bg-white/5 hover:text-[#645AFF]"
                >
                  Sign In
                </Button>
                <Button
                  render={<Link href="/sign-up" />}
                  nativeButton={false}
                  className="h-[52px] rounded-[8px] bg-[#5C53FE] px-6 text-lg font-medium text-[#EDEDEF] shadow-[inset_0_3px_10px_rgba(255,255,255,0.2)] hover:bg-[#7B74FF]"
                >
                  Get Started
                </Button>
              </>}
          </div>
        </nav>

        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          aria-expanded={open}
          aria-controls="site-navbar-mobile"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "size-11 rounded-lg border border-white/10 bg-[#1A1A1F] text-[#EDEDEF] hover:bg-white/5 hover:text-white lg:hidden"
          )}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {/* Mobile panel */}
      {open ? (
        <div
          id="site-navbar-mobile"
          className="mx-auto mt-3 flex max-w-7xl flex-col gap-2 rounded-lg border border-white/10 bg-[#1A1A1F] p-4 shadow-xl lg:hidden"
        >
          <ul className="flex flex-col">
            {NAV_LINKS.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(link.href + "/")

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-md px-3 py-2 text-base tracking-[-0.0125rem] transition-colors hover:bg-white/5 hover:text-white",
                      active
                        ? "font-bold text-[#EDEDEF] underline underline-offset-3"
                        : "text-[#EDEDEF]/90"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div aria-hidden className="h-px w-full bg-[#A8A8A8]/40" />

          <div className="flex flex-col gap-2">
            <Button
              render={<Link href="/sign-in" onClick={() => setOpen(false)} />}
              nativeButton={false}
              className="h-[44px] rounded-[8px] border border-white/10 bg-transparent px-4 text-lg font-semibold text-[#645AFF] hover:bg-white/5 hover:text-[#645AFF]"
            >
              Sign In
            </Button>
            <Button
              render={<Link href="/sign-up" onClick={() => setOpen(false)} />}
              nativeButton={false}
              className="h-[52px] rounded-[8px] bg-[#5C53FE] px-6 text-lg font-medium text-[#EDEDEF] shadow-[inset_0_3px_10px_rgba(255,255,255,0.2)] hover:bg-[#7B74FF]"
            >
              Get Started
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  )
}

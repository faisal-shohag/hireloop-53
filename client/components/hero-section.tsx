"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { MapPin, Search, Sparkles } from "lucide-react"

import globe from "@/app/images/globe.png"

// Matches the "Hireloop 2.0" home hero: centered headline over a dark space-y
// background with a glowing globe art layer below.
const TRENDING = [
  "Product Designer",
  "AI Engineering",
  "Dev-ops Engineer",
] as const

const inputFieldClass =
  "flex h-11 flex-1 items-center gap-2 text-base leading-[1.7]"

export function HeroSection() {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [location, setLocation] = React.useState("")

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()

    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    if (location.trim()) params.set("location", location.trim())

    router.push(`/jobs${params.size ? `?${params.toString()}` : ""}`)
  }

  return (
    <section className="relative overflow-hidden bg-[#010103] text-white">
      <div className="relative z-10 mx-auto max-w-4xl px-4 pt-10 text-center sm:px-6">
        {/* Badge */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <div
            aria-hidden
            className="hidden h-px w-16 bg-gradient-to-r from-[#010123] to-[#A8A8A8] opacity-70 sm:block"
          />
          <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-b from-[#474747] to-[#010102] px-6 py-3 shadow-[inset_0_0_6px_6px_rgba(255,255,255,0.1)]">
            <Sparkles aria-hidden className="size-6" />
            <span className="font-badge text-xl leading-[1.2]">
              50,000+ new jobs this month
            </span>
          </div>
          <div
            aria-hidden
            className="hidden h-px w-16 bg-gradient-to-l from-[#010123] to-[#A8A8A8] opacity-70 sm:block"
          />
        </div>

        {/* Title */}
        <div className="flex flex-col items-center gap-4">
          <h1 className="font-heading text-[40px] leading-[1.15] font-bold tracking-[-0.02em] md:text-[56px]">
            Find Your Dream Job Today
          </h1>
          <p className="text-lg leading-[1.6] md:text-xl">
            HireLoop connects top talent with world-class companies. Browse
            thousands of curated opportunities and land your next role — faster.
          </p>
        </div>

        {/* Search */}
        <form
          onSubmit={onSubmit}
          role="search"
          className="mt-6 rounded-2xl border border-white/20 bg-[#101010] p-2 md:p-3"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-6 md:px-3">
            <div className={inputFieldClass}>
              <Search aria-hidden className="size-6 shrink-0" />
              <input
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Job title, skill or company"
                className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-white/70"
              />
            </div>

            <div aria-hidden className="hidden h-6 w-px bg-white/20 md:block" />

            <div className={inputFieldClass}>
              <MapPin aria-hidden className="size-6 shrink-0" />
              <input
                name="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location or Remote"
                className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-white/70"
              />
            </div>

            <button
              type="submit"
              aria-label="Search jobs"
              className="mt-1 flex size-12 shrink-0 items-center justify-center self-center rounded-xl bg-[#5C53FE] transition-colors hover:bg-[#7B74FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40 md:mt-0 md:self-auto"
            >
              <Search aria-hidden className="size-6" />
            </button>
          </div>
        </form>

        {/* Trending positions */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <span className="text-base">Trending Position</span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {TRENDING.map((label) => (
              <a
                key={label}
                href={`/jobs?q=${encodeURIComponent(label)}`}
                className="rounded-full border border-white/10 bg-[#1A1A1B] px-3 py-1.5 text-sm leading-[1.5] transition-colors hover:border-[#5C53FE]/50 hover:bg-[#5C53FE]"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Hero art: purple glow behind the globe, globe bleeds off the bottom */}
      <div className="relative z-0 h-[440px] sm:h-[560px] lg:h-[732px]">
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 h-[min(1037px,180vw)] w-[min(1236px,86vw)] max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5C53FE] blur-[148px]"
        />
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 h-[min(1037px,178vw)] w-[min(1208px,84vw)] max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#010103]"
        />
        <div className="absolute inset-y-0 left-1/2 w-full max-w-[1180px] -translate-x-1/2">
          <Image
            src={globe}
            alt=""
            aria-hidden
            priority
            placeholder="blur"
            sizes="(min-width: 1248px) 1180px, 100vw"
            className="object-cover object-bottom select-none"
          />
          {/* Apex glow over the horizon so it lights the globe, not just the sky */}
          <div
            aria-hidden
            className="absolute inset-0 mix-blend-screen [background:radial-gradient(75%_60%_at_50%_32%,rgba(92,83,254,0.50)_0%,rgba(92,83,254,0.22)_42%,transparent_72%)]"
          />
        </div>
      </div>
    </section>
  )
}

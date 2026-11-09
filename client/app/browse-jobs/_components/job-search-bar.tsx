"use client"

// Search bar for the Browse Jobs page — mirrors the Figma
// "Section - Search & Quick Filters".
//
// Submit is intentionally a no-op stub: changing the query does not
// navigate or set any URL state. Implement the real search here later
// (e.g. router.push with ?q= plus the current filter values).

import { useRouter } from "next/navigation"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

export function JobSearchBar() {

    const router = useRouter()

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const formData = new FormData(event.currentTarget)
        const data = Object.fromEntries(formData.entries())
        
        const search = data.searchField;

        const params = new URLSearchParams()
        params.set('search', search as string);
        router.push(`/browse-jobs?${params.toString()}`)

    }

    return (
        <form
            onSubmit={handleSubmit}
            role="search"
            className="surface-card flex flex-col gap-3 p-6 sm:flex-row sm:items-center"
        >
            <div className="relative flex-1">
                <Search
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8E9192]"
                />
                <Input
                    name="searchField"
                    aria-label="Search jobs"
                    placeholder="Search by job title, keywords..."
                    className="surface-field h-12 w-full pr-3 pl-10 text-sm text-[#EDEDEF] placeholder:text-[#A0A0AB]"
                />
            </div>
            <button type="submit" className={cn(buttonVariants(), "bg-white text-[#2F3131] hover:bg-white/90 sm:h-12")}>
                Search Jobs
            </button>
        </form>
    )
}

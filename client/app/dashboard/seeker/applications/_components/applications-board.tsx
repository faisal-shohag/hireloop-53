"use client"

// The My Applications UI — from the Figma "Seeker / My Applications":
// header with Active/Archived segmented toggle + Export PDF, a four-cell
// stats bento, and a table of applications with status pills.
//
// Data comes in as a prop (dummy data for now); stats mirror the Figma
// layout but are computed from the actual list.

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/formatters"
import { STATUS_META, type ApplicationRow, type ApplicationStatus } from "@/lib/types/applications"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"

const cardShadow =
    "shadow-[0_1px_2px_rgba(0,0,0,0.35)] shadow-[inset_0_1px_rgba(255,255,255,0.035)]"

/** Status pill: colored border + text on a 10% tint of the same color. */
function StatusPill({ status }: { status: ApplicationStatus }) {
    const { label, color } = STATUS_META[status]
    return (
        <span
            className="inline-flex h-[22px] items-center whitespace-nowrap rounded-full border px-2.5 text-xs font-medium"
            style={{ color, borderColor: color, backgroundColor: `${color}1A` }}
        >
            {label}
        </span>
    )
}

// Avatar tile palette from the Figma rows (32×32, radius 4).
const AVATAR_TILES = [
    { bg: "#222228", fg: "#EDEDEF" },
    { bg: "#474746", fg: "#EDEDEF" },
    { bg: "#C6C6C7", fg: "#2F3131" },
]

const headerCellClass = "px-3 py-3 text-[12px] font-medium text-[#6E6E78]"

const stats = [
    { label: "Total Applied", tone: "text-[#EDEDEF]" },
    { label: "Shortlisted", tone: "text-[#EDEDEF]" },
    { label: "Interviews", tone: "text-[#F59E0B]" },
    { label: "Success Rate", tone: "text-[#22C55E]" },
]

type Tab = "active" | "archived"

export function ApplicationsBoard({
    applications,
}: {
    applications: readonly ApplicationRow[]
}) {
    const [tab, setTab] = useState<Tab>("active")
    const rows = applications.filter((app) =>
        tab === "active" ? !app.archived : app.archived,
    )

    const count = (status: ApplicationStatus) =>
        applications.filter((app) => app.status === status).length
    const statValues = [
        String(applications.length),
        String(count("shortlisted")),
        String(count("review")),
        `${Math.round((count("offered") / Math.max(applications.length, 1)) * 100)}%`,
    ]

    return (
        <div>
            {/* Page header + right-side controls */}
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#EDEDEF]">
                        My Applications
                    </h1>
                    <p className="mt-1 text-[13px] text-[#A0A0AB]">
                        Track your job applications and interview progress in real-time.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Active / Archived segmented toggle */}
                    <div
                        role="tablist"
                        aria-label="Filter applications"
                        className="flex rounded-md border border-white/10 bg-[#1A1A1F] p-[5px]"
                    >
                        {(["active", "archived"] as const).map((value) => (
                            <button
                                key={value}
                                type="button"
                                role="tab"
                                aria-selected={tab === value}
                                onClick={() => setTab(value)}
                                className={cn(
                                    "h-8 rounded-[4px] px-4 text-[13px] transition-colors",
                                    tab === value
                                        ? "text-[#EDEDEF]"
                                        : "text-[#A0A0AB] hover:text-[#EDEDEF]",
                                )}
                            >
                                {value === "active" ? "Active" : "Archived"}
                            </button>
                        ))}
                    </div>

                    {/* Export PDF — TODO: wire the export handler. */}
                    <button
                        type="button"
                        className={cn(
                            "flex h-[42px] items-center gap-2 rounded-md bg-[#FAFAFA] px-4 text-[13px] font-medium text-[#0B0B0C]",
                            cardShadow,
                            "transition-colors hover:bg-white",
                        )}
                    >
                        <Download aria-hidden className="size-3" />
                        Export PDF
                    </button>
                </div>
            </header>

            {/* Stats bento */}
            <dl className="mt-6 grid grid-cols-2 gap-6 lg:grid-cols-4">
                {stats.map(({ label, tone }, index) => (
                    <div
                        key={label}
                        className={cn(
                            "border border-white/10 bg-[#141418] px-6 py-4",
                            cardShadow,
                        )}
                    >
                        <dt className="text-[13px] text-[#A0A0AB]">{label}</dt>
                        <dd className={cn("mt-2.5 text-[26px] leading-8 font-semibold", tone)}>
                            {statValues[index]}
                        </dd>
                    </div>
                ))}
            </dl>

            {/* Applications table */}
            <section
                className={cn(
                    "mt-6 overflow-hidden border border-white/10 bg-[#141418]",
                    cardShadow,
                )}
            >
                <div className="overflow-x-auto">
                    <table className="w-full table-fixed min-w-3xl text-left">
                        <colgroup>
                            <col className="w-[30%]" />
                            <col className="w-[20%]" />
                            <col className="w-[15%]" />
                            <col className="w-[17%]" />
                            <col />
                        </colgroup>

                        <thead>
                            <tr className="bg-[#1A1A1F]">
                                <th scope="col" className={cn(headerCellClass, "pl-4")}>Job Title</th>
                                <th scope="col" className={headerCellClass}>Company</th>
                                <th scope="col" className={headerCellClass}>Applied</th>
                                <th scope="col" className={headerCellClass}>Status</th>
                                <th scope="col" className={cn(headerCellClass, "pr-4 text-right")}>
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map((app, index) => {
                                const tile = AVATAR_TILES[index % AVATAR_TILES.length]
                                return (
                                    <tr
                                        key={app._id}
                                        className="h-16 border-t border-white/10"
                                    >
                                        <td className="pl-4">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    aria-hidden
                                                    className="flex size-8 shrink-0 items-center justify-center rounded-[4px] text-[13px] font-medium"
                                                    style={{ backgroundColor: tile.bg, color: tile.fg }}
                                                >
                                                    {app.companyName.charAt(0)}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate text-[13px] font-medium text-[#EDEDEF]">
                                                        {app.jobTitle}
                                                    </p>
                                                    <p className="truncate text-xs text-[#A0A0AB]">
                                                        {app.jobType} • {app.isRemote ? "Remote" : "On-site"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="truncate pr-3 text-[13px] text-[#EDEDEF]">
                                            {app.companyName}
                                        </td>
                                        <td className="pr-3 text-[13px] text-[#A0A0AB]">
                                            {formatRelativeTime(app.appliedAt)}
                                        </td>
                                        <td className="pr-3">
                                            <StatusPill status={app.status} />
                                        </td>
                                        <td className="pr-4 text-right">
                                            <Link
                                                href={`/browse-jobs/${app.jobId}`}
                                                className="text-[13px] text-[#EDEDEF] hover:underline"
                                            >
                                                Details
                                            </Link>
                                        </td>
                                    </tr>
                                )
                            })}

                            {rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-10 text-center text-[13px] text-[#6E6E78]"
                                    >
                                        No {tab} applications yet.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
                    <p className="text-[13px] text-[#A0A0AB]">
                        Showing 1-{rows.length} of {applications.length} applications
                    </p>

                    {/* Pagination — static until real paging is wired. */}
                    <div className="flex items-center gap-1.5">
                        <button type="button" aria-label="Previous page" disabled
                            className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-[#1A1A1F] text-[#6E6E78]">
                            <ChevronLeft aria-hidden className="size-4" />
                        </button>
                        <span className="flex size-8 items-center justify-center rounded-lg bg-white text-[13px] font-medium text-[#0B0B0C]">
                            1
                        </span>
                        <button type="button" aria-label="Next page" disabled
                            className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-[#1A1A1F] text-[#6E6E78]">
                            <ChevronRight aria-hidden className="size-4" />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    )
}

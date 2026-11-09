// Main content card for the job details page — the Figma
// "Content Sections" card: description paragraph, then sections
// separated by horizontal white/10 borders.
//
// Fields without backend data (Benefits block, skill chips) are left
// out until the data model grows those fields.

import type { JobRow } from "@/lib/types/jobs"

const headingClass =
    "text-[22px] font-semibold tracking-[-0.02em] text-[#EDEDEF]"
const bodyClass = "text-[13px] leading-5 text-[#A0A0AB]"

/** "• A\n B" → ["A", "B"] — strips bullets and blank lines. */
const toBullets = (text: string) =>
    text
        .split("\n")
        .map((line) => line.trim().replace(/^•\s*/, ""))
        .filter(Boolean)

/** Figma bullet row: 6px white dot + text, 24px gap. */
function BulletList({ items }: { items: readonly string[] }) {
    return (
        <ul className="list-none">
            {items.map((item) => (
                <li key={item} className={`${bodyClass} flex items-start gap-6 py-1.5`}>
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-white" />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    )
}

/** One narrative/bullet block — bullets when the text has several lines. */
function JobText({ text }: { text: string }) {
    const bullets = toBullets(text)
    return bullets.length > 1 ? <BulletList items={bullets} /> : <p className={bodyClass}>{text}</p>
}

export function JobContentCard({ job }: { job: JobRow }) {
    return (
        <section className="border border-white/10 bg-[#141418] p-8 shadow-[0_1px_2px_rgba(0,0,0,0.35)] shadow-[inset_0_1px_rgba(255,255,255,0.035)]">
            <div className="pb-7">
                <h2 className={headingClass}>Job Description</h2>
                <div className="mt-5">
                    <JobText text={job.responsibilities} />
                </div>
            </div>

            <div className="border-t border-white/10 py-7">
                <h2 className={headingClass}>Requirements</h2>
                <div className="mt-5">
                    <JobText text={job.requirements} />
                </div>
            </div>
        </section>
    )
}

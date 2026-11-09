"use client"

// Single-select pill row (shadcn RadioGroup wrapped by styled labels).
// Shared by the sign-up role picker and the job-type pills in the new-job form.

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

type PillOption<T extends string> = {
    value: T
    label: string
    icon?: React.ComponentType<{ className?: string }>
}

export function PillGroup<T extends string>({
    name,
    value,
    onChange,
    options,
    className,
    pillClassName,
}: {
    /** Radio group name — also becomes each pill's id (`${name}-${value}`). */
    name: string
    value: T
    onChange: (value: T) => void
    options: readonly PillOption<T>[]
    /** Layout classes for the group, e.g. "grid grid-cols-3 gap-2". */
    className?: string
    /** Extra pill classes: role pills stack vertically, job-type pills are horizontal. */
    pillClassName?: string
}) {
    return (
        <RadioGroup
            name={name}
            value={value}
            onValueChange={(selected) => onChange(selected as T)}
            className={className}
        >
            {options.map(({ value: optionValue, label, icon: Icon }) => {
                const selected = value === optionValue

                return (
                    <Label
                        key={optionValue}
                        htmlFor={`${name}-${optionValue}`}
                        className={cn(
                            "flex cursor-pointer items-center rounded-lg border text-sm transition-colors has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-[#5C53FE]/60",
                            selected
                                ? "border-[#5C53FE] bg-[#5C53FE]/15 text-white"
                                : "border-white/10 bg-[#1A1A1F] text-white/70 hover:border-white/25 hover:text-white",
                            pillClassName,
                        )}
                    >
                        <RadioGroupItem
                            value={optionValue}
                            id={`${name}-${optionValue}`}
                            className="sr-only"
                        />
                        {Icon ? <Icon aria-hidden className="size-5" /> : null}
                        <span>{label}</span>
                    </Label>
                )
            })}
        </RadioGroup>
    )
}

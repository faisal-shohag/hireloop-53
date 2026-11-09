// Labeled field wrapper — "flex flex-col gap-2" + <Label> + optional hint,
// previously repeated ~14× in the new-job form alone.

import { Label } from "@/components/ui/label"

export function Field({
    label,
    htmlFor,
    hint,
    required,
    children,
}: {
    label: string
    htmlFor: string
    /** Small helper text shown under the control (e.g. "Required"). */
    hint?: string
    /** Renders the red asterisk after the label. */
    required?: boolean
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor={htmlFor}>
                {label}
                {required ? <span className="text-destructive/70">*</span> : null}
            </Label>
            {children}
            {hint ? <p className="text-xs text-white/40">{hint}</p> : null}
        </div>
    )
}

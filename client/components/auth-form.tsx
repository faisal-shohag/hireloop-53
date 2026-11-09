"use client"

import * as React from "react"
import Link from "next/link"
import { Eye, EyeOff, Lock, Mail, Shield, User, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { PillGroup } from "@/components/shared/pill-group"
import type { UserRole } from "@/lib/types/user"

// TODO: Replace this with better-auth (`@/lib/auth-client`) once the backend
// integration is wired up. For now it only reports the collected data.
// Roles mirror the `user.additionalFields.role` enum in `lib/auth.ts`.
export type { UserRole }

export type AuthMode = "signin" | "signup"

export type AuthFormData = {
  email: string
  password: string
  name?: string
  role?: UserRole
}

const COPY = {
  signin: {
    title: "Welcome back",
    subtitle: "Sign in to continue your job hunt.",
    submitLabel: "Sign In",
    showName: false,
    footer: "New to HireLoop?",
    footerLinkHref: "/sign-up",
    footerLinkLabel: "Create an account",
  },
  signup: {
    title: "Create your account",
    subtitle: "Three minutes to set up. Matches start arriving today.",
    submitLabel: "Sign Up",
    showName: true,
    footer: "Already have an account?",
    footerLinkHref: "/sign-in",
    footerLinkLabel: "Sign in",
  },
} as const

const inputClass =
  "h-12 w-full rounded-lg border surface-field pl-10 pr-3 text-base tracking-[-0.0125rem] text-[#EDEDEF] shadow-[inset_0_3px_10px_rgba(255,255,255,0.04)] outline-none transition-colors placeholder:text-white/60 focus:ring-2 focus:ring-[#5C53FE]/30"
const labelClass = "mb-2 block text-left text-sm text-[#EDEDEF]/80"

// Sign-up role picker — values match better-auth's `role` field in lib/auth.ts.
const ROLES: {
  value: UserRole
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { value: "seeker", label: "Job Seeker", icon: Users },
  { value: "recruiter", label: "Recruiter", icon: User },
  { value: "admin", label: "Admin", icon: Shield },
]

export function AuthForm({
  mode,
  onSubmit,
  error,
}: {
  mode: AuthMode
  /** Called with the collected form values when the form is submitted. */
  onSubmit?: (data: AuthFormData) => void
  /** Shown under the submit button, e.g. an auth API error message. */
  error?: string | null
}) {
  const copy = COPY[mode]
  const isSignup = mode === "signup"

  const [values, setValues] = React.useState<AuthFormData>({
    email: "",
    password: "",
    name: "",
    role: "seeker",
  })
  const [showPassword, setShowPassword] = React.useState(false)

  const setField =
    (field: keyof AuthFormData) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [field]: event.target.value }))

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Collect the form data; wire this into better-auth later.
    const data: AuthFormData = {
      email: values.email,
      password: values.password,
      ...(isSignup ? { name: values.name, role: values.role } : {}),
    }
    onSubmit?.(data)
  }

  return (
    <div className="surface-card w-full p-8">
      <div className="mb-8 flex flex-col gap-2 text-center">
        <h1 className="page-title">{copy.title}</h1>
        <p className="text-base leading-[1.6] text-white/70">{copy.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {copy.showName ? (
          <fieldset>
            <legend className={labelClass}>Joining HireLoop as</legend>
            <PillGroup
              name="role"
              value={values.role ?? "seeker"}
              onChange={(role) => setValues((prev) => ({ ...prev, role }))}
              options={ROLES}
              className="grid grid-cols-3 gap-2"
              pillClassName="flex-col h-full w-full justify-center gap-1.5 px-2 py-3 tracking-[-0.0125rem]"
            />
          </fieldset>
        ) : null}

        {copy.showName ? (
          <div>
            <label htmlFor="name" className={labelClass}>
              Full name
            </label>
            <div className="relative">
              <User
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-white/50"
              />
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                maxLength={80}
                value={values.name ?? ""}
                onChange={setField("name")}
                placeholder="Jane Doe"
                className={inputClass}
              />
            </div>
          </div>
        ) : null}

        <div>
          <label htmlFor="email" className={labelClass}>
            Email address
          </label>
          <div className="relative">
            <Mail
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-white/50"
            />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={values.email}
              onChange={setField("email")}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            {isSignup ? null : (
              <Link
                href="/forgot-password"
                className="mb-2 text-sm text-[#8B85FF] transition-colors hover:text-white"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <Lock
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-white/50"
            />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={8}
              maxLength={72}
              value={values.password}
              onChange={setField("password")}
              placeholder={isSignup ? "At least 8 characters" : "Your password"}
              className={cn(inputClass, "pr-11")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-white/50 transition-colors hover:text-white"
            >
              {showPassword ? (
                <EyeOff aria-hidden className="size-4" />
              ) : (
                <Eye aria-hidden className="size-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn-brand mt-1 h-[52px] w-full rounded-[8px] text-lg font-medium text-[#EDEDEF] shadow-[inset_0_3px_10px_rgba(255,255,255,0.2)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
        >
          {copy.submitLabel}
        </button>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}
      </form>

      <p className="mt-8 text-center text-base text-white/70">
        {copy.footer}{" "}
        <Link
          href={copy.footerLinkHref}
          className="font-semibold text-[#8B85FF] transition-colors hover:text-white"
        >
          {copy.footerLinkLabel}
        </Link>
      </p>
    </div>
  )
}

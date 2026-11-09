"use client"

import { AuthForm, AuthFormData } from "@/components/auth-form"
import { authClient } from "@/lib/auth-client"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"

function SignInForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const requestedPath = searchParams.get("redirectTo") ?? "/"
  const redirectTo =
    requestedPath.startsWith("/") &&
    !requestedPath.startsWith("//") &&
    !requestedPath.includes("\\")
      ? requestedPath
      : "/"

  const handleSignIn = async (data: AuthFormData) => {
    setErrorMessage(null)
    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
      rememberMe: true,
      callbackURL: redirectTo,
    })

    if (error) {
      setErrorMessage(error.message || "Unable to sign in. Please try again.")
      return
    }
    router.refresh()
    router.push(redirectTo)
  }

  return <AuthForm mode="signin" onSubmit={handleSignIn} error={errorMessage} />
}

export default function SignInPage() {
  return (
    <Suspense fallback={<p className="text-white/60">Loading sign-in…</p>}>
      <SignInForm />
    </Suspense>
  )
}

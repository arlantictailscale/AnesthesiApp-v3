"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signUp, signInWithGoogle } from "@/lib/storage"
import { Logo } from "@/components/logo"

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.")
      return
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.")
      return
    }
    loading_helper(true)
    const { error, needsEmailConfirmation } = await signUp(email, password)
    loading_helper(false)
    if (error) {
      toast.error(error)
      return
    }
    if (needsEmailConfirmation) {
      toast.success("Check your email to confirm your account")
      router.push(`/signup/success?email=${encodeURIComponent(email)}`)
      return
    }
    toast.success("Account created")
    router.push("/dashboard")
    router.refresh()
  }

  function loading_helper(val: boolean) {
    setLoading(val)
  }

  async function handleGoogleSignIn() {
    setLoading(true)
    const { error } = await signInWithGoogle()
    setLoading(false)
    if (error) {
      toast.error(error)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 md:px-6">
          <Logo height={32} />

        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-6 md:p-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
            <p className="text-sm text-muted-foreground">
              Start logging anesthesia cases in minutes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@hospital.org"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" className="mt-2" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 border-border hover:bg-accent/50 hover:text-accent-foreground"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Sign up with Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>

          <p className="mt-6 text-center text-[10px] text-muted-foreground leading-normal max-w-xs mx-auto">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline font-semibold hover:text-primary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline font-semibold hover:text-primary">
              Privacy Policy
            </Link>.
          </p>
        </Card>
      </main>
    </div>
  )
}

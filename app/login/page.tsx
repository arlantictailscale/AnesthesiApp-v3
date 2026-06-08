"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn, signInWithGoogle, sendPasswordResetEmail } from "@/lib/storage"
import { createClient } from "@/lib/supabase/client"
import { Logo } from "@/components/logo"
import { Footer } from "@/components/footer"
import { Fingerprint, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  // Forgot password states
  const [resetEmail, setResetEmail] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      setLoading(false)
      toast.error(error)
      return
    }

    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (!aalError && aalData && aalData.currentLevel === "aal1" && aalData.nextLevel === "aal2") {
        toast.info("Two-Factor Authentication required")
        router.push("/login/mfa")
        return
      }
    } catch (err) {
      console.error("MFA checking error:", err)
    }

    setLoading(false)
    toast.success("Welcome back")
    router.push("/dashboard")
    router.refresh()
  }

  async function handlePasskeySignIn() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPasskey()
      if (error) {
        console.error("Passkey sign-in failed:", error)
        toast.error(error.message || "Failed to sign in with passkey")
        setLoading(false)
        return
      }

      // Check if MFA is required
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (!aalError && aalData && aalData.currentLevel === "aal1" && aalData.nextLevel === "aal2") {
        toast.info("Two-Factor Authentication required")
        router.push("/login/mfa")
        return
      }

      toast.success("Welcome back")
      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      console.error("Passkey sign-in caught error:", err)
      toast.error(err.message || "An error occurred during passkey sign-in")
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!resetEmail.trim()) {
      toast.error("Please enter your email address")
      return
    }

    setResetLoading(true)
    const { error } = await sendPasswordResetEmail(resetEmail)
    setResetLoading(false)

    if (error) {
      toast.error(error)
    } else {
      toast.success("Password reset link sent! Please check your email inbox.")
      setResetDialogOpen(false)
      setResetEmail("")
    }
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
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Access your anesthesia case log.
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setResetDialogOpen(true)}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="mt-2 font-bold text-xs" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-primary/30 hover:bg-primary/5 hover:border-primary font-bold text-xs"
              onClick={handlePasskeySignIn}
              disabled={loading}
            >
              <Fingerprint className="h-4 w-4 text-primary" />
              Sign in with Passkey
            </Button>
          </form>

          {/* Reset Password Dialog */}
          <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  We will send a secure link to your email address to reset your password and restore account access.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="resetEmail">Email Address</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@hospital.org"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setResetDialogOpen(false)}
                    disabled={resetLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={resetLoading}>
                    {resetLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

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
            Sign in with Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>

          <p className="mt-6 text-center text-[10px] text-muted-foreground leading-normal max-w-xs mx-auto">
            By signing in, you agree to our{" "}
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
      <Footer containerClassName="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-4 py-8 text-xs text-muted-foreground md:flex-row md:px-6" />
    </div>
  )
}

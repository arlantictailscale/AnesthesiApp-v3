"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import { createClient } from "@/lib/supabase/client"
import { signOut } from "@/lib/storage"
import { ShieldCheck, Loader2, LogOut, ArrowLeft, KeyRound } from "lucide-react"

function MFAChallengeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextRoute = searchParams?.get("next") || "/dashboard"

  const [otpCode, setOtpCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [factorId, setFactorId] = useState("")
  const [challengeId, setChallengeId] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const supabase = createClient()

  // Initialize and challenge factor
  async function initMFA() {
    setLoading(true)
    setErrorMsg("")
    try {
      // 1. Get current assurance level to see if they actually need MFA
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aalError) throw aalError

      if (!aalData || aalData.nextLevel === "aal1") {
        // User has no MFA factors enrolled, send to dashboard
        toast.info("No active MFA factor found.")
        router.replace("/dashboard")
        return
      }

      if (aalData.currentLevel === "aal2") {
        // User has already completed MFA, send to dashboard
        router.replace(nextRoute)
        return
      }

      // 2. List factors to find the verified TOTP factor
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors()
      if (factorsError) throw factorsError

      const verifiedFactor =
        factorsData?.totp?.find((f) => f.status === "verified") ||
        factorsData?.all?.find(
          (f) => (f.factorType === "totp" || (f as any).factor_type === "totp") && f.status === "verified"
        )

      if (!verifiedFactor) {
        toast.error("No active verified authenticator factor found.")
        await handleSignOut()
        return
      }

      setFactorId(verifiedFactor.id)

      // 3. Challenge the factor
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: verifiedFactor.id
      })
      if (challengeError) throw challengeError

      setChallengeId(challengeData.id)
    } catch (err: any) {
      console.error("MFA Initialization failed:", err)
      setErrorMsg(err.message || "Failed to initiate authenticator challenge. Please try again.")
      toast.error("Failed to start 2FA challenge.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initMFA()
  }, [])

  // Submit OTP Verification code
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (otpCode.length < 6) {
      toast.error("Please enter a 6-digit verification code.")
      return
    }

    setVerifying(true)
    try {
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: otpCode.trim()
      })

      if (error) {
        toast.error(error.message || "Incorrect verification code.")
        setOtpCode("")
      } else {
        toast.success("Security verification completed.")
        router.replace(nextRoute)
        router.refresh()
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to verify authenticator code.")
    } finally {
      setVerifying(false)
    }
  }

  // Fallback sign out (if they don't have code/device)
  async function handleSignOut() {
    try {
      await signOut()
      router.replace("/login")
      router.refresh()
    } catch (err) {
      router.replace("/login")
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
        <Card className="w-full max-w-md p-6 md:p-8 border border-border/80 shadow-md">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div>
                <h2 className="text-sm font-bold text-foreground">Initiating Secure Connection</h2>
                <p className="text-xs text-muted-foreground mt-1">Retrieving Two-Factor verification details...</p>
              </div>
            </div>
          ) : errorMsg ? (
            <div className="flex flex-col gap-4 text-center py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Security Protocol Error</h2>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">{errorMsg}</p>
              <div className="flex flex-col gap-2 mt-4">
                <Button onClick={initMFA} className="bg-primary text-xs font-bold w-full">
                  Retry Challenge
                </Button>
                <Button variant="ghost" onClick={handleSignOut} className="text-xs text-muted-foreground w-full gap-1">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 text-center items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">Security Verification</h1>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                  Enter the 6-digit temporary passcode generated by your authenticator app to complete the sign-in.
                </p>
              </div>

              <form onSubmit={handleVerify} className="mt-6 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="otpCode" className="text-xs font-bold text-muted-foreground uppercase text-center block mb-1">
                    Passcode
                  </Label>
                  <Input
                    id="otpCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    autoFocus
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="text-center font-mono text-2xl tracking-[0.4em] pl-[0.4em] h-12 max-w-[220px] mx-auto focus:ring-primary focus:border-primary font-bold"
                    disabled={verifying}
                  />
                </div>

                <Button type="submit" className="w-full mt-2 font-bold text-xs" disabled={verifying}>
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Verifying code…
                    </>
                  ) : (
                    "Confirm Verification"
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="w-full gap-2 text-xs text-destructive hover:bg-destructive/5 hover:text-destructive"
                onClick={handleSignOut}
                disabled={verifying}
              >
                <LogOut className="h-4 w-4" />
                Cancel & Sign Out
              </Button>
            </>
          )}

        </Card>
      </main>
    </div>
  )
}

export default function MFAChallengePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col bg-muted/30">
        <header className="border-b border-border bg-background">
          <div className="mx-auto flex h-16 max-w-6xl items-center px-4 md:px-6">
            <Logo height={32} />
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md p-6 md:p-8 border border-border/80 shadow-md flex flex-col items-center justify-center py-10 gap-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Loading Security Verification</h2>
              <p className="text-xs text-muted-foreground mt-1">Please wait...</p>
            </div>
          </Card>
        </main>
      </div>
    }>
      <MFAChallengeContent />
    </Suspense>
  )
}

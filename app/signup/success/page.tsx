"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import { createClient } from "@/lib/supabase/client"
import { Mail, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function SignUpSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 text-muted-foreground gap-4">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span>Loading confirmation page...</span>
      </div>
    }>
      <SignUpSuccessPageContent />
    </Suspense>
  )
}

function SignUpSuccessPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  const [code, setCode] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!email) {
      toast.error("Email address not found. Please sign up again.")
      return
    }

    if (code.length < 6) {
      toast.error("Confirmation code must be at least 6 characters.")
      return
    }

    setVerifying(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Email successfully confirmed!")
        setSuccess(true)
        setTimeout(() => {
          router.push("/welcome")
          router.refresh()
        }, 1500)
      }
    } catch (err) {
      console.error("Verify OTP error:", err)
      toast.error("An error occurred while verifying the code.")
    } finally {
      setVerifying(false)
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
          <div className="flex flex-col items-center gap-4 text-center">
            {success ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 animate-bounce">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-6 w-6" />
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {success ? "Confirmation Successful!" : "Check Your Email"}
              </h1>
              <p className="text-sm text-muted-foreground text-pretty">
                {success ? (
                  "Your account has been activated. Redirecting to dashboard..."
                ) : (
                  <>
                    We have sent a confirmation link and security code to{" "}
                    {email ? (
                      <span className="font-medium text-foreground">{email}</span>
                    ) : (
                      "your email"
                    )}
                    . Please enter the code below for instant activation.
                  </>
                )}
              </p>
            </div>

            {!success && (
              <form onSubmit={handleVerify} className="mt-4 w-full flex flex-col gap-4">
                <div className="flex flex-col gap-2 text-left">
                  <Label htmlFor="code" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Confirmation Code (OTP)
                  </Label>
                  <Input
                     id="code"
                     type="text"
                     placeholder="12345678"
                     required
                     value={code}
                     onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8))}
                     className="text-center tracking-[0.3em] font-mono text-2xl h-14"
                     maxLength={8}
                     disabled={verifying}
                  />
                </div>
                <Button type="submit" className="w-full h-11 text-sm font-medium" disabled={verifying}>
                  {verifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Verifying...
                    </span>
                  ) : (
                    "Confirm Account"
                  )}
                </Button>
              </form>
            )}

            <Button asChild variant="ghost" className="mt-2 w-full text-xs text-muted-foreground">
              <Link href="/login">Back to sign in page</Link>
            </Button>
          </div>
        </Card>
      </main>
    </div>
  )
}


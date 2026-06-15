"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Sparkles, Loader2, Calendar, Landmark, ArrowRight, Heart } from "lucide-react"
import Link from "next/link"

function SuccessPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get("order_id")
  const transactionStatus = searchParams.get("transaction_status")

  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<"paid" | "pending" | "failed" | "unknown">("unknown")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }

    async function verifyPayment() {
      try {
        const res = await fetch("/api/support/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId }),
        })

        if (!res.ok) {
          throw new Error("Failed to verify transaction status.")
        }

        const data = await res.json()
        setStatus(data.status) // "paid", "pending", "failed"
      } catch (err) {
        console.error("Verification error:", err)
        setErrorMsg("We couldn't verify the payment status automatically, but it will be processed shortly.")
      } finally {
        setLoading(false)
      }
    }

    // Delay slightly for a smoother transition
    const timer = setTimeout(() => {
      verifyPayment()
    }, 800)

    return () => clearTimeout(timer)
  }, [orderId])

  if (loading) {
    return (
      <Card className="border border-border bg-card/60 backdrop-blur-xs shadow-lg max-w-md mx-auto text-center p-8 flex flex-col items-center justify-center gap-4 animate-pulse-slow">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <CardTitle className="text-lg font-bold mt-2">Confirming Payment</CardTitle>
        <CardDescription className="text-xs">
          Verifying your transaction with Midtrans payment gateway, please do not close this page...
        </CardDescription>
      </Card>
    )
  }

  // If order_id is missing or status is failed
  if (!orderId || status === "failed") {
    return (
      <Card className="border border-destructive/20 bg-destructive/[0.02] shadow-lg max-w-md mx-auto text-center p-8 flex flex-col items-center justify-center gap-4">
        <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
          <Heart className="h-7 w-7" />
        </div>
        <CardTitle className="text-lg font-bold text-destructive">Payment Failed or Cancelled</CardTitle>
        <CardDescription className="text-xs max-w-xs leading-relaxed">
          The payment transaction was either cancelled or denied by the gateway. If money was deducted, contact support.
        </CardDescription>
        <div className="flex flex-col gap-2 w-full mt-4">
          <Button asChild className="w-full font-bold">
            <Link href="/support">Try Purchasing Again</Link>
          </Button>
          <Button asChild variant="outline" className="w-full font-semibold">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </Card>
    )
  }

  const isPending = status === "pending" || transactionStatus === "pending"

  return (
    <Card className={`border shadow-lg max-w-md mx-auto text-center p-8 flex flex-col items-center justify-center gap-4 relative overflow-hidden ${isPending ? "border-amber-500/20 bg-amber-500/[0.01]" : "border-emerald-500/20 bg-emerald-500/[0.01]"}`}>
      {/* Decorative top shape */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${isPending ? "bg-amber-500" : "bg-emerald-500"}`} />

      {!isPending && (
        <div className="absolute top-4 right-4 text-amber-500 animate-pulse-slow">
          <Sparkles className="h-5 w-5 fill-current" />
        </div>
      )}

      <div className={`h-16 w-16 rounded-full flex items-center justify-center ${isPending ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"} animate-bounce-slow`}>
        {isPending ? (
          <Landmark className="h-8 w-8" />
        ) : (
          <CheckCircle2 className="h-8 w-8 fill-current" />
        )}
      </div>

      <div className="space-y-1">
        <CardTitle className={`text-xl font-extrabold ${isPending ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}`}>
          {isPending ? "Payment Pending Completion" : "Premium Plan Activated!"}
        </CardTitle>
        <CardDescription className="text-xs font-medium text-muted-foreground">
          Order ID: <span className="font-mono font-bold text-foreground">{orderId}</span>
        </CardDescription>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
        {isPending 
          ? "Your transaction has been initiated but requires payment completion (e.g. at an ATM, convenience store, or banking app). Your name will display on the Premium Wall once settlement completes."
          : "Thank you for upgrading! Your premium access has been activated. You can now use all premium simulator prep tools and logged case cloud backups."
        }
      </p>

      {errorMsg && (
        <div className="p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-lg text-[10px] text-yellow-700 dark:text-yellow-400 max-w-xs text-left leading-normal mt-2">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col gap-2 w-full mt-4 pt-4 border-t border-border/60">
        <Button asChild className={`w-full font-bold text-xs gap-1.5 ${isPending ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
          <Link href="/support">
            {isPending ? "Check Members Wall" : "See Members Wall"} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full font-semibold text-xs">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    </Card>
  )
}

export default function SupportSuccessPage() {
  return (
    <AppShell>
      <div className="flex flex-col justify-center items-center py-12 min-h-[50vh]">
        <Suspense fallback={
          <Card className="border border-border bg-card/60 backdrop-blur-xs shadow-lg max-w-md mx-auto text-center p-8 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <CardTitle className="text-lg font-bold mt-2">Loading Page...</CardTitle>
          </Card>
        }>
          <SuccessPageContent />
        </Suspense>
      </div>
    </AppShell>
  )
}

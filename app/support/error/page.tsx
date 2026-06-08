"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ArrowLeft, RefreshCw, HelpCircle } from "lucide-react"
import Link from "next/link"

function ErrorPageContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")
  const statusCode = searchParams.get("status_code")
  const transactionStatus = searchParams.get("transaction_status")

  let errorTitle = "Payment Unsuccessful"
  let errorDesc = "Your support contribution could not be processed at this time."
  
  if (transactionStatus === "deny") {
    errorTitle = "Transaction Denied"
    errorDesc = "The payment was denied by your bank or the payment provider fraud check."
  } else if (transactionStatus === "cancel") {
    errorTitle = "Transaction Cancelled"
    errorDesc = "You closed the checkout modal or explicitly cancelled the payment process."
  } else if (transactionStatus === "expire") {
    errorTitle = "Transaction Expired"
    errorDesc = "The time limit to complete this transaction has elapsed."
  }

  return (
    <Card className="border border-red-500/20 bg-red-500/[0.01] shadow-lg max-w-md mx-auto text-center p-8 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
      {/* Decorative top shape */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500" />

      <div className="h-16 w-16 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center animate-bounce-slow">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <div className="space-y-1">
        <CardTitle className="text-xl font-extrabold text-red-700 dark:text-red-400">
          {errorTitle}
        </CardTitle>
        {orderId && (
          <CardDescription className="text-xs font-medium text-muted-foreground">
            Order ID: <span className="font-mono font-bold text-foreground">{orderId}</span>
            {statusCode && <span className="ml-2">({statusCode})</span>}
          </CardDescription>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
        {errorDesc} If money was deducted from your account, please contact our support team at <span className="font-semibold text-foreground">support@anesthesiapp.my.id</span> with your Order ID.
      </p>

      <div className="flex flex-col gap-2 w-full mt-4 pt-4 border-t border-border/60">
        <Button asChild className="w-full font-bold text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white">
          <Link href="/support">
            <RefreshCw className="h-3.5 w-3.5" /> Try Support Again
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full font-semibold text-xs gap-1.5">
          <Link href="/dashboard">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
        </Button>
      </div>
    </Card>
  )
}

export default function SupportErrorPage() {
  return (
    <AppShell>
      <div className="flex flex-col justify-center items-center py-12 min-h-[50vh]">
        <Suspense fallback={
          <Card className="border border-border bg-card/60 backdrop-blur-xs shadow-lg max-w-md mx-auto text-center p-8 flex flex-col items-center justify-center gap-4">
            <div className="h-10 w-10 animate-spin border-4 border-primary border-t-transparent rounded-full" />
            <CardTitle className="text-lg font-bold mt-2">Loading...</CardTitle>
          </Card>
        }>
          <ErrorPageContent />
        </Suspense>
      </div>
    </AppShell>
  )
}

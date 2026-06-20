"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { listUserPayments, type Supporter } from "@/lib/storage"
import { SupporterBadge } from "@/components/supporter-badge"
import { 
  ArrowLeft, 
  CreditCard, 
  Loader2, 
  RefreshCw, 
  CheckCircle2, 
  Landmark, 
  XCircle, 
  AlertCircle, 
  Coins, 
  Award,
  Clock
} from "lucide-react"
import Link from "next/link"

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<Supporter[]>([])
  const [loading, setLoading] = useState(true)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const router = useRouter()

  async function loadPayments() {
    try {
      const data = await listUserPayments()
      setPayments(data)
    } catch (err) {
      console.error("Failed to load payment history:", err)
      toast.error("Could not load your payment history.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [])

  async function handleSyncStatus(orderId: string) {
    if (syncingId) return
    setSyncingId(orderId)
    const toastId = toast.loading(`Syncing status for ${orderId}...`)

    try {
      const res = await fetch("/api/support/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      })

      if (!res.ok) {
        let errorMessage = "Failed to verify transaction status"
        try {
          const errData = await res.json()
          errorMessage = errData.error || errorMessage
        } catch {
          // ignore parsing error
        }
        throw new Error(errorMessage)
      }

      const data = await res.json()
      
      if (data.status === "paid") {
        toast.success("Payment confirmed! Your Supporter Badge is now active.", { id: toastId })
      } else if (data.status === "failed") {
        toast.error("Payment failed or was cancelled.", { id: toastId })
      } else {
        toast.info("Payment is still pending completion.", { id: toastId })
      }

      // Refresh list
      await loadPayments()
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : "Failed to sync payment status with DOKU."
      toast.error(message, { id: toastId })
    } finally {
      setSyncingId(null)
    }
  }

  // Calculate quick stats
  const completedPayments = payments.filter(p => p.status === "paid")
  const pendingPayments = payments.filter(p => p.status === "pending")
  const totalContributed = completedPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0)

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-10">
        
        {/* Back Link */}
        <div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-3 text-muted-foreground hover:text-foreground">
            <Link href="/support">
              <ArrowLeft className="h-4 w-4" /> Back to Support Page
            </Link>
          </Button>
        </div>

        {/* Page Header */}
        <div className="border-b pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Payment History</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Manage your supporter subscriptions, check pending DOKU payments, and view badge statuses.
            </p>
          </div>
          <Button onClick={loadPayments} variant="outline" size="sm" className="gap-1.5 h-9 font-semibold shrink-0">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh List
          </Button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex h-[40vh] flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">Loading your payment records...</p>
          </div>
        ) : (
          <>
            {/* Quick Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border border-border/80 shadow-xs bg-card/45 backdrop-blur-xs">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-emerald-500" /> Total Contribution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-foreground">
                    Rp {totalContributed.toLocaleString("id-ID")}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/80 shadow-xs bg-card/45 backdrop-blur-xs">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-amber-500" /> Active Badges
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                  <div className="text-2xl font-black text-foreground">
                    {completedPayments.length}
                  </div>
                  {completedPayments.length > 0 && (
                    <div className="flex -space-x-1 shrink-0 scale-90">
                      {Array.from(new Set(completedPayments.map(p => p.tier))).map((tier, idx) => (
                        <SupporterBadge key={idx} tier={tier === "Gold Sponsor" ? "gold sponsor" : tier === "Platinum Sponsor" ? "platinum sponsor" : tier === "Diamond Sponsor" ? "diamond sponsor" : tier.toLowerCase()} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-border/80 shadow-xs bg-card/45 backdrop-blur-xs">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-amber-500" /> Pending Payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-foreground">
                    {pendingPayments.length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payments List/Table */}
            {payments.length === 0 ? (
              <Card className="border border-dashed p-10 text-center bg-card/20">
                <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-bold text-base">No payment history found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 leading-normal">
                  You haven't initiated any sponsorship payments yet. Visit our support page to choose a tier.
                </p>
                <Button asChild className="mt-5 font-bold text-xs">
                  <Link href="/support">Support Us & Get Badge</Link>
                </Button>
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-bold flex items-center gap-2 mt-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Transaction Records
                </h2>

                <div className="rounded-xl border border-border/80 bg-card/30 overflow-hidden shadow-xs">
                  {/* Table Header (hidden on mobile) */}
                  <div className="hidden md:grid grid-cols-[150px_120px_90px_100px_1fr] gap-4 p-4 border-b border-border/60 bg-muted/20 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <div>Order Details</div>
                    <div>Badge Tier</div>
                    <div className="text-right">Amount</div>
                    <div className="text-center">Status</div>
                    <div className="text-right">Action</div>
                  </div>

                  <div className="divide-y divide-border/60">
                    {payments.map((payment) => {
                      const dateStr = new Date(payment.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })

                      return (
                        <div key={payment.id} className="grid grid-cols-1 md:grid-cols-[150px_120px_90px_100px_1fr] gap-3 md:gap-4 p-4 items-center hover:bg-muted/10 transition-colors">
                          
                          {/* Order Details (ID & Date) */}
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-xs font-bold text-foreground">
                              {payment.order_id || "N/A"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {dateStr}
                            </span>
                          </div>

                          {/* Badge Tier */}
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-foreground">
                              {payment.tier}
                            </span>
                            <div className="flex items-center">
                              <SupporterBadge tier={payment.tier === "Gold Sponsor" ? "gold sponsor" : payment.tier === "Platinum Sponsor" ? "platinum sponsor" : payment.tier === "Diamond Sponsor" ? "diamond sponsor" : payment.tier.toLowerCase()} className="scale-95 origin-left" />
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="md:text-right font-semibold text-xs text-foreground">
                            <span className="md:hidden text-muted-foreground font-medium mr-1.5">Amount:</span>
                            Rp {payment.amount?.toLocaleString("id-ID") || "0"}
                          </div>

                          {/* Status Badge */}
                          <div className="flex md:justify-center">
                            <span className="md:hidden text-muted-foreground font-medium mr-1.5 self-center">Status:</span>
                            {payment.status === "paid" ? (
                              <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 gap-1 text-[10px] font-bold px-2.5 py-0.5">
                                <CheckCircle2 className="h-3 w-3" /> Paid
                              </Badge>
                            ) : payment.status === "failed" ? (
                              <Badge className="bg-destructive/10 border-destructive/20 text-destructive gap-1 text-[10px] font-bold px-2.5 py-0.5" variant="destructive">
                                <XCircle className="h-3 w-3" /> Failed
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 gap-1 text-[10px] font-bold px-2.5 py-0.5">
                                <Landmark className="h-3 w-3 animate-pulse" /> Pending
                              </Badge>
                            )}
                          </div>

                          {/* Action Button */}
                          <div className="flex md:justify-end mt-2 md:mt-0">
                            {payment.status === "pending" && payment.order_id ? (
                              <div className="flex flex-col sm:flex-row gap-1.5 w-full md:w-auto md:justify-end">
                                {payment.payment_url && (
                                  <Button
                                    asChild
                                    size="sm"
                                    className="w-full md:w-auto h-8 text-[11px] gap-1 font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                                  >
                                    <a href={payment.payment_url} target="_blank" rel="noopener noreferrer">
                                      Pay Now
                                    </a>
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSyncStatus(payment.order_id!)}
                                  disabled={syncingId === payment.order_id}
                                  className="w-full md:w-auto h-8 text-[11px] gap-1 font-bold text-amber-600 border-amber-500/20 hover:bg-amber-500/5 hover:text-amber-700 shrink-0"
                                >
                                  {syncingId === payment.order_id ? (
                                    <>
                                      <Loader2 className="h-3 w-3 animate-spin" /> Checking
                                    </>
                                  ) : (
                                    <>
                                      <RefreshCw className="h-3 w-3" /> Check Status
                                    </>
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <span className="hidden md:inline text-xs text-muted-foreground/40 font-medium">—</span>
                            )}
                          </div>
                          
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Additional Help Alert */}
                <Card className="border border-border/80 bg-muted/5 p-4 mt-2">
                  <div className="flex gap-3 items-start text-xs text-muted-foreground leading-normal">
                    <AlertCircle className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-foreground mb-1">DOKU Payment Settlements</p>
                      <p>
                        Most payments settle within seconds. If you made a payment but your badge remains "Pending", use the <strong>"Check Status"</strong> button next to the order above to pull the latest state from DOKU. For support queries, please contact <span className="font-semibold text-foreground">support@anesthesiapp.my.id</span>.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}

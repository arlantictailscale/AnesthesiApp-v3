"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SupporterBadge } from "@/components/supporter-badge"
import { getSession } from "@/lib/storage"
import {
  Users,
  ShieldCheck,
  Search,
  Loader2,
  AlertCircle,
  Crown,
  Coins,
  ArrowLeft,
  CreditCard,
  RefreshCw,
  MessageSquare,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  Landmark
} from "lucide-react"
import Link from "next/link"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  title_role: string | null
  department: string | null
  bio: string | null
  avatar_url: string | null
  supporter_tier: string | null
  role: string | null
  updated_at: string
}

interface PaymentRecord {
  id: string
  name: string
  type: "individual" | "sponsor"
  tier: "Backer" | "Sponsor" | "Gold Sponsor" | "Platinum Sponsor" | "Diamond Sponsor"
  amount: number
  message: string | null
  website: string | null
  status: "pending" | "paid" | "failed"
  order_id: string | null
  payment_url: string | null
  created_at: string
  profiles: { email: string } | null
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"users" | "payments">("users")
  const [users, setUsers] = useState<UserProfile[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentSearchQuery, setPaymentSearchQuery] = useState("")
  
  // Action states
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null)

  const router = useRouter()

  // Verify auth and load all data
  async function loadAdminData() {
    try {
      const session = await getSession()
      if (!session) {
        toast.error("You must sign in first.")
        router.replace("/login")
        return
      }
      setCurrentUserId(session.userId)

      // Fetch users and payments
      const res = await fetch("/api/admin/users")
      if (res.status === 403) {
        toast.error("Access Denied: Admin privileges required.")
        router.replace("/dashboard")
        return
      }

      if (!res.ok) {
        throw new Error("Failed to load administration data.")
      }

      const data = await res.json()
      setUsers(data.users || [])
      setPayments(data.payments || [])
      setAuthorized(true)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to initialize Admin Panel.")
      router.replace("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  // Handle user role modification
  async function handleRoleChange(targetUserId: string, newRole: string) {
    if (targetUserId === currentUserId) {
      toast.error("Self-demotion protection: You cannot revoke your own admin rights.")
      return
    }

    setUpdatingId(targetUserId)
    const toastId = toast.loading("Updating user permission role...")

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, role: newRole }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update role.")
      }

      toast.success("User role updated successfully.", { id: toastId })
      
      // Update local state
      setUsers(prev =>
        prev.map(u => (u.id === targetUserId ? { ...u, role: newRole } : u))
      )
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to update role.", { id: toastId })
    } finally {
      setUpdatingId(null)
    }
  }

  // Handle supporter tier modification
  async function handleTierChange(targetUserId: string, newTier: string) {
    setUpdatingId(targetUserId)
    const toastId = toast.loading("Updating supporter subscription tier...")

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, supporter_tier: newTier }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update supporter tier.")
      }

      toast.success("Supporter subscription tier updated.", { id: toastId })

      // Update local state
      setUsers(prev =>
        prev.map(u => (u.id === targetUserId ? { ...u, supporter_tier: newTier } : u))
      )
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to update tier.", { id: toastId })
    } finally {
      setUpdatingId(null)
    }
  }

  // Sync single payment status manually from DOKU
  async function handleSyncStatus(orderId: string) {
    if (syncingOrderId) return
    setSyncingOrderId(orderId)
    const toastId = toast.loading(`Querying status for ${orderId} from DOKU...`)

    try {
      const res = await fetch("/api/support/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      })

      if (!res.ok) {
        let errorMessage = "Failed to sync payment status"
        try {
          const errData = await res.json()
          errorMessage = errData.error || errorMessage
        } catch {
          // ignore
        }
        throw new Error(errorMessage)
      }

      const data = await res.json()
      
      if (data.status === "paid") {
        toast.success(`Payment confirmed! ${orderId} is settled.`, { id: toastId })
      } else if (data.status === "failed") {
        toast.error(`Payment marked as failed or cancelled.`, { id: toastId })
      } else {
        toast.info(`Payment is still pending.`, { id: toastId })
      }

      // Reload admin datasets
      await loadAdminData()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to sync status.", { id: toastId })
    } finally {
      setSyncingOrderId(null)
    }
  }

  // Filter computations
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users
    const query = searchQuery.toLowerCase()
    return users.filter(
      u =>
        u.email.toLowerCase().includes(query) ||
        (u.full_name && u.full_name.toLowerCase().includes(query)) ||
        (u.title_role && u.title_role.toLowerCase().includes(query))
    )
  }, [users, searchQuery])

  const filteredPayments = useMemo(() => {
    if (!paymentSearchQuery.trim()) return payments
    const query = paymentSearchQuery.toLowerCase()
    return payments.filter(
      p =>
        (p.order_id && p.order_id.toLowerCase().includes(query)) ||
        p.name.toLowerCase().includes(query) ||
        (p.profiles && p.profiles.email.toLowerCase().includes(query)) ||
        p.tier.toLowerCase().includes(query)
    )
  }, [payments, paymentSearchQuery])

  // Statistics computations
  const stats = useMemo(() => {
    const totalUsers = users.length
    const admins = users.filter(u => u.role === "admin").length
    const supporters = users.filter(u => u.supporter_tier && u.supporter_tier !== "none").length
    
    // Payments statistics
    const totalPayments = payments.length
    const completedPayments = payments.filter(p => p.status === "paid")
    const pendingPayments = payments.filter(p => p.status === "pending")
    const totalFunds = completedPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)

    return { 
      totalUsers, 
      admins, 
      supporters, 
      totalPayments, 
      completedPaymentsCount: completedPayments.length,
      pendingPaymentsCount: pendingPayments.length,
      totalFunds 
    }
  }, [users, payments])

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Authorizing & loading administration panel...</p>
        </div>
      </AppShell>
    )
  }

  if (!authorized) {
    return (
      <AppShell>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center max-w-sm mx-auto">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h3 className="font-bold text-lg">Unauthorized Access</h3>
          <p className="text-sm text-muted-foreground leading-normal mt-1">
            You do not have administrative privileges to access this directory panel.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
        
        {/* Back Link */}
        <div>
          <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-3 text-muted-foreground hover:text-foreground">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Page Header */}
        <div className="border-b pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-red-600 dark:text-red-500" /> Administrative Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 font-medium">
              Manage registered users, toggle permission roles, and manually adjust supporter subscription tiers.
            </p>
          </div>
          <Button onClick={loadAdminData} variant="outline" size="sm" className="gap-1.5 h-9 font-semibold shrink-0">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Datasets
          </Button>
        </div>

        {/* Tabs Control */}
        <div className="grid grid-cols-2 p-1 bg-card/25 rounded-xl border border-border/80 max-w-md">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "users" ? "bg-background text-foreground shadow-xs border border-border/30" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Users className="h-3.5 w-3.5" /> User Directory ({stats.totalUsers})
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "payments" ? "bg-background text-foreground shadow-xs border border-border/30" : "text-muted-foreground hover:text-foreground"}`}
          >
            <CreditCard className="h-3.5 w-3.5" /> Transaction Ledger ({stats.totalPayments})
          </button>
        </div>

        {activeTab === "users" ? (
          <>
            {/* User Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border border-border bg-card/45 backdrop-blur-xs shadow-xs">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary" /> Total Platform Users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-foreground">{stats.totalUsers}</div>
                </CardContent>
              </Card>

              <Card className="border border-border bg-card/45 backdrop-blur-xs shadow-xs">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Crown className="h-4 w-4 text-red-500" /> Administrators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-foreground">{stats.admins}</div>
                </CardContent>
              </Card>

              <Card className="border border-border bg-card/45 backdrop-blur-xs shadow-xs">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-amber-500" /> Active Supporters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-foreground">{stats.supporters}</div>
                </CardContent>
              </Card>
            </div>

            {/* User Search Input */}
            <div className="flex items-center gap-3 bg-card/30 border border-border/80 rounded-xl px-4 py-3 shadow-xs">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search users by name, email, or clinical title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-0 outline-none text-sm w-full text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Users table */}
            <div className="rounded-xl border border-border/80 bg-card/30 overflow-hidden shadow-xs">
              {/* Table Header (hidden on mobile) */}
              <div className="hidden md:grid grid-cols-[1.2fr_120px_200px_1fr] gap-4 p-4 border-b border-border/60 bg-muted/20 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <div>User Credentials</div>
                <div>Role</div>
                <div>Subscription Tier</div>
                <div className="text-right">Actions / Controls</div>
              </div>

              <div className="divide-y divide-border/60">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground font-semibold">
                    No users found matching the query.
                  </div>
                ) : (
                  filteredUsers.map((profile) => (
                    <div key={profile.id} className="grid grid-cols-1 md:grid-cols-[1.2fr_120px_200px_1fr] gap-3 md:gap-4 p-4 items-center hover:bg-muted/10 transition-colors">
                      
                      {/* User Credentials */}
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs text-foreground truncate">
                          {profile.full_name || <span className="italic text-muted-foreground/60 font-medium">No Name Profile</span>}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate mt-0.5 font-mono">
                          {profile.email}
                        </span>
                        {profile.title_role && (
                          <span className="text-[9px] bg-primary/10 text-primary w-fit px-1.5 py-0.5 rounded-sm mt-1.5 font-bold uppercase">
                            {profile.title_role}
                          </span>
                        )}
                      </div>

                      {/* Role Badge */}
                      <div>
                        <span className="md:hidden text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Role:</span>
                        {profile.role === "admin" ? (
                          <Badge className="bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 gap-1 text-[10px] font-bold px-2 py-0.5">
                            Admin
                          </Badge>
                        ) : (
                          <Badge className="bg-muted/40 border-border text-muted-foreground gap-1 text-[10px] font-bold px-2 py-0.5">
                            User
                          </Badge>
                        )}
                      </div>

                      {/* Supporter Subscription Badge */}
                      <div className="flex items-center gap-1.5">
                        <span className="md:hidden text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Subscription:</span>
                        {profile.supporter_tier && profile.supporter_tier !== "none" ? (
                          <div className="scale-95 origin-left">
                            <SupporterBadge tier={profile.supporter_tier.toLowerCase()} />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 font-semibold italic">No Active Supporter Badge</span>
                        )}
                      </div>

                      {/* Action Controls */}
                      <div className="flex flex-col sm:flex-row gap-2 md:justify-end mt-2 md:mt-0">
                        {/* Role Control */}
                        <div className="flex flex-col gap-1 w-full sm:w-auto">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">Set Permission Role</label>
                          <select
                            value={profile.role || "user"}
                            disabled={updatingId === profile.id || profile.id === currentUserId}
                            onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                            className="bg-background border border-border/80 rounded-lg text-[11px] font-bold px-2 py-1 outline-none text-foreground w-full sm:w-28 cursor-pointer disabled:opacity-50"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>

                        {/* Subscription Control */}
                        <div className="flex flex-col gap-1 w-full sm:w-auto">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">Set Supporter Tier</label>
                          <select
                            value={profile.supporter_tier || "none"}
                            disabled={updatingId === profile.id}
                            onChange={(e) => handleTierChange(profile.id, e.target.value)}
                            className="bg-background border border-border/80 rounded-lg text-[11px] font-bold px-2 py-1 outline-none text-foreground w-full sm:w-36 cursor-pointer disabled:opacity-50"
                          >
                            <option value="none">None (Regular Plan)</option>
                            <option value="backer">Backer</option>
                            <option value="sponsor">Sponsor</option>
                            <option value="gold sponsor">Gold Sponsor</option>
                            <option value="platinum sponsor">Platinum Sponsor</option>
                            <option value="diamond sponsor">Diamond Sponsor</option>
                          </select>
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Payments Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-4">
              <Card className="border border-border bg-card/45 backdrop-blur-xs shadow-xs">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-primary" /> Total Transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-foreground">{stats.totalPayments}</div>
                </CardContent>
              </Card>

              <Card className="border border-border bg-card/45 backdrop-blur-xs shadow-xs">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Settled Payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-foreground">{stats.completedPaymentsCount}</div>
                </CardContent>
              </Card>

              <Card className="border border-border bg-card/45 backdrop-blur-xs shadow-xs">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-amber-500" /> Pending Checkout
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-foreground">{stats.pendingPaymentsCount}</div>
                </CardContent>
              </Card>

              <Card className="border border-border bg-card/45 backdrop-blur-xs shadow-xs">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-emerald-500" /> Total Funds Raised
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-foreground">
                    Rp {stats.totalFunds.toLocaleString("id-ID")}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payments Search Input */}
            <div className="flex items-center gap-3 bg-card/30 border border-border/80 rounded-xl px-4 py-3 shadow-xs">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search transactions by order ID, name, email, or tier..."
                value={paymentSearchQuery}
                onChange={(e) => setPaymentSearchQuery(e.target.value)}
                className="bg-transparent border-0 outline-none text-sm w-full text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Payments list/table */}
            <div className="rounded-xl border border-border/80 bg-card/30 overflow-hidden shadow-xs">
              {/* Table Header (hidden on mobile) */}
              <div className="hidden md:grid grid-cols-[1.3fr_1fr_120px_100px_1fr] gap-4 p-4 border-b border-border/60 bg-muted/20 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <div>Order details</div>
                <div>Supporter profile</div>
                <div>Tier / Amount</div>
                <div className="text-center">Status</div>
                <div className="text-right">Actions</div>
              </div>

              <div className="divide-y divide-border/60">
                {filteredPayments.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground font-semibold">
                    No transactions found matching the query.
                  </div>
                ) : (
                  filteredPayments.map((payment) => {
                    const dateStr = new Date(payment.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })

                    return (
                      <div key={payment.id} className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_120px_100px_1fr] gap-3 md:gap-4 p-4 items-center hover:bg-muted/10 transition-colors">
                        
                        {/* Order details */}
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {payment.order_id || "N/A"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {dateStr}
                          </span>
                        </div>

                        {/* Supporter profile */}
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-xs text-foreground truncate">
                            {payment.name || <span className="italic text-muted-foreground/60 font-medium">Anonymous</span>}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">
                            {payment.profiles?.email || "No registered email"}
                          </span>
                          {payment.message && (
                            <span className="text-[9px] text-muted-foreground flex items-center gap-1 mt-1 bg-muted/30 px-1 py-0.5 rounded-sm w-fit font-medium">
                              <MessageSquare className="h-2.5 w-2.5 shrink-0" /> {payment.message}
                            </span>
                          )}
                          {payment.website && (
                            <a href={payment.website} target="_blank" rel="noopener noreferrer" className="text-[9px] text-primary flex items-center gap-1 mt-1 hover:underline font-bold">
                              <Globe className="h-2.5 w-2.5 shrink-0" /> Website Link
                            </a>
                          )}
                        </div>

                        {/* Tier / Amount */}
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-foreground">
                            {payment.tier}
                          </span>
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            Rp {payment.amount?.toLocaleString("id-ID") || "0"}
                          </span>
                        </div>

                        {/* Status badge */}
                        <div className="flex md:justify-center">
                          <span className="md:hidden text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Status:</span>
                          {payment.status === "paid" ? (
                            <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 gap-1 text-[10px] font-bold px-2 py-0.5">
                              <CheckCircle2 className="h-3 w-3" /> Paid
                            </Badge>
                          ) : payment.status === "failed" ? (
                            <Badge className="bg-destructive/10 border-destructive/20 text-destructive gap-1 text-[10px] font-bold px-2 py-0.5" variant="destructive">
                              <XCircle className="h-3 w-3" /> Failed
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 gap-1 text-[10px] font-bold px-2 py-0.5">
                              <Landmark className="h-3 w-3 animate-pulse" /> Pending
                            </Badge>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex md:justify-end">
                          {payment.status === "pending" && payment.order_id ? (
                            <div className="flex flex-col sm:flex-row gap-1.5 w-full md:w-auto md:justify-end">
                              {payment.payment_url && (
                                <Button
                                  asChild
                                  size="sm"
                                  className="w-full md:w-auto h-8 text-[11px] gap-1 font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 shadow-xs"
                                >
                                  <a href={payment.payment_url} target="_blank" rel="noopener noreferrer">
                                    Pay Link
                                  </a>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSyncStatus(payment.order_id!)}
                                disabled={syncingOrderId === payment.order_id}
                                className="w-full md:w-auto h-8 text-[11px] gap-1 font-bold text-amber-600 border-amber-500/20 hover:bg-amber-500/5 hover:text-amber-700 shrink-0"
                              >
                                {syncingOrderId === payment.order_id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin" /> Syncing
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="h-3 w-3" /> Force Sync
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
                  })
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </AppShell>
  )
}

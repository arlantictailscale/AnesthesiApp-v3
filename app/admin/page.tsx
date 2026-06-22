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
  Landmark,
  Edit2,
  Trash2,
  Plus,
  BookOpen,
  Calendar,
  ExternalLink,
  History,
  Award
} from "lucide-react"
import Link from "next/link"
import { listPackages, deletePackage } from "@/lib/cbt/storage"
import { listOsceStations, deleteOsceStation } from "@/lib/osce/storage"
import type { CBTPackage } from "@/lib/cbt/default-data"
import type { OsceStation } from "@/lib/osce/default-data"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const [activeTab, setActiveTab] = useState<"users" | "payments" | "cbt" | "osce">("users")
  const [users, setUsers] = useState<UserProfile[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [cbtPackages, setCbtPackages] = useState<CBTPackage[]>([])
  const [osceStations, setOsceStations] = useState<OsceStation[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentSearchQuery, setPaymentSearchQuery] = useState("")
  
  // Action states
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null)

  // Selected user for attempts history modal
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [userCbtAttempts, setUserCbtAttempts] = useState<any[]>([])
  const [userOsceAttempts, setUserOsceAttempts] = useState<any[]>([])
  const [loadingAttempts, setLoadingAttempts] = useState(false)
  const [attemptsTab, setAttemptsTab] = useState<"cbt" | "osce">("cbt")

  const router = useRouter()

  useEffect(() => {
    if (!selectedUser) {
      setUserCbtAttempts([])
      setUserOsceAttempts([])
      return
    }

    async function fetchAttempts() {
      setLoadingAttempts(true)
      try {
        const supabase = createClient()
        
        // 1. Fetch CBT attempts
        const { data: cbtData, error: cbtError } = await supabase
          .from("cbt_attempts")
          .select("*")
          .eq("user_id", selectedUser.id)
          .order("created_at", { ascending: false })

        if (cbtError) throw cbtError

        const mappedCbt = (cbtData || []).map((row: any) => {
          const pkg = cbtPackages.find((p) => p.id === row.package_id)
          return {
            id: row.id,
            user_id: row.user_id,
            package_id: row.package_id,
            package_name: pkg ? pkg.name : "Paket Kustom",
            score: Number(row.score),
            total_questions: row.total_questions,
            correct_count: row.correct_count,
            time_spent: row.time_spent,
            created_at: row.created_at,
          }
        })
        setUserCbtAttempts(mappedCbt)

        // 2. Fetch OSCE attempts
        const { data: osceData, error: osceError } = await supabase
          .from("osce_attempts")
          .select("*")
          .eq("user_id", selectedUser.id)
          .order("completed_at", { ascending: false })

        if (osceError) throw osceError

        const mappedOsce = (osceData || []).map((row: any) => {
          const station = osceStations.find((s) => s.id === row.station_id)
          return {
            ...row,
            station_title: station ? station.title : "Stasiun OSCE",
          }
        })
        setUserOsceAttempts(mappedOsce)

      } catch (err) {
        console.error("Failed to load user attempts:", err)
        toast.error("Gagal memuat riwayat ujian pengguna.")
      } finally {
        setLoadingAttempts(false)
      }
    }

    fetchAttempts()
  }, [selectedUser, cbtPackages, osceStations])

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

      const pkgs = await listPackages()
      setCbtPackages(pkgs)
      const stns = await listOsceStations()
      setOsceStations(stns)

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

  const defaultCbtPackages = useMemo(() => {
    return cbtPackages.filter(p => p.user_id === null || p.id === "default-national-exam")
  }, [cbtPackages])

  const defaultOsceStations = useMemo(() => {
    return osceStations.filter(s => s.user_id === null)
  }, [osceStations])

  async function handleDeleteCbtPackage(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus paket CBT utama ini dari database?")) return
    const toastId = toast.loading("Menghapus paket CBT...")
    try {
      await deletePackage(id)
      toast.success("Paket CBT berhasil dihapus.", { id: toastId })
      const pkgs = await listPackages()
      setCbtPackages(pkgs)
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus paket CBT.", { id: toastId })
    }
  }

  async function handleDeleteOsceStation(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus stasiun OSCE utama ini dari database?")) return
    const toastId = toast.loading("Menghapus stasiun OSCE...")
    try {
      await deleteOsceStation(id)
      toast.success("Stasiun OSCE berhasil dihapus.", { id: toastId })
      const stns = await listOsceStations()
      setOsceStations(stns)
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus stasiun OSCE.", { id: toastId })
    }
  }

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
        <div className="grid grid-cols-2 sm:grid-cols-4 p-1 bg-card/25 rounded-xl border border-border/80 w-full max-w-2xl gap-1">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "users" ? "bg-background text-foreground shadow-xs border border-border/30" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Users className="h-3.5 w-3.5" /> Users ({stats.totalUsers})
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "payments" ? "bg-background text-foreground shadow-xs border border-border/30" : "text-muted-foreground hover:text-foreground"}`}
          >
            <CreditCard className="h-3.5 w-3.5" /> Payments ({stats.totalPayments})
          </button>
          <button
            onClick={() => setActiveTab("cbt")}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "cbt" ? "bg-background text-foreground shadow-xs border border-border/30" : "text-muted-foreground hover:text-foreground"}`}
          >
            <BookOpen className="h-3.5 w-3.5" /> Default CBT ({defaultCbtPackages.length})
          </button>
          <button
            onClick={() => setActiveTab("osce")}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "osce" ? "bg-background text-foreground shadow-xs border border-border/30" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Default OSCE ({defaultOsceStations.length})
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
              <div className="hidden md:grid grid-cols-[1.1fr_100px_180px_1.5fr] gap-4 p-4 border-b border-border/60 bg-muted/20 text-xs font-bold text-muted-foreground uppercase tracking-wider">
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
                    <div key={profile.id} className="grid grid-cols-1 md:grid-cols-[1.1fr_100px_180px_1.5fr] gap-3 md:gap-4 p-4 items-center hover:bg-muted/10 transition-colors">
                      
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
                      <div className="flex flex-col sm:flex-row gap-2 md:justify-end mt-2 md:mt-0 items-end">
                        {/* Role Control */}
                        <div className="flex flex-col gap-1 w-full sm:w-auto">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">Set Permission Role</label>
                          <select
                            value={profile.role || "user"}
                            disabled={updatingId === profile.id || profile.id === currentUserId}
                            onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                            className="bg-background border border-border/80 rounded-lg text-[11px] font-bold px-2 py-1.5 outline-none text-foreground w-full sm:w-28 cursor-pointer disabled:opacity-50"
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
                            className="bg-background border border-border/80 rounded-lg text-[11px] font-bold px-2 py-1.5 outline-none text-foreground w-full sm:w-36 cursor-pointer disabled:opacity-50"
                          >
                            <option value="none">None (Regular Plan)</option>
                            <option value="backer">Backer</option>
                            <option value="sponsor">Sponsor</option>
                            <option value="gold sponsor">Gold Sponsor</option>
                            <option value="platinum sponsor">Platinum Sponsor</option>
                            <option value="diamond sponsor">Diamond Sponsor</option>
                          </select>
                        </div>

                        {/* View History Button */}
                        <div className="flex flex-col gap-1 w-full sm:w-auto justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedUser(profile)}
                            className="text-[11px] font-bold h-[31px] px-3 gap-1 hover:bg-muted"
                          >
                            <History className="h-3.5 w-3.5" /> Riwayat
                          </Button>
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

        {activeTab === "cbt" && (
          <div className="space-y-6">
            {/* Header / Create Shortcut */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card/30 border border-border/80 rounded-xl p-4 shadow-xs">
              <div>
                <h3 className="font-bold text-sm text-foreground">Manajemen Soal CBT Utama</h3>
                <p className="text-xs text-muted-foreground mt-1">Daftar paket soal Computer-Based Test bawaan sistem yang tersedia secara nasional untuk seluruh pengguna.</p>
              </div>
              <Button asChild className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 gap-1.5 shrink-0 shadow-xs">
                <Link href="/cbt/create">
                  <Plus className="h-4 w-4" /> Buat Paket Default Baru
                </Link>
              </Button>
            </div>

            {/* List */}
            <div className="rounded-xl border border-border/80 bg-card/30 overflow-hidden shadow-xs">
              <div className="hidden md:grid grid-cols-[1fr_2fr_120px_150px] gap-4 p-4 border-b border-border/60 bg-muted/20 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <div>Nama Paket</div>
                <div>Deskripsi</div>
                <div>Jumlah Soal</div>
                <div className="text-right">Aksi / Kontrol</div>
              </div>
              <div className="divide-y divide-border/60">
                {defaultCbtPackages.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground font-semibold">
                    Tidak ada paket CBT utama yang ditemukan.
                  </div>
                ) : (
                  defaultCbtPackages.map((pkg) => (
                    <div key={pkg.id} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_120px_150px] gap-3 md:gap-4 p-4 items-center hover:bg-muted/10 transition-colors">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-foreground">{pkg.name}</span>
                        <span className="text-[9px] text-muted-foreground font-mono mt-1 uppercase">ID: {pkg.id}</span>
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {pkg.description || <span className="italic text-muted-foreground/45">Tidak ada deskripsi</span>}
                      </div>
                      <div className="text-xs font-semibold text-foreground">
                        {pkg.questions.length} Butir Soal
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline" className="h-8 text-xs font-bold border-border/80 hover:bg-muted">
                          <Link href={`/cbt/create?edit=${pkg.id}`}>
                            <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteCbtPackage(pkg.id)}
                          className="h-8 text-xs font-bold"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "osce" && (
          <div className="space-y-6">
            {/* Header / Create Shortcut */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card/30 border border-border/80 rounded-xl p-4 shadow-xs">
              <div>
                <h3 className="font-bold text-sm text-foreground">Manajemen Stasiun OSCE Utama</h3>
                <p className="text-xs text-muted-foreground mt-1">Daftar stasiun ujian OSCE bawaan sistem yang tersedia secara nasional untuk seluruh pengguna.</p>
              </div>
              <Button asChild className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 gap-1.5 shrink-0 shadow-xs">
                <Link href="/osce/create">
                  <Plus className="h-4 w-4" /> Buat Stasiun Default Baru
                </Link>
              </Button>
            </div>

            {/* List */}
            <div className="rounded-xl border border-border/80 bg-card/30 overflow-hidden shadow-xs">
              <div className="hidden md:grid grid-cols-[1.5fr_1fr_120px_150px] gap-4 p-4 border-b border-border/60 bg-muted/20 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <div>Nama Stasiun</div>
                <div>Kategori</div>
                <div>Aspek Rubrik</div>
                <div className="text-right">Aksi / Kontrol</div>
              </div>
              <div className="divide-y divide-border/60">
                {defaultOsceStations.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground font-semibold">
                    Tidak ada stasiun OSCE utama yang ditemukan.
                  </div>
                ) : (
                  defaultOsceStations.map((station) => (
                    <div key={station.id} className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_120px_150px] gap-3 md:gap-4 p-4 items-center hover:bg-muted/10 transition-colors">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-foreground">{station.title}</span>
                        <span className="text-[9px] text-muted-foreground font-mono mt-1 uppercase">ID: {station.id}</span>
                      </div>
                      <div>
                        <Badge variant="secondary" className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20">
                          {station.category}
                        </Badge>
                      </div>
                      <div className="text-xs font-semibold text-foreground">
                        {station.rubric?.length || 0} Aspek Penilaian
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline" className="h-8 text-xs font-bold border-border/80 hover:bg-muted">
                          <Link href={`/osce/create?edit=${station.id}`}>
                            <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteOsceStation(station.id)}
                          className="h-8 text-xs font-bold"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Exam History Dialog Modal */}
        <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-6">
            <DialogHeader className="border-b border-border/60 pb-4">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-red-500" />
                Riwayat Ujian Pengguna
              </DialogTitle>
              {selectedUser && (
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Nama: <span className="font-semibold text-foreground">{selectedUser.full_name || "Tanpa Nama"}</span> · Email: <span className="font-semibold text-foreground">{selectedUser.email}</span>
                </DialogDescription>
              )}
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-6 mt-4">
                {/* Segmented Tab Controls */}
                <div className="flex p-1 bg-card/45 rounded-xl border border-border/80 w-full max-w-xs gap-1">
                  <button
                    onClick={() => setAttemptsTab("cbt")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${attemptsTab === "cbt" ? "bg-background text-foreground shadow-xs border border-border/30" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <BookOpen className="h-3.5 w-3.5" /> CBT Simulator ({userCbtAttempts.length})
                  </button>
                  <button
                    onClick={() => setAttemptsTab("osce")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${attemptsTab === "osce" ? "bg-background text-foreground shadow-xs border border-border/30" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" /> OSCE Prep ({userOsceAttempts.length})
                  </button>
                </div>

                {loadingAttempts ? (
                  <div className="flex h-[30vh] flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground font-medium">Memuat riwayat ujian...</p>
                  </div>
                ) : attemptsTab === "cbt" ? (
                  /* CBT Attempts List */
                  userCbtAttempts.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-border rounded-xl bg-card/20">
                      <p className="text-muted-foreground text-xs font-medium">Belum ada riwayat CBT untuk pengguna ini.</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-card/30 overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-muted text-[10px] uppercase font-bold text-muted-foreground border-b border-border">
                            <tr>
                              <th className="px-4 py-3">Paket Ujian</th>
                              <th className="px-4 py-3">Tanggal</th>
                              <th className="px-4 py-3">Durasi</th>
                              <th className="px-4 py-3">Skor</th>
                              <th className="px-4 py-3 text-right">Detail</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {userCbtAttempts.map((att) => {
                              const minutes = Math.floor(att.time_spent / 60)
                              const seconds = att.time_spent % 60
                              const durationStr = `${minutes}m ${seconds}s`
                              const isPassed = att.score >= 70

                              return (
                                <tr key={att.id} className="hover:bg-muted/10 transition-colors">
                                  <td className="px-4 py-3.5 font-semibold text-foreground max-w-[200px] truncate">
                                    {att.package_name}
                                  </td>
                                  <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(att.created_at).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                      })}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {durationStr}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3.5 whitespace-nowrap">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${isPassed ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                                      {att.score}% · {isPassed ? "LULUS" : "GAGAL"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                    <Button asChild variant="outline" size="sm" className="h-7 text-[10px] font-bold px-2 py-1 gap-1">
                                      <a href={`/cbt/results/${att.id}`} target="_blank" rel="noopener noreferrer">
                                        Detail <ExternalLink className="h-2.5 w-2.5" />
                                      </a>
                                    </Button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                ) : (
                  /* OSCE Attempts List */
                  userOsceAttempts.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-border rounded-xl bg-card/20">
                      <p className="text-muted-foreground text-xs font-medium">Belum ada riwayat OSCE untuk pengguna ini.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {userOsceAttempts.map((a) => {
                        const pct = Math.round((a.total_score / a.max_score) * 100)
                        let scoreColor = "text-red-500 bg-red-500/10"
                        if (pct >= 80) scoreColor = "text-emerald-500 bg-emerald-500/10"
                        else if (pct >= 60) scoreColor = "text-yellow-600 bg-yellow-500/10"

                        const diffSec = Math.round((new Date(a.completed_at).getTime() - new Date(a.started_at).getTime()) / 1000)
                        const min = Math.floor(diffSec / 60)
                        const sec = diffSec % 60
                        const durationStr = `${min}m ${sec}s`

                        return (
                          <Card key={a.id} className="p-3.5 border border-border bg-card/40 hover:bg-card/60 transition-all text-xs flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <span className="font-bold text-foreground line-clamp-1 block text-left" title={a.station_title}>
                                  {a.station_title}
                                </span>
                                <Badge className={`font-extrabold text-[11px] px-1.5 py-0.5 shrink-0 rounded-md ${scoreColor}`} variant="outline">
                                  {pct}%
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground font-semibold border-b border-border/40 pb-2 mb-2">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(a.completed_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{durationStr}</span>
                                </div>
                              </div>
                              
                              {a.feedback && (
                                <p className="text-[10px] text-muted-foreground line-clamp-3 italic leading-relaxed mb-3 text-left">
                                  "{a.feedback}"
                                </p>
                              )}
                            </div>

                            <div className="flex justify-between items-center mt-auto pt-2 border-t border-border/40">
                              <span className="text-[10px] font-bold text-foreground">Score: {a.total_score}/{a.max_score}</span>
                              <Button asChild variant="outline" size="sm" className="h-7 text-[10px] font-bold px-2 py-1 gap-1">
                                <a href={`/osce/practice/${a.station_id}?attempt=${a.id}`} target="_blank" rel="noopener noreferrer">
                                  Buka Evaluasi <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              </Button>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  )
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </AppShell>
  )
}

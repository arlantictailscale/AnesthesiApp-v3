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
  ArrowLeft
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

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("")
  
  // Updating action state
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const router = useRouter()

  // Verify auth and load all user profiles
  async function initAdmin() {
    try {
      const session = await getSession()
      if (!session) {
        toast.error("You must sign in first.")
        router.replace("/login")
        return
      }
      setCurrentUserId(session.userId)

      // Fetch users
      const res = await fetch("/api/admin/users")
      if (res.status === 403) {
        toast.error("Access Denied: Admin privileges required.")
        router.replace("/dashboard")
        return
      }

      if (!res.ok) {
        throw new Error("Failed to load users data.")
      }

      const data = await res.json()
      setUsers(data.users || [])
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
    initAdmin()
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

  // Search filter computes
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

  // Stat summary computes
  const stats = useMemo(() => {
    const total = users.length
    const admins = users.filter(u => u.role === "admin").length
    const supporters = users.filter(u => u.supporter_tier && u.supporter_tier !== "none").length
    return { total, admins, supporters }
  }, [users])

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
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border border-border bg-card/45 backdrop-blur-xs shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" /> Total Platform Users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground">{stats.total}</div>
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

        {/* Search & Filter */}
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

        {/* Users list/table */}
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

      </div>
    </AppShell>
  )
}

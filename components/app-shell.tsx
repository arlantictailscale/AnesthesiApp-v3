"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getSession, signOut } from "@/lib/storage"
import {
  LogOut,
  Plus,
  User,
  Menu,
  LayoutDashboard,
  ClipboardList,
  GraduationCap,
  BookOpen,
  Pill,
  Share2
} from "lucide-react"
import { Logo } from "@/components/logo"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    let active = true
    getSession().then(async (s) => {
      if (!active) return
      if (!s) {
        router.replace("/login")
        return
      }
      setEmail(s.email)
      setReady(true)

      // Background self-healing check to sync MFA metadata status
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const supabase = createClient()
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (active && aalData) {
          const hasMfaEnrolled = aalData.nextLevel === "aal2"
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const metadataEnrolled = user.user_metadata?.mfa_enrolled === true
            if (hasMfaEnrolled !== metadataEnrolled) {
              await supabase.auth.updateUser({ data: { mfa_enrolled: hasMfaEnrolled } })
            }
          }
        }
      } catch (err) {
        console.error("MFA metadata sync check failed:", err)
      }
    })
    return () => {
      active = false
    }
  }, [router])

  // Close sheet on path change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  async function handleSignOut() {
    await signOut()
    router.replace("/login")
    router.refresh()
  }

  const isDashboard = pathname === "/dashboard"
  const isCbt = pathname?.startsWith("/cbt")
  const isDrugs = pathname?.startsWith("/drugs")
  const isGuidelines = pathname?.startsWith("/guidelines")
  const isResearch = pathname?.startsWith("/research")
  const isOsce = pathname?.startsWith("/osce")
  const isNew = pathname?.startsWith("/cases/new")
  const isCases = pathname?.startsWith("/cases") && !isNew

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 md:px-6">
          <Logo href="/dashboard" height={30} />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <Button
              asChild
              variant={isDashboard ? "secondary" : "ghost"}
              size="sm"
            >
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button
              asChild
              variant={isCases ? "secondary" : "ghost"}
              size="sm"
            >
              <Link href="/cases">My cases</Link>
            </Button>
            <Button
              asChild
              variant={isNew ? "secondary" : "ghost"}
              size="sm"
              className="gap-1"
            >
              <Link href="/cases/new">
                <Plus className="h-4 w-4" />
                <span>New case</span>
              </Link>
            </Button>
            <Button
              asChild
              variant={isCbt ? "secondary" : "ghost"}
              size="sm"
            >
              <Link href="/cbt">CBT Prep</Link>
            </Button>
            <Button
              asChild
              variant={isOsce ? "secondary" : "ghost"}
              size="sm"
            >
              <Link href="/osce">OSCE Prep</Link>
            </Button>
            <Button
              asChild
              variant={isDrugs ? "secondary" : "ghost"}
              size="sm"
            >
              <Link href="/drugs">Drug Library</Link>
            </Button>
            <Button
              asChild
              variant={isGuidelines ? "secondary" : "ghost"}
              size="sm"
            >
              <Link href="/guidelines">Guidelines</Link>
            </Button>
            <Button
              asChild
              variant={isResearch ? "secondary" : "ghost"}
              size="sm"
            >
              <Link href="/research">Research</Link>
            </Button>
          </nav>

          <div className="flex items-center gap-2">
            {/* Account Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account menu">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="max-w-[220px] truncate">
                  {email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center w-full cursor-pointer">
                    <User className="mr-2 h-4 w-4" /> My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Sheet Trigger */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px] p-4 flex flex-col justify-between">
                <div className="flex flex-col gap-6">
                  <SheetHeader className="p-0 text-left">
                    <SheetTitle>
                      <Logo href="/dashboard" height={28} />
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-1">
                    <Button
                      asChild
                      variant={isDashboard ? "secondary" : "ghost"}
                      className="justify-start gap-3 w-full"
                    >
                      <Link href="/dashboard">
                        <LayoutDashboard className="h-4 w-4 shrink-0 text-primary" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant={isCases ? "secondary" : "ghost"}
                      className="justify-start gap-3 w-full"
                    >
                      <Link href="/cases">
                        <ClipboardList className="h-4 w-4 shrink-0 text-primary" />
                        My cases
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant={isNew ? "secondary" : "ghost"}
                      className="justify-start gap-3 w-full"
                    >
                      <Link href="/cases/new">
                        <Plus className="h-4 w-4 shrink-0 text-primary" />
                        New case
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant={isCbt ? "secondary" : "ghost"}
                      className="justify-start gap-3 w-full"
                    >
                      <Link href="/cbt">
                        <GraduationCap className="h-4 w-4 shrink-0 text-primary" />
                        CBT Prep
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant={isOsce ? "secondary" : "ghost"}
                      className="justify-start gap-3 w-full"
                    >
                      <Link href="/osce">
                        <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                        OSCE Prep
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant={isDrugs ? "secondary" : "ghost"}
                      className="justify-start gap-3 w-full"
                    >
                      <Link href="/drugs">
                        <Pill className="h-4 w-4 shrink-0 text-primary" />
                        Drug Library
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant={isGuidelines ? "secondary" : "ghost"}
                      className="justify-start gap-3 w-full"
                    >
                      <Link href="/guidelines">
                        <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                        Guidelines
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant={isResearch ? "secondary" : "ghost"}
                      className="justify-start gap-3 w-full"
                    >
                      <Link href="/research">
                        <Share2 className="h-4 w-4 shrink-0 text-primary" />
                        Research Hub
                      </Link>
                    </Button>
                  </nav>
                </div>
                {email && (
                  <div className="border-t pt-4 flex flex-col gap-2">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                    >
                      <User className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground truncate font-medium">Logged in as</p>
                        <p className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">{email}</p>
                      </div>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10 gap-3 w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6 md:py-10">
        {children}
      </main>
    </div>
  )
}

"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
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
  Share2,
  Heart,
  Pill,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  CreditCard,
  History
} from "lucide-react"
import { Logo } from "@/components/logo"
import { Footer } from "@/components/footer"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SupporterBadge } from "@/components/supporter-badge"

const TERMS_AND_PRIVACY_TEXT = `
ANESTHESIAPP TERMS OF SERVICE & PRIVACY POLICY
Last updated: June 20, 2026

Welcome to AnesthesiApp. Before using our service, you must read, understand, and agree to all of the terms and conditions below.

1. MEDICAL DISCLAIMER
- AnesthesiApp is an educational simulation, exam preparation, and clinical research case logging platform for study purposes.
- This application is NOT a certified medical device, an official Electronic Health Record (EHR/EMR), or a clinical decision support tool.
- All dosages, guidelines, and drug formulas provided in the Pharmacology and Guidelines modules are for academic review only. Never rely on the outputs of this application for real patient care or clinical management.

2. PATIENT DATA PRIVACY & ANONYMIZATION POLICY (CRITICAL)
- As a user logging clinical cases, you are solely responsible for maintaining patient privacy and complying with health data protection laws (such as HIPAA in the US, GDPR in the EU, and UU PDP in Indonesia).
- You are strictly prohibited from entering real personally identifiable information (PII) or protected health information (PHI) — including real patient names, actual medical record numbers (MRN), exact dates of birth, home addresses, or phone numbers — anywhere in this application (including private logs).
- All patient name and MRN fields must use dummy, fictional, or randomized values (e.g., "Patient A", "MRN-9999").
- Our service is not designed to host actual clinical patient records. We disclaim all liability under privacy laws if you input real patient identifiers.
- We reserve the right to inspect and immediately delete any case logs suspected of containing real-world patient data or identified PII.

3. GOOGLE OAUTH AUTHENTICATION
- We use Google Sign-In to authenticate accounts. We only access basic profile information (email, name, profile picture) to set up your account.
- Your data is stored securely using TLS/SSL encryption and Row-Level Security (RLS) on Supabase databases.

4. USER RIGHTS AND DATA DELETION
- You have the full right to request the deletion of all your account data and logged cases by contacting us at support@anesthesiapp.my.id. We will process your data deletion request within 7 business days.

By checking the box below and clicking "Agree & Continue", you declare that you have read, understood, and agreed to all the terms above.
`.trim()

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)
  const [supporterTier, setSupporterTier] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Terms agreement state
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [submittingTerms, setSubmittingTerms] = useState(false)

  useEffect(() => {
    let active = true
    getSession().then(async (s) => {
      if (!active) return
      if (!s) {
        router.replace("/login")
        return
      }
      setEmail(s.email)

      // Fetch profile supporter tier
      try {
        const { getUserProfile } = await import("@/lib/storage")
        const profile = await getUserProfile(s.userId)
        if (active && profile) {
          setSupporterTier(profile.supporter_tier || null)
          setUserRole(profile.role || null)
        }
      } catch (err) {
        console.error("Failed to load user profile in app shell:", err)
      }

      // Check if user has accepted the terms and privacy policy
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const alreadyAgreed = user.user_metadata?.agreed_to_terms === true
          if (active && !alreadyAgreed) {
            setShowTermsModal(true)
          }
        }
      } catch (err) {
        console.error("Failed to check terms agreement metadata:", err)
      }

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
                <DropdownMenuLabel className="max-w-[220px] truncate flex flex-col gap-1 items-start">
                  <span className="truncate">{email}</span>
                  <SupporterBadge tier={supporterTier} />
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userRole === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center w-full cursor-pointer font-bold text-red-600 dark:text-red-400">
                      <ShieldCheck className="mr-2 h-4 w-4" /> Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center w-full cursor-pointer">
                    <User className="mr-2 h-4 w-4" /> My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/support/history" className="flex items-center w-full cursor-pointer">
                    <History className="mr-2 h-4 w-4" /> Payment History
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/support" className="flex items-center w-full cursor-pointer text-amber-600 dark:text-amber-400 font-semibold">
                    <Heart className="mr-2 h-4 w-4 fill-current" /> Support Us
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
                    {userRole === "admin" && (
                      <Button
                        asChild
                        variant={pathname === "/admin" ? "secondary" : "ghost"}
                        className="justify-start gap-3 w-full font-bold text-red-600 dark:text-red-400 hover:text-red-700"
                      >
                        <Link href="/admin">
                          <ShieldCheck className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                          Admin Panel
                        </Link>
                      </Button>
                    )}
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
      <Footer />

      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-card border border-border w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-border bg-muted/10">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
              Terms of Service & Privacy Policy Agreement
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              You must read to the end of the document and agree to the terms below to use AnesthesiApp.
            </p>
          </div>

          <div 
            onScroll={(e) => {
              const target = e.currentTarget
              const isBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 10
              if (isBottom) {
                setHasScrolled(true)
              }
            }}
            className="p-6 overflow-y-auto flex-1 text-xs text-muted-foreground whitespace-pre-line leading-relaxed border-b border-border bg-muted/5 font-medium max-h-[40vh]"
          >
            {TERMS_AND_PRIVACY_TEXT}
          </div>

          <div className="p-6 flex flex-col gap-4 bg-muted/10">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                disabled={!hasScrolled}
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
              />
              <span className={`text-xs leading-normal font-semibold ${!hasScrolled ? "text-muted-foreground/60" : "text-foreground"}`}>
                {!hasScrolled 
                  ? "Please scroll down and read the text above to enable this agreement checkbox." 
                  : "I agree to the Terms of Service and Privacy Policy of AnesthesiApp."
                }
              </span>
            </label>

            <div className="flex justify-end gap-3 mt-2">
              <Button 
                onClick={async () => {
                  await signOut()
                  window.location.replace("/login")
                }}
                variant="ghost" 
                className="text-xs font-semibold"
              >
                Log Out
              </Button>
              <Button
                disabled={!agreed || submittingTerms}
                onClick={async () => {
                  setSubmittingTerms(true)
                  try {
                    const { createClient } = await import("@/lib/supabase/client")
                    const supabase = createClient()
                    const { error } = await supabase.auth.updateUser({
                      data: { agreed_to_terms: true }
                    })
                    if (error) throw error
                    setShowTermsModal(false)
                  } catch (err) {
                    console.error("Failed to save terms agreement:", err)
                    toast.error("Failed to save agreement. Please try again.")
                  } finally {
                    setSubmittingTerms(false)
                  }
                }}
                className="gap-1.5 font-bold text-xs"
              >
                {submittingTerms && <Loader2 className="h-3 w-3 animate-spin" />}
                Agree & Continue
              </Button>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  )
}

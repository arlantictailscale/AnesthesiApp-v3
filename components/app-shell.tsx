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
import { LogOut, Plus, User } from "lucide-react"
import { Logo } from "@/components/logo"

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    getSession().then((s) => {
      if (!active) return
      if (!s) {
        router.replace("/login")
        return
      }
      setEmail(s.email)
      setReady(true)
    })
    return () => {
      active = false
    }
  }, [router])

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

  const isCbt = pathname?.startsWith("/dashboard/cbt")
  const isDrugs = pathname?.startsWith("/dashboard/drugs")
  const isGuidelines = pathname?.startsWith("/dashboard/guidelines")
  const isCases = (pathname === "/dashboard" || pathname?.startsWith("/cases")) && !isCbt && !isDrugs && !isGuidelines
  const isNew = pathname?.startsWith("/cases/new")

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 md:px-6">
          <Logo href="/dashboard" height={30} />


          <nav className="flex items-center gap-1">
            <Button
              asChild
              variant={isCases ? "secondary" : "ghost"}
              size="sm"
            >
              <Link href="/dashboard">My cases</Link>
            </Button>
            <Button
              asChild
              variant={isNew ? "secondary" : "ghost"}
              size="sm"
              className="gap-1"
            >
              <Link href="/cases/new">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New case</span>
              </Link>
            </Button>
            <Button
              asChild
              variant={isCbt ? "secondary" : "ghost"}
              size="sm"
            >
              <Link href="/dashboard/cbt">CBT Prep</Link>
            </Button>
            <Button
              asChild
              variant={isDrugs ? "secondary" : "ghost"}
              size="sm"
            >
              <Link href="/dashboard/drugs">Drug Library</Link>
            </Button>
            <Button
              asChild
              variant={isGuidelines ? "secondary" : "ghost"}
              size="sm"
            >
              <Link href="/dashboard/guidelines">Guidelines</Link>
            </Button>
          </nav>

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
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6 md:py-10">
        {children}
      </main>
    </div>
  )
}

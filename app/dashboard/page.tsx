"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { listCases, getSession, listSharedCases } from "@/lib/storage"
import { listPackages, listAttempts } from "@/lib/cbt/storage"
import { listOsceStations, listOsceAttempts } from "@/lib/osce/storage"
import { listDrugs } from "@/lib/drugs/storage"
import { listGuidelines } from "@/lib/guidelines/storage"
import type { StoredCase } from "@/lib/schema"
import {
  LayoutDashboard,
  ClipboardList,
  Plus,
  GraduationCap,
  BookOpen,
  Pill,
  Share2,
  Activity,
  Calendar,
  Search,
  ArrowRight,
  Stethoscope,
  FileSpreadsheet,
  TrendingUp,
  Award,
  ChevronRight,
  BookOpenText,
  UserCheck,
  Loader2
} from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Data states
  const [myCases, setMyCases] = useState<StoredCase[]>([])
  const [cbtCount, setCbtCount] = useState(0)
  const [cbtAttemptsCount, setCbtAttemptsCount] = useState(0)
  const [cbtAvgScore, setCbtAvgScore] = useState<number | null>(null)
  const [osceCount, setOsceCount] = useState(0)
  const [osceAttemptsCount, setOsceAttemptsCount] = useState(0)
  const [osceAvgScore, setOsceAvgScore] = useState<number | null>(null)
  const [drugsCount, setDrugsCount] = useState(0)
  const [guidelinesCount, setGuidelinesCount] = useState(0)
  const [sharedCasesCount, setSharedCasesCount] = useState(0)

  // Search state for quick drug lookup
  const [drugSearch, setDrugSearch] = useState("")

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const session = await getSession()
        if (session) {
          setEmail(session.email)
        }

        // Fetch cases
        const casesList = await listCases()
        setMyCases(casesList)

        // Fetch CBT statistics
        const [packages, attempts] = await Promise.all([listPackages(), listAttempts()])
        setCbtCount(packages.length)
        setCbtAttemptsCount(attempts.length)
        if (attempts.length > 0) {
          const totalScore = attempts.reduce((acc, curr) => acc + curr.score, 0)
          setCbtAvgScore(Math.round(totalScore / attempts.length))
        }

        // Fetch OSCE statistics
        const [stations, osceAttempts] = await Promise.all([listOsceStations(), listOsceAttempts()])
        setOsceCount(stations.length)
        setOsceAttemptsCount(osceAttempts.length)
        if (osceAttempts.length > 0) {
          const completedAttempts = osceAttempts.filter((a) => a.status === "completed")
          if (completedAttempts.length > 0) {
            const totalScore = completedAttempts.reduce((acc, curr) => acc + (curr.total_score || 0), 0)
            const maxScore = completedAttempts.reduce((acc, curr) => acc + (curr.max_score || 0), 0)
            setOsceAvgScore(maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0)
          } else {
            setOsceAvgScore(null)
          }
        }

        // Fetch Drug count
        const drugsList = await listDrugs()
        setDrugsCount(drugsList.length)

        // Fetch Guidelines count
        const guidelinesList = await listGuidelines()
        setGuidelinesCount(guidelinesList.length)

        // Fetch Shared Cases count
        const sharedCases = await listSharedCases()
        setSharedCasesCount(sharedCases.length)
      } catch (err) {
        console.error("Failed to load dashboard data", err)
        toast.error("Some stats could not be loaded")
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  useEffect(() => {
    if (!myCases || !myCases.some((c) => c.status === "processing")) return
    const interval = setInterval(() => {
      listCases()
        .then((rows) => {
          setMyCases(rows)
        })
        .catch(console.error)
    }, 3000)
    return () => clearInterval(interval)
  }, [myCases])

  function handleDrugSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!drugSearch.trim()) return
    router.push(`/drugs?search=${encodeURIComponent(drugSearch.trim())}`)
  }

  // Get user prefix for welcoming message
  const userGreeting = email ? email.split("@")[0] : "Doctor"
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Loading Screen
  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Gathering your clinical dashboard...</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-8 pb-10">
        
        {/* Welcome Section */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Hello, <span className="bg-gradient-to-r from-primary to-[color:var(--brand-crimson)] bg-clip-text text-transparent capitalize">{userGreeting}</span>
            </h1>
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" /> {currentDate}
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button asChild size="sm" className="gap-1.5 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-xs">
              <Link href="/cases/new">
                <Plus className="h-4 w-4" /> Log New Case
              </Link>
            </Button>
          </div>
        </div>

        {/* Global Statistics Ribbon */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card className="border border-border/80 bg-card/60 backdrop-blur-xs shadow-xs transition-all duration-300 hover:shadow-sm">
            <CardContent className="p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Cases</span>
                <ClipboardList className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight">{myCases.length}</span>
                <span className="text-[10px] text-muted-foreground font-medium">Logged</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-card/60 backdrop-blur-xs shadow-xs transition-all duration-300 hover:shadow-sm">
            <CardContent className="p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CBT Score</span>
                <GraduationCap className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-emerald-600">
                  {cbtAvgScore !== null ? `${cbtAvgScore}%` : "—"}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">Average</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-card/60 backdrop-blur-xs shadow-xs transition-all duration-300 hover:shadow-sm">
            <CardContent className="p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">OSCE Score</span>
                <BookOpen className="h-4 w-4 text-amber-500" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-amber-600">
                  {osceAvgScore !== null ? `${osceAvgScore}%` : "—"}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">Evaluation</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-card/60 backdrop-blur-xs shadow-xs transition-all duration-300 hover:shadow-sm">
            <CardContent className="p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Drug Profiles</span>
                <Pill className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-indigo-600">{drugsCount}</span>
                <span className="text-[10px] text-muted-foreground font-medium">Available</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Primary Content Split: 2 Columns */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Column 1 & 2: Main Activity (Cases, Prep Status) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Case Logger Activity */}
            <Card className="border border-border/80 shadow-xs flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      Anesthesia Case Log
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Monitor and review your clinical documentation activity.
                    </CardDescription>
                  </div>
                  <Button asChild size="xs" variant="outline" className="text-xs font-semibold h-8">
                    <Link href="/cases">View All Cases</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {myCases.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed rounded-lg bg-muted/20">
                    <ClipboardList className="h-10 w-10 text-muted-foreground/30 mb-2" />
                    <p className="text-sm font-semibold">No logged cases yet</p>
                    <p className="text-xs text-muted-foreground max-w-[280px] mt-0.5 mb-3">
                      Start building your clinical profile by logging your first anesthesia procedure.
                    </p>
                    <Button asChild size="sm" className="gap-1 bg-primary text-xs font-bold">
                      <Link href="/cases/new">
                        <Plus className="h-3.5 w-3.5" /> Log First Case
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                          <th className="py-2.5">Patient / MRN</th>
                          <th className="py-2.5 hidden sm:table-cell">Diagnosis</th>
                          <th className="py-2.5">Procedure</th>
                          <th className="py-2.5 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {myCases.slice(0, 3).map((c) => {
                          const isProcessing = c.status === "processing"
                          const isFailed = c.status === "failed"

                          return (
                            <tr key={c.id} className="hover:bg-muted/30 transition-colors group">
                              <td className="py-3 pr-2">
                                <span className="font-bold text-foreground block group-hover:text-primary transition-colors flex items-center gap-1.5">
                                  {isProcessing && (
                                    <Loader2 className="h-3 w-3 animate-spin text-amber-500 shrink-0" />
                                  )}
                                  {isProcessing ? (
                                    <span className="text-amber-600 dark:text-amber-400">AI Populating...</span>
                                  ) : isFailed ? (
                                    <span className="text-destructive">AI Population Failed</span>
                                  ) : (
                                    c.patient_name
                                  )}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium uppercase">
                                  {isProcessing ? "Extracting..." : isFailed ? "Failed" : `MRN ${c.medical_record_number}`}
                                </span>
                              </td>
                              <td className="py-3 pr-2 hidden sm:table-cell max-w-[150px] truncate font-medium text-muted-foreground">
                                {isProcessing ? "Processing..." : isFailed ? "—" : c.diagnosis}
                              </td>
                              <td className="py-3 pr-2 max-w-[150px] truncate font-medium text-foreground">
                                {isProcessing ? "Processing..." : isFailed ? "—" : c.procedure_intervention}
                              </td>
                              <td className="py-3 text-right whitespace-nowrap font-medium text-muted-foreground">
                                {isProcessing ? (
                                  <span className="text-amber-500 font-semibold">Processing</span>
                                ) : isFailed ? (
                                  <span className="text-destructive font-semibold">Failed</span>
                                ) : (
                                  new Date(c.procedure_date).toLocaleDateString()
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prep Modules: CBT & OSCE */}
            <div className="grid gap-6 sm:grid-cols-2">
              
              {/* CBT Prep Card */}
              <Card className="border border-border/80 shadow-xs flex flex-col justify-between group hover:border-emerald-500/30 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/10 font-bold text-[9px] uppercase tracking-wider">
                      CBT Prep
                    </Badge>
                    <GraduationCap className="h-5 w-5 text-emerald-500" />
                  </div>
                  <CardTitle className="text-base font-bold mt-2.5 group-hover:text-emerald-600 transition-colors">
                    CBT Simulator & Hub
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Access standard practice packages and community exams.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-4 border-y py-3 text-xs mb-4">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Packages</span>
                      <span className="font-extrabold text-foreground text-sm">{cbtCount} Available</span>
                    </div>
                    <div className="border-l pl-4">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Attempts</span>
                      <span className="font-extrabold text-foreground text-sm">{cbtAttemptsCount} Total</span>
                    </div>
                  </div>
                  <Button asChild size="sm" className="w-full gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                    <Link href="/cbt">
                      Practice CBT Exams <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* OSCE Prep Card */}
              <Card className="border border-border/80 shadow-xs flex flex-col justify-between group hover:border-amber-500/30 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/10 font-bold text-[9px] uppercase tracking-wider">
                      OSCE Prep
                    </Badge>
                    <Stethoscope className="h-5 w-5 text-amber-500" />
                  </div>
                  <CardTitle className="text-base font-bold mt-2.5 group-hover:text-amber-600 transition-colors">
                    OSCE Examiner Hub
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Practice structured OSCE stations with timing and scoring.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-4 border-y py-3 text-xs mb-4">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Stations</span>
                      <span className="font-extrabold text-foreground text-sm">{osceCount} Available</span>
                    </div>
                    <div className="border-l pl-4">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Attempts</span>
                      <span className="font-extrabold text-foreground text-sm">{osceAttemptsCount} Total</span>
                    </div>
                  </div>
                  <Button asChild size="sm" className="w-full gap-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs">
                    <Link href="/osce">
                      Start OSCE Prep <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Column 3: Sidebar tools (Drugs, Guidelines, Peer Hub) */}
          <div className="flex flex-col gap-6">
            
            {/* Drug Lookup Search Panel */}
            <Card className="border border-border/80 shadow-xs bg-indigo-500/5 border-indigo-500/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-700">
                  <Pill className="h-4.5 w-4.5 text-indigo-500" />
                  Quick Drug Search
                </CardTitle>
                <CardDescription className="text-xs text-indigo-600">
                  Instantly access pharmacology, dosing, and clinical guidelines.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDrugSearchSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-indigo-400" />
                    <Input
                      placeholder="e.g. Propofol, Fentanyl"
                      className="pl-8 text-xs h-9 bg-white border-indigo-200 focus-visible:ring-indigo-500"
                      value={drugSearch}
                      onChange={(e) => setDrugSearch(e.target.value)}
                    />
                  </div>
                  <Button type="submit" size="sm" className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0">
                    Search
                  </Button>
                </form>
                <div className="mt-4 flex justify-between items-center text-[10px] text-indigo-700 font-semibold">
                  <span>Pharmacology Library</span>
                  <Link href="/drugs" className="hover:underline flex items-center gap-0.5">
                    Browse All Drugs <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Quick Reference Guidelines */}
            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BookOpenText className="h-4.5 w-4.5 text-primary" />
                  Guidelines Library
                </CardTitle>
                <CardDescription className="text-xs">
                  Browse {guidelinesCount} official clinical anesthesia guidelines.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs space-y-2 border-t pt-2.5">
                  <div className="flex items-start justify-between gap-2 p-1.5 rounded-sm hover:bg-muted/40 transition-colors">
                    <span className="font-semibold text-foreground truncate max-w-[200px]">ASA Difficult Airway</span>
                    <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 text-[8px] font-bold py-0.5">Airway</Badge>
                  </div>
                  <div className="flex items-start justify-between gap-2 p-1.5 rounded-sm hover:bg-muted/40 transition-colors">
                    <span className="font-semibold text-foreground truncate max-w-[200px]">Sepsis Survival Campaign</span>
                    <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[8px] font-bold py-0.5">Critical Care</Badge>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full text-xs font-semibold mt-1">
                  <Link href="/guidelines">Open Guidelines</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Peer Research Hub */}
            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Share2 className="h-4.5 w-4.5 text-primary" />
                  Peer Research Library
                </CardTitle>
                <CardDescription className="text-xs">
                  Analyse case contributions shared by fellow residents.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 border rounded-lg p-3 text-xs mb-4 flex justify-around">
                  <div className="text-center">
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase">Shared Library</span>
                    <span className="font-extrabold text-foreground text-sm">{sharedCasesCount} Cases</span>
                  </div>
                  <div className="border-l" />
                  <div className="text-center">
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase">Collaborators</span>
                    <span className="font-extrabold text-foreground text-sm flex items-center justify-center gap-0.5">
                      <UserCheck className="h-3 w-3 text-emerald-500" /> Active
                    </span>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full text-xs font-semibold">
                  <Link href="/research">Browse Research Library</Link>
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>

      </div>
    </AppShell>
  )
}

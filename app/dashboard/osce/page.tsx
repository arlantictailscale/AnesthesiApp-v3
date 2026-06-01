"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { listOsceStations, listOsceAttempts, deleteOsceStation } from "@/lib/osce-storage"
import type { OsceStation, OsceAttempt } from "@/lib/osce-default-data"
import {
  BookOpen, Play, CheckCircle2, History, TrendingUp, Award, Clock, HelpCircle, AlertTriangle, Plus, Edit2, Trash2
} from "lucide-react"

export default function OscePrepDashboard() {
  const [stations, setStations] = useState<OsceStation[]>([])
  const [attempts, setAttempts] = useState<OsceAttempt[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    try {
      const stationsList = await listOsceStations()
      const attemptsList = await listOsceAttempts()
      setStations(stationsList)
      setAttempts(attemptsList)
    } catch (err) {
      toast.error("Failed to load OSCE preparation data.")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus stasiun OSCE kustom ini?")) return
    try {
      await deleteOsceStation(id)
      toast.success("Stasiun OSCE kustom berhasil dihapus.")
      loadData()
    } catch (err) {
      toast.error("Gagal menghapus stasiun OSCE.")
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Calculate statistics
  const totalAttempts = attempts.length
  const completedAttempts = attempts.filter((a) => a.status === "completed")
  const averageScore = completedAttempts.length > 0
    ? Math.round(
        (completedAttempts.reduce((acc, curr) => acc + curr.total_score, 0) /
          completedAttempts.reduce((acc, curr) => acc + curr.max_score, 0)) *
          100
      )
    : 0

  const highestScore = completedAttempts.length > 0
    ? Math.max(...completedAttempts.map((a) => Math.round((a.total_score / a.max_score) * 100)))
    : 0

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-primary" />
              OSCE Preparation Study
            </h1>
            <p className="text-sm text-muted-foreground max-w-3xl">
              Prepare for practical clinical examinations using our simulated OSCE stations. Practice with an AI examiner and get evaluated against standard grading rubrics.
            </p>
          </div>
          <Button asChild className="sm:self-start bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs shrink-0 h-9 gap-1.5 shadow-sm">
            <Link href="/dashboard/osce/create">
              <Plus className="h-4 w-4" />
              Buat Station Baru
            </Link>
          </Button>
        </div>

        {/* Analytics Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-muted/10 border-border shadow-xs">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Practice Attempts</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center gap-3">
              <History className="h-5 w-5 text-primary shrink-0" />
              <div className="text-2xl font-bold">{totalAttempts}</div>
            </CardContent>
          </Card>

          <Card className="bg-muted/10 border-border shadow-xs">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Average Score Rating</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-emerald-500 shrink-0" />
              <div className="text-2xl font-bold text-emerald-500">
                {averageScore > 0 ? `${averageScore}%` : "—"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/10 border-border shadow-xs">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Highest Evaluation Score</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center gap-3">
              <Award className="h-5 w-5 text-yellow-500 shrink-0" />
              <div className="text-2xl font-bold text-yellow-500">
                {highestScore > 0 ? `${highestScore}%` : "—"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stations and Attempts Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column: Stations List */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-1.5 border-b border-border pb-1">
              Active Exam Stations ({stations.length})
            </h2>

            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-44 w-full animate-pulse bg-muted rounded-xl border" />
              ))
            ) : stations.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">No OSCE stations available.</Card>
            ) : (
              <div className="grid gap-4">
                {stations.map((s) => (
                  <Card key={s.id} className="border border-border bg-card hover:border-primary/40 transition-all p-5 flex flex-col gap-4 group">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <Badge className="mb-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                          {s.category}
                        </Badge>
                        <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                          {s.title}
                        </h3>
                      </div>
                      <Badge variant="outline" className="flex gap-1 py-0.5 px-2 text-xs font-semibold shrink-0">
                        <Clock className="h-3 w-3 mt-0.5 text-muted-foreground" /> {s.duration_minutes} Mins
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {s.scenario}
                    </p>

                    <div className="flex flex-wrap gap-1.5 py-1">
                      {s.equipment.slice(0, 4).map((eq) => (
                        <span key={eq} className="text-[10px] bg-muted/65 text-muted-foreground font-semibold px-2 py-0.5 rounded-full border border-border/50">
                          {eq}
                        </span>
                      ))}
                      {s.equipment.length > 4 && (
                        <span className="text-[10px] text-muted-foreground px-2 py-0.5 font-semibold">
                          +{s.equipment.length - 4} more
                        </span>
                      )}
                    </div>

                    <div className="border-t border-border pt-3 flex items-center justify-between mt-auto">
                      <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                        <HelpCircle className="h-3.5 w-3.5 text-primary" /> {s.rubric.length} Evaluation Aspects
                      </span>
                      <div className="flex items-center gap-2">
                        {s.user_id !== null && (
                          <>
                            <Button asChild size="sm" variant="outline" className="h-8 text-xs font-semibold px-2.5 gap-1">
                              <Link href={`/dashboard/osce/create?edit=${s.id}`}>
                                <Edit2 className="h-3 w-3 text-muted-foreground" /> Edit
                              </Link>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="h-8 text-xs font-semibold px-2.5"
                              onClick={() => handleDelete(s.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        <Button asChild size="sm" className="gap-1.5 font-bold text-xs h-8">
                          <Link href={`/dashboard/osce/practice/${s.id}`}>
                            <Play className="h-3.5 w-3.5 fill-current" /> Mulai Simulasi
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: History list */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-1.5 border-b border-border pb-1">
              Practice History
            </h2>

            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 w-full animate-pulse bg-muted rounded-xl border" />
              ))
            ) : attempts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-xl bg-card">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground font-medium">Belum ada riwayat latihan OSCE.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {attempts.map((a) => {
                  const pct = Math.round((a.total_score / a.max_score) * 100)
                  let scoreColor = "text-red-500"
                  if (pct >= 80) scoreColor = "text-emerald-500"
                  else if (pct >= 60) scoreColor = "text-yellow-600"

                  const stationTitle = a.station_id === "builtin-obstetric-sc-appendicitis"
                    ? "Sectio Caesarea & Appendiktomi"
                    : "OSCE Custom Station"

                  return (
                    <Card key={a.id} className="p-3 border border-border bg-card hover:bg-muted/15 transition-all text-xs">
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <span className="font-bold text-foreground truncate block max-w-[140px]" title={stationTitle}>
                          {stationTitle}
                        </span>
                        <span className={`font-extrabold text-[13px] shrink-0 ${scoreColor}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
                        <span>Score: {a.total_score}/{a.max_score}</span>
                        <span>{new Date(a.completed_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2 italic leading-relaxed border-t border-border/40 pt-1.5">
                        "{a.feedback}"
                      </p>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

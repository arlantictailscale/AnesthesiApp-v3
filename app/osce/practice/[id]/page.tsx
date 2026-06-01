"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getOsceStation, saveOsceAttempt } from "@/lib/osce/storage"
import type { OsceStation } from "@/lib/osce/default-data"
import {
  ArrowLeft, Clock, Play, Send, CheckCircle2, RefreshCw, Loader2, AlertCircle, Award, Check
} from "lucide-react"

export default function OsceArenaPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [station, setStation] = useState<OsceStation | null>(null)
  const [loading, setLoading] = useState(true)

  // Simulation state
  const [started, setStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(17 * 60) // 17 minutes
  const [messages, setMessages] = useState<{ role: "user" | "assistant" | "system"; content: string }[]>([])
  const [inputVal, setInputVal] = useState("")
  const [sending, setSending] = useState(false)

  // Scoring state
  const [completed, setCompleted] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [scorecard, setScorecard] = useState<{
    scores: Record<string, number>
    feedback: string
    breakdown: { aspect: string; score: number; max_score: number; feedback: string }[]
  } | null>(null)

  // Session start timestamp
  const [startedAt, setStartedAt] = useState("")

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Load active station
  useEffect(() => {
    if (!params?.id) return
    getOsceStation(params.id).then((st) => {
      setStation(st)
      if (st) {
        setTimeLeft(st.duration_minutes * 60)
      }
      setLoading(false)
    }).catch(() => {
      toast.error("Failed to load active OSCE station.")
      setLoading(false)
    })
  }, [params?.id])

  // Scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Timer logic
  useEffect(() => {
    if (started && timeLeft > 0 && !completed) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleFinishExam() // Auto finish on 0
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [started, completed])

  function formatTime(sec: number) {
    const min = Math.floor(sec / 60)
    const s = sec % 60
    return `${min.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  // Starts the exam chat
  async function handleStartExam() {
    if (!station) return
    setStarted(true)
    setStartedAt(new Date().toISOString())
    
    // Add examiner initial welcome prompt
    const initialInstruction = station.instructions_participant
      ? `\n\nTugas Anda:\n${station.instructions_participant}\n\nSilakan mulai dengan memperkenalkan diri dan mengerjakan tugas Anda!`
      : `\n\nSilakan mulai dengan memperkenalkan diri dan melakukan anamnesis/pemeriksaan!`

    setMessages([
      {
        role: "assistant",
        content: `Halo Dokter, selamat datang di Station ${station.category}. Saya adalah Penguji Anda pada ujian hari ini. \n\nSkenario Anda adalah: \n"${station.scenario}"${initialInstruction}`
      }
    ])
  }

  // Sends chat message to AI examiner
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!inputVal.trim() || sending || completed || !started) return

    const userMsg = inputVal.trim()
    setInputVal("")
    const nextMessages = [...messages, { role: "user" as const, content: userMsg }]
    setMessages(nextMessages)
    setSending(true)

    try {
      const res = await fetch("/api/ai/osce-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          scenario: station?.scenario,
          instructions: station?.instructions_participant,
          rubric: station?.rubric,
          equipment: station?.equipment
        })
      })

      if (!res.ok) throw new Error("Connection failed")

      const data = await res.json()
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }])
    } catch (err) {
      toast.error("Failed to receive response from AI examiner. Please retry.")
    } finally {
      setSending(false)
    }
  }

  // Finish exam and call evaluation API
  async function handleFinishExam() {
    if (completed || evaluating || !station) return
    setCompleted(true)
    setEvaluating(true)
    toast.info("Evaluasi sedang diproses. Mohon tunggu...")

    try {
      const res = await fetch("/api/ai/osce-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatHistory: messages,
          rubric: station.rubric
        })
      })

      if (!res.ok) throw new Error("Evaluation request failed")

      const data = await res.json()
      const ev = data.evaluation

      setScorecard(ev)

      // Calculate totals
      let total = 0
      let maxScore = 0
      station.rubric.forEach((r) => {
        const score = ev.scores[r.aspect] ?? 0
        total += score * r.weight
        maxScore += 3 * r.weight
      })

      // Save practice log
      await saveOsceAttempt({
        station_id: station.id,
        started_at: startedAt,
        chat_history: messages,
        scores: ev.scores,
        feedback: ev.feedback,
        total_score: total,
        max_score: maxScore,
        status: "completed"
      })

      toast.success("Evaluasi OSCE berhasil disimpan!")
    } catch (err) {
      console.error(err)
      toast.error("Evaluasi otomatis gagal. Silakan hubungi admin.")
    } finally {
      setEvaluating(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[400px] items-center justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" /> Loading OSCE Station...
        </div>
      </AppShell>
    )
  }

  if (!station) {
    return (
      <AppShell>
        <Card className="p-8 text-center text-muted-foreground">Station not found.</Card>
      </AppShell>
    )
  }

  // Calculate scores for display if completed
  let totalScoreEarned = 0
  let maxPossibleScore = 0
  if (scorecard) {
    station.rubric.forEach((r) => {
      const sc = scorecard.scores[r.aspect] ?? 0
      totalScoreEarned += sc * r.weight
      maxPossibleScore += 3 * r.weight
    })
  }
  const percentageScore = maxPossibleScore > 0 ? Math.round((totalScoreEarned / maxPossibleScore) * 100) : 0

  return (
    <AppShell>
      <div className="flex flex-col gap-5 min-h-[calc(100vh-10rem)]">
        {/* Simulation Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link href="/osce">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <Badge className="bg-primary/10 text-primary border-primary/20">{station.category}</Badge>
              <h1 className="text-xl font-bold tracking-tight mt-1">{station.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto sm:ml-0">
            {started && (
              <Badge variant="outline" className={`flex gap-1.5 py-1 px-3 text-sm font-bold animate-pulse-slow ${timeLeft < 180 ? "border-red-500 text-red-500" : ""}`}>
                <Clock className="h-4 w-4 mt-0.5" /> {formatTime(timeLeft)}
              </Badge>
            )}
            {started && !completed && (
              <Button onClick={handleFinishExam} variant="destructive" size="sm" className="font-bold">
                Akhiri Ujian
              </Button>
            )}
          </div>
        </div>

        {/* Scoring Evaluation Overlay View */}
        {completed && scorecard && (
          <Card className="border-2 border-primary bg-primary/5 shadow-md p-6 flex flex-col gap-6 animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <Award className="h-10 w-10 text-primary animate-bounce-slow" />
                <div>
                  <CardTitle className="text-xl font-bold">Hasil Evaluasi Simulasi OSCE</CardTitle>
                  <CardDescription className="text-xs">Grading dan feedback otomatis berdasarkan rubrik penilaian resmi.</CardDescription>
                </div>
              </div>
              <div className="flex flex-col items-center md:items-end bg-card border border-border px-6 py-2.5 rounded-xl shadow-xs">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Nilai</span>
                <span className="text-3xl font-black text-primary">{percentageScore}%</span>
                <span className="text-xs text-muted-foreground">Score: {totalScoreEarned} / {maxPossibleScore}</span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Left Aspect Breakdown */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Rincian Nilai per Aspek</h3>
                
                <div className="space-y-3">
                  {scorecard.breakdown.map((b, idx) => {
                    const aspectDetails = station.rubric.find((r) => r.aspect === b.aspect)
                    const weight = aspectDetails?.weight ?? 1
                    let badgeStyle = "bg-red-500/10 text-red-500 border-red-500/20"
                    if (b.score === 3) badgeStyle = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    else if (b.score >= 1) badgeStyle = "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"

                    return (
                      <Card key={idx} className="p-4 border bg-card">
                        <div className="flex justify-between items-start gap-3 mb-2">
                          <div>
                            <h4 className="font-bold text-sm text-foreground">{b.aspect}</h4>
                            <span className="text-[10px] text-muted-foreground font-semibold">Bobot: {weight}</span>
                          </div>
                          <Badge variant="outline" className={`font-extrabold text-xs shrink-0 py-0.5 px-2.5 ${badgeStyle}`}>
                            Skor: {b.score} / {b.max_score}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border/40 mt-1 italic">
                          {b.feedback}
                        </p>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Right Global Feedback Summary */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Feedback Global Penguji</h3>
                <Card className="bg-card border border-border p-4 h-full">
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line italic">
                    "{scorecard.feedback}"
                  </p>
                </Card>
              </div>
            </div>

            <div className="border-t border-border pt-4 flex justify-end gap-3">
              <Button onClick={() => window.location.reload()} variant="outline" className="gap-1.5 font-semibold text-xs">
                <RefreshCw className="h-3.5 w-3.5" /> Ulangi Ujian
              </Button>
              <Button asChild className="gap-1.5 font-bold text-xs">
                <Link href="/osce">
                  <Check className="h-3.5 w-3.5" /> Selesai Review
                </Link>
              </Button>
            </div>
          </Card>
        )}

        {/* Simulation Arena */}
        {!completed && (
          <div className="grid gap-6 md:grid-cols-5 flex-1 min-h-0">
            {/* Left Case Sheet details */}
            <div className="md:col-span-2 flex flex-col gap-4">
              {/* Skenario Ujian */}
              <Card className="border border-border bg-card">
                <CardHeader className="p-4 pb-2 border-b border-border/40 bg-muted/10">
                  <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    Skenario Kasus Klinis
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-sm text-foreground font-medium leading-relaxed">
                  {station.scenario}
                </CardContent>
              </Card>

              {/* Instruksi Tugas */}
              <Card className="border border-border bg-card">
                <CardHeader className="p-4 pb-2 border-b border-border/40 bg-muted/10">
                  <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    Instruksi Tugas Peserta
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs text-muted-foreground font-semibold leading-relaxed whitespace-pre-line">
                  {station.instructions_participant}
                </CardContent>
              </Card>

              {/* Daftar Peralatan yang Disediakan */}
              <Card className="border border-border bg-card">
                <CardHeader className="p-4 pb-2 border-b border-border/40 bg-muted/10">
                  <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    Peralatan yang Disediakan
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-wrap gap-1.5">
                  {station.equipment.map((eq) => (
                    <span key={eq} className="text-[10px] bg-muted/50 border text-muted-foreground font-bold px-2 py-0.5 rounded-full">
                      {eq}
                    </span>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Chat panel */}
            <div className="md:col-span-3 border border-border bg-card rounded-xl flex flex-col overflow-hidden min-h-[450px]">
              {!started ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/5">
                  <Clock className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <h3 className="font-bold text-lg">Mulai Latihan OSCE</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4 leading-normal">
                    Setelah Anda menekan tombol Mulai, waktu 17 menit akan berjalan, dan Penguji akan menyapa Anda untuk memulai ujian.
                  </p>
                  <Button onClick={handleStartExam} className="gap-2 font-bold px-6">
                    <Play className="h-4 w-4 fill-current" /> Mulai Ujian Sekarang
                  </Button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 bg-muted/5 relative">
                  {/* Messages log */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                    {messages.map((m, idx) => {
                      const isExaminer = m.role === "assistant"
                      return (
                        <div key={idx} className={`flex ${isExaminer ? "justify-start" : "justify-end"}`}>
                          <div className={`max-w-[85%] rounded-xl p-3.5 shadow-sm text-xs font-medium leading-relaxed ${
                            isExaminer
                              ? "bg-card border border-border text-foreground rounded-tl-xs"
                              : "bg-primary text-primary-foreground rounded-tr-xs"
                          }`}>
                            <span className="text-[9px] font-bold block uppercase tracking-wider mb-1 opacity-70">
                              {isExaminer ? "Penguji" : "Peserta"}
                            </span>
                            <span className="whitespace-pre-line leading-relaxed">{m.content}</span>
                          </div>
                        </div>
                      )
                    })}
                    {sending && (
                      <div className="flex justify-start">
                        <div className="bg-card border rounded-xl p-3 shadow-xs text-xs flex items-center gap-2 rounded-tl-xs">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-muted-foreground font-semibold text-[10px]">Penguji sedang mengetik...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Input Form Box */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card flex gap-2 shrink-0">
                    <input
                      type="text"
                      placeholder="Ketik tindakan atau jawaban Anda di sini..."
                      value={inputVal}
                      disabled={sending || completed}
                      onChange={(e) => setInputVal(e.target.value)}
                      className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-xs shadow-inner focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                    />
                    <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={sending || !inputVal.trim() || completed}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Evaluating loader overlay */}
        {evaluating && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-50 animate-in fade-in duration-200">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
            <h3 className="font-bold text-lg text-white">Mengevaluasi Kinerja Anda...</h3>
            <p className="text-xs text-white/70 max-w-xs text-center leading-normal">
              AI Scorer sedang memeriksa transkrip percakapan Anda terhadap rubrik aspek klinis dan komunikasi profesional.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  )
}

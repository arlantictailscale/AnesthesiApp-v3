"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAttempt, getPackage, type CBTAttempt, type CBTPackage } from "@/lib/cbt-storage"
import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle,
  Clock,
  Compass,
  CornerDownRight,
  HelpCircle,
  AlertCircle,
  FileText,
  XCircle,
} from "lucide-react"

export default function CBTResultsPage() {
  const params = useParams()
  const router = useRouter()
  const attemptId = params.id as string

  const [attempt, setAttempt] = useState<CBTAttempt | null>(null)
  const [pkg, setPkg] = useState<CBTPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<"all" | "correct" | "incorrect" | "unanswered">("all")

  useEffect(() => {
    async function load() {
      try {
        const att = await getAttempt(attemptId)
        if (!att) {
          toast.error("Riwayat hasil ujian tidak ditemukan.")
          router.replace("/dashboard/cbt")
          return
        }
        setAttempt(att)

        const p = await getPackage(att.package_id)
        if (p) {
          setPkg(p)
        }
      } catch (err) {
        toast.error("Gagal memuat hasil ujian.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [attemptId, router])

  if (loading || !attempt || !pkg) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 text-muted-foreground gap-4">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span>Memuat ulasan hasil ujian...</span>
      </div>
    )
  }

  const questions = pkg.questions
  const score = attempt.score
  const isPassed = score >= 70

  // Time conversion
  const minutes = Math.floor(attempt.time_spent / 60)
  const seconds = attempt.time_spent % 60
  const durationStr = `${minutes} menit ${seconds} detik`

  // Calculate category statistics
  const categoriesList = [
    "Farmakologi & Fisiologi",
    "Resusitasi & Critical Care",
    "Anestesi Umum & Regional",
    "Anestesi Obstetrik & Pediatrik",
    "Neuroanestesi & Kardiovaskular",
  ] as const

  const categoryStats = categoriesList.map((cat) => {
    const catQuestions = questions.filter((q) => q.category === cat)
    const total = catQuestions.length

    let correct = 0
    catQuestions.forEach((q) => {
      // Find the index of this question in the original array
      const origIdx = questions.findIndex((origQ) => origQ.id === q.id)
      const userAns = attempt.answers[origIdx.toString()] || ""
      if (userAns === q.correctOption) {
        correct++
      }
    })

    const pct = total > 0 ? Math.round((correct / total) * 100) : 0

    return {
      name: cat,
      correct,
      total,
      percentage: pct,
    }
  })

  // Strengths and weaknesses commentary
  const strengths = categoryStats.filter((c) => c.percentage >= 80)
  const weaknesses = categoryStats.filter((c) => c.percentage < 60)

  // Filters for review accordion
  const filteredQuestions = questions.map((q, idx) => {
    const userAns = attempt.answers[idx.toString()] || ""
    const isCorrect = userAns === q.correctOption
    const isUnanswered = userAns === ""

    return {
      ...q,
      originalIdx: idx,
      userAns,
      isCorrect,
      isUnanswered,
    }
  }).filter((q) => {
    if (activeFilter === "correct") return q.isCorrect
    if (activeFilter === "incorrect") return !q.isCorrect && !q.isUnanswered
    if (activeFilter === "unanswered") return q.isUnanswered
    return true // all
  })

  // Circular gauge config
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <AppShell>
      <div className="flex flex-col gap-6 pb-12">
        {/* Back Link */}
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/cbt" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Dashboard CBT
            </Link>
          </Button>
        </div>

        {/* Results Overview Row */}
        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          {/* Circular Score card */}
          <Card className="flex flex-col items-center justify-between border-border bg-card p-6 shadow-sm">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Hasil Akhir Anda
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 w-full">
              {/* Circular progress SVG */}
              <div className="relative flex h-36 w-36 items-center justify-center">
                <svg className="h-full w-full -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    className="stroke-muted fill-transparent"
                    strokeWidth="10"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className={`fill-transparent transition-all duration-1000 ${isPassed ? "stroke-emerald-500" : "stroke-rose-500"}`}
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-extrabold tracking-tight">{score}%</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Nilai Kelulusan: 70%</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="text-center space-y-1">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1 text-sm font-extrabold tracking-wide uppercase ${isPassed ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                  {isPassed ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {isPassed ? "LULUS UJIAN" : "BELUM LULUS"}
                </span>
                <p className="text-xs text-muted-foreground pt-1.5">
                  {isPassed
                    ? "Luar biasa! Skor Anda telah melampaui batas nilai kelulusan minimal."
                    : "Terus berlatih! Ulas materi dan ulangi tes untuk meningkatkan performa."}
                </p>
              </div>

              {/* Stats Breakdown Grid */}
              <div className="grid grid-cols-3 gap-2 w-full border-t border-border pt-4 text-center text-xs">
                <div>
                  <dt className="text-muted-foreground">Benar</dt>
                  <dd className="text-lg font-bold text-emerald-500 mt-0.5">{attempt.correct_count}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Salah</dt>
                  <dd className="text-lg font-bold text-rose-500 mt-0.5">
                    {attempt.total_questions - attempt.correct_count}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Durasi</dt>
                  <dd className="text-sm font-bold text-foreground mt-1 whitespace-nowrap">
                    {minutes}m {seconds}s
                  </dd>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subspecialty Category stats */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" />
                Analisis Sub-Spesialisasi Klinis
              </CardTitle>
              <CardDescription>
                Tinjauan performa Anda di setiap sub-bidang ujian kompetensi anestesiologi.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {categoryStats.map((cat) => (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-foreground">{cat.name}</span>
                    <span className="text-muted-foreground">
                      {cat.correct} / {cat.total} Benar ({cat.percentage}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${cat.percentage >= 80 ? "bg-emerald-500" : cat.percentage >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}

              {/* Study Guidance alert */}
              <div className="mt-4 rounded-xl bg-muted/30 border border-border p-4 text-xs space-y-2">
                <h4 className="font-bold text-foreground flex items-center gap-1">
                  <Award className="h-4 w-4 text-primary" />
                  Rekomendasi Rencana Belajar
                </h4>
                <div className="space-y-1.5 text-muted-foreground leading-relaxed">
                  {strengths.length > 0 && (
                    <p>
                      <strong className="text-emerald-500 font-semibold">Kekuatan:</strong> Bidang{" "}
                      {strengths.map((s) => `"${s.name}"`).join(", ")} menunjukkan penguasaan materi yang matang.
                    </p>
                  )}
                  {weaknesses.length > 0 ? (
                    <p>
                      <strong className="text-rose-500 font-semibold">Fokus Latihan:</strong> Anda disarankan memperdalam porsi studi pada sub-spesialisasi{" "}
                      {weaknesses.map((w) => `"${w.name}"`).join(", ")} karena tingkat penguasaan masih berada di bawah 60%.
                    </p>
                  ) : (
                    <p className="text-emerald-500 font-semibold">
                      Selamat! Anda menunjukkan penguasaan materi yang seimbang di seluruh sub-spesialisasi anestesiologi.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Question Review Accordion */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Kunci Jawaban & Pembahasan</h2>
              <p className="text-sm text-muted-foreground">Review jawaban Anda secara mendalam dengan ulasan klinis dari instruktur.</p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1 border border-border rounded-lg p-1 bg-card w-fit text-xs">
              <Button
                variant={activeFilter === "all" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs font-semibold"
                onClick={() => setActiveFilter("all")}
              >
                Semua ({totalQuestions})
              </Button>
              <Button
                variant={activeFilter === "correct" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs font-semibold text-emerald-500 hover:text-emerald-600"
                onClick={() => setActiveFilter("correct")}
              >
                Benar ({attempt.correct_count})
              </Button>
              <Button
                variant={activeFilter === "incorrect" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs font-semibold text-rose-500 hover:text-rose-600"
                onClick={() => setActiveFilter("incorrect")}
              >
                Salah ({totalQuestions - attempt.correct_count - Object.values(attempt.answers).filter(v => v === "").length})
              </Button>
              <Button
                variant={activeFilter === "unanswered" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs font-semibold text-muted-foreground"
                onClick={() => setActiveFilter("unanswered")}
              >
                Kosong ({Object.values(attempt.answers).filter(v => v === "").length})
              </Button>
            </div>
          </div>

          {/* List of questions */}
          <div className="flex flex-col gap-4">
            {filteredQuestions.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground border border-dashed border-border bg-card">
                Tidak ada soal yang cocok dengan filter yang dipilih.
              </Card>
            ) : (
              filteredQuestions.map((q) => {
                return (
                  <Card key={q.id} className="border border-border bg-card shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-border bg-muted/10 pb-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-foreground">
                          SOAL NO. {q.originalIdx + 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground font-medium">
                            {q.category}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold uppercase ${q.isCorrect ? "bg-emerald-500/10 text-emerald-500" : q.isUnanswered ? "bg-muted text-muted-foreground" : "bg-rose-500/10 text-rose-500"}`}>
                            {q.isCorrect ? "Benar" : q.isUnanswered ? "Kosong" : "Salah"}
                          </span>
                        </div>
                      </div>
                      <CardTitle className="text-sm font-semibold leading-relaxed mt-2 text-foreground select-none">
                        {q.text.replace(/^\[Soal\s*(?:No\.?)?\s*\d+\]\s*/i, "")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      {/* Options with colored answers */}
                      <div className="flex flex-col gap-2.5 text-xs md:text-sm">
                        {(["A", "B", "C", "D", "E"] as const).map((letter) => {
                          const optionText = q.options[letter]
                          const isCorrectOption = q.correctOption === letter
                          const isUserSelected = q.userAns === letter

                          let choiceStyle = "border-border bg-card text-foreground"
                          let circleStyle = "bg-muted text-muted-foreground"

                          if (isCorrectOption) {
                            choiceStyle = "border-emerald-500 bg-emerald-500/5 text-emerald-900 font-medium"
                            circleStyle = "bg-emerald-500 text-white font-bold"
                          } else if (isUserSelected && !isCorrectOption) {
                            choiceStyle = "border-rose-400 bg-rose-500/5 text-rose-900"
                            circleStyle = "bg-rose-500 text-white font-bold"
                          }

                          return (
                            <div
                              key={letter}
                              className={`flex items-start gap-3 rounded-lg border p-3 ${choiceStyle}`}
                            >
                              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${circleStyle}`}>
                                {letter}
                              </span>
                              <div className="flex-1 leading-relaxed">
                                {optionText}
                                {isUserSelected && (
                                  <span className="inline-block text-[10px] uppercase font-bold tracking-wide mt-1 text-primary-foreground bg-primary px-1.5 py-0.25 rounded ml-2">
                                    Pilihan Anda
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Explanation box */}
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2 text-xs md:text-sm">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <span>Kunci Jawaban: {q.correctOption}</span>
                        </div>
                        <div className="text-emerald-900 font-semibold flex items-start gap-1">
                          <CornerDownRight className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                          <div className="leading-relaxed">
                            <strong className="font-bold text-emerald-800">Pembahasan Klinis:</strong> {q.explanation}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

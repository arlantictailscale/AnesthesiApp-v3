"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getPackage, saveAttempt, type CBTPackage } from "@/lib/cbt-storage"
import { Logo } from "@/components/logo"
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  HelpCircle,
  LogOut,
  Send,
} from "lucide-react"

export default function CBTExamPage() {
  const params = useParams()
  const router = useRouter()
  const packageId = params.id as string

  const [pkg, setPkg] = useState<CBTPackage | null>(null)
  const [loading, setLoading] = useState(true)

  // Exam state
  const [activeIdx, setActiveIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [flagged, setFlagged] = useState<Set<number>>(new Set())

  // Timer state
  const [timeLeft, setTimeLeft] = useState(0) // seconds
  const [totalDuration, setTotalDuration] = useState(0)
  const [examFinished, setExamFinished] = useState(false)

  // Submit Modal
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Load package
  useEffect(() => {
    async function load() {
      try {
        const p = await getPackage(packageId)
        if (!p) {
          toast.error("Paket ujian tidak ditemukan.")
          router.replace("/dashboard/cbt")
          return
        }
        setPkg(p)
        
        // Default time: 60 seconds per question (100 minutes for 100 questions)
        const defaultSeconds = p.questions.length * 60
        let seconds = defaultSeconds
        let duration = defaultSeconds

        if (typeof window !== "undefined") {
          const rawProgress = localStorage.getItem(`anesthesiapp:cbt_progress_${packageId}`)
          if (rawProgress) {
            try {
              const saved = JSON.parse(rawProgress)
              setAnswers(saved.answers || {})
              setFlagged(new Set(saved.flagged || []))
              setActiveIdx(saved.activeIdx || 0)
              seconds = saved.timeLeft ?? defaultSeconds
              duration = saved.totalDuration ?? defaultSeconds
              toast.info("Melanjutkan progres ujian sebelumnya.")
            } catch (e) {
              console.error("Failed to parse saved exam progress:", e)
            }
          }
        }

        setTimeLeft(seconds)
        setTotalDuration(duration)
      } catch (err) {
        toast.error("Gagal memuat paket ujian.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [packageId, router])

  // Save progress dynamically
  useEffect(() => {
    if (loading || !pkg || examFinished) return

    const progress = {
      answers,
      flagged: Array.from(flagged),
      activeIdx,
      timeLeft,
      totalDuration,
    }

    try {
      localStorage.setItem(`anesthesiapp:cbt_progress_${packageId}`, JSON.stringify(progress))
    } catch (e) {
      console.error("Failed to save exam progress:", e)
    }
  }, [answers, flagged, activeIdx, timeLeft, totalDuration, loading, pkg, examFinished, packageId])

  // Timer countdown
  useEffect(() => {
    if (loading || !pkg || timeLeft <= 0 || examFinished) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleForceSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, pkg, timeLeft, examFinished])

  // Warn user before refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = "Ujian sedang berlangsung. Progress Anda akan hilang jika menutup halaman ini."
      return e.returnValue
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  if (loading || !pkg) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 text-muted-foreground gap-4">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span>Memuat simulator CBT...</span>
      </div>
    )
  }

  const questions = pkg.questions
  const currentQuestion = questions[activeIdx]

  // Stats calculation
  const totalQuestions = questions.length
  const answeredCount = Object.keys(answers).filter((k) => answers[Number(k)] !== "").length
  const isFlagged = flagged.has(activeIdx)

  // Timer formatting
  const hours = Math.floor(timeLeft / 3600)
  const minutes = Math.floor((timeLeft % 3600) / 60)
  const seconds = timeLeft % 60
  const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`

  const isTimeLow = timeLeft < totalDuration * 0.1 // 10% time left

  function handleSelectOption(optionLetter: "A" | "B" | "C" | "D" | "E") {
    setAnswers((prev) => ({
      ...prev,
      [activeIdx]: optionLetter,
    }))
  }

  function handleToggleFlag() {
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(activeIdx)) {
        next.delete(activeIdx)
      } else {
        next.add(activeIdx)
      }
      return next
    })
  }

  function handleNext() {
    if (activeIdx < totalQuestions - 1) {
      setActiveIdx((prev) => prev + 1)
    }
  }

  function handlePrev() {
    if (activeIdx > 0) {
      setActiveIdx((prev) => prev - 1)
    }
  }

  // Force submit when timer hits zero
  async function handleForceSubmit() {
    setExamFinished(true)
    toast.warning("Waktu ujian telah habis! Mengirimkan jawaban Anda...")
    await submitExam(true)
  }

  async function submitExam(isForce = false) {
    setSubmitting(true)
    try {
      // Calculate scores
      let correct = 0
      const answersMap: Record<string, string> = {}

      questions.forEach((q, index) => {
        const userAns = answers[index] || ""
        answersMap[index.toString()] = userAns
        if (userAns === q.correctOption) {
          correct++
        }
      })

      const score = Number(((correct / totalQuestions) * 100).toFixed(1))
      const time_spent = totalDuration - timeLeft

      const attempt = await saveAttempt({
        package_id: pkg.id,
        package_name: pkg.name,
        score,
        total_questions: totalQuestions,
        correct_count: correct,
        time_spent,
        answers: answersMap,
      })

      // Clear saved progress
      if (typeof window !== "undefined") {
        localStorage.removeItem(`anesthesiapp:cbt_progress_${pkg.id}`)
      }

      toast.success("Ujian berhasil diselesaikan!")
      router.replace(`/dashboard/cbt/results/${attempt.id}`)
    } catch (err) {
      console.error("CBT Submit Error:", err)
      toast.error(err instanceof Error ? `Gagal: ${err.message}` : "Gagal menyimpan hasil ujian. Silakan coba lagi.")
    } finally {
      setSubmitting(false)
      setIsSubmitOpen(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      {/* CBT Header Layout */}
      <header className="sticky top-0 z-40 border-b border-border bg-background px-4 py-3 shadow-sm md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo href={null} height={26} />
            <span className="hidden sm:inline-block h-4 w-px bg-border" />
            <h1 className="hidden sm:inline-block text-sm font-semibold truncate max-w-[200px] md:max-w-[400px]">
              {pkg.name}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer Display */}
            <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-sm font-bold shadow-sm transition-colors ${isTimeLow ? "bg-rose-500/10 border-rose-500 text-rose-500 animate-pulse" : "bg-card border-border text-foreground"}`}>
              <Clock className={`h-4 w-4 ${isTimeLow ? "text-rose-500" : "text-muted-foreground"}`} />
              <span>{timeStr}</span>
            </div>

            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 font-semibold"
              onClick={() => setIsSubmitOpen(true)}
            >
              <Send className="h-3.5 w-3.5" />
              Akhiri Ujian
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:flex-row md:p-6">
        {/* Left Side: Question Pane */}
        <div className="flex flex-1 flex-col gap-4">
          <Card className="flex flex-1 flex-col justify-between border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-primary uppercase">
                  SOAL NO. {activeIdx + 1} DARI {totalQuestions}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-0.5 font-medium text-foreground">
                  {currentQuestion.category}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-6 flex flex-col gap-6">
              {/* Question Text */}
              <p className="text-base md:text-lg leading-relaxed font-medium text-foreground select-none">
                {currentQuestion.text.replace(/^\[Soal\s*(?:No\.?)?\s*\d+\]\s*/i, "")}
              </p>

              {/* Choices List */}
              <div className="flex flex-col gap-3">
                {(["A", "B", "C", "D", "E"] as const).map((letter) => {
                  const isSelected = answers[activeIdx] === letter
                  return (
                    <button
                      key={letter}
                      className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all ${isSelected ? "border-primary bg-primary/5 text-foreground shadow-sm ring-1 ring-primary" : "border-border bg-card hover:bg-muted/40 hover:border-muted-foreground/30 text-foreground"}`}
                      onClick={() => handleSelectOption(letter)}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/10"}`}>
                        {letter}
                      </span>
                      <span className="text-sm md:text-base leading-relaxed font-medium">
                        {currentQuestion.options[letter]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </CardContent>

            {/* Bottom Actions Panel */}
            <div className="flex items-center justify-between border-t border-border bg-muted/20 p-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={activeIdx === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={activeIdx === totalQuestions - 1}
                  className="gap-1"
                >
                  Selanjutnya
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Ragu-ragu Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/30 transition-colors">
                <Checkbox
                  checked={isFlagged}
                  onCheckedChange={handleToggleFlag}
                  className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
                <div className="flex items-center gap-1">
                  <Flag className={`h-3.5 w-3.5 ${isFlagged ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                  <span>Ragu-ragu</span>
                </div>
              </label>
            </div>
          </Card>
        </div>

        {/* Right Side: Navigation Dashboard */}
        <aside className="w-full shrink-0 md:w-80">
          <Card className="sticky top-20 border-border bg-card shadow-sm h-[calc(100vh-140px)] flex flex-col justify-between overflow-hidden">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                Navigasi Soal
              </CardTitle>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2">
                <span>{answeredCount} Terjawab</span>
                <span>{totalQuestions - answeredCount} Sisa</span>
              </div>
            </CardHeader>

            {/* Questions Grid scroll container */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, index) => {
                  const hasAnswer = answers[index] && answers[index] !== ""
                  const isCur = activeIdx === index
                  const isFlg = flagged.has(index)

                  let bgStyle = "bg-muted/30 text-foreground border-border hover:bg-muted/60"
                  if (isFlg) {
                    bgStyle = "bg-amber-500 border-amber-500 text-white font-bold"
                  } else if (hasAnswer) {
                    bgStyle = "bg-primary border-primary text-primary-foreground font-semibold"
                  }

                  let borderStyle = "border"
                  if (isCur) {
                    borderStyle = "border-2 border-foreground ring-2 ring-primary ring-offset-1"
                  }

                  return (
                    <button
                      key={index}
                      className={`flex h-10 w-full items-center justify-center rounded-lg text-xs font-medium transition-all ${bgStyle} ${borderStyle}`}
                      onClick={() => setActiveIdx(index)}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Navigation Summary Footer */}
            <div className="border-t border-border bg-muted/30 p-4 text-xs space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-primary" />
                <span className="text-muted-foreground">Sudah Dijawab</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-amber-500" />
                <span className="text-muted-foreground">Ragu-ragu (Flagged)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded border border-border bg-muted/20" />
                <span className="text-muted-foreground">Belum Dijawab</span>
              </div>

              <div className="pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-1.5"
                  onClick={() => {
                    if (confirm("Keluar dari ujian? Progress Anda saat ini akan dihapus.")) {
                      if (typeof window !== "undefined") {
                        localStorage.removeItem(`anesthesiapp:cbt_progress_${packageId}`)
                      }
                      router.replace("/dashboard/cbt")
                    }
                  }}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Keluar dari Ujian
                </Button>
              </div>
            </div>
          </Card>
        </aside>
      </main>

      {/* Submission Confirmation Modal */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <AlertTriangle className="h-6 w-6 text-amber-500 animate-pulse" />
              Selesaikan Ujian?
            </DialogTitle>
            <DialogDescription className="pt-2 leading-relaxed">
              Anda telah menjawab <strong className="text-foreground">{answeredCount} dari {totalQuestions}</strong> soal.
              {answeredCount < totalQuestions && (
                <span className="block text-rose-500 font-medium mt-1">
                  Peringatan: Masih terdapat {totalQuestions - answeredCount} soal yang belum Anda isi!
                </span>
              )}
              Apakah Anda yakin ingin mengakhiri sesi ujian ini? Jawaban Anda akan langsung dihitung dan direkam.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSubmitOpen(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Kembali Lanjutkan
            </Button>
            <Button
              type="button"
              onClick={() => submitExam(false)}
              disabled={submitting}
              className="w-full sm:w-auto gap-2"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Mengirim Jawaban...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Ya, Akhiri Ujian
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  listPackages,
  listAttempts,
  createPackage,
  deletePackage,
  type CBTPackage,
  type CBTAttempt,
} from "@/lib/cbt-storage"
import {
  BookOpen,
  Plus,
  Trash2,
  Calendar,
  Award,
  Clock,
  CheckCircle,
  FileText,
  Sparkles,
  HelpCircle,
  ChevronRight,
  TrendingUp,
} from "lucide-react"

export default function CBTDashboardPage() {
  const [packages, setPackages] = useState<CBTPackage[]>([])
  const [attempts, setAttempts] = useState<CBTAttempt[]>([])
  const [loading, setLoading] = useState(true)

  // Upload/Create states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [pkgName, setPkgName] = useState("")
  const [pkgDesc, setPkgDesc] = useState("")
  const [jsonText, setJsonText] = useState("")

  // AI Generator states
  const [aiTopic, setAiTopic] = useState("")
  const [aiCount, setAiCount] = useState(10)
  const [generating, setGenerating] = useState(false)

  async function loadData() {
    try {
      const pkgs = await listPackages()
      const atts = await listAttempts()
      setPackages(pkgs)
      setAttempts(atts)
    } catch (err) {
      toast.error("Gagal memuat data ujian.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Calculate statistics
  const totalAttempts = attempts.length
  const averageScore =
    totalAttempts > 0
      ? Math.round(attempts.reduce((acc, curr) => acc + curr.score, 0) / totalAttempts)
      : 0
  const highestScore =
    totalAttempts > 0 ? Math.max(...attempts.map((a) => a.score)) : 0
  const passRate =
    totalAttempts > 0
      ? Math.round((attempts.filter((a) => a.score >= 70).length / totalAttempts) * 100)
      : 0

  async function handleJsonUpload() {
    if (!pkgName.trim()) {
      toast.error("Nama paket wajib diisi.")
      return
    }

    try {
      const parsed = JSON.parse(jsonText)
      if (!Array.isArray(parsed)) {
        throw new Error("Format JSON harus berupa array berisi soal.")
      }

      // Basic validation
      for (const [index, q] of parsed.entries()) {
        if (!q.text || !q.options || !q.correctOption || !q.category) {
          throw new Error(`Soal pada indeks ${index} kekurangan data penting (text/options/correctOption/category).`)
        }
        if (!["A", "B", "C", "D", "E"].includes(q.correctOption)) {
          throw new Error(`Soal pada indeks ${index} memiliki correctOption tidak valid (harus A/B/C/D/E).`)
        }
      }

      await createPackage(pkgName, pkgDesc, parsed)
      toast.success("Paket ujian kustom berhasil ditambahkan!")
      setIsCreateOpen(false)
      setPkgName("")
      setPkgDesc("")
      setJsonText("")
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengurai JSON. Pastikan format valid.")
    }
  }

  async function handleAiGeneration() {
    if (!aiTopic.trim()) {
      toast.error("Topik atau materi wajib diisi.")
      return
    }

    setGenerating(true)
    try {
      const response = await fetch("/api/ai/generate-cbt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic,
          count: aiCount,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Gagal menghasilkan soal menggunakan AI.")
      }

      await createPackage(
        `Paket AI: ${aiTopic}`,
        `Paket soal latihan kustom yang dihasilkan menggunakan AI untuk materi: ${aiTopic}. Berisi ${aiCount} soal pilihan ganda.`,
        result.questions,
      )

      toast.success(`Berhasil menghasilkan ${aiCount} soal kustom via AI!`)
      setIsCreateOpen(false)
      setAiTopic("")
      setAiCount(10)
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat soal dengan AI.")
    } finally {
      setGenerating(false)
    }
  }

  async function handleDeletePkg(id: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm("Hapus paket ujian ini?")) return

    try {
      await deletePackage(id)
      toast.success("Paket ujian berhasil dihapus.")
      loadData()
    } catch (err) {
      toast.error("Gagal menghapus paket.")
    }
  }

  const sampleJson = `[
  {
    "id": "cq1",
    "text": "Contoh pertanyaan anestesiologi di sini...",
    "options": {
      "A": "Pilihan A",
      "B": "Pilihan B",
      "C": "Pilihan C",
      "D": "Pilihan D",
      "E": "Pilihan E"
    },
    "correctOption": "A",
    "category": "Farmakologi & Fisiologi",
    "explanation": "Penjelasan mengapa pilihan A benar di sini..."
  }
]`

  return (
    <AppShell>
      <div className="flex flex-col gap-8 pb-12">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/90 via-primary/80 to-card p-6 text-primary-foreground shadow-lg md:p-10">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 md:max-w-2xl">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              <Award className="h-3.5 w-3.5" />
              Portal CBT Prep Nasional
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl leading-tight">
              Kolegium Anestesiologi <br />
              <span className="text-primary-foreground/90 font-medium text-2xl md:text-3xl">Computer-Based Test Simulator</span>
            </h1>
            <p className="text-pretty text-sm leading-relaxed text-primary-foreground/80 md:text-base">
              Siapkan diri Anda untuk Ujian Kompetensi Nasional Anestesiologi dengan bank soal berkualitas tinggi. Uji kemampuan Anda dengan simulator waktu riil, analisis kategori sub-spesialisasi lengkap, dan pembahasan mendalam.
            </p>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card className="bg-card shadow-sm border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Ujian</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAttempts}</div>
              <p className="text-xs text-muted-foreground mt-1">Percobaan selesai</p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-sm border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata Nilai</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageScore}%</div>
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${averageScore >= 70 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                  {averageScore >= 70 ? "Lulus" : "Belum Lulus"}
                </span>
                <span className="text-xs text-muted-foreground">Passing limit: 70%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-sm border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tingkat Kelulusan</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{passRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Dari total percobaan</p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-sm border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Nilai Tertinggi</CardTitle>
              <Award className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{highestScore}%</div>
              <p className="text-xs text-muted-foreground mt-1">Rekor belajar Anda</p>
            </CardContent>
          </Card>
        </div>

        {/* Packages Grid */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Paket Soal Ujian</h2>
              <p className="text-sm text-muted-foreground">Pilih paket latihan yang tersedia untuk memulai CBT Simulator.</p>
            </div>

            {/* Add package dialog trigger */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Tambah Paket Ujian
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Tambah Paket Soal Baru</DialogTitle>
                  <DialogDescription>
                    Tambahkan paket soal kustom Anda sendiri menggunakan template JSON atau buat secara instan menggunakan kecerdasan buatan (AI).
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="ai" className="w-full mt-4">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="ai" className="gap-1.5">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Hasilkan dengan AI
                    </TabsTrigger>
                    <TabsTrigger value="json" className="gap-1.5">
                      <FileText className="h-4 w-4" />
                      Unggah JSON Soal
                    </TabsTrigger>
                  </TabsList>

                  {/* AI Generator Tab */}
                  <TabsContent value="ai" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="aiTopic">Topik Ujian Spesifik</Label>
                      <Input
                        id="aiTopic"
                        placeholder="Contoh: Obstetrik Anestesi, Preeklamsia, Blok Regional Ekstremitas Bawah, dll."
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        disabled={generating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aiCount">Jumlah Soal</Label>
                      <select
                        id="aiCount"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={aiCount}
                        onChange={(e) => setAiCount(Number(e.target.value))}
                        disabled={generating}
                      >
                        <option value="5">5 Soal (Cepat)</option>
                        <option value="10">10 Soal (Latihan Singkat)</option>
                        <option value="20">20 Soal (Komprehensif)</option>
                      </select>
                    </div>

                    <DialogFooter className="pt-4">
                      <Button
                        type="button"
                        onClick={handleAiGeneration}
                        disabled={generating}
                        className="w-full sm:w-auto gap-2"
                      >
                        {generating ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                            Sedang Merumuskan Soal...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Hasilkan Soal Latihan
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </TabsContent>

                  {/* JSON Upload Tab */}
                  <TabsContent value="json" className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="pkgName">Nama Paket Soal</Label>
                        <Input
                          id="pkgName"
                          placeholder="Contoh: Paket Latihan Kardiovaskular A"
                          value={pkgName}
                          onChange={(e) => setPkgName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pkgDesc">Deskripsi Singkat</Label>
                        <Input
                          id="pkgDesc"
                          placeholder="Latihan soal khusus anestesi obstetrik..."
                          value={pkgDesc}
                          onChange={(e) => setPkgDesc(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="jsonText">Salin JSON Soal Di Sini</Label>
                        <Button
                          variant="link"
                          className="h-auto p-0 text-xs"
                          onClick={() => setJsonText(sampleJson)}
                        >
                          Gunakan Contoh Format
                        </Button>
                      </div>
                      <Textarea
                        id="jsonText"
                        placeholder={`Masukkan array JSON berisi soal di sini...\nFormat:\n${sampleJson}`}
                        className="font-mono text-xs h-[180px]"
                        value={jsonText}
                        onChange={(e) => setJsonText(e.target.value)}
                      />
                    </div>

                    <DialogFooter className="pt-4">
                      <Button type="button" onClick={handleJsonUpload} className="w-full sm:w-auto">
                        Simpan Paket Ujian
                      </Button>
                    </DialogFooter>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="animate-pulse bg-card p-6 h-[180px] border border-border" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => {
                // Find user's highest score for this package
                const pkgAttempts = attempts.filter((a) => a.package_id === pkg.id)
                const high = pkgAttempts.length > 0 ? Math.max(...pkgAttempts.map((a) => a.score)) : null

                const isDefault = pkg.id === "default-national-exam"

                return (
                  <Card key={pkg.id} className="relative flex flex-col justify-between overflow-hidden border border-border bg-card transition-all hover:shadow-md hover:border-primary/30">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isDefault ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                          {isDefault ? "Resmi Kolegium" : "Kustom User"}
                        </span>
                        {!isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={(e) => handleDeletePkg(pkg.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <CardTitle className="line-clamp-2 mt-2 text-lg font-bold">{pkg.name}</CardTitle>
                      <CardDescription className="line-clamp-2 text-xs leading-relaxed mt-1">
                        {pkg.description || "Tidak ada deskripsi."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 flex flex-col gap-4">
                      <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <HelpCircle className="h-3.5 w-3.5" />
                          <span>{pkg.questions.length} Soal</span>
                        </div>
                        {high !== null ? (
                          <div className="flex items-center gap-1 font-semibold text-emerald-500">
                            <Award className="h-3.5 w-3.5" />
                            <span>Skor: {high}%</span>
                          </div>
                        ) : (
                          <span className="italic">Belum dicoba</span>
                        )}
                      </div>

                      <Button asChild className="w-full gap-2">
                        <Link href={`/dashboard/cbt/exam/${pkg.id}`}>
                          Mulai Ujian
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Attempts History */}
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Riwayat Percobaan CBT</h2>
            <p className="text-sm text-muted-foreground">Daftar semua ujian yang telah Anda selesaikan beserta skor analisis.</p>
          </div>

          {!loading && attempts.length === 0 ? (
            <Card className="p-8 text-center border border-dashed border-border bg-card">
              <p className="text-muted-foreground text-sm">Belum ada riwayat ujian. Selesaikan latihan pertama Anda di atas!</p>
            </Card>
          ) : (
            <Card className="overflow-hidden border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-xs uppercase font-semibold text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-6 py-3.5">Paket Ujian</th>
                      <th className="px-6 py-3.5">Tanggal</th>
                      <th className="px-6 py-3.5">Waktu Pengerjaan</th>
                      <th className="px-6 py-3.5">Benar / Total</th>
                      <th className="px-6 py-3.5">Skor Akhir</th>
                      <th className="px-6 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {attempts.map((att) => {
                      const minutes = Math.floor(att.time_spent / 60)
                      const seconds = att.time_spent % 60
                      const durationStr = `${minutes}m ${seconds}s`
                      const isPassed = att.score >= 70

                      return (
                        <tr key={att.id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-6 py-4 font-semibold text-foreground max-w-[240px] truncate">
                            {att.package_name}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              {new Date(att.created_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-xs">
                              <Clock className="h-3.5 w-3.5" />
                              {durationStr}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-foreground whitespace-nowrap">
                            {att.correct_count} / {att.total_questions}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${isPassed ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                              {att.score}% · {isPassed ? "LULUS" : "GAGAL"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/dashboard/cbt/results/${att.id}`}>
                                Lihat Review
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}

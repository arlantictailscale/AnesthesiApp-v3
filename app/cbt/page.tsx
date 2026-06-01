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
import { createClient } from "@/lib/supabase/client"
import {
  listPackages,
  listAttempts,
  createPackage,
  deletePackage,
  getPackageRatings,
  deleteAttempt,
  type CBTPackage,
  type CBTAttempt,
} from "@/lib/cbt/storage"
import { CBTDiscussion } from "@/components/cbt-discussion"
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
  Star,
  MessageSquare,
  Edit2,
} from "lucide-react"

export default function CBTDashboardPage() {
  const [packages, setPackages] = useState<CBTPackage[]>([])
  const [attempts, setAttempts] = useState<CBTAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [activeProgressMap, setActiveProgressMap] = useState<Record<string, boolean>>({})
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [ratingsMap, setRatingsMap] = useState<Record<string, { average: number; count: number }>>({})
  const [discussionPkg, setDiscussionPkg] = useState<CBTPackage | null>(null)



  async function loadData() {
    try {
      const pkgs = await listPackages()
      const atts = await listAttempts()
      setPackages(pkgs)
      setAttempts(atts)

      // Get current logged-in user
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      // Load ratings in parallel
      const ratingsData = await Promise.all(
        pkgs.map(async (p) => {
          try {
            const r = await getPackageRatings(p.id)
            return { id: p.id, average: r.average, count: r.count }
          } catch {
            return { id: p.id, average: 0, count: 0 }
          }
        })
      )
      const rMap: Record<string, { average: number; count: number }> = {}
      ratingsData.forEach((item) => {
        rMap[item.id] = { average: item.average, count: item.count }
      })
      setRatingsMap(rMap)
    } catch (err) {
      toast.error("Gagal memuat data ujian.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && packages.length > 0) {
      const progressMap: Record<string, boolean> = {}
      packages.forEach((pkg) => {
        const raw = localStorage.getItem(`anesthesiapp:cbt_progress_${pkg.id}`)
        if (raw) {
          progressMap[pkg.id] = true
        }
      })
      setActiveProgressMap(progressMap)
    }
  }, [packages])

  function handleResetProgress(packageId: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (confirm("Hapus progress berjalan dan ulangi ujian dari awal?")) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(`anesthesiapp:cbt_progress_${packageId}`)
        setActiveProgressMap((prev) => {
          const next = { ...prev }
          delete next[packageId]
          return next
        })
        toast.success("Progress berhasil dihapus. Anda dapat memulai ulang ujian.")
      }
    }
  }

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

  async function handleDeleteAttempt(id: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm("Hapus riwayat percobaan ujian ini?")) return

    try {
      await deleteAttempt(id)
      toast.success("Riwayat percobaan berhasil dihapus.")
      loadData()
    } catch (err) {
      toast.error("Gagal menghapus riwayat percobaan.")
    }
  }

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

            <div className="flex flex-wrap gap-2">
              <Button asChild className="gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/cbt/create">
                  <Sparkles className="h-4 w-4" />
                  Buat Ujian Baru (Visual / AI / JSON)
                </Link>
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="animate-pulse flex flex-col justify-between overflow-hidden border border-border bg-card p-6 min-h-[220px]">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="h-4 w-24 bg-muted rounded-full" />
                      <div className="h-4 w-12 bg-muted rounded-full" />
                    </div>
                    <div className="h-5 w-3/4 bg-muted rounded" />
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-muted rounded" />
                      <div className="h-3 w-5/6 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="border-t border-border pt-4 mt-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div className="h-3 w-16 bg-muted rounded" />
                      <div className="h-3 w-20 bg-muted rounded" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-10 flex-1 bg-muted rounded-md" />
                      <div className="h-10 w-10 bg-muted rounded-md" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (() => {
            const myOrOfficialPackages = packages.filter((pkg) => {
              const isDefault = pkg.id === "default-national-exam"
              const isMine = pkg.creator_email && currentUser?.email && pkg.creator_email === currentUser.email
              const isLocalOnly = !pkg.creator_email
              return isDefault || isMine || isLocalOnly
            })

            const communityPackages = packages.filter((pkg) => {
              const isDefault = pkg.id === "default-national-exam"
              const isMine = pkg.creator_email && currentUser?.email && pkg.creator_email === currentUser.email
              const isLocalOnly = !pkg.creator_email
              return !isDefault && !isMine && !isLocalOnly
            })

            function renderPackageCard(pkg: CBTPackage) {
              const pkgAttempts = attempts.filter((a) => a.package_id === pkg.id)
              const high = pkgAttempts.length > 0 ? Math.max(...pkgAttempts.map((a) => a.score)) : null
              const isDefault = pkg.id === "default-national-exam"
              const rInfo = ratingsMap[pkg.id] || { average: 0, count: 0 }

              return (
                <Card key={pkg.id} className="relative flex flex-col justify-between overflow-hidden border border-border bg-card transition-all hover:shadow-md hover:border-primary/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isDefault ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                        {isDefault ? "Resmi Kolegium" : pkg.creator_email ? `Oleh: ${pkg.creator_email.split('@')[0]}` : "Kustom User"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 text-xs text-yellow-500 font-semibold" title={`Average: ${rInfo.average} stars`}>
                          <Star className={`h-3.5 w-3.5 ${rInfo.count > 0 ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"}`} />
                          <span>{rInfo.count > 0 ? rInfo.average : "0.0"}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">({rInfo.count})</span>
                        </div>
                        {!isDefault && (!pkg.creator_email || (currentUser?.email && pkg.creator_email === currentUser.email)) && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-primary"
                              title="Edit Paket"
                            >
                              <Link href={`/cbt/create?edit=${pkg.id}`} onClick={(e) => e.stopPropagation()}>
                                <Edit2 className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={(e) => handleDeletePkg(pkg.id, e)}
                              title="Hapus Paket"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
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
                      {activeProgressMap[pkg.id] ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-500 animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Sedang Berlangsung
                        </span>
                      ) : high !== null ? (
                        <div className="flex items-center gap-1 font-semibold text-emerald-500">
                          <Award className="h-3.5 w-3.5" />
                          <span>Skor: {high}%</span>
                        </div>
                      ) : (
                        <span className="italic">Belum dicoba</span>
                      )}
                    </div>

                    {activeProgressMap[pkg.id] ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button asChild className="flex-1 gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm">
                            <Link href={`/cbt/exam/${pkg.id}`}>
                              Lanjutkan Ujian
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={() => setDiscussionPkg(pkg)}
                            title="Diskusi & Ulasan"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                          onClick={(e) => handleResetProgress(pkg.id, e)}
                        >
                          Ulangi dari Awal
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button asChild className="flex-1 gap-2">
                          <Link href={`/cbt/exam/${pkg.id}`}>
                            Mulai Ujian
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
                          onClick={() => setDiscussionPkg(pkg)}
                          title="Diskusi & Ulasan"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            }

            return (
              <Tabs defaultValue="my-exams" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                  <TabsTrigger value="my-exams" className="gap-1.5 font-semibold">
                    <Award className="h-4 w-4 text-primary" />
                    Ujian & Latihan Saya
                  </TabsTrigger>
                  <TabsTrigger value="community-hub" className="gap-1.5 font-semibold">
                    <Sparkles className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    Community Hub ({communityPackages.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="my-exams" className="space-y-4">
                  {myOrOfficialPackages.length === 0 ? (
                    <Card className="p-8 text-center border border-dashed border-border bg-card">
                      <p className="text-muted-foreground text-sm">Belum ada paket ujian kustom.</p>
                    </Card>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {myOrOfficialPackages.map((pkg) => renderPackageCard(pkg))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="community-hub" className="space-y-4">
                  {communityPackages.length === 0 ? (
                    <Card className="p-8 text-center border border-dashed border-border bg-card">
                      <p className="text-muted-foreground text-sm">Belum ada paket ujian dari komunitas. Jadilah yang pertama membuat dan membagikannya!</p>
                    </Card>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {communityPackages.map((pkg) => renderPackageCard(pkg))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )
          })()}
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
                    {loading ? (
                      [1, 2, 3].map((n) => (
                        <tr key={n} className="animate-pulse">
                          <td className="px-6 py-4"><div className="h-4 w-40 bg-muted rounded animate-pulse" /></td>
                          <td className="px-6 py-4"><div className="h-4 w-32 bg-muted rounded animate-pulse" /></td>
                          <td className="px-6 py-4"><div className="h-4 w-16 bg-muted rounded animate-pulse" /></td>
                          <td className="px-6 py-4"><div className="h-4 w-12 bg-muted rounded animate-pulse" /></td>
                          <td className="px-6 py-4"><div className="h-6 w-20 bg-muted rounded-full animate-pulse" /></td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                            <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                          </td>
                        </tr>
                      ))
                    ) : (
                      attempts.map((att) => {
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
                          <td className="px-6 py-4 text-right whitespace-nowrap flex items-center justify-end gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/cbt/results/${att.id}`}>
                                Lihat Review
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => handleDeleteAttempt(att.id, e)}
                              title="Hapus Riwayat"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      )
                    }))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Discussion Dialog Popover */}
        <Dialog open={!!discussionPkg} onOpenChange={(open) => !open && setDiscussionPkg(null)}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Diskusi & Ulasan: {discussionPkg?.name}
              </DialogTitle>
              <DialogDescription>
                Berikan rating, tanyakan materi, atau diskusikan soal ini dengan penulis dan rekan sejawat lainnya.
              </DialogDescription>
            </DialogHeader>
            {discussionPkg && (
              <div className="mt-4">
                <CBTDiscussion packageId={discussionPkg.id} packageName={discussionPkg.name} />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}

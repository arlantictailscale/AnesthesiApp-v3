"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createPackage, getPackage, updatePackage } from "@/lib/cbt-storage"
import type { CBTQuestion } from "@/lib/cbt-default-data"
import { createClient } from "@/lib/supabase/client"
import {
  ChevronLeft,
  Plus,
  Trash2,
  Sparkles,
  Save,
  HelpCircle,
  AlertCircle,
  Edit2,
  BookOpen,
  FileText,
  Upload,
  X,
  ImageIcon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const CATEGORIES = [
  "Farmakologi & Fisiologi",
  "Resusitasi & Critical Care",
  "Anestesi Umum & Regional",
  "Anestesi Obstetrik",
  "Anestesi Pediatrik",
  "Neuroanestesi",
  "Anestesi Kardiovaskular",
  "Manajemen Nyeri (Pain Management)",
  "Anestesi Geriatrik",
  "Anestesi Rawat Jalan & NORA",
] as const

export default function CBTCreatePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 text-muted-foreground gap-4">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span>Memuat editor soal...</span>
      </div>
    }>
      <CBTCreatePageContent />
    </Suspense>
  )
}

function CBTCreatePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")

  // Package Metadata States
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  // List of added questions
  const [questions, setQuestions] = useState<CBTQuestion[]>([])

  // Import AI/JSON Dialog States
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importJsonText, setImportJsonText] = useState("")
  const [importPkgName, setImportPkgName] = useState("")
  const [importPkgDesc, setImportPkgDesc] = useState("")
  const [aiTopic, setAiTopic] = useState("")
  const [aiCount, setAiCount] = useState(10)
  const [generating, setGenerating] = useState(false)
  
  // Current active question being edited/created
  const [editIndex, setEditIndex] = useState<number | null>(null) // null means creating new
  const [qText, setQText] = useState("")
  const [optA, setOptA] = useState("")
  const [optB, setOptB] = useState("")
  const [optC, setOptC] = useState("")
  const [optD, setOptD] = useState("")
  const [optE, setOptE] = useState("")
  const [correctOption, setCorrectOption] = useState<"A" | "B" | "C" | "D" | "E">("A")
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("Farmakologi & Fisiologi")
  const [explanation, setExplanation] = useState("")
  const [qImageUrl, setQImageUrl] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)

  const [saving, setSaving] = useState(false)
  const [loadingPackage, setLoadingPackage] = useState(!!editId)

  // Load existing package for editing
  useEffect(() => {
    if (!editId) return

    async function loadPkg() {
      try {
        const p = await getPackage(editId)
        if (p) {
          setName(p.name)
          setDescription(p.description || "")
          setQuestions(p.questions)
        } else {
          toast.error("Paket soal tidak ditemukan.")
          router.push("/dashboard/cbt")
        }
      } catch (err) {
        toast.error("Gagal memuat paket soal.")
      } finally {
        setLoadingPackage(false)
      }
    }
    loadPkg()
  }, [editId, router])

  if (loadingPackage) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 text-muted-foreground gap-4">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span>Memuat paket soal yang akan diedit...</span>
      </div>
    )
  }

  // Reset question form
  function clearQuestionForm() {
    setEditIndex(null)
    setQText("")
    setOptA("")
    setOptB("")
    setOptC("")
    setOptD("")
    setOptE("")
    setCorrectOption("A")
    setCategory("Farmakologi & Fisiologi")
    setExplanation("")
    setQImageUrl("")
    setUploadingImage(false)
  }

  // Load a question into form for editing
  function handleEditQuestion(index: number) {
    const q = questions[index]
    setEditIndex(index)
    setQText(q.text)
    setOptA(q.options.A)
    setOptB(q.options.B)
    setOptC(q.options.C)
    setOptD(q.options.D)
    setOptE(q.options.E)
    setCorrectOption(q.correctOption)
    setCategory(q.category as any)
    setExplanation(q.explanation)
    setQImageUrl(q.imageUrl || "")
  }

  // Remove a question
  function handleDeleteQuestion(index: number) {
    if (confirm("Hapus soal ini?")) {
      setQuestions((prev) => prev.filter((_, i) => i !== index))
      if (editIndex === index) {
        clearQuestionForm()
      } else if (editIndex !== null && editIndex > index) {
        setEditIndex(editIndex - 1)
      }
      toast.success("Soal dihapus dari daftar.")
    }
  }

  // Add/Update question in the temporary list
  function handleSaveQuestion(e: React.FormEvent) {
    e.preventDefault()

    if (!qText.trim()) {
      toast.error("Teks pertanyaan tidak boleh kosong.")
      return
    }
    if (!optA.trim() || !optB.trim() || !optC.trim() || !optD.trim() || !optE.trim()) {
      toast.error("Semua pilihan jawaban (A-E) harus diisi.")
      return
    }

    const newQuestion: CBTQuestion = {
      id: editIndex !== null ? questions[editIndex].id : `q_${Date.now()}`,
      text: qText.trim(),
      options: {
        A: optA.trim(),
        B: optB.trim(),
        C: optC.trim(),
        D: optD.trim(),
        E: optE.trim(),
      },
      correctOption,
      category,
      explanation: explanation.trim(),
      imageUrl: qImageUrl || undefined,
    }

    if (editIndex !== null) {
      // Update existing
      setQuestions((prev) => {
        const updated = [...prev]
        updated[editIndex] = newQuestion
        return updated
      })
      toast.success("Pertanyaan berhasil diperbarui!")
    } else {
      // Append new
      setQuestions((prev) => [...prev, newQuestion])
      toast.success("Pertanyaan berhasil ditambahkan ke daftar!")
    }

    clearQuestionForm()
  }

  // Upload image to Supabase Storage
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar. Maksimum 5MB.")
      return
    }

    setUploadingImage(true)
    try {
      const supabase = createClient()
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`
      const filePath = `questions/${fileName}`

      const { data, error } = await supabase.storage
        .from("cbt-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from("cbt-images")
        .getPublicUrl(filePath)

      setQImageUrl(publicUrl)
      toast.success("Gambar pendukung berhasil diunggah!")
    } catch (err) {
      console.error("Upload error:", err)
      toast.error("Gagal mengunggah gambar. Pastikan bucket 'cbt-images' sudah siap di Supabase.")
    } finally {
      setUploadingImage(false)
    }
  }

  // Sample JSON format helper
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

  // Import from JSON into builder workspace
  function handleJsonImport() {
    if (!importPkgName.trim()) {
      toast.error("Nama paket wajib diisi.")
      return
    }

    try {
      // Sanitize backslashes to handle LaTeX or unescaped characters/symbols
      const sanitizedText = importJsonText
        .replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\")
        .replace(/\\([tnr])(?=[a-zA-Z])/g, "\\\\$1")

      const parsed = JSON.parse(sanitizedText)
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

      if (questions.length > 0 && !confirm("Impor ini akan menggantikan daftar soal saat ini di editor. Lanjutkan?")) {
        return
      }

      setName(importPkgName.trim())
      setDescription(importPkgDesc.trim())
      setQuestions(parsed)
      toast.success(`Berhasil memuat ${parsed.length} soal dari JSON ke dalam editor!`)
      setIsImportOpen(false)
      setImportJsonText("")
      setImportPkgName("")
      setImportPkgDesc("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengurai JSON. Pastikan format valid.")
    }
  }

  // Generate via AI into builder workspace
  async function handleAiImport() {
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

      if (questions.length > 0 && !confirm("Proses ini akan menggantikan daftar soal saat ini di editor. Lanjutkan?")) {
        return
      }

      setName(`Paket AI: ${aiTopic}`)
      setDescription(`Paket soal latihan kustom yang dihasilkan menggunakan AI untuk materi: ${aiTopic}. Berisi ${aiCount} soal pilihan ganda.`)
      setQuestions(result.questions)
      toast.success(`Berhasil menghasilkan ${aiCount} soal kustom via AI ke dalam editor!`)
      setIsImportOpen(false)
      setAiTopic("")
      setAiCount(10)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat soal dengan AI.")
    } finally {
      setGenerating(false)
    }
  }

  // Save/Update the entire package to Supabase
  async function handlePublishPackage() {
    if (!name.trim()) {
      toast.error("Nama paket ujian wajib diisi.")
      return
    }
    if (questions.length === 0) {
      toast.error("Harap tambahkan setidaknya satu pertanyaan sebelum menyimpan paket.")
      return
    }

    setSaving(true)
    try {
      if (editId) {
        await updatePackage(editId, name.trim(), description.trim(), questions)
        toast.success("Paket ujian kustom berhasil diperbarui!")
      } else {
        await createPackage(name.trim(), description.trim(), questions)
        toast.success("Paket ujian kustom berhasil disimpan dan dipublikasikan!")
      }
      router.push("/dashboard/cbt")
    } catch (err) {
      toast.error(err instanceof Error ? `Gagal: ${err.message}` : "Gagal menyimpan paket.")
    } finally {
      setSaving(false)
    }
  }

  // Count categories for statistics
  const categoryCounts = questions.reduce((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <AppShell>
      <div className="flex flex-col gap-6 pb-12">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/cbt")} className="gap-1.5">
              <ChevronLeft className="h-4 w-4" />
              Kembali ke Dashboard
            </Button>
          </div>
          <Button
            onClick={handlePublishPackage}
            disabled={saving || questions.length === 0}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {editId ? "Perbarui & Publikasikan Paket" : "Simpan & Publikasikan Paket"}
              </>
            )}
          </Button>
        </div>

        {/* Top Info Section */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/80 via-primary/70 to-card p-6 text-primary-foreground shadow-sm">
          <div className="relative z-10 flex flex-col gap-4">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              <BookOpen className="h-3.5 w-3.5" />
              Visual Question Builder
            </span>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {editId ? "Edit Paket Soal" : "Buat Paket Soal Baru"}
            </h1>
            <p className="text-sm text-primary-foreground/80 max-w-2xl leading-relaxed">
              {editId 
                ? "Gunakan editor interaktif ini untuk mengubah paket soal latihan anestesiologi Anda. Perubahan akan langsung diperbarui ke database."
                : "Gunakan editor interaktif ini untuk merumuskan paket soal latihan anestesiologi Anda sendiri. Paket yang disimpan akan langsung dipublikasikan ke Community Hub sehingga dapat diakses oleh rekan sejawat lainnya."
              }
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button
                onClick={() => setIsImportOpen(true)}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold gap-1.5 shadow-sm"
              >
                <Sparkles className="h-4 w-4" />
                {questions.length > 0 ? "Impor / Hasilkan via AI atau JSON (Menimpa)" : "Impor / Hasilkan via AI atau JSON"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Forms */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Step 1: Package Metadata */}
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold">1. Informasi Umum Paket</CardTitle>
                <CardDescription>Beri nama dan deskripsi ringkas paket soal Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pkg-name">Nama Paket Soal</Label>
                  <Input
                    id="pkg-name"
                    placeholder="Contoh: Paket Latihan Neuroanestesi Lanjutan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pkg-desc">Deskripsi Paket</Label>
                  <Textarea
                    id="pkg-desc"
                    placeholder="Contoh: Kumpulan 10 soal pilihan ganda mengenai manajemen TIK tinggi dan tumor otak..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-16"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Visual Question Form */}
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">
                    {editIndex !== null ? `2. Edit Pertanyaan #${editIndex + 1}` : "2. Tambah Pertanyaan Baru"}
                  </CardTitle>
                  <CardDescription>Formulasi pertanyaan klinis, opsi A-E, dan penjelasannya.</CardDescription>
                </div>
                {editIndex !== null && (
                  <Button variant="outline" size="sm" onClick={clearQuestionForm}>
                    Batal Edit / Buat Baru
                  </Button>
                )}
              </CardHeader>
              <form onSubmit={handleSaveQuestion}>
                <CardContent className="space-y-5">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="q-category">Kategori Subspesialisasi</Label>
                    <select
                      id="q-category"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-2">
                    <Label htmlFor="q-text">Teks Soal</Label>
                    <Textarea
                      id="q-text"
                      placeholder="Masukkan skenario klinis atau pertanyaan ujian..."
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      className="h-28"
                    />
                  </div>

                  {/* Image Upload Input */}
                  <div className="space-y-2">
                    <Label htmlFor="q-image">Gambar Pendukung (Opsional)</Label>
                    <div className="flex flex-col gap-3">
                      {qImageUrl ? (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={qImageUrl}
                            alt="Pendukung Soal"
                            className="max-h-full max-w-full object-contain"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-md"
                            onClick={() => setQImageUrl("")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full">
                          <label
                            htmlFor="q-image-upload"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/20 rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 transition-all"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground gap-2">
                              {uploadingImage ? (
                                <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                              ) : (
                                <Upload className="h-6 w-6" />
                              )}
                              <p className="text-xs font-semibold">
                                {uploadingImage ? "Mengunggah..." : "Klik untuk unggah gambar pendukung"}
                              </p>
                              <p className="text-[10px] text-muted-foreground/60">
                                PNG, JPG, JPEG (Maks. 5MB)
                              </p>
                            </div>
                            <input
                              id="q-image-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Options A-E */}
                  <div className="space-y-3">
                    <Label>Pilihan Jawaban (A-E)</Label>
                    
                    {(["A", "B", "C", "D", "E"] as const).map((letter) => {
                      const val = letter === "A" ? optA : letter === "B" ? optB : letter === "C" ? optC : letter === "D" ? optD : optE
                      const setter = letter === "A" ? setOptA : letter === "B" ? setOptB : letter === "C" ? setOptC : letter === "D" ? setOptD : setOptE

                      return (
                        <div key={letter} className="flex items-center gap-3">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${correctOption === letter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            {letter}
                          </span>
                          <Input
                            placeholder={`Pilihan ${letter}`}
                            value={val}
                            onChange={(e) => setter(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      )
                    })}
                  </div>

                  {/* Correct Option Dropdown */}
                  <div className="space-y-2">
                    <Label htmlFor="q-correct">Kunci Jawaban</Label>
                    <select
                      id="q-correct"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={correctOption}
                      onChange={(e) => setCorrectOption(e.target.value as any)}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                    </select>
                  </div>

                  {/* Explanation */}
                  <div className="space-y-2">
                    <Label htmlFor="q-explanation">Pembahasan Klinis (Penjelasan)</Label>
                    <Textarea
                      id="q-explanation"
                      placeholder="Jelaskan alasan fisiologis/farmakologis mengapa kunci jawaban tersebut benar..."
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      className="h-24"
                    />
                  </div>

                  <Button type="submit" className="w-full gap-2">
                    {editIndex !== null ? (
                      <>
                        <Edit2 className="h-4 w-4" />
                        Perbarui Pertanyaan
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Tambahkan Pertanyaan ke Paket
                      </>
                    )}
                  </Button>
                </CardContent>
              </form>
            </Card>
          </div>

          {/* Right Column: Question Navigator / Tracker */}
          <div className="flex flex-col gap-6">
            <Card className="border border-border bg-card shadow-sm sticky top-20">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  Daftar Soal ({questions.length})
                </CardTitle>
                <CardDescription>Klik soal untuk mengedit atau menghapus.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-xs">Belum ada pertanyaan. Buatlah pertanyaan pertama Anda menggunakan form di sebelah kiri.</p>
                  </div>
                ) : (
                  <>
                    {/* Category Summary Badges */}
                    <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
                      {Object.entries(categoryCounts).map(([cat, count]) => (
                        <span key={cat} className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                          {cat.split(" ")[0]}: {count}
                        </span>
                      ))}
                    </div>

                    {/* Scrollable List */}
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                      {questions.map((q, idx) => {
                        const isEditing = editIndex === idx
                        return (
                          <div
                            key={q.id}
                            onClick={() => handleEditQuestion(idx)}
                            className={`flex items-start justify-between gap-3 p-3 rounded-lg border text-left cursor-pointer transition-all hover:bg-muted/40 ${isEditing ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"}`}
                          >
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-primary block uppercase">
                                SOAL #{idx + 1} ({q.correctOption})
                              </span>
                              <p className="text-xs font-medium truncate mt-0.5 text-foreground">
                                {q.text}
                              </p>
                              <span className="text-[9px] text-muted-foreground italic mt-0.5 block">
                                {q.category}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteQuestion(idx)
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}

                <div className="pt-2 border-t border-border flex flex-col gap-2">
                  <Button
                    onClick={handlePublishPackage}
                    disabled={questions.length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                  >
                    <Save className="h-4 w-4" />
                    {editId ? "Perbarui & Publikasikan" : "Simpan & Publikasikan"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      if (confirm("Batalkan pembuatan paket? Semua data yang dimasukkan akan hilang.")) {
                        router.push("/dashboard/cbt")
                      }
                    }}
                  >
                    Batal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Import/Generate Dialog */}
        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Impor / Hasilkan Soal</DialogTitle>
              <DialogDescription>
                Hasilkan paket soal secara instan menggunakan kecerdasan buatan (AI) atau muat soal kustom Anda dari template JSON langsung ke dalam editor.
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
                    onClick={handleAiImport}
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
                        Hasilkan Soal ke Editor
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </TabsContent>

              {/* JSON Upload Tab */}
              <TabsContent value="json" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="importPkgName">Nama Paket Soal</Label>
                    <Input
                      id="importPkgName"
                      placeholder="Contoh: Paket Latihan Kardiovaskular A"
                      value={importPkgName}
                      onChange={(e) => setImportPkgName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="importPkgDesc">Deskripsi Singkat</Label>
                    <Input
                      id="importPkgDesc"
                      placeholder="Latihan soal khusus anestesi obstetrik..."
                      value={importPkgDesc}
                      onChange={(e) => setImportPkgDesc(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="importJsonText">Salin JSON Soal Di Sini</Label>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-xs text-primary"
                      type="button"
                      onClick={() => setImportJsonText(sampleJson)}
                    >
                      Gunakan Contoh Format
                    </Button>
                  </div>
                  <Textarea
                    id="importJsonText"
                    placeholder={`Masukkan array JSON berisi soal di sini...\nFormat:\n${sampleJson}`}
                    className="font-mono text-xs h-[180px]"
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                  />
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" onClick={handleJsonImport} className="w-full sm:w-auto">
                    Muat ke Editor
                  </Button>
                </DialogFooter>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}

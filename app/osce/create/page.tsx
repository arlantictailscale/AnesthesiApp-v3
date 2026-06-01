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
import { Badge } from "@/components/ui/badge"
import { createOsceStation, getOsceStation, updateOsceStation } from "@/lib/osce/storage"
import type { OsceStation, RubricItem } from "@/lib/osce/default-data"
import {
  ChevronLeft,
  Plus,
  Trash2,
  Sparkles,
  Save,
  HelpCircle,
  AlertCircle,
  FileText,
  X,
  FileDown,
  Activity,
  Layers,
  Wrench,
  BookOpen
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

export default function OSCECreatePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 text-muted-foreground gap-4">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span>Memuat editor stasiun OSCE...</span>
      </div>
    }>
      <OSCECreatePageContent />
    </Suspense>
  )
}

function OSCECreatePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")

  // Station Metadata States
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("Anestesi Umum & Regional")
  const [durationMinutes, setDurationMinutes] = useState(17)
  const [scenario, setScenario] = useState("")
  const [instructionsParticipant, setInstructionsParticipant] = useState("")
  const [instructionsExaminer, setInstructionsExaminer] = useState("")

  // Equipment List State
  const [equipmentList, setEquipmentList] = useState<string[]>([])
  const [newEquipment, setNewEquipment] = useState("")

  // Rubric Items State
  const [rubricItems, setRubricItems] = useState<RubricItem[]>([
    { aspect: "Diagnosis dan problem aktual - potensial", weight: 2, items: [] },
    { aspect: "Rencana tindakan anestesi / Persiapan", weight: 1, items: [] },
    { aspect: "Keterampilan klinis", weight: 3, items: [] },
    { aspect: "Manajemen nyeri pasca anestesi", weight: 3, items: [] },
    { aspect: "Komunikasi dan Perilaku profesional", weight: 1, items: [] }
  ])

  // Sub-checklist adding states for each rubric aspect
  const [newChecklistText, setNewChecklistText] = useState<Record<number, string>>({})

  // Dialog States
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importJsonText, setImportJsonText] = useState("")
  const [aiTopic, setAiTopic] = useState("")
  const [generating, setGenerating] = useState(false)

  const [saving, setSaving] = useState(false)
  const [loadingStation, setLoadingStation] = useState(!!editId)

  // Load existing station for editing
  useEffect(() => {
    if (!editId) return

    async function loadStation() {
      try {
        const s = await getOsceStation(editId)
        if (s) {
          setTitle(s.title)
          setCategory(s.category as any)
          setDurationMinutes(s.duration_minutes)
          setScenario(s.scenario)
          setInstructionsParticipant(s.instructions_participant)
          setInstructionsExaminer(s.instructions_examiner)
          setEquipmentList(s.equipment || [])
          setRubricItems(s.rubric || [])
        } else {
          toast.error("Stasiun OSCE tidak ditemukan.")
          router.push("/osce")
        }
      } catch (err) {
        toast.error("Gagal memuat stasiun OSCE.")
      } finally {
        setLoadingStation(false)
      }
    }
    loadStation()
  }, [editId, router])

  if (loadingStation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 text-muted-foreground gap-4">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span>Memuat stasiun OSCE yang akan diedit...</span>
      </div>
    )
  }

  // Handle equipment
  function handleAddEquipment() {
    const trimmed = newEquipment.trim()
    if (!trimmed) return
    if (equipmentList.includes(trimmed)) {
      toast.warning("Alat sudah ada dalam daftar.")
      return
    }
    setEquipmentList((prev) => [...prev, trimmed])
    setNewEquipment("")
  }

  function handleRemoveEquipment(item: string) {
    setEquipmentList((prev) => prev.filter((eq) => eq !== item))
  }

  // Handle rubric aspects
  function handleAddAspect() {
    setRubricItems((prev) => [
      ...prev,
      { aspect: `Aspek Penilaian Baru #${prev.length + 1}`, weight: 1, items: [] }
    ])
  }

  function handleRemoveAspect(index: number) {
    if (confirm("Hapus aspek penilaian ini beserta seluruh checklist detailnya?")) {
      setRubricItems((prev) => prev.filter((_, idx) => idx !== index))
    }
  }

  function handleAspectChange(index: number, field: keyof RubricItem, value: any) {
    setRubricItems((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: value
      }
      return updated
    })
  }

  // Handle aspect checklists
  function handleAddChecklistItem(aspectIndex: number) {
    const text = (newChecklistText[aspectIndex] || "").trim()
    if (!text) return

    setRubricItems((prev) => {
      const updated = [...prev]
      const items = [...updated[aspectIndex].items]
      if (items.includes(text)) {
        toast.warning("Item checklist sudah ada.")
        return prev
      }
      updated[aspectIndex] = {
        ...updated[aspectIndex],
        items: [...items, text]
      }
      return updated
    })

    setNewChecklistText((prev) => ({
      ...prev,
      [aspectIndex]: ""
    }))
  }

  function handleRemoveChecklistItem(aspectIndex: number, itemIndex: number) {
    setRubricItems((prev) => {
      const updated = [...prev]
      const items = updated[aspectIndex].items.filter((_, idx) => idx !== itemIndex)
      updated[aspectIndex] = {
        ...updated[aspectIndex],
        items
      }
      return updated
    })
  }

  // AI OSCE Generation
  async function handleAiGenerate() {
    if (!aiTopic.trim()) {
      toast.error("Topik atau skenario klinis wajib diisi.")
      return
    }

    setGenerating(true)
    try {
      const res = await fetch("/api/ai/generate-osce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat stasiun via AI.")
      }

      const st = data.station
      setTitle(st.title || "")
      setCategory(st.category || "Anestesi Umum & Regional")
      setDurationMinutes(st.duration_minutes || 17)
      setScenario(st.scenario || "")
      setInstructionsParticipant(st.instructions_participant || "")
      setInstructionsExaminer(st.instructions_examiner || "")
      setEquipmentList(st.equipment || [])
      setRubricItems(st.rubric || [])

      toast.success("Berhasil menghasilkan stasiun OSCE latihan kustom via AI!")
      setIsImportOpen(false)
      setAiTopic("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat stasiun OSCE.")
    } finally {
      setGenerating(false)
    }
  }

  // JSON Import
  function handleJsonImport() {
    try {
      const sanitized = importJsonText.replace(/\\(?!")/g, "\\\\")
      const parsed = JSON.parse(sanitized)

      if (!parsed.title || !parsed.scenario || !parsed.rubric) {
        throw new Error("Format JSON tidak valid. Judul, skenario, dan rubrik wajib diisi.")
      }

      setTitle(parsed.title)
      setCategory(parsed.category || "Anestesi Umum & Regional")
      setDurationMinutes(parsed.duration_minutes || 17)
      setScenario(parsed.scenario)
      setInstructionsParticipant(parsed.instructions_participant || "")
      setInstructionsExaminer(parsed.instructions_examiner || "")
      setEquipmentList(parsed.equipment || [])
      setRubricItems(parsed.rubric || [])

      toast.success("Stasiun OSCE berhasil dimuat dari JSON!")
      setIsImportOpen(false)
      setImportJsonText("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengurai JSON. Pastikan format valid.")
    }
  }

  // JSON Export
  function handleExportJson() {
    const data = {
      title,
      category,
      duration_minutes: durationMinutes,
      scenario,
      instructions_participant: instructionsParticipant,
      instructions_examiner: instructionsExaminer,
      equipment: equipmentList,
      rubric: rubricItems
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `OSCE_${title.replace(/\s+/g, "_")}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Konfigurasi stasiun berhasil diekspor ke file JSON.")
  }

  // Save changes to Supabase / LocalStorage
  async function handlePublishStation() {
    if (!title.trim()) {
      toast.error("Judul stasiun ujian wajib diisi.")
      return
    }
    if (!scenario.trim()) {
      toast.error("Skenario klinis wajib diisi.")
      return
    }
    if (rubricItems.length === 0) {
      toast.error("Harap tambahkan setidaknya satu aspek penilaian dalam rubrik.")
      return
    }

    // Check that aspects have some checklists
    const emptyAspect = rubricItems.find((r) => r.items.length === 0)
    if (emptyAspect) {
      toast.error(`Aspek "${emptyAspect.aspect}" tidak memiliki item checklist penilaian. Harap tambahkan setidaknya satu checklist detail.`)
      return
    }

    setSaving(true)
    try {
      const stationPayload = {
        title: title.trim(),
        category,
        duration_minutes: durationMinutes,
        scenario: scenario.trim(),
        instructions_participant: instructionsParticipant.trim(),
        instructions_examiner: instructionsExaminer.trim(),
        equipment: equipmentList,
        rubric: rubricItems
      }

      if (editId) {
        await updateOsceStation(editId, stationPayload)
        toast.success("Stasiun OSCE kustom berhasil diperbarui!")
      } else {
        await createOsceStation(stationPayload)
        toast.success("Stasiun OSCE kustom berhasil disimpan dan dipublikasikan!")
      }
      router.push("/osce")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? `Gagal menyimpan: ${err.message}` : "Gagal menyimpan stasiun OSCE.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6 pb-12">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/osce")} className="gap-1.5 font-bold">
              <ChevronLeft className="h-4 w-4" />
              Kembali ke Dashboard
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              disabled={!title}
              className="gap-1.5 font-semibold text-xs h-9 border-border/80 text-muted-foreground hover:text-foreground"
            >
              <FileDown className="h-4 w-4" />
              Ekspor JSON
            </Button>
            <Button
              onClick={handlePublishStation}
              disabled={saving}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 shadow-sm"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {editId ? "Perbarui Stasiun" : "Simpan Stasiun"}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Hero Title Card */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/80 via-primary/75 to-card p-6 text-primary-foreground shadow-sm">
          <div className="relative z-10 flex flex-col gap-4">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              <BookOpen className="h-3.5 w-3.5" />
              OSCE Station Builder
            </span>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {editId ? "Edit Stasiun OSCE Kustom" : "Buat Stasiun OSCE Baru"}
            </h1>
            <p className="text-sm text-primary-foreground/80 max-w-2xl leading-relaxed">
              {editId
                ? "Modifikasi data skenario, instruksi peserta, daftar alat, dan aspek penilaian rubrik untuk stasiun latihan kustom Anda."
                : "Rancang stasiun OSCE anestesiologi Anda sendiri. Anda dapat merumuskannya secara manual atau memicu AI untuk menghasilkan stasiun lengkap dalam hitungan detik."
              }
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button
                onClick={() => setIsImportOpen(true)}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold gap-1.5 shadow-sm"
              >
                <Sparkles className="h-4 w-4" />
                {title ? "Hasilkan / Impor via AI atau JSON (Menimpa)" : "Hasilkan / Impor via AI atau JSON"}
              </Button>
            </div>
          </div>
        </div>

        {/* Content Builder Layout */}
        <div className="grid gap-6 lg:grid-cols-5 items-start">
          {/* General and Equipment - 3 Columns */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  1. Informasi Kasus Klinis
                </CardTitle>
                <CardDescription>Detail skenario pasien dan petunjuk stasiun ujian.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="st-title" className="font-semibold text-xs">Nama/Judul Stasiun</Label>
                    <Input
                      id="st-title"
                      placeholder="Contoh: Anestesia SC & Apendiktomi Akut"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="st-category" className="font-semibold text-xs">Subspesialisasi</Label>
                    <select
                      id="st-category"
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="st-duration" className="font-semibold text-xs">Durasi Stasiun Ujian (Menit)</Label>
                  <Input
                    id="st-duration"
                    type="number"
                    min={5}
                    max={60}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="st-scenario" className="font-semibold text-xs">Skenario Klinis Pasien (Scenario Sheet)</Label>
                  <Textarea
                    id="st-scenario"
                    placeholder="Sebutkan detail klinis: Perempuan 28 th G1P0A0 letak sungsang + appendicitis cito, vital sign tensi 138/88, suhu 39.2 C..."
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                    className="h-28"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="st-inst-part" className="font-semibold text-xs">Instruksi Peserta Ujian (Candidate Tasks)</Label>
                  <Textarea
                    id="st-inst-part"
                    placeholder="Petunjuk tugas kandidat. Gunakan format poin:\n- Tentukan problem aktual dan potensial\n- Lakukan persiapan pre-op\n- Lakukan anestesi spinal..."
                    value={instructionsParticipant}
                    onChange={(e) => setInstructionsParticipant(e.target.value)}
                    className="h-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="st-inst-exam" className="font-semibold text-xs">Instruksi Penguji (Examiner Guide)</Label>
                  <Textarea
                    id="st-inst-exam"
                    placeholder="Petunjuk untuk dosen penguji. Contoh: Pastikan identitas kandidat, berikan skor checklist di tablet penguji..."
                    value={instructionsExaminer}
                    onChange={(e) => setInstructionsExaminer(e.target.value)}
                    className="h-20"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Equipment - Card */}
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-primary" />
                  2. Peralatan & Obat-obatan Stasiun
                </CardTitle>
                <CardDescription>Daftar alat medis dan obat yang disediakan di stasiun OSCE ini.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Contoh: Bupivacaine 0.5%, Jarum Spinal 26G, Tensimeter..."
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddEquipment()
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddEquipment} className="gap-1.5 shrink-0">
                    <Plus className="h-4 w-4" /> Tambah
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 min-h-[48px] border border-dashed rounded-lg p-3 bg-muted/20 border-border/80">
                  {equipmentList.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic my-auto">Belum ada peralatan yang ditambahkan.</span>
                  ) : (
                    equipmentList.map((eq) => (
                      <Badge key={eq} variant="secondary" className="flex items-center gap-1 font-semibold pr-1.5 py-0.5">
                        {eq}
                        <button
                          type="button"
                          onClick={() => handleRemoveEquipment(eq)}
                          className="h-4 w-4 hover:bg-destructive/20 hover:text-destructive rounded-full flex items-center justify-center transition-colors"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rubrics Builder - 2 Columns */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    3. Rubrik Penilaian ({rubricItems.length})
                  </CardTitle>
                  <CardDescription>Atur aspek penilaian, pembobotan nilai, dan checklist detail.</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAddAspect} className="gap-1 font-bold text-xs h-8">
                  <Plus className="h-3.5 w-3.5" /> Aspek
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {rubricItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground gap-2 border border-dashed rounded-lg p-4">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/45" />
                    <p className="text-xs">Belum ada aspek rubrik. Klik tombol "+ Aspek" untuk mulai membuat.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                    {rubricItems.map((item, aspectIndex) => (
                      <Card key={aspectIndex} className="border border-border/80 bg-muted/10 relative p-4 flex flex-col gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAspect(aspectIndex)}
                          className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-primary block uppercase">
                            ASPEK #{aspectIndex + 1}
                          </Label>
                          <Input
                            placeholder="Nama Aspek Penilaian..."
                            value={item.aspect}
                            onChange={(e) => handleAspectChange(aspectIndex, "aspect", e.target.value)}
                            className="text-xs font-semibold pr-8 bg-card"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground">Bobot Nilai (Multiplier)</Label>
                          <div className="flex gap-2">
                            {([1, 2, 3] as const).map((w) => (
                              <Button
                                key={w}
                                type="button"
                                variant={item.weight === w ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleAspectChange(aspectIndex, "weight", w)}
                                className={`flex-1 text-xs font-bold ${item.weight === w ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
                              >
                                Bobot x{w}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Checklist Details */}
                        <div className="space-y-2 pt-2 border-t border-border/40">
                          <Label className="text-[10px] font-bold text-muted-foreground block">
                            Butir Checklist Detail ({item.items.length})
                          </Label>

                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-0.5">
                            {item.items.length === 0 ? (
                              <p className="text-[11px] text-muted-foreground italic">Belum ada item checklist. Wajib tambahkan detail penilaian.</p>
                            ) : (
                              item.items.map((checkItem, itemIndex) => (
                                <div key={itemIndex} className="flex items-start gap-2 bg-card p-1.5 rounded border border-border/50 text-[11px] font-medium text-foreground">
                                  <span className="shrink-0 text-muted-foreground mt-0.5">•</span>
                                  <span className="flex-1 leading-relaxed">{checkItem}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveChecklistItem(aspectIndex, itemIndex)}
                                    className="text-muted-foreground hover:text-destructive shrink-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>

                          <div className="flex gap-1.5 mt-2 pt-1.5">
                            <Input
                              placeholder="Tambah butir checklist..."
                              value={newChecklistText[aspectIndex] || ""}
                              onChange={(e) => setNewChecklistText((prev) => ({ ...prev, [aspectIndex]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  handleAddChecklistItem(aspectIndex)
                                }
                              }}
                              className="h-8 text-xs bg-card"
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleAddChecklistItem(aspectIndex)}
                              className="h-8 text-xs shrink-0 font-bold"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-border flex flex-col gap-2">
                  <Button
                    onClick={handlePublishStation}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 shadow-sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editId ? "Perbarui & Publikasikan" : "Simpan & Publikasikan"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-muted-foreground hover:text-foreground text-xs"
                    onClick={() => {
                      if (confirm("Batalkan pengeditan? Semua perubahan akan hilang.")) {
                        router.push("/osce")
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

        {/* Generate / Import Dialog */}
        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogContent className="max-w-2xl border-border bg-card">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">Impor / Hasilkan Stasiun OSCE</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Hasilkan stasiun ujian kustom secara instan menggunakan kecerdasan buatan (AI) atau muat stasiun Anda sendiri lewat format JSON.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="ai" className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted">
                <TabsTrigger value="ai" className="gap-1.5 text-xs font-bold">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Hasilkan dengan AI
                </TabsTrigger>
                <TabsTrigger value="json" className="gap-1.5 text-xs font-bold">
                  <FileText className="h-3.5 w-3.5" />
                  Unggah JSON Stasiun
                </TabsTrigger>
              </TabsList>

              {/* AI Tab */}
              <TabsContent value="ai" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aiTopic" className="font-semibold text-xs">Topik / Masalah Anestesiologi</Label>
                  <Input
                    id="aiTopic"
                    placeholder="Contoh: Preeklamsia Berat SC, Intubasi Sulit Trauma Airway, Bradikardia Anestesi Spinal..."
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                    Kecerdasan Buatan (AI) akan secara otomatis merumuskan skenario, petunjuk peserta, daftar obat/alat, dan menyusun aspek rubrik penilaian yang relevan dengan topik ini.
                  </p>
                </div>

                <DialogFooter className="pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsImportOpen(false)}
                    className="text-xs font-bold"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAiGenerate}
                    disabled={generating || !aiTopic.trim()}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs gap-1.5"
                  >
                    {generating ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        Sedang Merumuskan...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Hasilkan OSCE Station
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </TabsContent>

              {/* JSON Tab */}
              <TabsContent value="json" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jsonText" className="font-semibold text-xs">Peta JSON Stasiun OSCE</Label>
                  <Textarea
                    id="jsonText"
                    placeholder={`{\n  "title": "Stasiun Kustom...",\n  "scenario": "Skenario...",\n  "rubric": [\n    { "aspect": "Diagnosis", "weight": 2, "items": ["Poin 1"] }\n  ]\n}`}
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    className="h-40 font-mono text-[11px] border border-border"
                  />
                </div>

                <DialogFooter className="pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsImportOpen(false)}
                    className="text-xs font-bold"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={handleJsonImport}
                    disabled={!importJsonText.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
                  >
                    <FileText className="h-4 w-4" />
                    Muat Konfigurasi
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

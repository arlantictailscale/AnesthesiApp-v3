"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { getSession } from "@/lib/storage"
import { listGuidelines, createGuideline, updateGuideline, deleteGuideline, uploadGuidelineFile } from "@/lib/guidelines/storage"
import type { AnesthesiaGuideline, GuidelineData } from "@/lib/schema"
import { guidelineSchema } from "@/lib/schema"
import {
  Search, Plus, Edit, Trash2, BookOpen, AlertTriangle, AlertCircle, Info, 
  ChevronRight, X, ArrowLeft, Download, Eye, FileText, Image as ImageIcon, 
  Upload, Loader2, Sparkles, FileUp, ZoomIn
} from "lucide-react"

const GUIDELINE_CATEGORIES = [
  "All",
  "Airway Management",
  "Emergency Protocols",
  "Cardiovascular",
  "Pediatric",
  "Obstetric",
  "Others"
]

export default function GuidelinesLibraryPage() {
  const [guidelines, setGuidelines] = useState<AnesthesiaGuideline[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedGuidelineId, setSelectedGuidelineId] = useState<string | null>(null)

  // Auth state
  const [userId, setUserId] = useState<string | null>(null)

  // Dialog & Form states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Mobile detail overlay toggle
  const [showMobileDetails, setShowMobileDetails] = useState(false)

  // Flowchart chart zoom modal state
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null)

  // Form states
  const [formData, setFormData] = useState<GuidelineData>({
    title: "",
    organization: "ASA",
    category: "Airway Management",
    summary: "",
    full_content: "",
    file_urls: [],
    image_urls: []
  })

  async function loadGuidelines() {
    try {
      const list = await listGuidelines()
      setGuidelines(list)
      // Auto select first guideline if none selected and on desktop
      if (list.length > 0 && !selectedGuidelineId) {
        setSelectedGuidelineId(list[0].id)
      }
    } catch (err) {
      toast.error("Failed to load guidelines library.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGuidelines()
    getSession().then((session) => {
      if (session) setUserId(session.userId)
    })
  }, [])

  // Filtered guidelines list
  const filteredGuidelines = guidelines.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.summary.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === "All" || g.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const activeGuideline = guidelines.find(g => g.id === selectedGuidelineId)

  // Reset form
  function handleResetForm() {
    setFormData({
      title: "",
      organization: "ASA",
      category: "Airway Management",
      summary: "",
      full_content: "",
      file_urls: [],
      image_urls: []
    })
  }

  // Multiple files & images upload handler
  async function handleMultipleUploads(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "file"
  ) {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (type === "file") setUploadingFile(true)
    else setUploadingImage(true)

    try {
      const newUploads: { name: string; url: string }[] = []
      const newImages: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const maxSize = type === "file" ? 10 * 1024 * 1024 : 5 * 1024 * 1024
        if (file.size > maxSize) {
          toast.error(`File "${file.name}" is too large. Max size is ${type === "file" ? "10MB" : "5MB"}.`)
          continue
        }

        const publicUrl = await uploadGuidelineFile(file)
        if (type === "file") {
          newUploads.push({ name: file.name, url: publicUrl })
        } else {
          newImages.push(publicUrl)
        }
      }

      if (type === "file") {
        setFormData(prev => ({
          ...prev,
          file_urls: [...(prev.file_urls || []), ...newUploads]
        }))
        toast.success("Documents uploaded successfully!")
      } else {
        setFormData(prev => ({
          ...prev,
          image_urls: [...(prev.image_urls || []), ...newImages]
        }))
        toast.success("Images uploaded successfully!")
      }
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Failed to upload files.")
    } finally {
      if (type === "file") setUploadingFile(false)
      else setUploadingImage(false)
    }
  }

  function handleRemoveImage(index: number) {
    setFormData(prev => ({
      ...prev,
      image_urls: (prev.image_urls || []).filter((_, i) => i !== index)
    }))
  }

  function handleRemoveFile(index: number) {
    setFormData(prev => ({
      ...prev,
      file_urls: (prev.file_urls || []).filter((_, i) => i !== index)
    }))
  }

  // Create guideline submit
  async function handleCreateGuideline(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    try {
      guidelineSchema.parse(formData)
      const newGuide = await createGuideline(formData)
      toast.success(`Guideline "${newGuide.title}" added to your library!`)
      setIsCreateOpen(false)
      handleResetForm()
      await loadGuidelines()
      setSelectedGuidelineId(newGuide.id)
    } catch (err) {
      if (err && (err as any).errors) {
        toast.error((err as any).errors[0].message || "Validation error")
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to add guideline")
      }
    } finally {
      setFormLoading(false)
    }
  }

  function openEditDialog(guide: AnesthesiaGuideline) {
    setFormData({
      title: guide.title,
      organization: guide.organization,
      category: guide.category,
      summary: guide.summary,
      full_content: guide.full_content,
      file_urls: guide.file_urls || [],
      image_urls: guide.image_urls || []
    })
    setIsEditOpen(true)
  }

  // Update guideline submit
  async function handleUpdateGuideline(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedGuidelineId) return
    setFormLoading(true)
    try {
      guidelineSchema.parse(formData)
      const updated = await updateGuideline(selectedGuidelineId, formData)
      toast.success(`Guideline "${updated.title}" updated successfully!`)
      setIsEditOpen(false)
      handleResetForm()
      await loadGuidelines()
    } catch (err) {
      if (err && (err as any).errors) {
        toast.error((err as any).errors[0].message || "Validation error")
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to update guideline")
      }
    } finally {
      setFormLoading(false)
    }
  }

  // Delete guideline submit
  async function handleDeleteGuideline(id: string) {
    if (!confirm("Are you sure you want to delete this custom guideline?")) return
    try {
      await deleteGuideline(id)
      toast.success("Guideline deleted.")
      setSelectedGuidelineId(null)
      setShowMobileDetails(false)
      await loadGuidelines()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete guideline")
    }
  }

  // Helper custom markdown renderer for local presentation
  function renderBoldText(text: string) {
    const parts = text.split(/\*\*([^*]+)\*\*/g)
    if (parts.length === 1) return text
    return parts.map((part, i) => {
      if (i % 2 === 1) return <strong key={i} className="font-bold text-foreground">{part}</strong>
      return part
    })
  }

  function MarkdownRenderer({ content }: { content: string }) {
    const lines = content.split("\n")
    return (
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground font-medium">
        {lines.map((line, idx) => {
          if (line.startsWith("#### ")) {
            return <h5 key={idx} className="text-sm font-bold text-foreground mt-4 mb-1">{line.slice(5)}</h5>
          }
          if (line.startsWith("### ")) {
            return <h4 key={idx} className="text-base font-bold text-foreground mt-5 mb-2 border-b border-border/50 pb-1">{line.slice(4)}</h4>
          }
          if (line.startsWith("## ")) {
            return <h3 key={idx} className="text-lg font-bold text-foreground mt-6 mb-2 border-b border-border pb-1">{line.slice(3)}</h3>
          }
          if (line.startsWith("# ")) {
            return <h2 key={idx} className="text-xl font-bold text-foreground mt-7 mb-3">{line.slice(2)}</h2>
          }
          if (line.startsWith("- ") || line.startsWith("* ")) {
            const text = line.slice(2)
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-primary mt-1.5 font-bold">•</span>
                <span className="flex-1">{renderBoldText(text)}</span>
              </div>
            )
          }
          if (/^\d+\.\s/.test(line)) {
            const text = line.replace(/^\d+\.\s/, "")
            const num = line.match(/^\d+/)![0]
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-primary font-bold mt-0.5">{num}.</span>
                <span className="flex-1">{renderBoldText(text)}</span>
              </div>
            )
          }
          if (line.trim() === "") {
            return <div key={idx} className="h-1" />
          }
          return <p key={idx}>{renderBoldText(line)}</p>
        })}
      </div>
    )
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-primary" />
              Anesthesia Guidelines Library
            </h1>
            <p className="text-sm text-muted-foreground">
               bedside reference for clinical anesthesia guidelines, algorithms, and treatment protocols.
            </p>
          </div>
          <Button onClick={() => { handleResetForm(); setIsCreateOpen(true); }} className="w-full sm:w-auto gap-2">
            <Plus className="h-4 w-4" /> Add custom guideline
          </Button>
        </div>

        {/* Master Detail Grid Split */}
        <div className="flex flex-col md:flex-row flex-1 gap-6 relative">

          {/* MASTER PANEL (Left Sidebar) */}
          <div className={`flex flex-col gap-4 w-full md:w-[350px] lg:w-[400px] shrink-0 border border-border bg-card rounded-xl p-4 ${showMobileDetails ? "hidden md:flex" : "flex"}`}>
            
            {/* Search Input */}
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search guidelines, orgs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1 h-8 w-8 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Scrollable Categories Tag Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
              {GUIDELINE_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat
                return (
                  <Button
                    key={cat}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className="rounded-full whitespace-nowrap shrink-0 text-xs py-1 h-7"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </Button>
                )
              })}
            </div>

            {/* Guidelines List */}
            <div className="flex flex-col gap-2">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 w-full animate-pulse bg-muted rounded-lg" />
                ))
              ) : filteredGuidelines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border">
                  <Info className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm font-semibold">No guidelines found</p>
                  <p className="text-xs text-muted-foreground/75 px-4 mt-1">Try resetting search or filters</p>
                </div>
              ) : (
                filteredGuidelines.map((g) => {
                  const isSelected = g.id === selectedGuidelineId
                  const isCustom = g.user_id !== null
                  
                  // Setup organization badges colors
                  let orgBadgeStyle = "bg-primary/10 text-primary border-primary/20"
                  if (g.organization === "ASA") orgBadgeStyle = "bg-blue-500/10 text-blue-600 border-blue-500/20"
                  else if (g.organization === "AHA") orgBadgeStyle = "bg-red-500/10 text-red-600 border-red-500/20"
                  else if (g.organization === "MHAUS") orgBadgeStyle = "bg-orange-500/10 text-orange-600 border-orange-500/20"
                  else if (g.organization === "ASRA") orgBadgeStyle = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"

                  return (
                    <div
                      key={g.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedGuidelineId(g.id)
                        setShowMobileDetails(true)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setSelectedGuidelineId(g.id)
                          setShowMobileDetails(true)
                        }
                      }}
                      className={`flex flex-col text-left p-3.5 rounded-lg border transition-all relative overflow-hidden group cursor-pointer w-full h-auto shrink-0 ${
                        isSelected
                          ? "bg-primary/5 border-primary text-foreground ring-1 ring-primary/30"
                          : "bg-background border-border hover:bg-muted/30 text-foreground"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 w-full">
                        <span className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors pr-2">
                          {g.title}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="outline" className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase scale-90 ${orgBadgeStyle}`}>
                            {g.organization}
                          </Badge>
                          {isCustom && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0.2 rounded font-semibold scale-90 bg-primary/5 border-primary/20 text-primary">
                              Custom
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 line-clamp-1 w-full">
                        {g.category}
                      </span>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-2 leading-normal">
                        {g.summary}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* DETAIL PANEL (Right Area) */}
          <div className={`flex-1 min-w-0 flex flex-col border border-border bg-card rounded-xl ${!showMobileDetails ? "hidden md:flex" : "flex"}`}>
            {activeGuideline ? (
              <div className="flex flex-col">
                
                {/* Detail Header */}
                <div className="p-4 border-b border-border bg-muted/10 shrink-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowMobileDetails(false)}
                      className="md:hidden h-8 w-8 text-muted-foreground"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-bold tracking-tight truncate">{activeGuideline.title}</h2>
                        <Badge variant="secondary" className="font-bold text-[10px] uppercase">
                          {activeGuideline.organization}
                        </Badge>
                        {activeGuideline.user_id !== null && (
                          <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-semibold text-[10px]">
                            Custom
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{activeGuideline.category}</p>
                    </div>
                  </div>

                  {/* Actions for custom entries */}
                  {activeGuideline.user_id !== null && activeGuideline.user_id === userId && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(activeGuideline)}
                        className="h-8 gap-1.5 text-xs font-semibold"
                      >
                        <Edit className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGuideline(activeGuideline.id)}
                        className="h-8 gap-1.5 text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/5"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Detail Content */}
                <div className="p-5 space-y-6">
                  
                  {/* Executive Summary Card */}
                  <Card className="bg-muted/10 border-border shadow-sm">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Info className="h-4 w-4 text-primary" /> Summary Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-sm leading-relaxed text-muted-foreground font-medium">
                      {activeGuideline.summary}
                    </CardContent>
                  </Card>

                  {/* Inline algorithm charts/images module */}
                  {activeGuideline.image_urls && activeGuideline.image_urls.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5 border-b border-border pb-1">
                        <ImageIcon className="h-4 w-4 text-primary" /> Guideline Flowcharts / Algorithms ({activeGuideline.image_urls.length})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {activeGuideline.image_urls.map((url, idx) => (
                          <div key={idx} className="relative group overflow-hidden border border-border bg-muted rounded-xl flex items-center justify-center aspect-[16/10] shadow-sm hover:border-primary/50 transition-colors">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`Algorithm Flowchart ${idx + 1}`}
                              className="max-h-full max-w-full object-contain cursor-zoom-in transition-all group-hover:scale-102"
                              onClick={() => setZoomImageUrl(url)}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                              <ZoomIn className="h-6 w-6 text-white" />
                            </div>
                            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs font-semibold">
                              Chart #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Guideline Full Content Markdown */}
                  <div className="space-y-2 border-t border-border pt-4">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5 border-b border-border pb-1">
                      <FileText className="h-4 w-4 text-primary" /> Clinical Protocol details
                    </h3>
                    <div className="bg-card p-4 rounded-xl border border-border/60 shadow-inner">
                      <MarkdownRenderer content={activeGuideline.full_content} />
                    </div>
                  </div>

                  {/* Attached Files List */}
                  {activeGuideline.file_urls && activeGuideline.file_urls.length > 0 && (
                    <div className="space-y-3 border-t border-border pt-4">
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5 border-b border-border pb-1">
                        <FileUp className="h-4 w-4 text-primary" /> Guideline Reference Documents ({activeGuideline.file_urls.length})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeGuideline.file_urls.map((fileObj, idx) => (
                          <Card key={idx} className="flex items-center justify-between p-3.5 border border-border bg-muted/5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-xs truncate pr-2" title={fileObj.name}>
                                  {fileObj.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground">PDF Document Format</p>
                              </div>
                            </div>
                            <Button asChild size="sm" variant="outline" className="gap-1 h-7 px-2.5 font-semibold text-xs shrink-0">
                              <a href={fileObj.url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-3 w-3" /> <span className="hidden sm:inline">Open</span>
                              </a>
                            </Button>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground bg-muted/5">
                <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <h3 className="font-semibold text-lg">No guideline selected</h3>
                <p className="text-sm max-w-sm mt-1">Select an anesthesia guideline or emergency protocol from the list to view flowchart and details.</p>
              </div>
            )}
          </div>
        </div>

        {/* DIALOG: CREATE CUSTOM GUIDELINE */}
        <Dialog open={isCreateOpen} onOpenChange={(open) => !open && setIsCreateOpen(false)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Add Custom Anesthesia Guideline</DialogTitle>
              <DialogDescription>
                Fill out the fields to add a new guideline to your bedside references.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateGuideline} className="space-y-4 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="create-title">Guideline Title</Label>
                  <Input
                    id="create-title"
                    required
                    placeholder="e.g. ASA Difficult Airway Algorithm"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                {/* Organization */}
                <div className="space-y-1.5">
                  <Label htmlFor="create-org">Authoring Organization</Label>
                  <Input
                    id="create-org"
                    required
                    placeholder="e.g. ASA, AHA, ASRA, ESA..."
                    value={formData.organization}
                    onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="create-category">Category / Speciality</Label>
                  <select
                    id="create-category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {GUIDELINE_CATEGORIES.filter(c => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-1.5">
                <Label htmlFor="create-summary">Executive Summary</Label>
                <Textarea
                  id="create-summary"
                  required
                  rows={2}
                  placeholder="Provide a brief clinical summary of this guideline..."
                  value={formData.summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                />
              </div>

              {/* Detailed Guidelines content */}
              <div className="space-y-1.5">
                <Label htmlFor="create-content">Detailed Protocol (Markdown Supported)</Label>
                <Textarea
                  id="create-content"
                  required
                  rows={5}
                  placeholder="Use simple markdown: # Header, - Bullet point, **bold text** to describe steps..."
                  value={formData.full_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_content: e.target.value }))}
                />
              </div>

              {/* File / Image uploads */}
              <div className="grid gap-4 sm:grid-cols-2 border border-border p-3 rounded-lg bg-muted/20">
                {/* Algorithm Images Upload */}
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label className="text-xs font-semibold animate-pulse-slow">Algorithm Charts / Images</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {formData.image_urls && formData.image_urls.map((url, index) => (
                      <div key={index} className="relative aspect-video rounded border border-border bg-card flex items-center justify-center overflow-hidden group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Thumbnail ${index + 1}`} className="max-h-full max-w-full object-contain" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-5 w-5 rounded-full shadow-md opacity-95"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    
                    <label className="flex flex-col items-center justify-center aspect-video border border-dashed border-muted-foreground/30 rounded cursor-pointer bg-card hover:bg-muted/10 transition-all min-h-[70px]">
                      <div className="flex flex-col items-center justify-center text-muted-foreground text-center px-1">
                        {uploadingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <Plus className="h-4 w-4 mb-1 text-primary" />
                        )}
                        <span className="text-[10px] font-semibold">{uploadingImage ? "Uploading..." : "Add Image"}</span>
                        <span className="text-[8px] text-muted-foreground/60">(PNG, JPG, max 5MB)</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={uploadingImage}
                        onChange={(e) => handleMultipleUploads(e, "image")}
                      />
                    </label>
                  </div>
                </div>

                {/* PDF Documents Upload */}
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label className="text-xs font-semibold">Official Guideline PDFs</Label>
                  <div className="space-y-2">
                    {formData.file_urls && formData.file_urls.map((fileObj, index) => (
                      <div key={index} className="relative flex items-center justify-between p-2 rounded border border-border bg-card text-xs">
                        <div className="flex items-center gap-1.5 min-w-0 pr-6">
                          <FileText className="h-4 w-4 text-red-500 shrink-0" />
                          <span className="truncate font-medium" title={fileObj.name}>{fileObj.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-5 w-5 rounded-full shadow-md shrink-0 absolute right-1.5"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    <label className="flex flex-col items-center justify-center w-full h-16 border border-dashed border-muted-foreground/30 rounded cursor-pointer bg-card hover:bg-muted/10 transition-all">
                      <div className="flex flex-col items-center justify-center text-muted-foreground text-center px-2">
                        {uploadingFile ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <Plus className="h-4 w-4 mb-0.5 text-primary" />
                        )}
                        <span className="text-[10px] font-semibold">{uploadingFile ? "Uploading..." : "Add PDF Document"}</span>
                        <span className="text-[8px] text-muted-foreground/60">(PDF only, max 10MB)</span>
                      </div>
                      <input
                        type="file"
                        accept="application/pdf"
                        multiple
                        className="hidden"
                        disabled={uploadingFile}
                        onChange={(e) => handleMultipleUploads(e, "file")}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading || uploadingFile || uploadingImage}>
                  {formLoading ? "Adding..." : "Add Guideline"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG: EDIT CUSTOM GUIDELINE */}
        <Dialog open={isEditOpen} onOpenChange={(open) => !open && setIsEditOpen(false)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Edit Custom Guideline</DialogTitle>
              <DialogDescription>
                Modify the details of your custom guideline.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateGuideline} className="space-y-4 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-title">Guideline Title</Label>
                  <Input
                    id="edit-title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                {/* Organization */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-org">Authoring Organization</Label>
                  <Input
                    id="edit-org"
                    required
                    value={formData.organization}
                    onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-category">Category / Speciality</Label>
                  <select
                    id="edit-category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {GUIDELINE_CATEGORIES.filter(c => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-summary">Executive Summary</Label>
                <Textarea
                  id="edit-summary"
                  required
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                />
              </div>

              {/* Detailed Guidelines content */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-content">Detailed Protocol (Markdown Supported)</Label>
                <Textarea
                  id="edit-content"
                  required
                  rows={5}
                  value={formData.full_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_content: e.target.value }))}
                />
              </div>

              {/* File / Image uploads */}
              <div className="grid gap-4 sm:grid-cols-2 border border-border p-3 rounded-lg bg-muted/20">
                {/* Algorithm Images Upload */}
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label className="text-xs font-semibold animate-pulse-slow">Algorithm Charts / Images</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {formData.image_urls && formData.image_urls.map((url, index) => (
                      <div key={index} className="relative aspect-video rounded border border-border bg-card flex items-center justify-center overflow-hidden group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Thumbnail ${index + 1}`} className="max-h-full max-w-full object-contain" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-5 w-5 rounded-full shadow-md opacity-95"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    
                    <label className="flex flex-col items-center justify-center aspect-video border border-dashed border-muted-foreground/30 rounded cursor-pointer bg-card hover:bg-muted/10 transition-all min-h-[70px]">
                      <div className="flex flex-col items-center justify-center text-muted-foreground text-center px-1">
                        {uploadingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <Plus className="h-4 w-4 mb-1 text-primary" />
                        )}
                        <span className="text-[10px] font-semibold">{uploadingImage ? "Uploading..." : "Add Image"}</span>
                        <span className="text-[8px] text-muted-foreground/60">(PNG, JPG, max 5MB)</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={uploadingImage}
                        onChange={(e) => handleMultipleUploads(e, "image")}
                      />
                    </label>
                  </div>
                </div>

                {/* PDF Documents Upload */}
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label className="text-xs font-semibold">Official Guideline PDFs</Label>
                  <div className="space-y-2">
                    {formData.file_urls && formData.file_urls.map((fileObj, index) => (
                      <div key={index} className="relative flex items-center justify-between p-2 rounded border border-border bg-card text-xs">
                        <div className="flex items-center gap-1.5 min-w-0 pr-6">
                          <FileText className="h-4 w-4 text-red-500 shrink-0" />
                          <span className="truncate font-medium" title={fileObj.name}>{fileObj.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-5 w-5 rounded-full shadow-md shrink-0 absolute right-1.5"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    <label className="flex flex-col items-center justify-center w-full h-16 border border-dashed border-muted-foreground/30 rounded cursor-pointer bg-card hover:bg-muted/10 transition-all">
                      <div className="flex flex-col items-center justify-center text-muted-foreground text-center px-2">
                        {uploadingFile ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <Plus className="h-4 w-4 mb-0.5 text-primary" />
                        )}
                        <span className="text-[10px] font-semibold">{uploadingFile ? "Uploading..." : "Add PDF Document"}</span>
                        <span className="text-[8px] text-muted-foreground/60">(PDF only, max 10MB)</span>
                      </div>
                      <input
                        type="file"
                        accept="application/pdf"
                        multiple
                        className="hidden"
                        disabled={uploadingFile}
                        onChange={(e) => handleMultipleUploads(e, "file")}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading || uploadingFile || uploadingImage}>
                  {formLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* IMAGE ZOOM POPUP MODAL */}
        <Dialog open={!!zoomImageUrl} onOpenChange={(open) => !open && setZoomImageUrl(null)}>
          <DialogContent className="max-w-4xl p-1 bg-black/90 border-0 flex items-center justify-center max-h-[90vh]">
            {zoomImageUrl && (
              <div className="relative w-full h-[85vh] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={zoomImageUrl}
                  alt="Zoomed Algorithm Flowchart"
                  className="max-h-full max-w-full object-contain"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-white hover:bg-white/10 rounded-full h-8 w-8"
                  onClick={() => setZoomImageUrl(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </AppShell>
  )
}

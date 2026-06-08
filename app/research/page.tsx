"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { listSharedCases, getSession } from "@/lib/storage"
import type { StoredCase } from "@/lib/schema"
import {
  Search, ClipboardList, Filter, X, ArrowUpDown, ArrowRight,
  Shield, Calendar, MapPin, User as UserIcon, Activity, Stethoscope,
  Download
} from "lucide-react"

export default function ResearchLibraryPage() {
  const [cases, setCases] = useState<StoredCase[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSex, setSelectedSex] = useState("All")
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("All")
  const [selectedPostOpRoom, setSelectedPostOpRoom] = useState("All")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "age">("newest")

  async function loadData() {
    try {
      const list = await listSharedCases()
      setCases(list)
    } catch (err) {
      toast.error("Failed to load shared research cases.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    getSession().then((session) => {
      if (session) setCurrentUserId(session.userId)
    })
  }, [])

  // Filtered cases list
  const filteredCases = cases.filter((c) => {
    if (c.status === "processing" || c.status === "failed") return false

    const isOwner = currentUserId !== null && c.user_id === currentUserId
    const displayName = isOwner ? c.patient_name : "Patient [Anonymized]"

    const matchesSearch =
      displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.medical_record_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.procedure_intervention.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSex = selectedSex === "All" || c.sex === selectedSex

    let matchesAge = true
    if (selectedAgeGroup === "Pediatric") matchesAge = c.age < 18
    else if (selectedAgeGroup === "Adult") matchesAge = c.age >= 18 && c.age <= 65
    else if (selectedAgeGroup === "Geriatric") matchesAge = c.age > 65

    const matchesPostOpRoom =
      selectedPostOpRoom === "All" || c.post_op_room === selectedPostOpRoom

    return matchesSearch && matchesSex && matchesAge && matchesPostOpRoom
  })

  // Sorted cases list
  const sortedCases = [...filteredCases].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    if (sortBy === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }
    if (sortBy === "age") {
      return b.age - a.age
    }
    return 0
  })

  function handleResetFilters() {
    setSearchQuery("")
    setSelectedSex("All")
    setSelectedAgeGroup("All")
    setSelectedPostOpRoom("All")
    setSortBy("newest")
  }

  function handleExportToExcel() {
    if (sortedCases.length === 0) {
      toast.error("No cases available to export.")
      return
    }

    // Define CSV headers
    const headers = [
      "ID",
      "Patient Name",
      "MRN",
      "Procedure Date",
      "Room",
      "Sex",
      "Age",
      "Weight (kg)",
      "Height (cm)",
      "BMI",
      "Diagnosis",
      "Procedure & Intervention",
      "Allergies",
      "Medications",
      "Past Illnesses",
      "Last Meal",
      "Event Details",
      "B1 Breathing",
      "B2 Cardiovascular",
      "B3 Neurological",
      "B4 Renal/Bladder",
      "B5 Abdomen/Bowel",
      "B6 Temp/Skin",
      "Other B-Symptoms",
      "Lab Results",
      "X-Ray Results",
      "ECG Results",
      "CT Scan Results",
      "MRI Results",
      "Other Investigation Label",
      "Other Investigation Result",
      "Clinical Assessment",
      "Anesthesia Planning",
      "Anesthesia Management",
      "Pre-Induction",
      "Induction",
      "Maintenance",
      "Analgesia Pre-Op",
      "Analgesia Intra-Op",
      "Analgesia Post-Op",
      "Post-Induction Side Effects",
      "Ventilator Settings",
      "Intra-Op Hemodynamics",
      "Surgery Duration",
      "Bleeding",
      "Transfusion",
      "Urine Output",
      "Fluid Balance",
      "Post-Op Room",
      "Post-Op Hemodynamics",
      "Post-Op Lab Results",
      "Created At"
    ]

    // Helper to sanitize CSV field: escape quotes and handle commas
    const escapeCsvField = (val: unknown) => {
      if (val === undefined || val === null) return ""
      let text = ""
      if (typeof val === "object") {
        const obj = val as any
        if (obj && typeof obj.enabled === "boolean") {
          text = obj.enabled ? (obj.result?.trim() ? obj.result : "Performed") : "Not Performed"
        } else {
          text = JSON.stringify(obj)
        }
      } else {
        text = String(val)
      }
      const escaped = text.replace(/"/g, '""')
      if (escaped.includes(",") || escaped.includes("\n") || escaped.includes("\r") || escaped.includes('"')) {
        return `"${escaped}"`
      }
      return escaped
    }

    const csvRows = []
    csvRows.push("\ufeff" + headers.join(","))

    sortedCases.forEach((c) => {
      const isOwner = currentUserId !== null && c.user_id === currentUserId
      const displayName = isOwner ? c.patient_name : "Patient [Anonymized]"

      const row = [
        c.id,
        displayName,
        c.medical_record_number,
        c.procedure_date,
        c.room,
        c.sex,
        c.age,
        c.weight_kg,
        c.height_cm,
        c.bmi,
        c.diagnosis,
        c.procedure_intervention,
        c.allergy,
        c.medication,
        c.past_illness,
        c.last_meal,
        c.event,
        c.b1_breathing,
        c.b2_blood,
        c.b3_brain,
        c.b4_bladder,
        c.b5_bowel,
        c.b6_body_temp,
        c.others,
        c.inv_laboratory,
        c.inv_xray,
        c.inv_ecg,
        c.inv_ct,
        c.inv_mri,
        c.inv_other_label,
        c.inv_other_result,
        c.assessment,
        c.planning,
        c.anesthesia_management,
        c.regimen_pre_induction,
        c.regimen_induction,
        c.regimen_maintenance,
        c.analgesia_pre_op,
        c.analgesia_intra_op,
        c.analgesia_post_op,
        c.post_induction_side_effects,
        c.ventilator_settings,
        c.hemodynamics_intra,
        c.duration_surgery,
        c.bleeding,
        c.transfusion,
        c.urine_output,
        c.fluid_balance,
        c.post_op_room,
        c.hemodynamics_post,
        c.lab_results_post,
        c.created_at
      ]

      csvRows.push(row.map(escapeCsvField).join(","))
    })

    const csvContent = csvRows.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    const dateStr = new Date().toISOString().slice(0, 10)
    link.setAttribute("download", `AnesthesiApp_Research_Export_${dateStr}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Successfully exported ${sortedCases.length} cases to Excel/CSV.`)
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
                <ClipboardList className="h-7 w-7 text-primary" />
                Clinical Research Case Library
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Browse and analyze cases shared by peers to gain insights, study outcomes, and enhance clinical preparation.
            </p>
          </div>
          <Button
            onClick={handleExportToExcel}
            className="w-full sm:w-auto gap-2 font-semibold shadow-xs"
            variant="outline"
          >
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
        </div>

        {/* Search, Filter and Sort Section */}
        <Card className="border border-border shadow-xs bg-card p-4 min-w-0">
          <div className="flex flex-col gap-4">
            {/* Search and Sort Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by diagnosis, procedure, MRN, etc..."
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
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-9 px-2.5 border-dashed shrink-0 flex gap-1.5 font-semibold text-xs text-muted-foreground">
                  <ArrowUpDown className="h-3.5 w-3.5" /> Sort:
                </Badge>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex h-9 w-[130px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0 font-medium"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="age">Age (High to Low)</option>
                </select>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-4 items-center border-t border-border pt-4 text-xs font-semibold text-muted-foreground uppercase">
              <span className="flex items-center gap-1"><Filter className="h-3.5 w-3.5" /> Filters:</span>
              
              {/* Sex Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] lowercase text-muted-foreground/70">Sex:</span>
                <select
                  value={selectedSex}
                  onChange={(e) => setSelectedSex(e.target.value)}
                  className="h-7 rounded border border-input bg-background px-2 text-xs uppercase font-semibold"
                >
                  <option value="All">All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Age Group Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] lowercase text-muted-foreground/70">Age:</span>
                <select
                  value={selectedAgeGroup}
                  onChange={(e) => setSelectedAgeGroup(e.target.value)}
                  className="h-7 rounded border border-input bg-background px-2 text-xs uppercase font-semibold"
                >
                  <option value="All">All Ages</option>
                  <option value="Pediatric">Pediatric (&lt;18)</option>
                  <option value="Adult">Adult (18-65)</option>
                  <option value="Geriatric">Geriatric (&gt;65)</option>
                </select>
              </div>

              {/* Post-Op Room Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] lowercase text-muted-foreground/70">Outcome Room:</span>
                <select
                  value={selectedPostOpRoom}
                  onChange={(e) => setSelectedPostOpRoom(e.target.value)}
                  className="h-7 rounded border border-input bg-background px-2 text-xs uppercase font-semibold"
                >
                  <option value="All">All Rooms</option>
                  <option value="Low Care">Low Care</option>
                  <option value="High Care">High Care</option>
                  <option value="ICU">ICU</option>
                </select>
              </div>

              {(searchQuery || selectedSex !== "All" || selectedAgeGroup !== "All" || selectedPostOpRoom !== "All" || sortBy !== "newest") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-7 px-2 text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/5 capitalize ml-auto"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Case Studies Display Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 w-full animate-pulse bg-muted rounded-xl border" />
            ))}
          </div>
        ) : sortedCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl bg-card">
            <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <h3 className="font-semibold text-lg">No shared cases found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">Try updating your filters or search terms.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedCases.map((c) => {
              const isOwner = currentUserId !== null && c.user_id === currentUserId
              
              // Post-op room badge style
              let roomBadgeStyle = "bg-muted text-muted-foreground"
              if (c.post_op_room === "ICU") roomBadgeStyle = "bg-red-500/10 text-red-600 border-red-500/20"
              else if (c.post_op_room === "High Care") roomBadgeStyle = "bg-orange-500/10 text-orange-600 border-orange-500/20"
              else if (c.post_op_room === "Low Care") roomBadgeStyle = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"

              return (
                <Card key={c.id} className="flex min-w-0 flex-col border border-border bg-card shadow-xs hover:border-primary/40 transition-colors p-5 relative group">
                  <div className="flex min-w-0 justify-between items-start gap-2 mb-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate pr-2 group-hover:text-primary transition-colors">
                        {isOwner ? c.patient_name : "Patient [Anonymized]"}
                      </h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        MRN {c.medical_record_number}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 scale-90">
                      <Badge variant="secondary" className="font-bold text-[9px] uppercase">
                        {c.sex} · {c.age}y
                      </Badge>
                      {isOwner && (
                        <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 font-bold text-[9px]">
                          Mine
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col gap-2 text-xs text-muted-foreground flex-1 mb-4 leading-normal">
                    <div className="flex gap-2 items-start min-w-0">
                      <Stethoscope className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-semibold text-foreground block truncate">Procedure</span>
                        <span className="truncate block font-medium">{c.procedure_intervention}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start min-w-0">
                      <Activity className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-semibold text-foreground block truncate">Diagnosis</span>
                        <span className="truncate block font-medium">{c.diagnosis}</span>
                      </div>
                    </div>
                    {c.post_op_room && (
                      <div className="flex gap-2 items-start min-w-0">
                        <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="font-semibold text-foreground block truncate">Recovery Outcome</span>
                          <Badge variant="outline" className={`mt-0.5 text-[9px] font-bold uppercase ${roomBadgeStyle}`}>
                            {c.post_op_room}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border pt-3 flex items-center justify-between mt-auto">
                    <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {new Date(c.procedure_date).toLocaleDateString()}
                    </span>
                    <Button asChild size="sm" variant="ghost" className="h-8 gap-1 text-xs font-bold text-primary group-hover:bg-primary/5">
                      <Link href={`/cases/${c.id}`}>
                        View Case Study <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}

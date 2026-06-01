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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { getSession } from "@/lib/storage"
import { listDrugs, createDrug, updateDrug, deleteDrug } from "@/lib/drug-storage"
import type { AnesthesiaDrug, DrugData } from "@/lib/schema"
import { drugSchema } from "@/lib/schema"
import { 
  Search, Plus, Edit, Trash2, Clock, Activity, 
  Calculator, AlertTriangle, AlertCircle, Info, BookOpen, 
  ShieldAlert, ChevronRight, CornerDownRight, X, ArrowLeft,
  Brain
} from "lucide-react"

const CATEGORIES = [
  "All",
  "Induction Agents",
  "Opioids / Analgesics",
  "Neuromuscular Blockers",
  "Reversals / Anticholinesterases",
  "Reversals",
  "Anticholinergics / Emergency",
  "Vasopressors / Cardiovascular",
  "Others"
]

export default function DrugLibraryPage() {
  const [drugs, setDrugs] = useState<AnesthesiaDrug[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedDrugId, setSelectedDrugId] = useState<string | null>(null)
  
  // Auth state
  const [userId, setUserId] = useState<string | null>(null)

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  
  // Mobile detail view toggle
  const [showMobileDetails, setShowMobileDetails] = useState(false)

  // Form states
  const [formData, setFormData] = useState<DrugData>({
    name: "",
    category: "Induction Agents",
    mechanism_of_action: "",
    pharmacokinetics: "",
    pharmacodynamics: "",
    onset_of_action: "",
    duration_of_action: "",
    induction_dose: "",
    maintenance_dose: "",
    side_effects: "",
    clinical_considerations: "",
    contraindications: "",
    infusion_guidelines: "",
    is_high_alert: false
  })

  // Calculator states
  const [calcWeight, setCalcWeight] = useState<number>(70)
  const [calcDose, setCalcDose] = useState<number>(100) // Default dose rate
  const [calcUnit, setCalcUnit] = useState<string>("mcg/kg/min")
  const [calcConcentration, setCalcConcentration] = useState<number>(10) // mg/mL
  const [calcResult, setCalcResult] = useState<{ mlPerHour: number; drugPerHourMcg: number; drugPerHourMg: number } | null>(null)

  async function loadDrugs() {
    try {
      const list = await listDrugs()
      setDrugs(list)
      // Auto select first drug if none selected and on desktop
      if (list.length > 0 && !selectedDrugId) {
        setSelectedDrugId(list[0].id)
      }
    } catch (err) {
      toast.error("Failed to load drug library.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDrugs()
    getSession().then((session) => {
      if (session) setUserId(session.userId)
    })
  }, [])

  // Recalculate dose whenever calculator states change
  useEffect(() => {
    if (!selectedDrugId) return
    calculateInfusion()
  }, [calcWeight, calcDose, calcUnit, calcConcentration, selectedDrugId])

  // Reset calculator defaults when switching drugs
  const activeDrug = drugs.find(d => d.id === selectedDrugId)
  useEffect(() => {
    if (!activeDrug) return

    // Guess default calculator parameters based on drug profile
    const name = activeDrug.name.toLowerCase()
    if (name.includes("propofol")) {
      setCalcDose(150)
      setCalcUnit("mcg/kg/min")
      setCalcConcentration(10) // 10 mg/mL (1%)
    } else if (name.includes("ketamine")) {
      setCalcDose(1)
      setCalcUnit("mg/kg/hr")
      setCalcConcentration(10) // 10 mg/mL
    } else if (name.includes("norepinephrine")) {
      setCalcDose(0.1)
      setCalcUnit("mcg/kg/min")
      setCalcConcentration(0.08) // 4mg in 50ml = 80 mcg/mL = 0.08 mg/mL
    } else if (name.includes("fentanyl")) {
      setCalcDose(2)
      setCalcUnit("mcg/kg/hr")
      setCalcConcentration(0.05) // 50 mcg/mL = 0.05 mg/mL
    } else {
      setCalcDose(5)
      setCalcUnit("mcg/kg/min")
      setCalcConcentration(1)
    }
  }, [selectedDrugId])

  function calculateInfusion() {
    if (calcWeight <= 0 || calcDose < 0 || calcConcentration <= 0) {
      setCalcResult(null)
      return
    }

    let mlPerHour = 0
    let drugPerHourMcg = 0
    let drugPerHourMg = 0

    // 1. Calculate drug delivered per hour in micrograms (mcg) and milligrams (mg)
    if (calcUnit === "mcg/kg/min") {
      drugPerHourMcg = calcDose * calcWeight * 60
      drugPerHourMg = drugPerHourMcg / 1000
    } else if (calcUnit === "mcg/kg/hr") {
      drugPerHourMcg = calcDose * calcWeight
      drugPerHourMg = drugPerHourMcg / 1000
    } else if (calcUnit === "mg/kg/hr") {
      drugPerHourMg = calcDose * calcWeight
      drugPerHourMcg = drugPerHourMg * 1000
    } else if (calcUnit === "mcg/min") {
      // Non-weight based
      drugPerHourMcg = calcDose * 60
      drugPerHourMg = drugPerHourMcg / 1000
    }

    // 2. Convert to infusion rate (mL/hr) based on concentration (mg/mL)
    mlPerHour = drugPerHourMg / calcConcentration

    setCalcResult({
      mlPerHour: Number(mlPerHour.toFixed(2)),
      drugPerHourMcg: Math.round(drugPerHourMcg),
      drugPerHourMg: Number(drugPerHourMg.toFixed(2))
    })
  }

  // Filtered drugs list
  const filteredDrugs = drugs.filter((drug) => {
    const matchesSearch = 
      drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drug.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drug.mechanism_of_action.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === "All" || drug.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Form helpers
  function handleResetForm() {
    setFormData({
      name: "",
      category: "Induction Agents",
      mechanism_of_action: "",
      pharmacokinetics: "",
      pharmacodynamics: "",
      onset_of_action: "",
      duration_of_action: "",
      induction_dose: "",
      maintenance_dose: "",
      side_effects: "",
      clinical_considerations: "",
      contraindications: "",
      infusion_guidelines: "",
      is_high_alert: false
    })
  }

  async function handleCreateDrug(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    try {
      // Validation
      drugSchema.parse(formData)
      const newDrug = await createDrug(formData)
      toast.success(`${newDrug.name} added to your library!`)
      setIsCreateOpen(false)
      handleResetForm()
      await loadDrugs()
      setSelectedDrugId(newDrug.id)
    } catch (err) {
      if (err && (err as any).errors) {
        toast.error((err as any).errors[0].message || "Validation error")
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to add drug")
      }
    } finally {
      setFormLoading(false)
    }
  }

  function openEditDialog(drug: AnesthesiaDrug) {
    setFormData({
      name: drug.name,
      category: drug.category,
      mechanism_of_action: drug.mechanism_of_action,
      pharmacokinetics: drug.pharmacokinetics,
      pharmacodynamics: drug.pharmacodynamics,
      onset_of_action: drug.onset_of_action,
      duration_of_action: drug.duration_of_action,
      induction_dose: drug.induction_dose,
      maintenance_dose: drug.maintenance_dose,
      side_effects: drug.side_effects,
      clinical_considerations: drug.clinical_considerations,
      contraindications: drug.contraindications || "",
      infusion_guidelines: drug.infusion_guidelines || "",
      is_high_alert: drug.is_high_alert || false
    })
    setIsEditOpen(true)
  }

  async function handleUpdateDrug(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDrugId) return
    setFormLoading(true)
    try {
      drugSchema.parse(formData)
      const updated = await updateDrug(selectedDrugId, formData)
      toast.success(`${updated.name} updated successfully!`)
      setIsEditOpen(false)
      handleResetForm()
      await loadDrugs()
    } catch (err) {
      if (err && (err as any).errors) {
        toast.error((err as any).errors[0].message || "Validation error")
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to update drug")
      }
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDeleteDrug(id: string) {
    if (!confirm("Are you sure you want to delete this custom drug?")) return
    try {
      await deleteDrug(id)
      toast.success("Drug deleted.")
      setSelectedDrugId(null)
      setShowMobileDetails(false)
      await loadDrugs()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete drug")
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6 pb-12 h-[calc(100vh-8rem)] min-h-[500px]">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-primary" />
              Anesthesia Drug Library
            </h1>
            <p className="text-sm text-muted-foreground">
              A clinical reference library for anesthetic agents, dosages, and bedside calculators.
            </p>
          </div>
          <Button onClick={() => { handleResetForm(); setIsCreateOpen(true); }} className="w-full sm:w-auto gap-2">
            <Plus className="h-4 w-4" /> Add custom drug
          </Button>
        </div>

        {/* Outer Split Container */}
        <div className="flex flex-1 gap-6 min-h-0 overflow-hidden relative">
          
          {/* MASTER PANEL (Left Sidebar) */}
          <div className={`flex flex-col gap-4 w-full md:w-[350px] lg:w-[400px] shrink-0 border border-border bg-card rounded-xl p-4 min-h-0 ${showMobileDetails ? "hidden md:flex" : "flex"}`}>
            
            {/* Search inputs */}
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, class, action..."
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

            {/* Horizontal Scrollable Categories */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
              {CATEGORIES.map((cat) => {
                const label = cat === "All" ? "All" : cat.split(" / ")[0]
                const isActive = selectedCategory === cat
                return (
                  <Button
                    key={cat}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className="rounded-full whitespace-nowrap shrink-0 text-xs py-1 h-7"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {label}
                  </Button>
                )
              })}
            </div>

            {/* Drug List */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 w-full animate-pulse bg-muted rounded-lg" />
                ))
              ) : filteredDrugs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border">
                  <Info className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm font-semibold">No drugs found</p>
                  <p className="text-xs text-muted-foreground/75 px-4 mt-1">Try resetting search or filters</p>
                </div>
              ) : (
                filteredDrugs.map((drug) => {
                  const isSelected = drug.id === selectedDrugId
                  const isCustom = drug.user_id !== null
                  return (
                    <div
                      key={drug.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedDrugId(drug.id)
                        setShowMobileDetails(true)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setSelectedDrugId(drug.id)
                          setShowMobileDetails(true)
                        }
                      }}
                      className={`flex flex-col text-left p-3.5 rounded-lg border transition-all relative overflow-hidden group cursor-pointer w-full h-auto ${
                        isSelected 
                          ? "bg-primary/5 border-primary text-foreground ring-1 ring-primary/30" 
                          : "bg-background border-border hover:bg-muted/30 text-foreground"
                      }`}
                    >
                      {drug.is_high_alert && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" title="High Alert Medication" />
                      )}
                      <div className="flex justify-between items-start gap-2 w-full">
                        <span className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                          {drug.name}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {drug.is_high_alert && (
                            <Badge variant="destructive" className="text-[9px] px-1 py-0.2 rounded font-bold uppercase tracking-wider scale-90">
                              Alert
                            </Badge>
                          )}
                          {isCustom && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0.2 rounded font-semibold scale-90 bg-primary/5 border-primary/20 text-primary">
                              Custom
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 line-clamp-1 w-full">
                        {drug.category}
                      </span>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground w-full">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          Onset: {drug.onset_of_action}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* DETAIL PANEL (Right Area) */}
          <div className={`flex-1 flex flex-col border border-border bg-card rounded-xl overflow-hidden min-h-0 ${!showMobileDetails ? "hidden md:flex" : "flex"}`}>
            {activeDrug ? (
              <div className="flex-1 flex flex-col min-h-0">
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
                        <h2 className="text-xl font-bold tracking-tight truncate">{activeDrug.name}</h2>
                        {activeDrug.is_high_alert && (
                          <Badge variant="destructive" className="gap-1 font-bold text-[10px] uppercase">
                            <ShieldAlert className="h-3 w-3" /> High Alert
                          </Badge>
                        )}
                        {activeDrug.user_id !== null && (
                          <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-semibold text-[10px]">
                            Custom Entry
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{activeDrug.category}</p>
                    </div>
                  </div>

                  {/* Actions for custom drugs */}
                  {activeDrug.user_id !== null && activeDrug.user_id === userId && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openEditDialog(activeDrug)}
                        className="h-8 gap-1.5"
                      >
                        <Edit className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteDrug(activeDrug.id)}
                        className="h-8 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/5"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Detail Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 min-h-0">
                  {/* Quick Dosages Grid */}
                  <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-muted/10 border-border">
                      <CardContent className="p-3">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Onset</span>
                        <div className="font-bold text-sm text-foreground mt-1 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                          {activeDrug.onset_of_action}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/10 border-border">
                      <CardContent className="p-3">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Duration</span>
                        <div className="font-bold text-sm text-foreground mt-1 flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          {activeDrug.duration_of_action}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/10 border-border col-span-1">
                      <CardContent className="p-3">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Induction Dose</span>
                        <div className="font-bold text-xs text-foreground mt-1 whitespace-pre-wrap" title={activeDrug.induction_dose}>
                          {activeDrug.induction_dose}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/10 border-border col-span-1">
                      <CardContent className="p-3">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Maintenance Dose</span>
                        <div className="font-bold text-xs text-foreground mt-1 whitespace-pre-wrap" title={activeDrug.maintenance_dose}>
                          {activeDrug.maintenance_dose}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tabs: Details vs Calculator */}
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-sm mb-4">
                      <TabsTrigger value="details" className="text-xs font-semibold">Clinical Information</TabsTrigger>
                      <TabsTrigger value="calculator" className="text-xs font-semibold gap-1">
                        <Calculator className="h-3.5 w-3.5" /> Bedside Calculator
                      </TabsTrigger>
                    </TabsList>

                    {/* DETAILS TAB */}
                    <TabsContent value="details" className="space-y-5 focus-visible:outline-none">
                      
                      {/* Section: Mechanism of Action */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5 border-b border-border pb-1">
                          <Brain className="h-4 w-4 text-primary" /> Mechanism of Action
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground font-medium">
                          {activeDrug.mechanism_of_action}
                        </p>
                      </div>

                      {/* Split PK & PD */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5 border-b border-border pb-1">
                            <Activity className="h-4 w-4 text-emerald-500" /> Pharmacokinetics
                          </h3>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {activeDrug.pharmacokinetics}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5 border-b border-border pb-1">
                            <Activity className="h-4 w-4 text-indigo-500" /> Pharmacodynamics
                          </h3>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {activeDrug.pharmacodynamics}
                          </p>
                        </div>
                      </div>

                      {/* Side Effects */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5 border-b border-border pb-1 text-red-500">
                          <AlertTriangle className="h-4 w-4 text-red-500" /> Side Effects
                        </h3>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {activeDrug.side_effects}
                        </p>
                      </div>

                      {/* Clinical Considerations & Contraindications */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide border-b border-border pb-1">
                          Clinical Guidelines
                        </h3>
                        
                        {/* Clinical Considerations Alert Box */}
                        <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg p-3 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
                          <Info className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-bold">Bedside Considerations</p>
                            <p className="leading-relaxed font-medium">{activeDrug.clinical_considerations}</p>
                          </div>
                        </div>

                        {/* Contraindications if any */}
                        {activeDrug.contraindications && (
                          <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-3 text-xs text-red-900 dark:text-red-300 flex items-start gap-2.5">
                            <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="font-bold">Contraindications</p>
                              <p className="leading-relaxed font-medium">{activeDrug.contraindications}</p>
                            </div>
                          </div>
                        )}

                        {/* Infusion Guidelines if any */}
                        {activeDrug.infusion_guidelines && (
                          <div className="bg-blue-500/10 border border-blue-500/25 rounded-lg p-3 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
                            <Calculator className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="font-bold">Administration & Infusion Guidelines</p>
                              <p className="leading-relaxed font-medium">{activeDrug.infusion_guidelines}</p>
                            </div>
                          </div>
                        )}
                      </div>

                    </TabsContent>

                    {/* CALCULATOR TAB */}
                    <TabsContent value="calculator" className="space-y-4 focus-visible:outline-none">
                      <div className="bg-muted/30 border border-border p-4 rounded-lg flex flex-col gap-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calculator className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold text-sm">Bedside Infusion Calculator</h4>
                        </div>
                        <p className="text-xs text-muted-foreground -mt-2">
                          Calculate the continuous IV infusion rate in mL/hr based on drug concentration and patient weight.
                        </p>

                        <div className="grid gap-4 sm:grid-cols-2">
                          {/* Weight */}
                          <div className="space-y-1.5">
                            <Label htmlFor="calc-weight" className="text-xs font-semibold">Patient Weight (kg)</Label>
                            <Input
                              id="calc-weight"
                              type="number"
                              min="1"
                              max="300"
                              value={calcWeight || ""}
                              onChange={(e) => setCalcWeight(Number(e.target.value))}
                            />
                          </div>

                          {/* Concentration */}
                          <div className="space-y-1.5">
                            <Label htmlFor="calc-conc" className="text-xs font-semibold">Concentration (mg/mL)</Label>
                            <Input
                              id="calc-conc"
                              type="number"
                              step="0.001"
                              min="0.0001"
                              value={calcConcentration || ""}
                              onChange={(e) => setCalcConcentration(Number(e.target.value))}
                            />
                          </div>

                          {/* Dose Rate */}
                          <div className="space-y-1.5">
                            <Label htmlFor="calc-dose" className="text-xs font-semibold">Target Dose</Label>
                            <Input
                              id="calc-dose"
                              type="number"
                              step="0.01"
                              value={calcDose || ""}
                              onChange={(e) => setCalcDose(Number(e.target.value))}
                            />
                          </div>

                          {/* Dose Unit */}
                          <div className="space-y-1.5">
                            <Label htmlFor="calc-unit" className="text-xs font-semibold">Dose Unit</Label>
                            <select
                              id="calc-unit"
                              value={calcUnit}
                              onChange={(e) => setCalcUnit(e.target.value)}
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              <option value="mcg/kg/min">mcg/kg/min</option>
                              <option value="mcg/kg/hr">mcg/kg/hr</option>
                              <option value="mg/kg/hr">mg/kg/hr</option>
                              <option value="mcg/min">mcg/min</option>
                            </select>
                          </div>
                        </div>

                        {/* Calculation Result Callout */}
                        {calcResult !== null && (
                          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Required Infusion Rate</span>
                              <div className="text-3xl font-extrabold text-primary mt-1">
                                {calcResult.mlPerHour} <span className="text-lg font-medium text-foreground">mL/hr</span>
                              </div>
                            </div>
                            <div className="text-right sm:border-l sm:border-border sm:pl-4 w-full sm:w-auto self-stretch flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">Drug Dose Delivered</span>
                              <span className="font-bold text-sm text-foreground mt-0.5">
                                {calcResult.drugPerHourMg} mg/hr
                              </span>
                              <span className="text-xs text-muted-foreground mt-0.5">
                                ({calcResult.drugPerHourMcg} mcg/hr)
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Predefined concentration guides */}
                        <div className="mt-2 text-[10px] text-muted-foreground space-y-1">
                          <p className="font-bold">Standard Concentrations & Guidelines:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                            <span className="flex items-center gap-1">
                              <CornerDownRight className="h-3 w-3 text-primary shrink-0" />
                              Propofol: 1% = 10 mg/mL, 2% = 20 mg/mL
                            </span>
                            <span className="flex items-center gap-1">
                              <CornerDownRight className="h-3 w-3 text-primary shrink-0" />
                              Ketamine: 10 mg/mL or 50 mg/mL
                            </span>
                            <span className="flex items-center gap-1">
                              <CornerDownRight className="h-3 w-3 text-primary shrink-0" />
                              Fentanyl: 50 mcg/mL = 0.05 mg/mL
                            </span>
                            <span className="flex items-center gap-1">
                              <CornerDownRight className="h-3 w-3 text-primary shrink-0" />
                              Norepinephrine: 80 mcg/mL = 0.08 mg/mL
                            </span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground bg-muted/5">
                <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <h3 className="font-semibold text-lg">No drug selected</h3>
                <p className="text-sm max-w-sm mt-1">Select a drug from the library list to view mechanisms, dosages, and calculators.</p>
              </div>
            )}
          </div>
        </div>

        {/* DIALOG: CREATE CUSTOM DRUG */}
        <Dialog open={isCreateOpen} onOpenChange={(open) => !open && setIsCreateOpen(false)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Add Custom Anesthesia Drug</DialogTitle>
              <DialogDescription>
                Fill out the fields to add a new drug to your local and cloud database.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateDrug} className="space-y-4 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="create-name">Drug Generic Name</Label>
                  <Input 
                    id="create-name"
                    required
                    placeholder="e.g. Dexmedetomidine"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="create-category">Category / Drug Class</Label>
                  <select
                    id="create-category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {CATEGORIES.filter(c => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Onset */}
                <div className="space-y-1.5">
                  <Label htmlFor="create-onset">Onset of Action</Label>
                  <Input 
                    id="create-onset"
                    required
                    placeholder="e.g. 1 - 2 minutes"
                    value={formData.onset_of_action}
                    onChange={(e) => setFormData(prev => ({ ...prev, onset_of_action: e.target.value }))}
                  />
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <Label htmlFor="create-duration">Duration of Action</Label>
                  <Input 
                    id="create-duration"
                    required
                    placeholder="e.g. 10 - 20 minutes"
                    value={formData.duration_of_action}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_of_action: e.target.value }))}
                  />
                </div>

                {/* Induction Dose */}
                <div className="space-y-1.5">
                  <Label htmlFor="create-ind-dose">Induction Dose</Label>
                  <Input 
                    id="create-ind-dose"
                    required
                    placeholder="e.g. 1.0 mcg/kg IV over 10 min"
                    value={formData.induction_dose}
                    onChange={(e) => setFormData(prev => ({ ...prev, induction_dose: e.target.value }))}
                  />
                </div>

                {/* Maintenance Dose */}
                <div className="space-y-1.5">
                  <Label htmlFor="create-maint-dose">Maintenance Dose</Label>
                  <Input 
                    id="create-maint-dose"
                    required
                    placeholder="e.g. 0.2 - 0.7 mcg/kg/hr IV"
                    value={formData.maintenance_dose}
                    onChange={(e) => setFormData(prev => ({ ...prev, maintenance_dose: e.target.value }))}
                  />
                </div>
              </div>

              {/* Mechanism of Action */}
              <div className="space-y-1.5">
                <Label htmlFor="create-mechanism">Mechanism of Action</Label>
                <Textarea 
                  id="create-mechanism"
                  required
                  rows={2}
                  placeholder="Explain receptor binding and pharmacological action..."
                  value={formData.mechanism_of_action}
                  onChange={(e) => setFormData(prev => ({ ...prev, mechanism_of_action: e.target.value }))}
                />
              </div>

              {/* Pharmacokinetics */}
              <div className="space-y-1.5">
                <Label htmlFor="create-pk">Pharmacokinetics (PK)</Label>
                <Textarea 
                  id="create-pk"
                  required
                  rows={2}
                  placeholder="Metabolism, half-life, clearance, protein binding..."
                  value={formData.pharmacokinetics}
                  onChange={(e) => setFormData(prev => ({ ...prev, pharmacokinetics: e.target.value }))}
                />
              </div>

              {/* Pharmacodynamics */}
              <div className="space-y-1.5">
                <Label htmlFor="create-pd">Pharmacodynamics (PD)</Label>
                <Textarea 
                  id="create-pd"
                  required
                  rows={2}
                  placeholder="Cardiovascular, Respiratory, and CNS physiological responses..."
                  value={formData.pharmacodynamics}
                  onChange={(e) => setFormData(prev => ({ ...prev, pharmacodynamics: e.target.value }))}
                />
              </div>

              {/* Side Effects */}
              <div className="space-y-1.5">
                <Label htmlFor="create-side">Side Effects</Label>
                <Textarea 
                  id="create-side"
                  required
                  rows={2}
                  placeholder="Common and dangerous adverse reactions..."
                  value={formData.side_effects}
                  onChange={(e) => setFormData(prev => ({ ...prev, side_effects: e.target.value }))}
                />
              </div>

              {/* Clinical Considerations */}
              <div className="space-y-1.5">
                <Label htmlFor="create-clinical">Clinical Considerations & Special Warnings</Label>
                <Textarea 
                  id="create-clinical"
                  required
                  rows={2}
                  placeholder="Practical bedside advice, monitoring criteria, preparation details..."
                  value={formData.clinical_considerations}
                  onChange={(e) => setFormData(prev => ({ ...prev, clinical_considerations: e.target.value }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Contraindications */}
                <div className="space-y-1.5">
                  <Label htmlFor="create-contra">Contraindications (Optional)</Label>
                  <Input 
                    id="create-contra"
                    placeholder="e.g. Severe bradycardia, heart blocks"
                    value={formData.contraindications}
                    onChange={(e) => setFormData(prev => ({ ...prev, contraindications: e.target.value }))}
                  />
                </div>

                {/* Infusion Guidelines */}
                <div className="space-y-1.5">
                  <Label htmlFor="create-inf-guide">Infusion Guidelines (Optional)</Label>
                  <Input 
                    id="create-inf-guide"
                    placeholder="e.g. Run in NS; avoid mixing with other drugs"
                    value={formData.infusion_guidelines}
                    onChange={(e) => setFormData(prev => ({ ...prev, infusion_guidelines: e.target.value }))}
                  />
                </div>
              </div>

              {/* High Alert Switch */}
              <div className="flex items-center justify-between border border-border p-3 rounded-lg bg-muted/20">
                <div className="space-y-0.5">
                  <Label htmlFor="create-high-alert" className="font-semibold text-sm text-foreground flex items-center gap-1.5 text-red-500">
                    <ShieldAlert className="h-4 w-4" /> High-Alert Medication
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Flag this medication as high-alert (requires extra clinical validation and highlighted warnings).
                  </p>
                </div>
                <Switch 
                  id="create-high-alert"
                  checked={formData.is_high_alert}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_high_alert: checked }))}
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? "Adding..." : "Add Drug"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG: EDIT CUSTOM DRUG */}
        <Dialog open={isEditOpen} onOpenChange={(open) => !open && setIsEditOpen(false)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Edit Custom Drug</DialogTitle>
              <DialogDescription>
                Modify the details of your custom drug entry.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateDrug} className="space-y-4 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name">Drug Generic Name</Label>
                  <Input 
                    id="edit-name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-category">Category / Drug Class</Label>
                  <select
                    id="edit-category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {CATEGORIES.filter(c => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Onset */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-onset">Onset of Action</Label>
                  <Input 
                    id="edit-onset"
                    required
                    value={formData.onset_of_action}
                    onChange={(e) => setFormData(prev => ({ ...prev, onset_of_action: e.target.value }))}
                  />
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-duration">Duration of Action</Label>
                  <Input 
                    id="edit-duration"
                    required
                    value={formData.duration_of_action}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_of_action: e.target.value }))}
                  />
                </div>

                {/* Induction Dose */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-ind-dose">Induction Dose</Label>
                  <Input 
                    id="edit-ind-dose"
                    required
                    value={formData.induction_dose}
                    onChange={(e) => setFormData(prev => ({ ...prev, induction_dose: e.target.value }))}
                  />
                </div>

                {/* Maintenance Dose */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-maint-dose">Maintenance Dose</Label>
                  <Input 
                    id="edit-maint-dose"
                    required
                    value={formData.maintenance_dose}
                    onChange={(e) => setFormData(prev => ({ ...prev, maintenance_dose: e.target.value }))}
                  />
                </div>
              </div>

              {/* Mechanism of Action */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-mechanism">Mechanism of Action</Label>
                <Textarea 
                  id="edit-mechanism"
                  required
                  rows={2}
                  value={formData.mechanism_of_action}
                  onChange={(e) => setFormData(prev => ({ ...prev, mechanism_of_action: e.target.value }))}
                />
              </div>

              {/* Pharmacokinetics */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-pk">Pharmacokinetics (PK)</Label>
                <Textarea 
                  id="edit-pk"
                  required
                  rows={2}
                  value={formData.pharmacokinetics}
                  onChange={(e) => setFormData(prev => ({ ...prev, pharmacokinetics: e.target.value }))}
                />
              </div>

              {/* Pharmacodynamics */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-pd">Pharmacodynamics (PD)</Label>
                <Textarea 
                  id="edit-pd"
                  required
                  rows={2}
                  value={formData.pharmacodynamics}
                  onChange={(e) => setFormData(prev => ({ ...prev, pharmacodynamics: e.target.value }))}
                />
              </div>

              {/* Side Effects */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-side">Side Effects</Label>
                <Textarea 
                  id="edit-side"
                  required
                  rows={2}
                  value={formData.side_effects}
                  onChange={(e) => setFormData(prev => ({ ...prev, side_effects: e.target.value }))}
                />
              </div>

              {/* Clinical Considerations */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-clinical">Clinical Considerations & Special Warnings</Label>
                <Textarea 
                  id="edit-clinical"
                  required
                  rows={2}
                  value={formData.clinical_considerations}
                  onChange={(e) => setFormData(prev => ({ ...prev, clinical_considerations: e.target.value }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Contraindications */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-contra">Contraindications (Optional)</Label>
                  <Input 
                    id="edit-contra"
                    value={formData.contraindications}
                    onChange={(e) => setFormData(prev => ({ ...prev, contraindications: e.target.value }))}
                  />
                </div>

                {/* Infusion Guidelines */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-inf-guide">Infusion Guidelines (Optional)</Label>
                  <Input 
                    id="edit-inf-guide"
                    value={formData.infusion_guidelines}
                    onChange={(e) => setFormData(prev => ({ ...prev, infusion_guidelines: e.target.value }))}
                  />
                </div>
              </div>

              {/* High Alert Switch */}
              <div className="flex items-center justify-between border border-border p-3 rounded-lg bg-muted/20">
                <div className="space-y-0.5">
                  <Label htmlFor="edit-high-alert" className="font-semibold text-sm text-foreground flex items-center gap-1.5 text-red-500">
                    <ShieldAlert className="h-4 w-4" /> High-Alert Medication
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Flag this medication as high-alert (requires extra clinical validation and highlighted warnings).
                  </p>
                </div>
                <Switch 
                  id="edit-high-alert"
                  checked={formData.is_high_alert}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_high_alert: checked }))}
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </AppShell>
  )
}

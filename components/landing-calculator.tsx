"use client"

import { useState, useMemo } from "react"
import { Pill, Activity, Info, AlertTriangle, Sparkles, Sliders } from "lucide-react"

// Types
type BolusDrug = {
  name: string
  class: string
  defaultDose: number // mg/kg or mcg/kg
  unit: "mg/kg" | "mcg/kg"
  minDose: number
  maxDose: number
  concentration: number // mg/ml or mcg/ml
  concentrationUnit: "mg/ml" | "mcg/ml"
  clinicalTip: string
}

type InfusionDrug = {
  name: string
  class: string
  defaultDoseRate: number // mcg/kg/min or mcg/kg/hr
  unit: "mcg/kg/min" | "mcg/kg/hr"
  minRate: number
  maxRate: number
  defaultSyringeAmount: number // mg or mcg
  syringeAmountUnit: "mg" | "mcg"
  defaultSyringeVolume: number // ml
  clinicalTip: string
}

// Data Definition
const BOLUS_DRUGS: BolusDrug[] = [
  {
    name: "Propofol",
    class: "Induction Agent",
    defaultDose: 2.0,
    unit: "mg/kg",
    minDose: 1.5,
    maxDose: 2.5,
    concentration: 10,
    concentrationUnit: "mg/ml",
    clinicalTip: "Can cause significant vasodilation and hypotension. Reduce dose in elderly or compromised cardiac states."
  },
  {
    name: "Fentanyl",
    class: "Opioid Analgesic",
    defaultDose: 2.0,
    unit: "mcg/kg",
    minDose: 1.0,
    maxDose: 3.0,
    concentration: 50,
    concentrationUnit: "mcg/ml",
    clinicalTip: "Administer slowly to avoid chest wall rigidity. Synergistic with propofol and midazolam."
  },
  {
    name: "Succinylcholine",
    class: "Depolarizing NMB",
    defaultDose: 1.5,
    unit: "mg/kg",
    minDose: 1.0,
    maxDose: 2.0,
    concentration: 20,
    concentrationUnit: "mg/ml",
    clinicalTip: "Fast onset (30-60s), short duration (5-10m). Trigger for malignant hyperthermia. Contraindicated in hyperkalemic states."
  },
  {
    name: "Ketamine",
    class: "Dissociative Anesthetic",
    defaultDose: 1.5,
    unit: "mg/kg",
    minDose: 1.0,
    maxDose: 2.5,
    concentration: 50,
    concentrationUnit: "mg/ml",
    clinicalTip: "Maintains respiration and sympathetic tone. Good for hemodynamically unstable patients or bronchospasm."
  },
  {
    name: "Rocuronium",
    class: "Non-depolarizing NMB",
    defaultDose: 1.0,
    unit: "mg/kg",
    minDose: 0.6,
    maxDose: 1.2,
    concentration: 10,
    concentrationUnit: "mg/ml",
    clinicalTip: "Sugammadex (2-4 mg/kg) can be used for rapid reversal. Standard intubating dose is 0.6 - 1.2 mg/kg."
  },
  {
    name: "Midazolam",
    class: "Benzodiazepine Sedative",
    defaultDose: 0.1,
    unit: "mg/kg",
    minDose: 0.05,
    maxDose: 0.2,
    concentration: 1,
    concentrationUnit: "mg/ml",
    clinicalTip: "Antidote is flumazenil. Often used for pre-medication or pediatric oral/nasal sedation."
  }
]

const INFUSION_DRUGS: InfusionDrug[] = [
  {
    name: "Norepinephrine",
    class: "Vasopressor",
    defaultDoseRate: 0.1,
    unit: "mcg/kg/min",
    minRate: 0.01,
    maxRate: 0.5,
    defaultSyringeAmount: 4, // 4 mg
    syringeAmountUnit: "mg",
    defaultSyringeVolume: 50, // 50 ml
    clinicalTip: "First-line vasopressor for septic shock. Administer via central line if possible to avoid tissue extravasation."
  },
  {
    name: "Propofol (TIVA)",
    class: "Anesthetic Infusion",
    defaultDoseRate: 100,
    unit: "mcg/kg/min",
    minRate: 25,
    maxRate: 200,
    defaultSyringeAmount: 500, // 500 mg
    syringeAmountUnit: "mg",
    defaultSyringeVolume: 50, // 50 ml
    clinicalTip: "Used for Total Intravenous Anesthesia. Monitor for Propofol Infusion Syndrome (PRIS) in long-term ICU infusions."
  },
  {
    name: "Dexmedetomidine",
    class: "Alpha-2 Agonist Sedative",
    defaultDoseRate: 0.4,
    unit: "mcg/kg/hr",
    minRate: 0.2,
    maxRate: 1.0,
    defaultSyringeAmount: 200, // 200 mcg
    syringeAmountUnit: "mcg",
    defaultSyringeVolume: 50, // 50 ml
    clinicalTip: "Provides cooperative sedation without respiratory depression. Side effects include bradycardia and hypotension."
  }
]

export function LandingCalculator() {
  const [activeTab, setActiveTab] = useState<"bolus" | "infusion">("bolus")
  const [weight, setWeight] = useState<number>(70)
  
  // Bolus states
  const [selectedBolusIdx, setSelectedBolusIdx] = useState<number>(0)
  const selectedBolus = BOLUS_DRUGS[selectedBolusIdx]
  const [customBolusDose, setCustomBolusDose] = useState<number>(selectedBolus.defaultDose)

  // Reset custom dose when drug changes
  const handleBolusDrugChange = (idx: number) => {
    setSelectedBolusIdx(idx)
    setCustomBolusDose(BOLUS_DRUGS[idx].defaultDose)
  }

  // Infusion states
  const [selectedInfIdx, setSelectedInfIdx] = useState<number>(0)
  const selectedInf = INFUSION_DRUGS[selectedInfIdx]
  const [customRate, setCustomRate] = useState<number>(selectedInf.defaultDoseRate)
  const [syringeAmount, setSyringeAmount] = useState<number>(selectedInf.defaultSyringeAmount)
  const [syringeVolume, setSyringeVolume] = useState<number>(selectedInf.defaultSyringeVolume)

  // Reset infusion inputs when drug changes
  const handleInfusionDrugChange = (idx: number) => {
    setSelectedInfIdx(idx)
    const drug = INFUSION_DRUGS[idx]
    setCustomRate(drug.defaultDoseRate)
    setSyringeAmount(drug.defaultSyringeAmount)
    setSyringeVolume(drug.defaultSyringeVolume)
  }

  // Weight presets handler
  const handleWeightPreset = (w: number) => {
    setWeight(w)
  }

  // Bolus Dosing Computations
  const bolusResults = useMemo(() => {
    const totalDose = weight * customBolusDose
    // Propofol & Ketamine & others are in mg, Fentanyl is in mcg
    const totalDoseFormatted = selectedBolus.unit === "mg/kg" 
      ? `${totalDose.toFixed(1)} mg` 
      : `${totalDose.toFixed(1)} mcg`

    const volume = selectedBolus.unit === "mcg/kg" && selectedBolus.concentrationUnit === "mcg/ml"
      ? totalDose / selectedBolus.concentration
      : totalDose / selectedBolus.concentration // Standard mg / mg/ml or mcg / mcg/ml

    return {
      totalDose,
      totalDoseFormatted,
      volume: volume.toFixed(2)
    }
  }, [weight, customBolusDose, selectedBolus])

  // Infusion Computations
  const infusionResults = useMemo(() => {
    // Determine concentration in mcg/ml
    let concentrationMcgMl = 0
    if (selectedInf.syringeAmountUnit === "mg") {
      // 1 mg = 1000 mcg
      concentrationMcgMl = (syringeAmount * 1000) / syringeVolume
    } else {
      concentrationMcgMl = syringeAmount / syringeVolume
    }

    // Rate calculations
    let flowRateMlHr = 0
    let stepBreakdown = ""

    if (selectedInf.unit === "mcg/kg/min") {
      // ml/hr = (mcg/kg/min * weight * 60) / concentrationMcgMl
      flowRateMlHr = (customRate * weight * 60) / concentrationMcgMl
      stepBreakdown = `
        1. Concentration = (${syringeAmount} mg × 1000) / ${syringeVolume} ml = ${concentrationMcgMl.toFixed(1)} mcg/ml
        2. Formula = (Rate × Weight × 60) / Concentration
        3. Calculation = (${customRate} × ${weight} kg × 60) / ${concentrationMcgMl.toFixed(1)}
        4. Result = ${(customRate * weight * 60).toFixed(0)} mcg/hr / ${concentrationMcgMl.toFixed(1)} = ${flowRateMlHr.toFixed(2)} ml/hr
      `.trim()
    } else if (selectedInf.unit === "mcg/kg/hr") {
      // ml/hr = (mcg/kg/hr * weight) / concentrationMcgMl
      flowRateMlHr = (customRate * weight) / concentrationMcgMl
      stepBreakdown = `
        1. Concentration = (${syringeAmount} mcg) / ${syringeVolume} ml = ${concentrationMcgMl.toFixed(1)} mcg/ml
        2. Formula = (Rate × Weight) / Concentration
        3. Calculation = (${customRate} × ${weight} kg) / ${concentrationMcgMl.toFixed(1)}
        4. Result = ${(customRate * weight).toFixed(1)} mcg/hr / ${concentrationMcgMl.toFixed(1)} = ${flowRateMlHr.toFixed(2)} ml/hr
      `.trim()
    }

    return {
      concentration: concentrationMcgMl.toFixed(1),
      flowRate: flowRateMlHr.toFixed(2),
      stepBreakdown
    }
  }, [weight, customRate, syringeAmount, syringeVolume, selectedInf])

  const isPediatric = weight < 30

  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-border/80 bg-card/45 backdrop-blur-md shadow-2xl p-5 flex flex-col gap-4 text-left transition-all duration-300">
      
      {/* Weight Selector Header */}
      <div className="flex flex-col gap-2 border-b border-border/60 pb-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-primary" /> Patient Weight
          </label>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-foreground">{weight}</span>
            <span className="text-xs font-bold text-muted-foreground">kg</span>
          </div>
        </div>
        
        {/* Sliders & Presets */}
        <div className="flex flex-col gap-3">
          <input
            type="range"
            min="1"
            max="150"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
          />
          <div className="flex flex-wrap gap-1.5 justify-between">
            <div className="flex gap-1.5">
              <button onClick={() => handleWeightPreset(5)} className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${weight === 5 ? 'bg-primary/20 border-primary text-primary' : 'bg-muted/10 border-border hover:bg-muted/30 text-muted-foreground'}`}>
                5kg (Peds)
              </button>
              <button onClick={() => handleWeightPreset(15)} className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${weight === 15 ? 'bg-primary/20 border-primary text-primary' : 'bg-muted/10 border-border hover:bg-muted/30 text-muted-foreground'}`}>
                15kg
              </button>
              <button onClick={() => handleWeightPreset(25)} className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${weight === 25 ? 'bg-primary/20 border-primary text-primary' : 'bg-muted/10 border-border hover:bg-muted/30 text-muted-foreground'}`}>
                25kg
              </button>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => handleWeightPreset(50)} className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${weight === 50 ? 'bg-primary/20 border-primary text-primary' : 'bg-muted/10 border-border hover:bg-muted/30 text-muted-foreground'}`}>
                50kg (Adult)
              </button>
              <button onClick={() => handleWeightPreset(70)} className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${weight === 70 ? 'bg-primary/20 border-primary text-primary' : 'bg-muted/10 border-border hover:bg-muted/30 text-muted-foreground'}`}>
                70kg
              </button>
              <button onClick={() => handleWeightPreset(90)} className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${weight === 90 ? 'bg-primary/20 border-primary text-primary' : 'bg-muted/10 border-border hover:bg-muted/30 text-muted-foreground'}`}>
                90kg
              </button>
            </div>
          </div>
        </div>

        {/* Pediatric Alert Banner */}
        {isPediatric && (
          <div className="flex gap-2 items-center bg-amber-500/10 border border-amber-500/20 text-[10px] rounded-lg p-2 mt-1 text-amber-600 dark:text-amber-400 font-semibold">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>Pediatric dosing active. Double check airway equipment sizes (ETT/LMA).</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 p-1 bg-muted/35 rounded-xl border border-border/40">
        <button
          onClick={() => setActiveTab("bolus")}
          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "bolus" ? "bg-background text-foreground shadow-xs border border-border/30" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Pill className="h-3.5 w-3.5" /> Bolus Dose
        </button>
        <button
          onClick={() => setActiveTab("infusion")}
          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "infusion" ? "bg-background text-foreground shadow-xs border border-border/30" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Activity className="h-3.5 w-3.5" /> Infusion Pump
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "bolus" ? (
        <div className="flex flex-col gap-4 flex-1 justify-between">
          
          {/* Drug Selection Chips */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Select Induction/Bolus Drug
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {BOLUS_DRUGS.map((drug, idx) => (
                <button
                  key={drug.name}
                  onClick={() => handleBolusDrugChange(idx)}
                  className={`py-2 px-1 text-[11px] font-extrabold rounded-lg border transition-all text-center ${selectedBolusIdx === idx ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/10 border-border/60 hover:bg-muted/30 text-foreground/80'}`}
                >
                  {drug.name}
                </button>
              ))}
            </div>
          </div>

          {/* Dose slider */}
          <div className="flex flex-col gap-1.5 bg-muted/10 border border-border/40 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span>Target Dose:</span>
              <span className="font-extrabold text-primary">
                {customBolusDose.toFixed(2)} {selectedBolus.unit.split("/")[0]} / kg
              </span>
            </div>
            <input
              type="range"
              min={selectedBolus.minDose}
              max={selectedBolus.maxDose}
              step="0.05"
              value={customBolusDose}
              onChange={(e) => setCustomBolusDose(Number(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-md appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[9px] text-muted-foreground font-semibold">
              <span>Min: {selectedBolus.minDose}</span>
              <span>Max: {selectedBolus.maxDose}</span>
            </div>
          </div>

          {/* Bolus Output Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Calculated Dose</span>
              <span className="text-xl font-black text-primary mt-1">{bolusResults.totalDoseFormatted}</span>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                Volume to Draw <span className="text-[9px] lowercase text-muted-foreground">({selectedBolus.concentration} {selectedBolus.concentrationUnit})</span>
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{bolusResults.volume} ml</span>
            </div>
          </div>

          {/* Clinical Tip */}
          <div className="flex gap-2 items-start bg-muted/20 border border-border/40 rounded-xl p-3 text-[11px] text-muted-foreground leading-normal">
            <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <div>
              <span className="font-bold text-foreground block mb-0.5">{selectedBolus.class} Clinical Note</span>
              {selectedBolus.clinicalTip}
            </div>
          </div>

        </div>
      ) : (
        <div className="flex flex-col gap-4 flex-1 justify-between">
          
          {/* Infusion Drug Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Select Infusion Vasopressor/Sedative
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {INFUSION_DRUGS.map((drug, idx) => (
                <button
                  key={drug.name}
                  onClick={() => handleInfusionDrugChange(idx)}
                  className={`py-2 px-1 text-[11px] font-extrabold rounded-lg border transition-all text-center ${selectedInfIdx === idx ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/10 border-border/60 hover:bg-muted/30 text-foreground/80'}`}
                >
                  {drug.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Concentration Configuration Inputs */}
          <div className="grid grid-cols-2 gap-3 bg-muted/10 border border-border/40 rounded-xl p-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted-foreground">Syringe Drug Amount</label>
              <div className="flex items-center gap-1.5 mt-0.5">
                <input
                  type="number"
                  value={syringeAmount}
                  onChange={(e) => setSyringeAmount(Number(e.target.value))}
                  className="bg-background border border-border rounded-lg px-2 py-1 text-xs font-bold w-full text-foreground"
                />
                <span className="text-xs font-bold text-muted-foreground">{selectedInf.syringeAmountUnit}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted-foreground">Syringe Liquid Vol.</label>
              <div className="flex items-center gap-1.5 mt-0.5">
                <input
                  type="number"
                  value={syringeVolume}
                  onChange={(e) => setSyringeVolume(Number(e.target.value))}
                  className="bg-background border border-border rounded-lg px-2 py-1 text-xs font-bold w-full text-foreground"
                />
                <span className="text-xs font-bold text-muted-foreground">ml</span>
              </div>
            </div>
          </div>

          {/* Infusion Rate slider */}
          <div className="flex flex-col gap-1.5 bg-muted/10 border border-border/40 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span>Target Dose Rate:</span>
              <span className="font-extrabold text-primary">
                {customRate.toFixed(selectedInf.unit === "mcg/kg/min" ? 2 : 1)} {selectedInf.unit}
              </span>
            </div>
            <input
              type="range"
              min={selectedInf.minRate}
              max={selectedInf.maxRate}
              step={selectedInf.unit === "mcg/kg/min" ? "0.01" : "0.05"}
              value={customRate}
              onChange={(e) => setCustomRate(Number(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-md appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[9px] text-muted-foreground font-semibold">
              <span>Min: {selectedInf.minRate}</span>
              <span>Max: {selectedInf.maxRate}</span>
            </div>
          </div>

          {/* Flow Rate Output Card */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Infusion Flow Rate</span>
              <span className="text-[9px] text-muted-foreground block mt-0.5">Syringe concentration: {infusionResults.concentration} mcg/ml</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block">{infusionResults.flowRate} ml/hr</span>
            </div>
          </div>

          {/* Formula step by step */}
          <div className="bg-muted/15 border border-border/40 rounded-xl p-3 text-[10px] font-mono text-muted-foreground leading-normal whitespace-pre-line">
            <div className="font-bold text-foreground text-[11px] mb-1 font-sans flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Calculation Steps
            </div>
            {infusionResults.stepBreakdown}
          </div>

        </div>
      )}

      {/* Safety Disclaimer Footer */}
      <div className="border-t border-border/50 pt-3 flex gap-2 items-start text-[9px] text-muted-foreground leading-relaxed">
        <Info className="h-3 w-3 shrink-0 text-muted-foreground mt-0.5" />
        <span>Disclaimer: All dosage computations are for simulation and academic training only. Verify clinical dosages locally before administering any drugs to live patients.</span>
      </div>
      
    </div>
  )
}

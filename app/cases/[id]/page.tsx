"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { getCase } from "@/lib/storage"
import type { StoredCase } from "@/lib/schema"
import { ArrowLeft, FileText } from "lucide-react"

type Section = {
  title: string
  rows: [string, React.ReactNode][]
}

function fmtInv(inv: { enabled: boolean; result: string } | undefined) {
  if (!inv?.enabled) return "—"
  return inv.result?.trim() ? inv.result : "Performed"
}

function val(v: unknown): React.ReactNode {
  if (v === undefined || v === null || v === "") return <span className="text-muted-foreground">—</span>
  return String(v)
}

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [c, setC] = useState<StoredCase | null | undefined>(undefined)

  useEffect(() => {
    if (!params?.id) return
    let active = true
    getCase(params.id)
      .then((row) => {
        if (active) setC(row)
      })
      .catch(() => {
        if (active) setC(null)
      })
    return () => {
      active = false
    }
  }, [params?.id])

  if (c === undefined) {
    return (
      <AppShell>
        <Card className="p-8 text-center text-muted-foreground">Loading…</Card>
      </AppShell>
    )
  }

  if (c === null) {
    return (
      <AppShell>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Case not found</EmptyTitle>
            <EmptyDescription>This case may have been deleted.</EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => router.replace("/dashboard")}>Back to dashboard</Button>
        </Empty>
      </AppShell>
    )
  }

  const sections: Section[] = [
    {
      title: "General & Patient",
      rows: [
        ["Procedure Date", val(c.procedure_date)],
        ["Patient", val(c.patient_name)],
        ["Sex", val(c.sex)],
        ["Age", val(c.age)],
        ["MRN", val(c.medical_record_number)],
        ["Room", val(c.room)],
        ["Weight (kg)", val(c.weight_kg)],
        ["Height (cm)", val(c.height_cm)],
        ["BMI", val(c.bmi)],
      ],
    },
    {
      title: "Clinical Assessment",
      rows: [
        ["Diagnosis", val(c.diagnosis)],
        ["Procedure / Intervention", val(c.procedure_intervention)],
        ["Allergy", val(c.allergy)],
        ["Medication", val(c.medication)],
        ["Past Illness", val(c.past_illness)],
        ["Last Meal", val(c.last_meal)],
        ["Event", val(c.event)],
      ],
    },
    {
      title: "Objective (B1–B6)",
      rows: [
        ["B1 Breathing/Airway", val(c.b1_breathing)],
        ["B2 Blood/Cardiovascular", val(c.b2_blood)],
        ["B3 Brain/Neurological", val(c.b3_brain)],
        ["B4 Bladder/Urine", val(c.b4_bladder)],
        ["B5 Bowel/Abdomen", val(c.b5_bowel)],
        ["B6 Body Temp/Skin", val(c.b6_body_temp)],
        ["Others", val(c.others)],
      ],
    },
    {
      title: "Investigations & Planning",
      rows: [
        ["Laboratory", fmtInv(c.inv_laboratory)],
        ["X-Ray", fmtInv(c.inv_xray)],
        ["ECG", fmtInv(c.inv_ecg)],
        ["CT Scan", fmtInv(c.inv_ct)],
        ["MRI", fmtInv(c.inv_mri)],
        [
          "Other",
          c.inv_other_label
            ? `${c.inv_other_label}${c.inv_other_result ? " — " + c.inv_other_result : ""}`
            : "—",
        ],
        ["Assessment", val(c.assessment)],
        ["Planning", val(c.planning)],
      ],
    },
    {
      title: "Anesthesia Management",
      rows: [
        ["Management", val(c.anesthesia_management)],
        ["Pre-induction", val(c.regimen_pre_induction)],
        ["Induction", val(c.regimen_induction)],
        ["Maintenance", val(c.regimen_maintenance)],
        ["Analgesia Pre-Op", val(c.analgesia_pre_op)],
        ["Analgesia Intra-Op", val(c.analgesia_intra_op)],
        ["Analgesia Post-Op", val(c.analgesia_post_op)],
      ],
    },
    {
      title: "Intra-Operative",
      rows: [
        ["Post-Induction Side Effects", val(c.post_induction_side_effects)],
        ["Ventilator Settings", val(c.ventilator_settings)],
        ["Hemodynamics", val(c.hemodynamics_intra)],
        ["Duration of Surgery", val(c.duration_surgery)],
        ["Bleeding", val(c.bleeding)],
        ["Transfusion", val(c.transfusion)],
        ["Urine Output", val(c.urine_output)],
        ["Fluid Balance", val(c.fluid_balance)],
      ],
    },
    {
      title: "Post-Operative",
      rows: [
        ["Post-Op Room", val(c.post_op_room)],
        ["Hemodynamics", val(c.hemodynamics_post)],
        ["Laboratory Results", val(c.lab_results_post)],
      ],
    },
  ]

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Button asChild variant="ghost" size="sm" className="w-fit gap-1 px-2">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {c.patient_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              MRN {c.medical_record_number} · {c.sex} · {c.age}y · Saved{" "}
              {new Date(c.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((s) => (
            <Card key={s.title} className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">{s.title}</h2>
              </div>
              <dl className="flex flex-col divide-y divide-border">
                {s.rows.map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <dt className="text-xs text-muted-foreground sm:min-w-32">{k}</dt>
                    <dd className="text-sm text-foreground sm:text-right sm:max-w-[65%]">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

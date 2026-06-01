"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { getCase, getSession, updateCase } from "@/lib/storage"
import type { StoredCase } from "@/lib/schema"
import { ArrowLeft, FileText, Globe, Lock, Loader2 } from "lucide-react"

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

function isLongValue(v: React.ReactNode): boolean {
  if (typeof v === "string") return v.length > 60 || v.includes("\n")
  return false
}

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [c, setC] = useState<StoredCase | null | undefined>(undefined)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [sharingLoading, setSharingLoading] = useState(false)

  useEffect(() => {
    getSession().then((session) => {
      if (session) setCurrentUserId(session.userId)
    })
  }, [])

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

  async function handleToggleSharing() {
    if (!c || sharingLoading) return
    setSharingLoading(true)
    try {
      const currentShared = c.is_shared !== false
      const nextSharedState = !currentShared
      const updated = await updateCase(c.id, { is_shared: nextSharedState })
      setC(updated)
      toast.success(nextSharedState ? "Case is now shared for research" : "Case is now private")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update sharing settings.")
    } finally {
      setSharingLoading(false)
    }
  }

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

  const isOwner = currentUserId !== null && c !== null && c !== undefined && c.user_id === currentUserId
  const isShared = c ? c.is_shared !== false : true

  const sections: Section[] = [
    {
      title: "General & Patient",
      rows: [
        ["Procedure Date", val(c.procedure_date)],
        ["Patient", val(isOwner ? c.patient_name : "Patient [Anonymized]")],
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

  const backHref = isOwner ? "/dashboard" : "/dashboard/research"

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <Button asChild variant="ghost" size="sm" className="w-fit gap-1 px-2">
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            </Button>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  {isOwner ? c.patient_name : "Patient [Anonymized]"}
                </h1>
                {!isOwner && (
                  <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/20 font-bold text-xs">
                    Research Case
                  </Badge>
                )}
                {isOwner && (
                  <Badge variant="outline" className={`text-xs font-semibold ${isShared ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"}`}>
                    {isShared ? "Shared for Research" : "Private Case"}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                MRN {c.medical_record_number} · {c.sex} · {c.age}y · Logged{" "}
                {new Date(c.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Share option toggle for the owner */}
          {isOwner && (
            <Button
              variant={isShared ? "outline" : "default"}
              size="sm"
              disabled={sharingLoading}
              onClick={handleToggleSharing}
              className="gap-2 shrink-0 font-semibold"
            >
              {sharingLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isShared ? (
                <>
                  <Lock className="h-4 w-4" /> Make Case Private
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4" /> Share for Research
                </>
              )}
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((s) => (
            <Card key={s.title} className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">{s.title}</h2>
              </div>
              <dl className="flex flex-col divide-y divide-border">
                {s.rows.map(([k, v]) => {
                  const stacked = isLongValue(v)
                  return (
                    <div
                      key={k}
                      className={
                        stacked
                          ? "flex flex-col gap-1 py-3 first:pt-0 last:pb-0"
                          : "flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                      }
                    >
                      <dt
                        className={
                          stacked
                            ? "text-xs font-medium uppercase tracking-wide text-muted-foreground"
                            : "text-xs text-muted-foreground sm:min-w-32"
                        }
                      >
                        {k}
                      </dt>
                      <dd
                        className={
                          stacked
                            ? "whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground"
                            : "text-sm text-foreground sm:max-w-[60%] sm:text-right"
                        }
                      >
                        {v}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

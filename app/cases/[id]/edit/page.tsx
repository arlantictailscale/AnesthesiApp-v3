"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { CaseWizard } from "@/components/wizard/case-wizard"
import { getCase, getSession } from "@/lib/storage"
import type { StoredCase } from "@/lib/schema"
import { Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function EditCasePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [c, setC] = useState<StoredCase | null | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params?.id) return
    let active = true

    async function loadData() {
      try {
        const session = await getSession()
        if (!session) {
          toast.error("You must be signed in to edit this case.")
          router.replace("/login")
          return
        }

        const caseData = await getCase(params.id)
        if (!active) return

        if (!caseData) {
          setC(null)
          return
        }

        if (caseData.user_id !== session.userId) {
          toast.error("You are not authorized to edit this case.")
          router.replace(`/cases/${params.id}`)
          return
        }

        setC(caseData)
      } catch (err) {
        console.error("Failed to load case for editing:", err)
        toast.error("Failed to load case data.")
        if (active) setC(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [params?.id, router])

  if (loading || c === undefined) {
    return (
      <AppShell>
        <div className="flex h-60 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">Loading case details…</p>
          </div>
        </div>
      </AppShell>
    )
  }

  if (c === null) {
    return (
      <AppShell>
        <Card className="p-8 text-center max-w-md mx-auto mt-12 border-dashed">
          <h2 className="text-lg font-bold text-foreground mb-2">Case not found</h2>
          <p className="text-sm text-muted-foreground mb-6">
            The case you are trying to edit does not exist or has been deleted.
          </p>
          <Button onClick={() => router.replace("/cases")}>Back to dashboard</Button>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <CaseWizard initialData={c} caseId={c.id} />
    </AppShell>
  )
}

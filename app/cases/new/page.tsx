"use client"

import { AppShell } from "@/components/app-shell"
import { CaseWizard } from "@/components/wizard/case-wizard"

export default function NewCasePage() {
  return (
    <AppShell>
      <div className="mb-4 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">New anesthesia case</h1>
        <p className="text-sm text-muted-foreground">
          Complete each step. Your progress is saved as a draft automatically when you click
          &quot;Save draft.&quot;
        </p>
      </div>
      <CaseWizard />
    </AppShell>
  )
}

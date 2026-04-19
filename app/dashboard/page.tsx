"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { deleteCase, getSession, listCases } from "@/lib/storage"
import type { StoredCase } from "@/lib/schema"
import { ClipboardList, Plus, Trash2, Calendar, User as UserIcon, MapPin } from "lucide-react"

export default function DashboardPage() {
  const [cases, setCases] = useState<StoredCase[] | null>(null)

  function load() {
    const s = getSession()
    if (!s) return
    setCases(listCases(s.userId))
  }

  useEffect(() => {
    load()
  }, [])

  function handleDelete(id: string) {
    if (!confirm("Delete this case? This cannot be undone.")) return
    deleteCase(id)
    toast.success("Case deleted")
    load()
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">My cases</h1>
            <p className="text-sm text-muted-foreground">
              All anesthesia cases you&apos;ve logged.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/cases/new">
              <Plus className="h-4 w-4" />
              New case
            </Link>
          </Button>
        </div>

        {cases === null ? (
          <Card className="p-8 text-center text-muted-foreground">Loading…</Card>
        ) : cases.length === 0 ? (
          <Empty className="border border-dashed bg-card">
            <EmptyHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ClipboardList className="h-6 w-6" />
              </div>
              <EmptyTitle>No cases yet</EmptyTitle>
              <EmptyDescription>
                Log your first anesthesia case to get started.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/cases/new">
                  <Plus className="mr-2 h-4 w-4" /> Create first case
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => (
              <Card key={c.id} className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{c.patient_name}</h3>
                    <p className="truncate text-xs text-muted-foreground">
                      MRN {c.medical_record_number}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {c.sex} · {c.age}y
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{c.procedure_date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">Room {c.room}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-3.5 w-3.5" />
                    <span className="truncate">{c.diagnosis}</span>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/cases/${c.id}`}>View</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(c.id)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}

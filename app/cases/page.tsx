"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { deleteCase, deleteCases, listCases } from "@/lib/storage"
import type { StoredCase } from "@/lib/schema"
import {
  ClipboardList,
  Plus,
  Trash2,
  Calendar,
  User as UserIcon,
  MapPin,
  Loader2,
  LayoutGrid,
  List,
  CheckSquare
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function DashboardPage() {
  const [cases, setCases] = useState<StoredCase[] | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false)

  // Load view mode preference on client mount
  useEffect(() => {
    const saved = localStorage.getItem('cases_view_mode')
    if (saved === 'grid' || saved === 'list') {
      setViewMode(saved)
    }
  }, [])

  const toggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('cases_view_mode', mode)
  }

  async function load() {
    try {
      const rows = await listCases()
      setCases(rows)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load cases")
      setCases([])
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!cases || !cases.some((c) => c.status === "processing")) return
    const interval = setInterval(() => {
      listCases().then((rows) => {
        setCases(rows)
      }).catch(console.error)
    }, 3000)
    return () => clearInterval(interval)
  }, [cases])

  async function handleDelete(id: string) {
    try {
      await deleteCase(id)
      toast.success("Case deleted")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete case")
    }
  }

  async function handleBulkDelete() {
    setIsBulkDeleting(true)
    const toastId = toast.loading(`Deleting ${selectedIds.length} cases...`)
    try {
      await deleteCases(selectedIds)
      toast.success(`${selectedIds.length} cases deleted`, { id: toastId })
      setSelectedIds([])
      setIsSelectionMode(false)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete cases", { id: toastId })
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = (allIds: string[]) => {
    if (selectedIds.length === allIds.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(allIds)
    }
  }

  const hasCases = cases && cases.length > 0

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
          <Button asChild className="w-full sm:w-auto gap-2">
            <Link href="/cases/new">
              <Plus className="h-4 w-4" />
              New case
            </Link>
          </Button>
        </div>

        {hasCases && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isSelectionMode) {
                    setIsSelectionMode(false)
                    setSelectedIds([])
                  } else {
                    setIsSelectionMode(true)
                  }
                }}
                className={`gap-1.5 h-9 ${
                  isSelectionMode
                    ? "bg-accent text-accent-foreground font-semibold"
                    : ""
                }`}
              >
                <CheckSquare className="h-4 w-4" />
                {isSelectionMode ? "Cancel Selection" : "Select Cases"}
              </Button>
              {isSelectionMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSelectAll(cases.map((c) => c.id))}
                  className="text-xs"
                >
                  {selectedIds.length === cases.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => toggleViewMode("grid")}
                className="h-7 w-7 p-0"
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => toggleViewMode("list")}
                className="h-7 w-7 p-0"
                title="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

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
        ) : viewMode === "grid" ? (
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => {
              const isProcessing = c.status === "processing"
              const isFailed = c.status === "failed"
              const isSelected = selectedIds.includes(c.id)

              return (
                <Card
                  key={c.id}
                  onClick={() => {
                    if (isSelectionMode) {
                      toggleSelect(c.id)
                    }
                  }}
                  className={`flex min-w-0 flex-col gap-3 p-5 transition-all duration-300 ${
                    isSelectionMode ? "cursor-pointer select-none" : ""
                  } ${
                    isSelected
                      ? "border-primary bg-primary/[0.015] shadow-sm"
                      : isProcessing
                      ? "animate-pulse border-amber-500/30 bg-amber-500/[0.01]"
                      : isFailed
                      ? "border-destructive/30 bg-destructive/[0.01]"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {isSelectionMode && (
                        <div
                          className="pt-1 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(c.id)}
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold flex items-center gap-1.5">
                          {isProcessing && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500 shrink-0" />
                          )}
                          {isProcessing ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">AI Populating...</span>
                          ) : isFailed ? (
                            <span className="text-destructive font-medium">AI Population Failed</span>
                          ) : (
                            c.patient_name
                          )}
                        </h3>
                        <p className="truncate text-xs text-muted-foreground" title={isFailed ? c.error_message : undefined}>
                          {isProcessing ? "Extracting MRN..." : isFailed ? (c.error_message || "Failed to parse notes") : `MRN ${c.medical_record_number}`}
                        </p>
                      </div>
                    </div>
                    {isProcessing ? (
                      <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        Processing
                      </span>
                    ) : isFailed ? (
                      <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        Failed
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {c.sex} · {c.age}y
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {isProcessing ? "Parsing date..." : isFailed ? "—" : c.procedure_date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {isProcessing ? "Parsing room..." : isFailed ? "—" : `Room ${c.room}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <UserIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {isProcessing ? "Parsing clinical details..." : isFailed ? "—" : c.diagnosis}
                      </span>
                    </div>
                  </div>

                  {!isSelectionMode && (
                    <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                      {isProcessing ? (
                        <Button disabled variant="ghost" size="sm" className="text-amber-500 font-medium">
                          Processing...
                        </Button>
                      ) : isFailed ? (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/cases/${c.id}/edit`}>Edit Manually</Link>
                        </Button>
                      ) : (
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/cases/${c.id}`}>View</Link>
                        </Button>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the anesthesia case
                              for <span className="font-semibold text-foreground">{isProcessing ? "this case" : isFailed ? "this failed case" : c.patient_name}</span>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(c.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {isSelectionMode && (
                    <TableHead className="w-[50px] text-center">
                      <Checkbox
                        checked={selectedIds.length === cases.length && cases.length > 0}
                        onCheckedChange={() => toggleSelectAll(cases.map((c) => c.id))}
                      />
                    </TableHead>
                  )}
                  <TableHead>Patient / Status</TableHead>
                  <TableHead>MRN</TableHead>
                  <TableHead>Sex & Age</TableHead>
                  <TableHead>Procedure Date</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead className="max-w-[200px] truncate">Diagnosis</TableHead>
                  {!isSelectionMode && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((c) => {
                  const isProcessing = c.status === "processing"
                  const isFailed = c.status === "failed"
                  const isSelected = selectedIds.includes(c.id)

                  return (
                    <TableRow
                      key={c.id}
                      data-state={isSelected ? "selected" : undefined}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/[0.015] hover:bg-primary/[0.02]"
                          : isProcessing
                          ? "bg-amber-500/[0.01] hover:bg-amber-500/[0.02]"
                          : isFailed
                          ? "bg-destructive/[0.01] hover:bg-destructive/[0.02]"
                          : ""
                      }`}
                      onClick={() => {
                        if (isSelectionMode) {
                          toggleSelect(c.id)
                        }
                      }}
                    >
                      {isSelectionMode && (
                        <TableCell
                          className="text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(c.id)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium whitespace-normal break-words max-w-[280px]">
                        <div className="flex items-center gap-2">
                          {isProcessing && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500 shrink-0" />
                          )}
                          <div className="min-w-0">
                            {isProcessing ? (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">AI Populating...</span>
                            ) : isFailed ? (
                              <span className="text-destructive font-medium">AI Population Failed</span>
                            ) : (
                              <span className="text-foreground font-semibold">{c.patient_name}</span>
                            )}
                            {isFailed && (
                              <p className="text-xs text-muted-foreground break-all whitespace-normal" title={c.error_message}>
                                {c.error_message || "Failed to parse notes"}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">
                        {isProcessing ? "—" : isFailed ? "—" : c.medical_record_number}
                      </TableCell>
                      <TableCell>
                        {isProcessing ? (
                          "—"
                        ) : isFailed ? (
                          "—"
                        ) : (
                          <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {c.sex} · {c.age}y
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {isProcessing ? "—" : isFailed ? "—" : c.procedure_date}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {isProcessing ? "—" : isFailed ? "—" : `Room ${c.room}`}
                      </TableCell>
                      <TableCell className="max-w-[250px] whitespace-normal break-words text-muted-foreground text-xs" title={c.diagnosis}>
                        {isProcessing ? "—" : isFailed ? "—" : c.diagnosis}
                      </TableCell>
                      {!isSelectionMode && (
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-2">
                            {isProcessing ? (
                              <span className="text-xs text-amber-500 font-medium">Processing...</span>
                            ) : isFailed ? (
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/cases/${c.id}/edit`}>Edit</Link>
                              </Button>
                            ) : (
                              <Button asChild variant="ghost" size="sm">
                                <Link href={`/cases/${c.id}`}>View</Link>
                              </Button>
                            )}

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the anesthesia case for{" "}
                                    <span className="font-semibold text-foreground">
                                      {isProcessing ? "this case" : isFailed ? "this failed case" : c.patient_name}
                                    </span>.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(c.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {isSelectionMode && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-300">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.length} {selectedIds.length === 1 ? "case" : "cases"} selected
          </span>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5 font-semibold" disabled={isBulkDeleting}>
                  {isBulkDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the {selectedIds.length} selected anesthesia {selectedIds.length === 1 ? "case" : "cases"}. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBulkDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, delete {selectedIds.length} {selectedIds.length === 1 ? "case" : "cases"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsSelectionMode(false)
                setSelectedIds([])
              }}
              disabled={isBulkDeleting}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  )
}

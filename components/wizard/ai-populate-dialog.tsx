"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AI_MODELS, DEFAULT_AI_MODEL, type AiModelId } from "@/lib/ai-models"
import { getSession, getUserProfile } from "@/lib/storage"

export function AiPopulateDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [model, setModel] = useState<AiModelId>(DEFAULT_AI_MODEL)
  const [loading, setLoading] = useState(false)
  const [isSupporter, setIsSupporter] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAccess() {
      try {
        const session = await getSession()
        if (session) {
          const profile = await getUserProfile(session.userId)
          if (profile) {
            setIsAdmin(profile.role === "admin")
            setIsSupporter(!!profile.supporter_tier && profile.supporter_tier !== "none")
          }
        }
      } catch (err) {
        console.error("Failed to check user access:", err)
      }
    }
    checkAccess()
  }, [])

  async function handleGenerate() {
    const trimmed = description.trim()
    if (!trimmed) {
      toast.error("Please describe the case first.")
      return
    }

    const modelObj = AI_MODELS.find(m => m.id === model)
    if (modelObj && modelObj.tier === "paid" && !isSupporter && !isAdmin) {
      toast.error("Paid models are reserved for Supporter accounts.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/ai/populate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: trimmed, model }),
      })
      const json = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Request failed (${res.status})`)
      }
      toast.success("AI population started in the background. The case will appear in your cases list shortly.")
      setOpen(false)
      router.push("/cases")
    } catch (err) {
      console.error("[v0] AI populate error:", err)
      toast.error(err instanceof Error ? err.message : "AI populate failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="gap-1.5">
          <Sparkles className="h-4 w-4 text-[color:var(--brand-crimson)]" />
          AI populate
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[color:var(--brand-crimson)]" />
            Auto-populate case with AI
          </DialogTitle>
          <DialogDescription>
            Paste a free-text case description, handover note, or rough bullets. The AI will extract
            structured values into every step of the form. You can edit anything before submitting.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-model">Model</Label>
            <Select value={model} onValueChange={(v) => setModel(v as AiModelId)}>
              <SelectTrigger id="ai-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="font-bold text-xs uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Free Models (Sorted by TPS)</SelectLabel>
                  {[...AI_MODELS].filter(m => m.tier === "free").sort((a, b) => b.tps - a.tps).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex flex-col py-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm text-foreground">{m.label}</span>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full px-1.5 py-0.2 font-mono font-semibold">
                            {m.tps} TPS
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">{m.id}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
                
                <SelectSeparator />
                
                <SelectGroup>
                  <SelectLabel className="font-bold text-xs uppercase text-amber-600 dark:text-amber-400 tracking-wider">Paid Models (Sorted by TPS)</SelectLabel>
                  {[...AI_MODELS].filter(m => m.tier === "paid").sort((a, b) => b.tps - a.tps).map((m) => (
                    <SelectItem key={m.id} value={m.id} disabled={!isSupporter && !isAdmin}>
                      <div className="flex flex-col py-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm text-foreground">{m.label}</span>
                          {!isSupporter && !isAdmin && (
                            <span className="text-[9px] bg-red-500/10 text-red-600 dark:text-red-400 rounded-full px-1.5 py-0.2 font-semibold">
                              Locked (Supporter Only)
                            </span>
                          )}
                          <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full px-1.5 py-0.2 font-mono font-semibold">
                            {m.priceLabel}
                          </span>
                          <span className="text-[9px] bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-full px-1.5 py-0.2 font-mono font-semibold">
                            {m.tps} TPS
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">{m.id}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1.5">
            <Label htmlFor="ai-description">Case description</Label>
            <Textarea
              id="ai-description"
              rows={9}
              placeholder={`e.g. 45y female, MRN 11823, scheduled for laparoscopic cholecystectomy in OR 3 on 2026-04-21. Weight 68kg, height 162cm. Allergies: penicillin. PMH: HTN on amlodipine. NPO since midnight. Airway: Mallampati II. Labs WNL, ECG normal sinus. Plan GA with propofol induction, sevoflurane maintenance, fentanyl analgesia. Post-op: Low Care.`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="max-h-[50vh] min-h-40 resize-y font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Only fields the model can extract will be filled; existing values stay untouched if
              the AI has nothing to say about them.
            </p>
          </div>
        </div>

        <DialogFooter className="border-t bg-background px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleGenerate} disabled={loading} className="gap-1.5">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

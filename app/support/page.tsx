"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { listSupporters, type Supporter } from "@/lib/storage"
import { Heart, Landmark, Globe, Loader2, Sparkles, AlertCircle } from "lucide-react"
import Script from "next/script"
import Link from "next/link"
import { Logo } from "@/components/logo"

declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: any) => void
          onPending?: (result: any) => void
          onError?: (result: any) => void
          onClose?: () => void
        }
      ) => void
    }
  }
}

const getTierDefaultAmount = (type: "individual" | "sponsor", selectedTier: string): string => {
  if (type === "individual") {
    return selectedTier === "Backer" ? "50000" : "150000"
  } else {
    if (selectedTier === "Backer") return "250000"
    if (selectedTier === "Sponsor") return "500000"
    if (selectedTier === "Gold Sponsor") return "1000000"
    return "2500000"
  }
}

export default function SupportUsPage() {
  const [supporters, setSupporters] = useState<Supporter[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [name, setName] = useState("")
  const [type, setType] = useState<"individual" | "sponsor">("individual")
  const [tier, setTier] = useState<"Backer" | "Sponsor" | "Gold Sponsor" | "Platinum Sponsor">("Backer")
  const [amount, setAmount] = useState("50000")
  const [message, setMessage] = useState("")
  const [website, setWebsite] = useState("")

  // Update tier & amount when type changes
  useEffect(() => {
    const defaultTier = type === "individual" ? "Backer" : "Gold Sponsor"
    setTier(defaultTier)
    setAmount(getTierDefaultAmount(type, defaultTier))
  }, [type])

  const handleTierChange = (newTier: typeof tier) => {
    setTier(newTier)
    setAmount(getTierDefaultAmount(type, newTier))
  }

  async function load() {
    try {
      const data = await listSupporters()
      setSupporters(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Please enter your name or organization name.")
      return
    }

    if (!amount || parseInt(amount) <= 0) {
      toast.error("Please enter a valid donation amount.")
      return
    }

    setSubmitting(true)
    const toastId = toast.loading("Initiating secure payment checkout...")

    try {
      const res = await fetch("/api/support/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          tier,
          amount: Math.round(parseFloat(amount)),
          message: message.trim() || undefined,
          website: website.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to initiate payment")
      }

      const { token, order_id } = await res.json()
      toast.dismiss(toastId)

      if (typeof window.snap === "undefined") {
        throw new Error("Payment gateway SDK failed to load. Please refresh the page.")
      }

      window.snap.pay(token, {
        onSuccess: async (result: any) => {
          const confirmToast = toast.loading("Verifying payment settlement status...")
          try {
            const confirmRes = await fetch("/api/support/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ order_id }),
            })
            if (confirmRes.ok) {
              toast.success("Thank you! Payment successful and recorded.", { id: confirmToast })
              setName("")
              setMessage("")
              setWebsite("")
              await load()
            } else {
              toast.error("Payment settlement verification pending.", { id: confirmToast })
            }
          } catch (confirmErr) {
            toast.error("Error confirming payment status.", { id: confirmToast })
          }
        },
        onPending: () => {
          toast.info("Payment is pending. Please complete transaction.")
        },
        onError: () => {
          toast.error("Payment failed. Please try again.")
        },
        onClose: () => {
          toast.warning("Payment checkout closed.")
        }
      })

    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record support", { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  // Group supporters by tier
  const platinumSponsors = supporters.filter(s => s.tier === "Platinum Sponsor")
  const goldSponsors = supporters.filter(s => s.tier === "Gold Sponsor")
  const sponsors = supporters.filter(s => s.tier === "Sponsor")
  const backers = supporters.filter(s => s.tier === "Backer")

  const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
  const snapUrl = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js"
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""

  return (
    <AppShell>
      <Script
        src={snapUrl}
        data-client-key={clientKey}
        strategy="lazyOnload"
      />

      <div className="flex flex-col gap-8 pb-12">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-3">
          <Badge variant="outline" className="w-fit mx-auto bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-3 py-1 text-xs">
            Non-Profit & Open Source
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-primary via-amber-500 to-emerald-500 bg-clip-text text-transparent">
            Support AnesthesiApp
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mt-1">
            AnesthesiApp is built to empower anesthesia practitioners with intelligent OSCE/CBT prep, drugs metadata, and case logs. Help us keep the servers running and the app free for everyone.
          </p>
        </div>

        {/* Content Columns */}
        <div className="grid gap-8 lg:grid-cols-12">
          
          {/* Column 1: Donation & Sponsorship Form */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <Card className="border border-border shadow-md bg-card/50 backdrop-blur-xs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                  Become a Supporter
                </CardTitle>
                <CardDescription>
                  Enter your details to join the wall of donors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Supporter Type Toggle */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-semibold">Support Type</Label>
                    <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-lg">
                      <Button
                        type="button"
                        variant={type === "individual" ? "secondary" : "ghost"}
                        className="h-8 text-xs font-semibold"
                        onClick={() => setType("individual")}
                      >
                        Individual Donor
                      </Button>
                      <Button
                        type="button"
                        variant={type === "sponsor" ? "secondary" : "ghost"}
                        className="h-8 text-xs font-semibold"
                        onClick={() => setType("sponsor")}
                      >
                        Sponsor / Org
                      </Button>
                    </div>
                  </div>

                  {/* Name Input */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="support-name" className="text-xs font-semibold">
                      {type === "individual" ? "Your Name" : "Organization Name"}
                    </Label>
                    <Input
                      id="support-name"
                      placeholder={type === "individual" ? "e.g., Dr. Jane Mercer" : "e.g., Global Anesthesia Group"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Support Tier Select */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="support-tier" className="text-xs font-semibold">Support Tier</Label>
                    <select
                      id="support-tier"
                      value={tier}
                      onChange={(e) => handleTierChange(e.target.value as any)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
                    >
                      {type === "individual" ? (
                        <>
                          <option value="Backer">Backer (Rp 50.000+)</option>
                          <option value="Sponsor">Sponsor (Rp 150.000+)</option>
                        </>
                      ) : (
                        <>
                          <option value="Backer">Sponsor Backer (Rp 250.000+)</option>
                          <option value="Sponsor">Bronze Sponsor (Rp 500.000+)</option>
                          <option value="Gold Sponsor">Gold Sponsor (Rp 1.000.000+)</option>
                          <option value="Platinum Sponsor">Platinum Sponsor (Rp 2.500.000+)</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Optional Donation Amount */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="support-amount" className="text-xs font-semibold">Donation Amount (IDR / Rupiah)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">Rp</span>
                      <Input
                        id="support-amount"
                        type="number"
                        placeholder="e.g., 50000"
                        className="pl-8"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Optional Website Link */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="support-website" className="text-xs font-semibold">Website / Profile Link (Optional)</Label>
                    <Input
                      id="support-website"
                      placeholder="e.g., https://myprofile.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>

                  {/* Optional Message */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="support-message" className="text-xs font-semibold">Message of Support (Optional)</Label>
                    <Textarea
                      id="support-message"
                      placeholder="Keep up the great work! Any message you leave will be displayed on the supporter wall."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" disabled={submitting} className="mt-2 w-full font-bold gap-2">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Recording...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> Support with Midtrans
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Sponsorship info banner */}
            <Card className="border-emerald-500/20 bg-emerald-500/[0.02] p-5 flex gap-4">
              <Landmark className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-400">Institutional Sponsorship</h4>
                <p className="text-xs text-muted-foreground leading-normal">
                  Organizations and hospitals can request custom banner listings, API endpoints or custom integrations. Contact us at <span className="font-semibold text-foreground">sponsors@anesthesiapp.my.id</span> to discuss formal partnerships.
                </p>
              </div>
            </Card>
          </div>

          {/* Column 2: Supporters Wall */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500" />
              Supporters Wall of Fame
            </h2>

            {loading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 w-full animate-pulse bg-muted rounded-xl border" />
                ))}
              </div>
            ) : supporters.length === 0 ? (
              <Card className="border border-dashed p-8 text-center bg-card/30">
                <Heart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="font-bold text-base">No supporters listed yet</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                  Be the very first to support this project and claim your spot on the Wall of Fame!
                </p>
              </Card>
            ) : (
              <div className="flex flex-col gap-6">
                
                {/* Platinum Tier */}
                {platinumSponsors.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
                      <span className="h-1 w-8 bg-amber-500 rounded-full" />
                      Platinum Sponsors
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {platinumSponsors.map((s) => (
                        <Card key={s.id} className="border-amber-500/30 bg-gradient-to-b from-amber-500/[0.03] to-transparent p-5 shadow-xs relative overflow-hidden group hover:border-amber-500/50 transition-colors">
                          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-8 translate-x-8 rotate-45 bg-amber-500/10" />
                          <div className="flex flex-col gap-1.5">
                            <span className="font-bold text-sm text-amber-700 dark:text-amber-400">{s.name}</span>
                            {s.amount && (
                              <span className="text-xs font-mono font-bold text-muted-foreground/80">Rp {s.amount.toLocaleString("id-ID")} Contribution</span>
                            )}
                            {s.message && (
                              <p className="text-xs text-muted-foreground/90 italic mt-1 leading-relaxed">&ldquo;{s.message}&rdquo;</p>
                            )}
                            {s.website && (
                              <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-1 mt-1.5 w-fit">
                                <Globe className="h-3 w-3" /> Visit website
                              </a>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gold Tier */}
                {goldSponsors.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                      <span className="h-1 w-8 bg-yellow-500 rounded-full" />
                      Gold Sponsors
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {goldSponsors.map((s) => (
                        <Card key={s.id} className="border-yellow-500/20 bg-gradient-to-b from-yellow-500/[0.015] to-transparent p-4 shadow-xs relative hover:border-yellow-500/40 transition-colors">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-bold text-sm text-yellow-700 dark:text-yellow-400">{s.name}</span>
                            {s.amount && (
                              <span className="text-xs font-mono font-bold text-muted-foreground/80">Rp {s.amount.toLocaleString("id-ID")} Contribution</span>
                            )}
                            {s.message && (
                              <p className="text-xs text-muted-foreground/90 italic mt-0.5 leading-relaxed">&ldquo;{s.message}&rdquo;</p>
                            )}
                            {s.website && (
                              <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-1 mt-1 w-fit">
                                <Globe className="h-3 w-3" /> Visit website
                              </a>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sponsor Tier */}
                {sponsors.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <span className="h-1 w-8 bg-emerald-500 rounded-full" />
                      Sponsors
                    </h3>
                    <div className="flex flex-col gap-2">
                      {sponsors.map((s) => (
                        <div key={s.id} className="flex flex-col gap-1.5 p-3 rounded-lg border border-border bg-card/40 hover:bg-card/75 transition-colors">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-xs text-foreground">{s.name}</span>
                            {s.amount && (
                              <span className="text-[10px] font-mono font-bold text-muted-foreground/80">Rp {s.amount.toLocaleString("id-ID")}</span>
                            )}
                          </div>
                          {s.message && (
                            <p className="text-xs text-muted-foreground italic leading-relaxed">&ldquo;{s.message}&rdquo;</p>
                          )}
                          {s.website && (
                            <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-1 w-fit">
                              <Globe className="h-3 w-3" /> Website
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Backers Tier */}
                {backers.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                      <span className="h-1 w-8 bg-primary rounded-full" />
                      Backers
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {backers.map((s) => (
                        <div
                          key={s.id}
                          className="inline-flex flex-col gap-1 bg-muted/60 hover:bg-muted border border-border px-3.5 py-2 rounded-lg text-xs transition-all relative group"
                          title={s.message ? `Message: "${s.message}"` : undefined}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground">{s.name}</span>
                            {s.amount && <span className="text-[10px] font-mono font-bold text-muted-foreground/80">Rp {s.amount.toLocaleString("id-ID")}</span>}
                          </div>
                          {s.message && (
                            <span className="text-[10px] text-muted-foreground italic max-w-[150px] truncate">&ldquo;{s.message}&rdquo;</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-border pt-8 bg-transparent">
        <div className="flex flex-col items-center justify-between gap-6 py-6 text-xs text-muted-foreground md:flex-row">
          <div className="flex items-center gap-3">
            <Logo height={20} href={null} />
            <span className="font-semibold">· for medical training & clinical research</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-bold">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <a href="mailto:support@anesthesiapp.my.id" className="hover:underline">Contact Support</a>
          </div>

          <p className="font-semibold">© {new Date().getFullYear()} AnesthesiApp. All rights reserved.</p>
        </div>
      </footer>
    </AppShell>
  )
}

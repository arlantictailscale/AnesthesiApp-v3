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
import { Heart, Landmark, Globe, Loader2, Sparkles, AlertCircle, Check, HelpCircle } from "lucide-react"
import Script from "next/script"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { SupporterBadge } from "@/components/supporter-badge"

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

const getTierDefaultAmount = (selectedTier: string): string => {
  if (selectedTier === "Backer") return "50000"
  if (selectedTier === "Sponsor") return "150000"
  if (selectedTier === "Gold Sponsor") return "500000"
  if (selectedTier === "Platinum Sponsor") return "1000000"
  return "2500000" // Diamond Sponsor
}

const getTierFeatures = (selectedTier: string): string[] => {
  if (selectedTier === "Backer") {
    return [
      "Verified Supporter Backer profile badge next to comments & logs",
      "Your name highlighted on the Premium Members Wall",
      "Help fund core server hosting and operational costs",
    ]
  }
  if (selectedTier === "Sponsor") {
    return [
      "Verified Supporter Sponsor profile badge next to comments & logs",
      "Your name highlighted on the Premium Members Wall",
      "Help fund ongoing AI patient simulator training costs",
      "Priority beta access to upcoming offline tools",
    ]
  }
  if (selectedTier === "Gold Sponsor") {
    return [
      "Verified Gold Member profile badge next to comments & logs",
      "Access to advanced paid AI models (e.g. GPT OSS 120B, Gemini Flash, etc.)",
      "Your name highlighted on the Premium Members Wall",
      "Help support infrastructure development",
    ]
  }
  if (selectedTier === "Platinum Sponsor") {
    return [
      "Verified Platinum Member profile badge next to comments & logs",
      "Access to all paid AI models",
      "Your name highlighted on the Premium Members Wall",
      "Priority support and early access to new simulation features",
    ]
  }
  return [
    "Verified Diamond Member profile badge next to comments & logs",
    "Unlimited access to all paid AI models",
    "Your name highlighted on the Premium Members Wall",
    "Priority feature requests and direct email contact line",
  ] // Diamond Sponsor
}


export default function SupportUsPage() {
  const [supporters, setSupporters] = useState<Supporter[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [name, setName] = useState("")
  const [type] = useState<"individual" | "sponsor">("individual")
  const [tier, setTier] = useState<"Backer" | "Sponsor" | "Gold Sponsor" | "Platinum Sponsor" | "Diamond Sponsor">("Backer")
  const [amount, setAmount] = useState("50000")
  const [message, setMessage] = useState("")
  const [website, setWebsite] = useState("")

  const handleTierChange = (newTier: typeof tier) => {
    setTier(newTier)
    setAmount(getTierDefaultAmount(newTier))
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
  const diamondSponsors = supporters.filter(s => s.tier === "Diamond Sponsor")
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
            Profile Badges & Sponsorship
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-primary via-amber-500 to-emerald-500 bg-clip-text text-transparent">
            Supporter Badges & Sponsorships
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mt-1">
            AnesthesiApp is built to empower anesthesia practitioners with intelligent OSCE/CBT prep, drug calculators, and case logs. <strong>All features are 100% free for everyone.</strong> Upgrade to a premium plan to obtain a profile badge next to your posts and join our public recognition wall.
          </p>
        </div>

        {/* Content Columns */}
        <div className="grid gap-8 lg:grid-cols-12">
          
          {/* Column 1: Pricing Plans & Checkout Form */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <Card className="border border-border shadow-md bg-card/50 backdrop-blur-xs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500" />
                  Choose Profile Badge Tier
                </CardTitle>
                <CardDescription>
                  Choose a plan to show your support and claim your badge.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Name Input */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="support-name" className="text-xs font-semibold">
                      Your Full Name
                    </Label>
                    <Input
                      id="support-name"
                      placeholder="e.g., Dr. Jane Mercer"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Access Plan Select */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="support-tier" className="text-xs font-semibold">Choose Badge Level</Label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground font-semibold">Badge Preview:</span>
                        <SupporterBadge tier={tier === "Gold Sponsor" ? "gold sponsor" : tier === "Platinum Sponsor" ? "platinum sponsor" : tier === "Diamond Sponsor" ? "diamond sponsor" : tier.toLowerCase()} />
                      </div>
                    </div>
                    <select
                      id="support-tier"
                      value={tier}
                      onChange={(e) => handleTierChange(e.target.value as any)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
                    >
                      <option value="Backer">Supporter Backer (Rp 50.000)</option>
                      <option value="Sponsor">Supporter Sponsor (Rp 150.000)</option>
                      <option value="Gold Sponsor">Gold Member (Rp 500.000)</option>
                      <option value="Platinum Sponsor">Platinum Member (Rp 1.000.000)</option>
                      <option value="Diamond Sponsor">Diamond Member (Rp 2.500.000)</option>
                    </select>
                  </div>

                  {/* Plan Price */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="support-amount" className="text-xs font-semibold">Support Amount (IDR / Rupiah)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">Rp</span>
                      <Input
                        id="support-amount"
                        type="number"
                        placeholder="e.g., 50000"
                        className="pl-8 bg-muted/50"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        readOnly
                        required
                      />
                    </div>
                  </div>

                  {/* Plan Feature Breakdown */}
                  <div className="rounded-lg border border-border bg-muted/40 p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <Check className="h-4 w-4 text-emerald-500" />
                      Sponsorship Benefits & Badges:
                    </div>
                    <ul className="flex flex-col gap-1.5 text-[11px] text-muted-foreground pl-1.5 font-medium">
                      {getTierFeatures(tier).map((feature, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="h-1.5 w-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
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
                    <Label htmlFor="support-message" className="text-xs font-semibold">Custom Wall Message (Optional)</Label>
                    <Textarea
                      id="support-message"
                      placeholder="Leave a message to display on the public members wall."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" disabled={submitting} className="mt-2 w-full font-bold gap-2">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Upgrading...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> Upgrade Profile & Pay
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Refund & Billing Policy Card */}
            <Card className="border-border bg-muted/10 p-4">
              <div className="flex flex-col gap-1.5 text-[11px] text-muted-foreground leading-normal">
                <div className="flex items-center gap-1 text-foreground font-bold uppercase tracking-wider text-[10px]">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  Billing & Refund Policy
                </div>
                <p>
                  All payments are securely processed via Midtrans payment gateway. By upgrading your account, you agree to our Terms of Service. Because supporter profile badges and wall listings are activated instantly, support payments are non-refundable. For billing queries, support, or tax invoice requests, please contact us at <span className="font-semibold text-foreground">support@anesthesiapp.my.id</span>.
                </p>
              </div>
            </Card>
          </div>

          {/* Column 2: Supporters Wall */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500" />
              Premium Members & Sponsors Wall
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
                <h3 className="font-bold text-base">No premium members listed yet</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                  Be the very first to purchase a premium package and claim your spot on the Wall!
                </p>
              </Card>
            ) : (
              <div className="flex flex-col gap-6">
                
                {/* Diamond Tier */}
                {diamondSponsors.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                      <span className="h-1 w-8 bg-indigo-500 rounded-full animate-pulse" />
                      Diamond Members
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {diamondSponsors.map((s) => (
                        <Card key={s.id} className="border-indigo-500/30 bg-gradient-to-b from-indigo-500/[0.03] to-transparent p-5 shadow-xs relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
                          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-8 translate-x-8 rotate-45 bg-indigo-500/10" />
                          <div className="flex flex-col gap-1.5">
                            <span className="font-bold text-sm text-indigo-750 dark:text-indigo-400 flex items-center gap-1.5">
                              {s.name}
                              <SupporterBadge tier="diamond sponsor" className="scale-90" />
                            </span>
                            {s.amount && (
                              <span className="text-xs font-mono font-bold text-muted-foreground/80">Rp {s.amount.toLocaleString("id-ID")} Member Tier</span>
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

                {/* Platinum Tier */}
                {platinumSponsors.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
                      <span className="h-1 w-8 bg-amber-500 rounded-full" />
                      Platinum Members
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {platinumSponsors.map((s) => (
                        <Card key={s.id} className="border-amber-500/30 bg-gradient-to-b from-amber-500/[0.03] to-transparent p-5 shadow-xs relative overflow-hidden group hover:border-amber-500/50 transition-colors">
                          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-8 translate-x-8 rotate-45 bg-amber-500/10" />
                          <div className="flex flex-col gap-1.5">
                            <span className="font-bold text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                              {s.name}
                              <SupporterBadge tier="platinum sponsor" className="scale-90" />
                            </span>
                            {s.amount && (
                              <span className="text-xs font-mono font-bold text-muted-foreground/80">Rp {s.amount.toLocaleString("id-ID")} Member Tier</span>
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
                      Gold Members
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {goldSponsors.map((s) => (
                        <Card key={s.id} className="border-yellow-500/20 bg-gradient-to-b from-yellow-500/[0.015] to-transparent p-4 shadow-xs relative hover:border-yellow-500/40 transition-colors">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-bold text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-1.5">
                              {s.name}
                              <SupporterBadge tier="gold sponsor" className="scale-90" />
                            </span>
                            {s.amount && (
                              <span className="text-xs font-mono font-bold text-muted-foreground/80">Rp {s.amount.toLocaleString("id-ID")} Member Tier</span>
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
                      Sponsors & Members
                    </h3>
                    <div className="flex flex-col gap-2">
                      {sponsors.map((s) => (
                        <div key={s.id} className="flex flex-col gap-1.5 p-3 rounded-lg border border-border bg-card/40 hover:bg-card/75 transition-colors">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                              {s.name}
                              <SupporterBadge tier="sponsor" className="scale-90" />
                            </span>
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
                      Premium Backers
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {backers.map((s) => (
                        <div
                          key={s.id}
                          className="inline-flex flex-col gap-1 bg-muted/60 hover:bg-muted border border-border px-3.5 py-2 rounded-lg text-xs transition-all relative group"
                          title={s.message ? `Message: "${s.message}"` : undefined}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              {s.name}
                              <SupporterBadge tier="backer" className="scale-90" />
                            </span>
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
    </AppShell>
  )
}

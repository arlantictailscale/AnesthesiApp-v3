"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  ArrowRight, 
  Lock, 
  CreditCard, 
  CheckCircle2, 
  Sparkles, 
  UserCheck, 
  Smartphone, 
  Home, 
  Printer, 
  ArrowLeft,
  Mail,
  Globe
} from "lucide-react"

export default function TransactionFlowPage() {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/20 py-8 px-4 sm:px-6 lg:px-8">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #fff !important;
            color: #000 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-break {
            page-break-after: always;
          }
          .print-card {
            border: 1px solid #ddd !important;
            box-shadow: none !important;
            background: #fff !important;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Navigation & Action Bar (no-print) */}
        <div className="flex items-center justify-between no-print border-b pb-4">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 font-semibold">
            <Link href="/support">
              <ArrowLeft className="h-4 w-4" /> Back to Plans
            </Link>
          </Button>
          <Button onClick={handlePrint} className="gap-1.5 font-bold shadow-xs bg-primary hover:bg-primary/90">
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </Button>
        </div>

        {/* Document Header */}
        <div className="flex flex-col gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                AnesthesiApp Checkout Flow
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Official Merchant Onboarding & Customer Journey Document
              </p>
            </div>
            <div className="text-xs sm:text-right text-muted-foreground font-mono bg-muted/40 p-3 rounded-lg border">
              <div>Document ID: AA-TX-FLOW-2026</div>
              <div>Generated: June 20, 2026</div>
              <div>Gateway Partner: DOKU Checkout</div>
            </div>
          </div>
        </div>

        {/* Merchant & Website Information Metadata */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="print-card bg-card/60 backdrop-blur-xs border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Merchant Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-sm space-y-1.5 font-semibold">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-normal">App Name:</span>
                <span className="text-foreground">AnesthesiApp</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-normal">Contact Email:</span>
                <span className="text-foreground">support@anesthesiapp.my.id</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-normal">Official Domain:</span>
                <a href="https://anesthesiapp.my.id" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                  anesthesiapp.my.id <Globe className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="print-card bg-card/60 backdrop-blur-xs border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Compliance Metadata</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-sm space-y-1.5 font-semibold">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-normal">Goods Sold:</span>
                <span className="text-foreground">Supporter Badges & Wall Recognition</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-normal">Base Currency:</span>
                <span className="text-foreground">IDR (Rupiah)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-normal">Refund Policy:</span>
                <span className="text-foreground">Non-refundable (Instant Access)</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Flow Diagram (Visual representation) */}
        <div className="mt-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Transaction Journey Overview</h2>
          <div className="grid gap-3 sm:grid-cols-5 text-center text-xs font-semibold relative">
            <div className="p-3 bg-muted/30 border rounded-lg flex flex-col items-center gap-2 justify-center">
              <Home className="h-5 w-5 text-primary" />
              <span>1. Visit Landing Page</span>
            </div>
            <div className="p-3 bg-muted/30 border rounded-lg flex flex-col items-center gap-2 justify-center">
              <UserCheck className="h-5 w-5 text-primary" />
              <span>2. Authenticate</span>
            </div>
            <div className="p-3 bg-muted/30 border rounded-lg flex flex-col items-center gap-2 justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>3. Choose Plan & Price</span>
            </div>
            <div className="p-3 bg-muted/30 border rounded-lg flex flex-col items-center gap-2 justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
              <span>4. DOKU Checkout Page</span>
            </div>
            <div className="p-3 bg-emerald-500/10 border-emerald-500/20 border rounded-lg flex flex-col items-center gap-2 justify-center text-emerald-800 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span>5. Instant Activation</span>
            </div>
          </div>
        </div>

        {/* Step-by-Step Details with Mockup Layouts */}
        <div className="flex flex-col gap-8 mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Step-by-Step Customer Journey</h2>

          {/* Step 1 */}
          <div className="border rounded-xl p-5 bg-card print-card flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary/10 text-primary font-mono font-bold flex items-center justify-center text-xs">01</span>
              <h3 className="font-bold text-base">User Authenticates (Login/Signup)</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Users visit the landing page <code>https://anesthesiapp.my.id</code> and authenticate securely via email registration or Google OAuth. This ensures billing transactions are tied to a unique identifier.
            </p>
            <div className="rounded-lg border bg-muted/20 p-4 font-mono text-[10px] space-y-1.5 max-w-md">
              <div className="text-muted-foreground border-b pb-1 font-bold">Authentication Mockup</div>
              <div className="flex justify-between items-center py-1">
                <span>[AnesthesiApp Sign In]</span>
                <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[8px]">Google Sign In</span>
              </div>
              <div className="text-muted-foreground">Email: [____________________] Password: [*********]</div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="border rounded-xl p-5 bg-card print-card flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary/10 text-primary font-mono font-bold flex items-center justify-center text-xs">02</span>
              <h3 className="font-bold text-base">Supporter Tier Selection</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The user navigates to the Supporter/Sponsorship page. They choose an individual plan, which displays its IDR price and corresponding profile badges.
            </p>
            <div className="rounded-lg border bg-muted/20 p-4 font-mono text-[10px] space-y-2 max-w-md">
              <div className="text-muted-foreground border-b pb-1 font-bold">Plan Details Display (in IDR)</div>
              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div className="border p-2 rounded bg-background">
                  <div className="font-bold text-foreground">Supporter Backer</div>
                  <div className="text-primary font-bold mt-1">Rp 50.000</div>
                  <div className="text-muted-foreground mt-1 text-[8px] leading-tight">• Verified Backer Badge<br />• Name listed on Wall</div>
                </div>
                <div className="border border-primary p-2 rounded bg-background">
                  <div className="font-bold text-foreground">Supporter Sponsor</div>
                  <div className="text-primary font-bold mt-1">Rp 150.000</div>
                  <div className="text-muted-foreground mt-1 text-[8px] leading-tight">• Verified Sponsor Badge<br />• Name listed on Wall</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="border rounded-xl p-5 bg-card print-card flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary/10 text-primary font-mono font-bold flex items-center justify-center text-xs">03</span>
              <h3 className="font-bold text-base">Initiate Secure Checkout Session</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The user enters their billing name and profile details and clicks **"Upgrade & Pay"**. The frontend posts a request to the backend API endpoint (<code>/api/support/checkout</code>). The server creates a pending record in the Supabase database and requests a secure checkout session URL from the DOKU payment endpoints.
            </p>
            <div className="rounded-lg border bg-muted/20 p-4 font-mono text-[9px] text-muted-foreground space-y-1">
              <div className="border-b pb-1 font-bold text-foreground">Backend Request to DOKU Checkout API</div>
              <div>POST https://api-sandbox.doku.com/checkout/v1/payment</div>
              <div>Body: &#123; "order": &#123; "invoice_number": "SUPPORT-8C2A", "amount": 150000, "callback_url": "..." &#125;, "customer": &#123; "name": "Dr. Jane Mercer", "email": "jane@example.com" &#125; &#125;</div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="border rounded-xl p-5 bg-card print-card flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary/10 text-primary font-mono font-bold flex items-center justify-center text-xs">04</span>
              <h3 className="font-bold text-base">DOKU Checkout Page Redirect</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The user is redirected to the DOKU-hosted Checkout page. The user is displayed the merchant details, order ID, and the exact price in IDR. They complete the transaction using QRIS, Credit Card, ShopeePay, GoPay, or Virtual Accounts.
            </p>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.02] p-4 font-mono text-[10px] space-y-1.5 max-w-sm mx-auto w-full">
              <div className="flex items-center justify-between border-b pb-1">
                <span className="font-bold text-amber-700">DOKU Secure Checkout Payment</span>
                <span className="text-[8px] bg-amber-500/10 text-amber-600 px-1 font-bold rounded">ORDER: SUPPORT-8C2A</span>
              </div>
              <div className="text-[12px] font-bold text-center py-2 text-foreground">
                Rp 150.000
              </div>
              <div className="space-y-1 text-[8px]">
                <div className="border p-1.5 rounded flex justify-between bg-background"><span>[QRIS] Pay with GoPay / OVO / ShopeePay</span> <ArrowRight className="h-3 w-3" /></div>
                <div className="border p-1.5 rounded flex justify-between bg-background"><span>[Bank Transfer] Virtual Account (Mandiri/BNI)</span> <ArrowRight className="h-3 w-3" /></div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="border rounded-xl p-5 bg-card print-card flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-600 font-mono font-bold flex items-center justify-center text-xs">05</span>
              <h3 className="font-bold text-base">Settlement Verification & Profile Badge Activation</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upon successful payment, DOKU redirects the user back to `/support/success`. The client triggers the server validation API (<code>/api/support/confirm</code>), which verifies the settlement with the DOKU Check Status API. Once settled, the server updates the database record state to `paid` and upgrades the user's supporter status to display their premium badge on comments & logs immediately.
            </p>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.02] p-4 font-mono text-[10px] space-y-1.5 max-w-sm mx-auto w-full text-center">
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="font-bold text-emerald-700">Supporter Badge Activated!</div>
              <div className="text-[8px] text-muted-foreground">Order ID: SUPPORT-8C2A has been successfully verified. Your supporter badge is now visible next to your profile.</div>
            </div>
          </div>
        </div>

        {/* Footer info for auditors */}
        <div className="border-t pt-6 text-center text-xs text-muted-foreground pb-12 font-medium">
          <div>AnesthesiApp Compliance & Operations Document</div>
          <div className="mt-1">For support, please contact us at <span className="font-bold text-foreground">support@anesthesiapp.my.id</span></div>
        </div>

      </div>
    </div>
  )
}

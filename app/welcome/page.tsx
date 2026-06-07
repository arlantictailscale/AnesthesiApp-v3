import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import { ShieldCheck, ArrowRight, Sparkles, ClipboardList, Stethoscope, GraduationCap } from "lucide-react"

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 md:px-6">
          <Logo height={32} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="relative w-full max-w-2xl overflow-hidden p-6 md:p-8 border border-border/80 shadow-xl bg-card">
          {/* Decorative Top Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 -z-10 w-96 h-48 bg-primary/10 rounded-full blur-3xl" />

          <div className="flex flex-col items-center text-center gap-6">
            {/* Verification Success Icon */}
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 animate-bounce">
              <ShieldCheck className="h-10 w-10" />
              <div className="absolute -inset-1 rounded-full border border-emerald-500/20 animate-ping" />
            </div>

            {/* Typography */}
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-foreground flex items-center justify-center gap-2">
                Email Confirmed! <Sparkles className="h-6 w-6 text-amber-500" />
              </h1>
              <p className="text-balance text-muted-foreground font-medium text-sm max-w-md mx-auto">
                Welcome to AnesthesiApp. Your account has been successfully verified. You now have full access to your clinical workspace.
              </p>
            </div>

            {/* Quick Features Checklist */}
            <div className="w-full grid gap-4 sm:grid-cols-3 text-left mt-4">
              <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col gap-2 transition-all duration-300 hover:border-primary/20">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-xs">Bedside Case Logger</h3>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Log cases instantly with a structured 7-step clinical workflow.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col gap-2 transition-all duration-300 hover:border-primary/20">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-xs">CBT Simulation</h3>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Prepare for national assessments with TIMED board practice modules.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col gap-2 transition-all duration-300 hover:border-primary/20">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Stethoscope className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-xs">OSCE Prep Hub</h3>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Test your patient management skills with OSCE checklist simulations.
                </p>
              </div>
            </div>

            {/* Action CTA */}
            <div className="flex flex-col gap-3 w-full sm:w-auto mt-6">
              <Button asChild size="lg" className="font-bold gap-2">
                <Link href="/dashboard">
                  Enter Your Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}

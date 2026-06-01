import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import {
  Activity,
  ClipboardList,
  ShieldCheck,
  Smartphone,
  Database,
  LineChart,
  ArrowRight,
  Stethoscope,
  Pill,
  BookOpenText,
  Share2,
  User,
  GraduationCap,
  Sparkles,
  Heart
} from "lucide-react"

import { createClient } from "@/lib/supabase/server"

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Logo height={32} priority />

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex font-semibold">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#workflow" className="hover:text-foreground">
              Workflow
            </a>
            <a href="#roadmap" className="hover:text-foreground">
              Roadmap
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Button asChild size="sm" className="font-semibold">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="font-semibold">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="font-semibold">
                  <Link href="/signup">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-accent/40 px-3 py-1 text-xs font-semibold text-accent-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              All-In-One Anesthesiology Ecosystem
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">
              Anesthesia cases.{" "}
              <span className="text-[color:var(--brand-crimson)]">Board & OSCE Prep.</span>
            </h1>
            <p className="text-pretty text-lg leading-relaxed text-muted-foreground font-medium">
              A comprehensive mobile-first ecosystem for residents and consultants — log cases at the bedside, simulate national CBT and OSCE exams, and access a curated pharmacology and guidelines database.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {isLoggedIn ? (
                <Button asChild size="lg" className="gap-2 font-bold shadow-xs">
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="gap-2 font-bold shadow-xs">
                    <Link href="/signup">
                      Create free account
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="font-bold">
                    <Link href="/login">Sign in to your account</Link>
                  </Button>
                </>
              )}
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-6">
              <div>
                <dt className="text-xs text-muted-foreground font-semibold">Bedside Log</dt>
                <dd className="text-2xl font-extrabold text-foreground">7-Step</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground font-semibold">Board prep</dt>
                <dd className="text-2xl font-extrabold text-foreground">CBT & OSCE</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground font-semibold">Integrations</dt>
                <dd className="text-2xl font-extrabold text-foreground">Supabase</dd>
              </div>
            </dl>
          </div>

          {/* Device mockup */}
          <div className="relative">
            <div className="absolute -inset-8 -z-10 rounded-3xl bg-primary/5 blur-2xl" />
            <Card className="mx-auto w-full max-w-sm overflow-hidden p-0 shadow-xl border border-border/80">
              <div className="border-b border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">CBT Exam Prep</p>
                    <p className="font-bold">National Board Simulation</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active Hub
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[85%] rounded-full bg-emerald-500" />
                </div>
              </div>
              <div className="space-y-3 p-4 text-sm font-medium">
                <MockField label="Exam" value="National Board Practice" />
                <MockField label="Categories" value="10 Subspecialties" />
                <MockField label="Time Limit" value="180 Minutes" />
                <MockField label="AI Features" value="Question Generator" highlight />
                <MockField label="Media" value="Image Support (CVC/ETT)" />
                <MockField label="Explanations" value="Full Clinical Insights" />
              </div>
              <div className="flex items-center justify-between border-t border-border bg-muted/40 p-3">
                <Button variant="ghost" size="sm" className="font-semibold">
                  Dashboard
                </Button>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Start Exam</Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold text-primary uppercase tracking-wider">Integrated Clinical Platform</p>
            <h2 className="mt-2 text-balance text-3xl font-extrabold tracking-tight md:text-4xl text-foreground">
              Anesthesiology Reference & Training Ecosystem
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground font-medium text-sm">
              Designed specifically for residents, anesthesia practitioners, and clinical researchers to streamline bedside logging, prepare for national assessments, and collaborate on study material.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Smartphone className="h-5 w-5" />}
              title="Clinical Case Logger"
              description="7-step structured entry workflow designed for quick bedside recording, with automatic BMI estimation and comprehensive organ systems check (B1-B6)."
            />
            <FeatureCard
              icon={<GraduationCap className="h-5 w-5" />}
              title="CBT Exam Simulator"
              description="Take timed, subspecialty-specific board practice exams. Features LaTeX formatting, instant grading, and in-depth clinical rationales."
            />
            <FeatureCard
              icon={<Stethoscope className="h-5 w-5" />}
              title="OSCE Prep Station"
              description="Simulate real-world clinical OSCE scenarios with interactive AI patient scenarios, countdown timers, and automated examiner checklist check-offs."
            />
            <FeatureCard
              icon={<Pill className="h-5 w-5" />}
              title="Pharmacology Library"
              description="Quickly search a generic drug database detailing dosages, induction agent parameters, infusion concentrations, and pediatric scaling."
            />
            <FeatureCard
              icon={<BookOpenText className="h-5 w-5" />}
              title="Guidelines Reference"
              description="Browse official medical guidelines directly. Quick access for ASA Difficult Airway algorithms, Sepsis guidelines, and emergency LAST protocols."
            />
            <FeatureCard
              icon={<Share2 className="h-5 w-5" />}
              title="Collaborative Peer Hub"
              description="Publish custom CBT packages and OSCE scenarios, write comments on discussions, and view peer ratings inside the community hubs."
            />
            <FeatureCard
              icon={<Database className="h-5 w-5" />}
              title="Secure Media Uploads"
              description="Attach custom graphics, CVC traces, or ETT chest X-rays to your custom cases and exam questions securely using Supabase Storage buckets."
            />
            <FeatureCard
              icon={<User className="h-5 w-5" />}
              title="Personal User Profiles"
              description="Display medical credentials, roles, and bio profiles. Includes custom profile photo uploads with strict RLS permissions."
            />
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24 border-t border-border">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold text-primary uppercase tracking-wider">Exam Practice Workflow</p>
          <h2 className="mt-2 text-balance text-3xl font-extrabold tracking-tight md:text-4xl">
            Simulated Practice & Discussion
          </h2>
        </div>
        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: "01", t: "Select Simulation Material", d: "Choose from standard official packages/stations or create custom materials visually." },
            { n: "02", t: "Simulate Under Timed Pressure", d: "Practice with timed conditions matching board standards with interactive checklists." },
            { n: "03", t: "View Automated AI Evaluation", d: "Obtain scorecards, subspecialty diagnostics, and model-grade rationales instantly." },
            { n: "04", t: "Peer-to-Peer Discussions", d: "Share custom packages, rate community resources, and discuss complex clinical edge cases." },
          ].map((s) => (
            <li key={s.n} className="rounded-xl border border-border bg-card p-5 shadow-xs transition-all duration-300 hover:border-primary/20">
              <div className="font-mono text-sm font-extrabold text-primary">{s.n}</div>
              <div className="mt-2 font-bold text-foreground">{s.t}</div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-medium">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Roadmap & Future Expansion */}
      <section id="roadmap" className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Development Roadmap</p>
            <h2 className="mt-2 text-balance text-3xl font-extrabold tracking-tight md:text-4xl">
              Upcoming Enhancements
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground text-sm font-medium">
              We are constantly refining the platform to add offline capability and support your clinical operations.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Card className="p-6 border border-border bg-muted/20 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-3 right-3 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                Planning Phase
              </div>
              <div className="mt-2">
                <h3 className="font-bold text-base text-foreground">Bedside Offline Mode</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-medium">
                  Implement local-first syncing utilizing Service Workers and IndexedDB, allowing you to log anesthesia cases even in deep, network-shielded operating theaters.
                </p>
              </div>
            </Card>

            <Card className="p-6 border border-border bg-muted/20 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-3 right-3 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                Planning Phase
              </div>
              <div className="mt-2">
                <h3 className="font-bold text-base text-foreground">Advanced Anesthesia Calculators</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-medium">
                  Add NPO fluid deficit timers, Maximum Allowable Blood Loss (MABL) metrics, pediatric dosage adjusters, and localized emergency resuscitation mixing algorithms.
                </p>
              </div>
            </Card>

            <Card className="p-6 border border-border bg-muted/20 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-3 right-3 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wide">
                Under Review
              </div>
              <div className="mt-2">
                <h3 className="font-bold text-base text-foreground">Native Mobile App Containers</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-medium">
                  Deliver standalone native iOS and Android packages on the app stores for quick, secure biometric login and immediate bedside clinical utility.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <Card className="overflow-hidden border-0 bg-primary p-8 text-primary-foreground md:p-12 shadow-md">
            <div className="grid items-center gap-6 md:grid-cols-[2fr_1fr]">
              <div>
                <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
                  Start documenting and preparing today.
                </h2>
                <p className="mt-3 text-pretty text-primary-foreground/80 font-medium text-sm">
                  Join fellow anesthesia residents in logging cases, completing CBTs, and practicing OSCEs. Your credentials, your logs, your research.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                {isLoggedIn ? (
                  <Button asChild size="lg" variant="secondary" className="w-full md:w-auto font-bold shadow-xs">
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg" variant="secondary" className="w-full md:w-auto font-bold shadow-xs">
                      <Link href="/signup">Create your account</Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="ghost"
                      className="w-full text-primary-foreground hover:bg-primary-foreground/10 md:w-auto font-bold"
                    >
                      <Link href="/login">Sign in</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 text-xs text-muted-foreground md:flex-row md:px-6">
          <div className="flex items-center gap-3">
            <Logo height={24} href={null} />
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
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className="flex flex-col gap-3 p-6 border border-border bg-card transition-all duration-300 hover:border-primary/20 hover:shadow-xs">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-bold text-foreground text-sm">{title}</h3>
      <p className="text-xs leading-relaxed text-muted-foreground font-medium">{description}</p>
    </Card>
  )
}

function MockField({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={
          "text-sm font-semibold " +
          (highlight ? "rounded-md bg-primary/10 px-2 py-0.5 text-primary" : "text-foreground")
        }
      >
        {value}
      </span>
    </div>
  )
}

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

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#workflow" className="hover:text-foreground">
              Workflow
            </a>
            <a href="#research" className="hover:text-foreground">
              For Research
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Button asChild size="sm">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
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
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-accent/40 px-3 py-1 text-xs font-medium text-accent-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Built for anesthesiologists & research teams
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">
              Log every anesthesia case.{" "}
              <span className="text-[color:var(--brand-crimson)]">Power your research.</span>
            </h1>
            <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
              A mobile-first case logger purpose-built for clinical documentation — structured
              seven-step workflow, automatic BMI calculation, and a clean interface that works at
              the bedside.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {isLoggedIn ? (
                <Button asChild size="lg" className="gap-2">
                  <Link href="/dashboard">
                    Go to your cases
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="gap-2">
                    <Link href="/signup">
                      Start logging cases
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/login">I already have an account</Link>
                  </Button>
                </>
              )}
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-6">
              <div>
                <dt className="text-xs text-muted-foreground">Form steps</dt>
                <dd className="text-2xl font-semibold">7</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Data fields</dt>
                <dd className="text-2xl font-semibold">50+</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Secured by</dt>
                <dd className="text-2xl font-semibold">RLS</dd>
              </div>
            </dl>
          </div>

          {/* Device mockup */}
          <div className="relative">
            <div className="absolute -inset-8 -z-10 rounded-3xl bg-primary/5 blur-2xl" />
            <Card className="mx-auto w-full max-w-sm overflow-hidden p-0 shadow-xl">
              <div className="border-b border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Case #1287</p>
                    <p className="font-semibold">General Anesthesia</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Step 3 of 7
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[43%] rounded-full bg-primary" />
                </div>
              </div>
              <div className="space-y-3 p-4 text-sm">
                <MockField label="Patient" value="J. Doe · M · 54y" />
                <MockField label="Weight / Height" value="78 kg · 175 cm" />
                <MockField label="BMI (auto)" value="25.5" highlight />
                <MockField label="Diagnosis" value="Acute cholecystitis" />
                <MockField label="B1 Airway" value="Patent, Mallampati II" />
                <MockField label="Room" value="OT-4" />
              </div>
              <div className="flex items-center justify-between border-t border-border bg-muted/40 p-3">
                <Button variant="ghost" size="sm">
                  Back
                </Button>
                <Button size="sm">Continue</Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-primary">Features</p>
            <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Everything you need to document a case
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground">
              From pre-op assessment to post-op monitoring — structured fields matching real
              clinical workflows.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <FeatureCard
              icon={<Smartphone className="h-5 w-5" />}
              title="Mobile-first"
              description="Designed for use at the bedside. Large touch targets, legible typography, and generous spacing."
            />
            <FeatureCard
              icon={<ClipboardList className="h-5 w-5" />}
              title="7-step wizard"
              description="Break extensive data entry into manageable steps. Navigate freely and save drafts at any time."
            />
            <FeatureCard
              icon={<Activity className="h-5 w-5" />}
              title="Auto BMI calc"
              description="Real-time BMI calculation updates as you enter weight and height. No manual math."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Secure by default"
              description="Row-level security ensures clinicians only see their own cases. Ready for Supabase."
            />
            <FeatureCard
              icon={<Database className="h-5 w-5" />}
              title="Research-ready"
              description="Structured schema exports cleanly to PostgreSQL. Perfect for big-data medical studies."
            />
            <FeatureCard
              icon={<LineChart className="h-5 w-5" />}
              title="Complete coverage"
              description="B1–B6 exam, investigations, anesthesia regimen, intra-op monitoring, and post-op tracking."
            />
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Workflow</p>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            A clinical workflow, step by step
          </h2>
        </div>
        <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { n: "01", t: "General & Patient", d: "Procedure date, demographics, vitals, BMI." },
            { n: "02", t: "Clinical Assessment", d: "Diagnosis, procedure, subjective history." },
            { n: "03", t: "Objective B1–B6", d: "Airway, CV, neuro, urine, abdomen, temp." },
            { n: "04", t: "Investigations", d: "Labs, imaging, assessment, planning." },
            { n: "05", t: "Anesthesia Regimen", d: "Pre-induction, induction, maintenance." },
            { n: "06", t: "Intra-Operative", d: "Ventilator, hemodynamics, fluids, bleeding." },
            { n: "07", t: "Post-Operative", d: "PACU room, hemodynamics, labs." },
            { n: "→", t: "Exported", d: "Saved for research, review, and audit." },
          ].map((s) => (
            <li key={s.n} className="rounded-lg border border-border bg-card p-5">
              <div className="font-mono text-xs text-primary">{s.n}</div>
              <div className="mt-2 font-semibold">{s.t}</div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section id="research" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <Card className="overflow-hidden border-0 bg-primary p-8 text-primary-foreground md:p-12">
            <div className="grid items-center gap-6 md:grid-cols-[2fr_1fr]">
              <div>
                <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                  Start building your case database today.
                </h2>
                <p className="mt-3 text-pretty text-primary-foreground/80">
                  Free to sign up. Your cases, your data, your research.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                {isLoggedIn ? (
                  <Button asChild size="lg" variant="secondary" className="w-full md:w-auto">
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg" variant="secondary" className="w-full md:w-auto">
                      <Link href="/signup">Create your account</Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="ghost"
                      className="w-full text-primary-foreground hover:bg-primary-foreground/10 md:w-auto"
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
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:px-6">
          <div className="flex items-center gap-3">
            <Logo height={24} href={null} />
            <span>· for medical research</span>
          </div>
          <p>© {new Date().getFullYear()} AnesthesiApp. All rights reserved.</p>
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
    <Card className="flex flex-col gap-3 p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
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
          "text-sm font-medium " +
          (highlight ? "rounded-md bg-primary/10 px-2 py-0.5 text-primary" : "text-foreground")
        }
      >
        {value}
      </span>
    </div>
  )
}

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
                <dt className="text-xs text-muted-foreground">CBT Questions</dt>
                <dd className="text-2xl font-semibold">100+</dd>
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
                    <p className="text-xs text-muted-foreground">CBT Exam Prep</p>
                    <p className="font-semibold">National Board Simulation</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active Hub
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[85%] rounded-full bg-emerald-500" />
                </div>
              </div>
              <div className="space-y-3 p-4 text-sm">
                <MockField label="Exam" value="National Board Practice" />
                <MockField label="Categories" value="10 Subspecialties" />
                <MockField label="Time Limit" value="180 Minutes" />
                <MockField label="AI Features" value="Question Generator" highlight />
                <MockField label="Media" value="Image Support (CVC/ETT)" />
                <MockField label="Explanations" value="Full Clinical Insights" />
              </div>
              <div className="flex items-center justify-between border-t border-border bg-muted/40 p-3">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">Start Exam</Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-primary">Integrated Platform</p>
            <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Core Features & Anesthesiology Ecosystem
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground">
              Designed specifically for residents, anesthesiologists, and academic researchers to document cases, prepare for board exams, and collaborate.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <FeatureCard
              icon={<Smartphone className="h-5 w-5" />}
              title="Clinical Case Logger (7-Step)"
              description="Portable clinical case documentation for the operating room and wards, featuring automated BMI calculation, detailed system reviews (B1-B6), and post-op summaries."
            />
            <FeatureCard
              icon={<LineChart className="h-5 w-5" />}
              title="CBT Exams & Simulation"
              description="Access standard board-level exams with interactive reviews, covering all 10 major anesthesiology subspecialties."
            />
            <FeatureCard
              icon={<ClipboardList className="h-5 w-5" />}
              title="Visual Builder & AI / JSON"
              description="Build custom exam packages manually, upload standard JSON with LaTeX support, or generate questions automatically using AI."
            />
            <FeatureCard
              icon={<Database className="h-5 w-5" />}
              title="Image Attachments & Storage"
              description="Store and attach clinical images (such as ETT positioning or CVC readings) directly to enrich question context and explanations."
            />
            <FeatureCard
              icon={<Activity className="h-5 w-5" />}
              title="Community Hub & Discussions"
              description="Share exam packages, rate others, and discuss complex clinical questions collaboratively with colleagues."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Secure & Private Research Data"
              description="Powered by Supabase Row-Level Security (RLS) to ensure your clinical logs and custom packages are private, secure, and encrypted."
            />
          </div>
        </div>
      </section>

      {/* Roadmap & Future Expansion */}
      <section id="roadmap" className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-emerald-500 font-bold">Development Roadmap</p>
            <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Upcoming Features (Coming Soon)
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground">
              We are actively developing additional clinical reference modules to fully equip your daily anesthesia practice.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6 border border-border bg-muted/20 relative overflow-hidden">
              <div className="absolute top-3 right-3 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 uppercase tracking-wide">
                In Development
              </div>
              <h3 className="font-bold text-lg text-foreground mt-2">Anesthesia Drug Library</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Quick access to anesthesiology drug dosages, continuous infusion calculations, pharmacodynamics of induction agents, muscle relaxants, and emergency drug mixing guidelines.
              </p>
            </Card>

            <Card className="p-6 border border-border bg-muted/20 relative overflow-hidden">
              <div className="absolute top-3 right-3 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 uppercase tracking-wide">
                In Development
              </div>
              <h3 className="font-bold text-lg text-foreground mt-2">Clinical Guidelines Library</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                A curated collection of vital clinical guidelines and algorithms (AHA ACLS/PALS, ASA Difficult Airway guidelines, Malignant Hyperthermia response, and LAST protocols).
              </p>
            </Card>

            <Card className="p-6 border border-border bg-muted/20 relative overflow-hidden">
              <div className="absolute top-3 right-3 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wide">
                Planning Phase
              </div>
              <h3 className="font-bold text-lg text-foreground mt-2">Advanced Anesthesia Calculators</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Interactive tools for calculating NPO fluid deficits/maintenance, Maximum Allowable Blood Loss (MABL), electrolyte corrections, and renal clearance estimations.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24 border-t border-border">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">CBT Exam Workflow</p>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            How CBT Prep Works
          </h2>
        </div>
        <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { n: "01", t: "Choose / Create Package", d: "Select from default packages or create one visually, via JSON, or powered by AI." },
            { n: "02", t: "Simulate Real Exams", d: "Practice with timed constraints matching national board conditions and question styles." },
            { n: "03", t: "Analyze Performance", d: "Identify weak areas across 10 subspecialties and view detailed score statistics." },
            { n: "04", t: "Discuss & Collaborate", d: "Discuss complex scenarios and explanations with peers via interactive comments." },
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

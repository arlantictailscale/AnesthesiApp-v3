import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { Footer } from "@/components/footer"
import { ArrowLeft, ShieldAlert, Key, HelpCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read AnesthesiApp's Privacy Policy. Learn how we anonymize patient case logs, secure your data via Supabase Row-Level Security (RLS), and handle Google OAuth authentication.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Logo height={28} />
          <Button asChild variant="ghost" size="sm" className="font-semibold gap-1">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-10 md:py-16">
        <article className="flex flex-col gap-6">
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Privacy & Compliance
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Privacy Policy
            </h1>
            <p className="text-xs text-muted-foreground font-semibold">
              Last updated: June 1, 2026
            </p>
          </div>

          <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed space-y-6 font-medium text-sm">
            
            <p className="text-foreground font-semibold text-base">
              AnesthesiApp ("we", "our", or "us") operates the AnesthesiApp web application. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
            </p>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5 border-b pb-1.5">
                <Key className="h-4 w-4 text-primary" /> 1. Information Collection and Use
              </h2>
              <p>
                We collect several different types of information for various purposes to provide and improve our clinical simulation and case logging Service to you.
              </p>
              <h3 className="font-bold text-foreground mt-2">Types of Data Collected:</h3>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Personal Profile Information (Google OAuth)</strong>: When registering or authenticating via Google Sign-In, we collect your email address, full name, and your Google account profile picture URL. This is used solely to construct your account and customize your dashboard.
                </li>
                <li>
                  <strong>Clinical Case Logs</strong>: Information regarding the cases you document (procedure details, anesthetics used, diagnostics, post-operative outcome rooms, and optional attached clinical images). <strong>All clinical logs must be fully anonymized or fictionalized by the user. You must never upload real-world Patient Names, actual Medical Record Numbers (MRN), or any other direct patient identifiers anywhere in the application.</strong>
                </li>
                <li>
                  <strong>Simulation Statistics</strong>: History of your CBT exam answers, OSCE completion checklists, scores, time elapsed, and reviews or discussion board comments.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5 border-b pb-1.5">
                2. Supabase Storage & Data Encryption
              </h2>
              <p>
                All data is stored securely using Supabase database tables and storage systems.
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Row-Level Security (RLS)</strong>: The database implements strict Row-Level Security policies. This ensures that your private case logs and custom test questions are accessible only to you.</li>
                <li><strong>Storage Buckets</strong>: Images attached to CBT questions or your user profile avatar are uploaded to secure Supabase storage buckets. Avatar updates are restricted to folders matching your user UUID.</li>
                <li><strong>TLS/SSL Encryption</strong>: All network traffic between your browser and the Supabase API is encrypted using secure protocols.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5 border-b pb-1.5">
                3. Use of Google OAuth Scopes
              </h2>
              <p>
                AnesthesiApp uses Google OAuth APIs to authenticate users. We strictly limit our request to basic profile scopes:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><code>openid</code>: To verify account authenticity.</li>
                <li><code>https://www.googleapis.com/auth/userinfo.email</code>: To access your email address and associate your clinical logs to a verified identity.</li>
                <li><code>https://www.googleapis.com/auth/userinfo.profile</code>: To fetch your name and profile avatar, preventing local database duplicates and streamlining account creation.</li>
              </ul>
              <p className="font-semibold text-foreground">
                We do not request offline API access, Google Drive files, or calendar read/writes. We do not sell or share Google Auth profiles with any advertisement networks or third parties.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5 border-b pb-1.5">
                4. Cookies & Local Storage
              </h2>
              <p>
                We use cookies and local storage tokens to keep you logged in and preserve session credentials.
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Session Cookies</strong>: Required for Supabase Auth to track tokens (access tokens and refresh tokens) across page transitions.</li>
                <li><strong>Local Storage Drafts</strong>: Used locally on your device to auto-save case logging wizard forms, preventing data loss if you refresh the browser mid-procedure.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5 border-b pb-1.5">
                5. User Rights & Data Deletion
              </h2>
              <p>
                We respect your privacy and give you full control over your information.
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Access and Export</strong>: You can browse all your logged cases directly inside your personal dashboard page.</li>
                <li><strong>Account Deletion</strong>: If you decide to remove your account, you have the right to request a complete wipe of all your case logs, profile credentials, CBT/OSCE attempts, and storage bucket files.</li>
              </ul>
              <p>
                To request account deletion, please send an email from your registered address to <a href="mailto:support@anesthesiapp.my.id" className="text-primary hover:underline font-bold">support@anesthesiapp.my.id</a>. We will verify and purge all associated records from the Supabase databases within 7 business days.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5 border-b pb-1.5">
                6. Changes to Privacy Policy
              </h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="space-y-3 pt-4 border-t">
              <p className="font-bold text-foreground flex items-center gap-1">
                <HelpCircle className="h-4 w-4 text-primary" /> Questions & Support
              </p>
              <p>
                For questions regarding data processing, to submit a GDPR/UU PDP/HIPAA deletion request, or to report accidental PII uploads, please reach out directly to our support team at <a href="mailto:support@anesthesiapp.my.id" className="text-primary hover:underline font-bold">support@anesthesiapp.my.id</a>.
              </p>
            </section>

          </div>
        </article>
      </main>
      <Footer tagline="· legal privacy" containerClassName="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-muted-foreground md:flex-row" />
    </div>
  )
}

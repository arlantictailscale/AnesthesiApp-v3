import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { ArrowLeft, ShieldCheck, Scale, FileText } from "lucide-react"

export default function TermsOfServicePage() {
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
              <Scale className="h-5 w-5 text-primary" />
              Legal Agreements
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Terms of Service
            </h1>
            <p className="text-xs text-muted-foreground font-semibold">
              Last updated: June 1, 2026
            </p>
          </div>

          <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed space-y-6 font-medium text-sm">
            
            <p className="text-foreground font-semibold text-base">
              Please read these Terms of Service ("Terms") carefully before using the AnesthesiApp web application (the "Service") operated by AnesthesiApp ("us", "we", or "our").
            </p>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5 border-b pb-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" /> 1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service. These terms apply to all visitors, authenticated users, and others who access the Service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[color:var(--brand-crimson)] flex items-center gap-1.5 border-b pb-1.5">
                <FileText className="h-4 w-4 text-[color:var(--brand-crimson)]" /> 2. Medical Disclaimer
              </h2>
              <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10 text-red-700 space-y-2">
                <p className="font-bold uppercase tracking-wider text-xs">CRITICAL WARNING FOR CLINICAL USE</p>
                <p className="text-xs leading-normal">
                  AnesthesiApp is an educational simulation, exam preparation, and clinical research logging platform. It is <strong>NOT</strong> a certified medical device, electronic health record (EHR) system, or clinical decision support tool. It does <strong>NOT</strong> provide medical advice, diagnosis, or treatment protocols.
                </p>
                <p className="text-xs leading-normal">
                  Dosages, guidelines, and drug formulas provided in the Pharmacology and Guidelines modules are for educational review only. Never rely on the outputs of this application for actual patient care or clinical management. Always consult official hospital formularies, drug inserts, and certified clinical guidelines.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5 border-b pb-1.5">
                3. Patient Data & Anonymization Policy
              </h2>
              <p>
                As a user logging clinical cases, you are strictly responsible for maintaining patient privacy and HIPAA compliance (or regional equivalent laws).
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>You must <strong>NEVER</strong> enter personally identifiable information (PII) such as full patient names, exact home addresses, phone numbers, or actual national ID numbers in public fields.</li>
                <li>All case logs shared to the public Research Hub must be completely anonymized.</li>
                <li>We reserve the right to delete any logs containing suspect patient data or identified PII immediately.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5 border-b pb-1.5">
                4. Google Authentication & Data Access
              </h2>
              <p>
                We use Google Sign-In (OAuth 2.0) to authenticate user accounts. When you register or log in using Google Auth, we access specific scopes:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>email</strong>: Used to establish your unique account credentials, communicate important updates, and protect session tokens.</li>
                <li><strong>profile (name, avatar URL)</strong>: Used to customize your personal dashboard profile and display email prefixes or names on community packages you create (e.g. CBT packages, OSCE stations).</li>
              </ul>
              <p>
                We do not sell, rent, or lease your Google profile information to third parties. All authentication credentials are securely managed via Supabase Auth services.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5 border-b pb-1.5">
                5. User Contributions & Community Standards
              </h2>
              <p>
                You may upload case files, write comments, publish custom exam packages, and rate content ("Contributions"). By uploading content, you guarantee:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>You own the copyright or have licenses to use any images or text in your contributions (e.g. ECG graphs, reference materials).</li>
                <li>Your contributions do not violate safety rules or patient privacy regulations.</li>
                <li>Your comments on public discussion forums are clinical and professional.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5 border-b pb-1.5">
                6. Termination & Deletion
              </h2>
              <p>
                We may terminate or suspend access to our Service immediately, without prior notice, for any reason, including without limitation if you breach the Terms.
              </p>
              <p>
                If you wish to terminate your account and delete all associated profile and case data, you can contact us at <a href="mailto:support@anesthesiapp.my.id" className="text-primary hover:underline font-bold">support@anesthesiapp.my.id</a>. We will process your deletion request within 7 business days.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5 border-b pb-1.5">
                7. Changes to Terms
              </h2>
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
              </p>
            </section>

            <section className="space-y-3 pt-4 border-t">
              <p className="font-bold text-foreground">Contact Us</p>
              <p>
                If you have any questions about these Terms, please contact us at <a href="mailto:support@anesthesiapp.my.id" className="text-primary hover:underline font-bold">support@anesthesiapp.my.id</a>.
              </p>
            </section>

          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <Logo height={20} href={null} />
            <span>· legal terms</span>
          </div>
          <p>© {new Date().getFullYear()} AnesthesiApp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

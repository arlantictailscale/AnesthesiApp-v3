import Link from "next/link"
import { Logo } from "@/components/logo"

interface FooterProps {
  className?: string
  containerClassName?: string
  tagline?: string
}

export function Footer({
  className = "border-t border-border bg-muted/20 mt-auto",
  containerClassName = "mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-6 px-4 py-8 text-xs text-muted-foreground md:flex-row md:px-6",
  tagline = "· for medical training & clinical research"
}: FooterProps) {
  return (
    <footer className={className}>
      <div className={containerClassName}>
        <div className="flex items-center gap-3">
          <Logo height={20} href={null} />
          <span className="font-semibold">{tagline}</span>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-bold">
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>
          <a href="mailto:support@anesthesiapp.my.id" className="hover:underline">
            Contact Support
          </a>
        </div>

        <p className="font-semibold">
          © {new Date().getFullYear()} AnesthesiApp. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

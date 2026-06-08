import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/footer"
import { Logo } from "@/components/logo"

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 md:px-6">
          <Logo height={32} />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Authentication error</h1>
          <p className="text-muted-foreground">
            We couldn&apos;t complete your sign-in. The link may have expired or already been used.
          </p>
          <Button asChild>
            <Link href="/login">Back to login</Link>
          </Button>
        </div>
      </main>
      <Footer containerClassName="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-4 py-8 text-xs text-muted-foreground md:flex-row md:px-6" />
    </div>
  )
}

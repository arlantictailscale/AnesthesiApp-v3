import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6">
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
  )
}

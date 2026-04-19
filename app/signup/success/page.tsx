import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import { Mail } from "lucide-react"

export default async function SignUpSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 md:px-6">
          <Logo height={32} />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-6 md:p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-6 w-6" />
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
              <p className="text-sm text-muted-foreground text-pretty">
                We sent a confirmation link{email ? (
                  <> to <span className="font-medium text-foreground">{email}</span></>
                ) : null}. Click it to activate your account and sign in.
              </p>
            </div>
            <Button asChild className="mt-2 w-full">
              <Link href="/login">Back to sign in</Link>
            </Button>
          </div>
        </Card>
      </main>
    </div>
  )
}

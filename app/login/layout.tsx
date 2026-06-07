import { type Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Log in to your AnesthesiApp account to manage your bedside case logbook and access interactive board exam resources.",
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

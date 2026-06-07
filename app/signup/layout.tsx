import { type Metadata } from "next"

export const metadata: Metadata = {
  title: "Create Free Account",
  description: "Register a free account on AnesthesiApp to start logging clinical procedures, taking board practice tests, and tracking your training progress.",
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

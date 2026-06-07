import { type Metadata } from "next"

export const metadata: Metadata = {
  title: "CBT Board Exam Simulator",
  description: "Prepare for your national anesthesiology board assessments with our timed CBT simulators, covering 10 major subspecialties with detailed solutions.",
}

export default function CbtLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

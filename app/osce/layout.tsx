import { type Metadata } from "next"

export const metadata: Metadata = {
  title: "OSCE Clinical Exam Station Prep",
  description: "Simulate clinical OSCE exam stations with interactive patient roleplay scenarios, clinical checklists, examiner instructions, and timers.",
}

export default function OsceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

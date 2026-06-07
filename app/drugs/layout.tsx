import { type Metadata } from "next"

export const metadata: Metadata = {
  title: "Pharmacology & Drug Library",
  description: "Browse or search generic anesthesia drugs, dosages, induction parameters, infusion tables, and pediatric scaling equations for clinical training.",
}

export default function DrugsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

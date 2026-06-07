import { type Metadata } from "next"

export const metadata: Metadata = {
  title: "Anesthesiology Clinical Guidelines",
  description: "Browse official medical reference guidelines, including ASA Difficult Airway algorithms, Sepsis guidelines, and emergency LAST protocols.",
}

export default function GuidelinesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

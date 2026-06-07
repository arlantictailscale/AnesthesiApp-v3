import { type Metadata } from "next"

export const metadata: Metadata = {
  title: "Clinical Research & Cases Hub",
  description: "Explore anonymized clinical anesthesia cases shared by peer practitioners for medical training, statistical research, and discussions.",
}

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: "AnesthesiApp — Anesthesia Case Logger & Exam Prep",
    template: "%s | AnesthesiApp",
  },
  description: "A mobile-first anesthesia case logging platform for clinical documentation, medical research, and national board CBT & OSCE exam preparation.",
  applicationName: "AnesthesiApp",
  authors: [{ name: "AnesthesiApp Team" }],
  generator: "Next.js",
  keywords: [
    "anesthesia logbook",
    "anesthesiology case logger",
    "clinical documentation",
    "medical logbook",
    "anesthesiology resident",
    "anesthesia CBT simulator",
    "anesthesia OSCE practice",
    "drug database",
    "medical guidelines reference"
  ],
  referrer: "origin-when-cross-origin",
  creator: "AnesthesiApp Team",
  publisher: "AnesthesiApp",
  metadataBase: new URL("https://anesthesiapp.my.id"),
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AnesthesiApp — Anesthesia Case Logger & Exam Prep",
    description: "Bedside anesthesia case logger, national board CBT & OSCE prep, pharmacology database, and clinical guidelines reference.",
    url: "https://anesthesiapp.my.id",
    siteName: "AnesthesiApp",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AnesthesiApp — Anesthesia Case Logger & Exam Prep",
    description: "Bedside anesthesia case logger, national board CBT & OSCE prep, pharmacology database, and clinical guidelines reference.",
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}

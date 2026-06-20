"use client"

import { Sparkles, Award, Star, ShieldCheck } from "lucide-react"

export type SupporterTier = 'none' | 'backer' | 'sponsor' | 'gold sponsor' | 'platinum sponsor' | 'diamond sponsor'

interface SupporterBadgeProps {
  tier?: string | null
  className?: string
}

export function SupporterBadge({ tier, className = "" }: SupporterBadgeProps) {
  if (!tier || tier === 'none') return null

  const normalizedTier = tier.toLowerCase().replace(/_/g, " ") as SupporterTier

  switch (normalizedTier) {
    case 'backer':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary shrink-0 select-none ${className}`}>
          <Star className="h-3 w-3 fill-current" /> Backer
        </span>
      )
    case 'sponsor':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 select-none ${className}`}>
          <Award className="h-3 w-3 fill-current" /> Sponsor
        </span>
      )
    case 'gold sponsor':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 px-2 py-0.5 text-[10px] font-extrabold text-yellow-600 dark:text-yellow-400 shrink-0 select-none shadow-xs ${className}`}>
          <Sparkles className="h-3 w-3 fill-current" /> Gold Member
        </span>
      )
    case 'platinum sponsor':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-2 py-0.5 text-[10px] font-extrabold text-white shrink-0 select-none shadow-md ${className}`}>
          <ShieldCheck className="h-3 w-3" /> Platinum Member
        </span>
      )
    case 'diamond sponsor':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 px-2 py-0.5 text-[10px] font-extrabold text-white shrink-0 select-none shadow-lg animate-pulse ${className}`}>
          <Sparkles className="h-3 w-3 fill-current text-cyan-200" /> Diamond Member
        </span>
      )
    default:
      return null
  }
}

"use client"

import { Check } from "lucide-react"
import { STEP_TITLES } from "@/lib/schema"

export function Stepper({ 
  current, 
  onChangeStep 
}: { 
  current: number
  onChangeStep?: (step: number) => void 
}) {
  const pct = ((current + 1) / STEP_TITLES.length) * 100
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-primary">
          Step {current + 1} of {STEP_TITLES.length}
        </span>
        <span className="text-muted-foreground">{STEP_TITLES[current]}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="hidden items-center justify-between gap-2 md:flex">
        {STEP_TITLES.map((t, i) => {
          const isDone = i < current
          const isCurrent = i === current
          return (
            <li 
              key={t} 
              onClick={() => onChangeStep?.(i)}
              className="flex min-w-0 flex-1 items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity select-none"
            >
              <div
                className={
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium " +
                  (isDone
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                      ? "bg-primary/10 text-primary ring-2 ring-primary"
                      : "bg-muted text-muted-foreground")
                }
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={
                  "truncate text-xs " +
                  (isCurrent ? "font-medium text-foreground" : "text-muted-foreground")
                }
              >
                {t}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

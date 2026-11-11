"use client"

import { cn } from "cn"
import { TREMOR_COLOR_MAP, type TremorColor } from "./chart-colors"

interface ProgressBarProps {
  value: number
  label?: string
  showAnimation?: boolean
  color?: TremorColor
  className?: string
  tooltip?: string
}

export function ProgressBar({
  value,
  label,
  showAnimation = true,
  color = "blue",
  className,
  tooltip,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const barBg = TREMOR_COLOR_MAP[color].bg

  return (
    <div
      className={cn("flex w-full items-center gap-3", className)}
      title={tooltip}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            barBg,
            showAnimation && "transition-all duration-500 ease-out"
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {label ? (
        <span className="shrink-0 text-xs font-medium text-foreground tabular-nums">
          {label}
        </span>
      ) : null}
    </div>
  )
}

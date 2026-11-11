"use client"

import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react"
import { cn } from "cn"

export type DeltaType =
  | "increase"
  | "moderateIncrease"
  | "decrease"
  | "moderateDecrease"
  | "unchanged"

interface BadgeDeltaProps {
  deltaType?: DeltaType
  children: React.ReactNode
  isIncreasePositive?: boolean
  size?: "xs" | "sm" | "md"
  className?: string
}

export function BadgeDelta({
  deltaType = "unchanged",
  children,
  isIncreasePositive = true,
  size = "sm",
  className,
}: BadgeDeltaProps) {
  const isPositive =
    deltaType === "increase" || deltaType === "moderateIncrease"
  const isNegative =
    deltaType === "decrease" || deltaType === "moderateDecrease"

  let toneClasses =
    "bg-muted text-muted-foreground ring-1 ring-inset ring-border"
  if (deltaType !== "unchanged") {
    const good = isIncreasePositive ? isPositive : isNegative
    toneClasses = good
      ? "bg-(--tone-emerald-bg) text-(--tone-emerald-fg) ring-1 ring-inset ring-(--tone-emerald-border)"
      : "bg-(--tone-rose-bg) text-(--tone-rose-fg) ring-1 ring-inset ring-(--tone-rose-border)"
  }

  const sizeClasses =
    size === "xs"
      ? "px-1.5 py-0.5 text-[11px]"
      : size === "md"
        ? "px-2.5 py-1 text-xs"
        : "px-2 py-0.5 text-xs"

  const Icon = isPositive
    ? ArrowUpRight
    : isNegative
      ? ArrowDownRight
      : ArrowRight

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-(--radius-delta) font-medium tabular-nums whitespace-nowrap",
        toneClasses,
        sizeClasses,
        className
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </span>
  )
}

import * as React from "react"
import { cn } from "cn"
import { Card, CardContent } from "@/components/ui/card"
import { BadgeDelta, type DeltaType } from "@/components/tremor"

interface KpiCardProps {
  title: string
  value: string | number
  delta?: string
  deltaType?: DeltaType
  isIncreasePositive?: boolean
  subtitle?: string
  icon?: React.ReactNode
  className?: string
  footer?: React.ReactNode
}

export function KpiCard({
  title,
  value,
  delta,
  deltaType = "unchanged",
  isIncreasePositive = true,
  subtitle,
  icon,
  className,
  footer,
}: KpiCardProps) {
  return (
    <Card className={cn("py-4 transition-shadow hover:shadow-sm", className)}>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          {icon ? (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary dark:bg-primary/15">
              {icon}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {value}
          </span>
          {delta ? (
            <BadgeDelta
              deltaType={deltaType}
              isIncreasePositive={isIncreasePositive}
              size="xs"
            >
              {delta}
            </BadgeDelta>
          ) : null}
        </div>

        {subtitle ? (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        ) : null}

        {footer}
      </CardContent>
    </Card>
  )
}

"use client"

import * as React from "react"
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { cn } from "cn"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DEFAULT_CHART_COLORS,
  TREMOR_COLOR_MAP,
  type TremorColor,
} from "./chart-colors"

export interface DonutChartProps {
  data: Record<string, string | number>[]
  category: string
  index: string
  colors?: TremorColor[]
  valueFormatter?: (value: number) => string
  variant?: "donut" | "pie"
  showLegend?: boolean
  label?: string
  className?: string
  heightClassName?: string
}

const emptySubscribe = () => () => {}

function useIsClient() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

export function DonutChart({
  data,
  category,
  index,
  colors = DEFAULT_CHART_COLORS,
  valueFormatter = (v) => v.toLocaleString("en-US"),
  variant = "donut",
  showLegend = true,
  label,
  className,
  heightClassName = "h-56",
}: DonutChartProps) {
  const mounted = useIsClient()

  const total = React.useMemo(
    () => data.reduce((acc, item) => acc + Number(item[category] ?? 0), 0),
    [data, category]
  )

  return (
    <div className={cn("w-full min-w-0", className)}>
      <div className={cn("relative w-full min-w-0", heightClassName)}>
        {!mounted ? (
          <Skeleton className="h-full w-full rounded-full" />
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const item = payload[0]
                    return (
                      <div className="rounded-(--radius-control) border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-(--shadow-overlay)">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: item.payload?.fill }}
                          />
                          <span className="font-medium text-foreground">
                            {String(item.name)}
                          </span>
                          <span className="ml-2 font-semibold tabular-nums">
                            {valueFormatter(Number(item.value ?? 0))}
                          </span>
                        </div>
                      </div>
                    )
                  }}
                />
                <Pie
                  data={data}
                  dataKey={category}
                  nameKey={index}
                  cx="50%"
                  cy="50%"
                  innerRadius={variant === "donut" ? "64%" : 0}
                  outerRadius="88%"
                  paddingAngle={variant === "donut" ? 2 : 0}
                  strokeWidth={0}
                  isAnimationActive={false}
                >
                  {data.map((entry, idx) => {
                    const color = colors[idx % colors.length]
                    return (
                      <Cell
                        key={String(entry[index] ?? idx)}
                        fill={TREMOR_COLOR_MAP[color].fill}
                      />
                    )
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {variant === "donut" && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-display text-lg font-semibold tracking-tight text-foreground tabular-nums [[data-theme=studio]_&]:text-2xl">
                  {label ?? valueFormatter(total)}
                </span>
                <span className="text-[11px] text-muted-foreground">Total</span>
              </div>
            )}
          </>
        )}
      </div>

      {showLegend ? (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {data.map((entry, idx) => {
            const color = colors[idx % colors.length]
            const name = String(entry[index])
            const val = Number(entry[category] ?? 0)
            return (
              <div
                key={name}
                className="flex items-center justify-between gap-2 truncate"
              >
                <span className="flex items-center gap-1.5 truncate text-muted-foreground">
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      TREMOR_COLOR_MAP[color].bg
                    )}
                  />
                  <span className="truncate">{name}</span>
                </span>
                <span className="shrink-0 font-medium tabular-nums text-foreground">
                  {valueFormatter(val)}
                </span>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

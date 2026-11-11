"use client"

import * as React from "react"
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "cn"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DEFAULT_CHART_COLORS,
  TREMOR_COLOR_MAP,
  type TremorColor,
} from "./chart-colors"

export interface AreaChartProps {
  data: Record<string, string | number>[]
  index: string
  categories: string[]
  colors?: TremorColor[]
  valueFormatter?: (value: number) => string
  showLegend?: boolean
  showGridLines?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  yAxisWidth?: number
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

export function AreaChart({
  data,
  index,
  categories,
  colors = DEFAULT_CHART_COLORS,
  valueFormatter = (v) => v.toLocaleString("en-US"),
  showLegend = true,
  showGridLines = true,
  showXAxis = true,
  showYAxis = true,
  yAxisWidth = 54,
  className,
  heightClassName = "h-72",
}: AreaChartProps) {
  const mounted = useIsClient()
  const uid = React.useId().replace(/:/g, "")

  return (
    <div className={cn("w-full min-w-0", className)}>
      {showLegend ? (
        <div className="mb-3 flex flex-wrap items-center justify-end gap-4">
          {categories.map((cat, idx) => {
            const color = colors[idx % colors.length]
            return (
              <div key={cat} className="flex items-center gap-1.5 text-xs">
                <span
                  className={cn(
                    "size-2.5 rounded-full",
                    TREMOR_COLOR_MAP[color].bg
                  )}
                />
                <span className="text-muted-foreground">{cat}</span>
              </div>
            )
          })}
        </div>
      ) : null}

      <div className={cn("w-full min-w-0", heightClassName)}>
        {!mounted ? (
          <Skeleton className="h-full w-full rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <RechartsAreaChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                {categories.map((cat, idx) => {
                  const color = colors[idx % colors.length]
                  const hex = TREMOR_COLOR_MAP[color].fill
                  return (
                    <linearGradient
                      key={cat}
                      id={`area-${uid}-${idx}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor={hex} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={hex} stopOpacity={0.02} />
                    </linearGradient>
                  )
                })}
              </defs>
              {showGridLines ? (
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-border/60"
                />
              ) : null}
              {showXAxis ? (
                <XAxis
                  dataKey={index}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
              ) : null}
              {showYAxis ? (
                <YAxis
                  width={yAxisWidth}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => valueFormatter(Number(v))}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
              ) : null}
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
                      <div className="mb-1.5 font-medium text-foreground">
                        {String(label)}
                      </div>
                      <div className="space-y-1">
                        {payload.map((entry) => (
                          <div
                            key={String(entry.dataKey)}
                            className="flex items-center justify-between gap-4"
                          >
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              {String(entry.name)}
                            </span>
                            <span className="font-medium tabular-nums text-foreground">
                              {valueFormatter(Number(entry.value ?? 0))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }}
              />
              {categories.map((cat, idx) => {
                const color = colors[idx % colors.length]
                const stroke = TREMOR_COLOR_MAP[color].stroke
                return (
                  <Area
                    key={cat}
                    type="monotone"
                    dataKey={cat}
                    stroke={stroke}
                    strokeWidth={2}
                    fill={`url(#area-${uid}-${idx})`}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                )
              })}
            </RechartsAreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

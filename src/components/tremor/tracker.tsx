"use client"

import { cn } from "cn"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface TrackerBlock {
  key?: string
  color?: string
  tooltip?: string
}

interface TrackerProps {
  data: TrackerBlock[]
  className?: string
}

export function Tracker({ data, className }: TrackerProps) {
  return (
    <div
      className={cn("flex h-8 w-full items-center gap-0.5 sm:gap-1", className)}
      role="list"
      aria-label="Status tracker"
    >
      {data.map((item, idx) => (
        <Tooltip key={item.key ?? idx}>
          <TooltipTrigger asChild>
            <div
              role="listitem"
              tabIndex={0}
              aria-label={item.tooltip ?? `Segment ${idx + 1}`}
              className={cn(
                "h-full flex-1 rounded-[3px] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                item.color ?? "bg-emerald-500"
              )}
            />
          </TooltipTrigger>
          {item.tooltip ? (
            <TooltipContent side="top" className="text-xs">
              {item.tooltip}
            </TooltipContent>
          ) : null}
        </Tooltip>
      ))}
    </div>
  )
}

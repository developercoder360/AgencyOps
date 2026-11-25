"use client"

import * as React from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "cn"

interface TablePickerProps {
  onSelect: (rows: number, cols: number) => void
  trigger: React.ReactNode
}

const MAX_GRID = 8

export function TablePicker({ onSelect, trigger }: TablePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [hoverRows, setHoverRows] = React.useState(3)
  const [hoverCols, setHoverCols] = React.useState(3)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="w-auto space-y-2 p-2.5">
        <div className="flex items-center justify-between text-xs font-medium">
          <span>Insert Table</span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {hoverRows} × {hoverCols}
          </span>
        </div>

        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${MAX_GRID}, 1fr)` }}
        >
          {Array.from({ length: MAX_GRID * MAX_GRID }).map((_, idx) => {
            const r = Math.floor(idx / MAX_GRID) + 1
            const c = (idx % MAX_GRID) + 1
            const active = r <= hoverRows && c <= hoverCols
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                aria-label={`Insert ${r} by ${c} table`}
                onMouseEnter={() => {
                  setHoverRows(r)
                  setHoverCols(c)
                }}
                onClick={() => {
                  onSelect(r, c)
                  setOpen(false)
                }}
                className={cn(
                  "size-4 rounded-[3px] border transition-colors",
                  active
                    ? "border-primary bg-primary/25"
                    : "border-border bg-muted/40 hover:border-primary/60"
                )}
              />
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

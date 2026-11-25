"use client"

import * as React from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getRecentColors, pushRecentColor } from "./utils"

const DEFAULT_PALETTE = [
  "#000000",
  "#475569",
  "#DC2626",
  "#EA580C",
  "#D97706",
  "#16A34A",
  "#0D9488",
  "#2563EB",
  "#4F46E5",
  "#9333EA",
  "#DB2777",
  "#E11D48",
]

const HIGHLIGHT_PALETTE = [
  "#FEF08A",
  "#FDE68A",
  "#FED7AA",
  "#FECACA",
  "#BBF7D0",
  "#99F6E4",
  "#BFDBFE",
  "#C7D2FE",
  "#E9D5FF",
  "#FBCFE8",
  "#E2E8F0",
  "#F3F4F6",
]

interface ColorPickerProps {
  mode: "text" | "highlight"
  currentColor?: string
  onSelect: (color: string | null) => void
  trigger: React.ReactNode
}

export function ColorPicker({
  mode,
  currentColor,
  onSelect,
  trigger,
}: ColorPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [hex, setHex] = React.useState(currentColor ?? "")
  const [recent, setRecent] = React.useState<string[]>([])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setHex(currentColor ?? "")
      setRecent(getRecentColors())
    }
  }

  const palette = mode === "highlight" ? HIGHLIGHT_PALETTE : DEFAULT_PALETTE

  function applyColor(color: string) {
    const updated = pushRecentColor(color)
    setRecent(updated)
    onSelect(color)
    setOpen(false)
  }

  function handleCustomApply() {
    const cleaned = hex.trim()
    if (/^#[0-9A-Fa-f]{3,8}$/.test(cleaned)) {
      applyColor(cleaned)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="w-60 space-y-2.5 p-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">
            {mode === "highlight" ? "Highlight Color" : "Text Color"}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => {
              onSelect(null)
              setOpen(false)
            }}
            className="h-6 gap-1 px-1.5 text-[11px] text-muted-foreground"
          >
            <RotateCcw className="size-3" />
            Default
          </Button>
        </div>

        <div className="grid grid-cols-6 gap-1.5">
          {palette.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => applyColor(c)}
              aria-label={`Select color ${c}`}
              style={{ backgroundColor: c }}
              className="size-6 rounded border border-border transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          ))}
        </div>

        {recent.length > 0 ? (
          <div className="space-y-1">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Recent
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recent.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => applyColor(c)}
                  aria-label={`Select recent color ${c}`}
                  style={{ backgroundColor: c }}
                  className="size-5 rounded border border-border"
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-1.5 pt-0.5">
          <Input
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleCustomApply()
              }
            }}
            placeholder="#2563EB"
            aria-label="Custom hex color"
            className="h-7 flex-1 font-mono text-xs"
          />
          <Button
            type="button"
            size="xs"
            onClick={handleCustomApply}
            disabled={!/^#[0-9A-Fa-f]{3,8}$/.test(hex.trim())}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

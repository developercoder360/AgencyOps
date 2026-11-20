"use client"

import * as React from "react"
import { Check, Plus, Search, Tag, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { RevisionFlag, TaskTagColor } from "@/types"
import { getTagChipClass, TAG_COLOR_OPTIONS } from "./types"

interface RevisionFlagPickerProps {
  value: string[]
  onChange: (flagIds: string[]) => void
  availableFlags: RevisionFlag[]
  onAddFlag?: (flag: { name: string; color: TaskTagColor }) => RevisionFlag
  disabled?: boolean
  className?: string
  ariaLabel?: string
}

export function RevisionFlagPicker({
  value = [],
  onChange,
  availableFlags = [],
  onAddFlag,
  disabled = false,
  className,
  ariaLabel = "Flags",
}: RevisionFlagPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [newFlagName, setNewFlagName] = React.useState("")
  const [newFlagColor, setNewFlagColor] = React.useState<TaskTagColor>("rose")

  const selectedFlags = React.useMemo(() => {
    return availableFlags.filter((f) => value.includes(f.id))
  }, [availableFlags, value])

  const filteredFlags = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return availableFlags
    return availableFlags.filter((f) => f.name.toLowerCase().includes(q))
  }, [availableFlags, search])

  function toggleFlag(flagId: string) {
    if (value.includes(flagId)) {
      onChange(value.filter((id) => id !== flagId))
    } else {
      onChange([...value, flagId])
    }
  }

  function removeFlag(flagId: string, e: React.MouseEvent) {
    e.stopPropagation()
    onChange(value.filter((id) => id !== flagId))
  }

  function handleCreateFlag(e: React.FormEvent) {
    e.preventDefault()
    const name = newFlagName.trim()
    if (!name || !onAddFlag) return

    // Check if flag with exact name already exists
    const existing = availableFlags.find(
      (f) => f.name.toLowerCase() === name.toLowerCase()
    )
    if (existing) {
      if (!value.includes(existing.id)) {
        onChange([...value, existing.id])
      }
      setNewFlagName("")
      return
    }

    const created = onAddFlag({ name, color: newFlagColor })
    if (created && created.id) {
      onChange([...value, created.id])
    }
    setNewFlagName("")
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex min-h-8 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background p-1.5">
        {selectedFlags.length === 0 ? (
          <span className="px-1 text-xs text-muted-foreground/70">
            No flags
          </span>
        ) : (
          selectedFlags.map((flag) => (
            <span
              key={flag.id}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
                getTagChipClass(flag.color)
              )}
            >
              <Tag className="size-2.5 opacity-70" />
              <span>{flag.name}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => removeFlag(flag.id, e)}
                  aria-label={`Remove flag ${flag.name}`}
                  className="rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <X className="size-2.5" />
                </button>
              )}
            </span>
          ))
        )}

        {!disabled && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 gap-1 rounded-full px-2 text-[11px] font-normal text-muted-foreground hover:text-foreground"
                aria-label={ariaLabel}
              >
                <Plus className="size-3" />
                <span>Add flag</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-2"
              align="start"
              sideOffset={4}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 rounded-md border border-input bg-muted/30 px-2 py-1">
                  <Search className="size-3 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search flags..."
                    className="h-6 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>

                <div className="max-h-40 overflow-y-auto space-y-0.5">
                  {filteredFlags.length === 0 ? (
                    <div className="p-2 text-center text-xs text-muted-foreground">
                      No matching flags
                    </div>
                  ) : (
                    filteredFlags.map((flag) => {
                      const isSelected = value.includes(flag.id)
                      return (
                        <button
                          key={flag.id}
                          type="button"
                          onClick={() => toggleFlag(flag.id)}
                          className={cn(
                            "flex w-full items-center justify-between rounded px-2 py-1 text-xs text-left transition-colors hover:bg-accent",
                            isSelected && "font-medium"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                "size-2 rounded-full",
                                TAG_COLOR_OPTIONS.find(
                                  (c) => c.color === flag.color
                                )?.swatchClass || "bg-rose-500"
                              )}
                            />
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[10px]",
                                getTagChipClass(flag.color)
                              )}
                            >
                              {flag.name}
                            </span>
                          </span>
                          {isSelected && (
                            <Check className="size-3.5 text-primary" />
                          )}
                        </button>
                      )
                    })
                  )}
                </div>

                {onAddFlag && (
                  <form
                    onSubmit={handleCreateFlag}
                    className="border-t border-border pt-2 space-y-2"
                  >
                    <div className="text-[11px] font-medium text-muted-foreground">
                      Create new flag
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        value={newFlagName}
                        onChange={(e) => setNewFlagName(e.target.value)}
                        placeholder="Flag name..."
                        className="h-7 text-xs"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!newFlagName.trim()}
                        className="h-7 px-2 text-xs"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex items-center gap-1 pt-0.5">
                      {TAG_COLOR_OPTIONS.map((opt) => (
                        <button
                          key={opt.color}
                          type="button"
                          title={opt.label}
                          onClick={() => setNewFlagColor(opt.color)}
                          className={cn(
                            "size-4 rounded-full transition-transform",
                            opt.swatchClass,
                            newFlagColor === opt.color
                              ? "ring-2 ring-primary ring-offset-1 scale-110"
                              : "opacity-70 hover:opacity-100"
                          )}
                        />
                      ))}
                    </div>
                  </form>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  )
}

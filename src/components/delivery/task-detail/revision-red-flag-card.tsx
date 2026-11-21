"use client"

import * as React from "react"
import { Check, ChevronDown, Flag, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { StaffUser } from "@/types"

interface RevisionRedFlagCardProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  value: string[]
  onChange: (flaggedUserIds: string[]) => void
  taskCollaborators: StaffUser[]
  disabled?: boolean
  error?: string
  className?: string
}

export function RevisionRedFlagCard({
  enabled,
  onEnabledChange,
  value = [],
  onChange,
  taskCollaborators,
  disabled = false,
  error,
  className,
}: RevisionRedFlagCardProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedCollaborators = React.useMemo(() => {
    return taskCollaborators.filter((u) => value.includes(u.id))
  }, [taskCollaborators, value])

  const filteredCollaborators = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return taskCollaborators
    return taskCollaborators.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    )
  }, [taskCollaborators, search])

  function toggleCollaborator(userId: string) {
    if (value.includes(userId)) {
      onChange(value.filter((id) => id !== userId))
    } else {
      onChange([...value, userId])
    }
  }

  function removeCollaborator(userId: string) {
    onChange(value.filter((id) => id !== userId))
  }

  function handleToggleCard() {
    if (disabled) return
    const next = !enabled
    onEnabledChange(next)
    if (!next) {
      onChange([])
      setOpen(false)
    }
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-rose-200/90 bg-rose-50/50 p-3.5 sm:p-4 transition-all dark:border-rose-900/40 dark:bg-rose-950/20",
        className
      )}
    >
      {/* Header matching reference screenshot */}
      <div className="flex items-start justify-between gap-3">
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={handleToggleCard}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              handleToggleCard()
            }
          }}
          className={cn(
            "flex items-start gap-2.5 flex-1 select-none",
            !disabled && "cursor-pointer"
          )}
        >
          <Flag className="size-4.5 text-rose-600 stroke-[2] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-rose-950 dark:text-rose-100 leading-tight">
              Mark as Red Flag
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Flag responsible collaborator(s) for this revision
            </p>
          </div>
        </div>

        <button
          type="button"
          role="checkbox"
          aria-checked={enabled}
          aria-label="Mark as Red Flag"
          disabled={disabled}
          onClick={handleToggleCard}
          className={cn(
            "size-5.5 rounded-md flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 shrink-0",
            enabled
              ? "bg-rose-500 text-white shadow-2xs hover:bg-rose-600"
              : "border-2 border-rose-300 bg-white hover:border-rose-400 dark:border-rose-700 dark:bg-zinc-900"
          )}
        >
          {enabled && <Check className="size-3.5 stroke-[3]" />}
        </button>
      </div>

      {/* When enabled: divider and collaborator select field */}
      {enabled && (
        <div className="mt-3.5 pt-3 border-t border-rose-200/80 dark:border-rose-900/50 space-y-1.5">
          <label className="text-xs font-semibold text-rose-700 dark:text-rose-400 block">
            Select Task Collaborator(s) to Red Flag <span className="text-destructive">*</span>
          </label>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={disabled}
                aria-label="Select task collaborators to red flag"
                aria-expanded={open}
                className={cn(
                  "flex min-h-9 w-full items-center justify-between gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground shadow-2xs transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-50",
                  error && "border-destructive focus-visible:ring-destructive"
                )}
              >
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  {selectedCollaborators.length === 0 ? (
                    <span className="text-xs text-muted-foreground font-normal">
                      Select collaborator(s)...
                    </span>
                  ) : (
                    selectedCollaborators.map((u) => (
                      <span
                        key={u.id}
                        className="inline-flex items-center gap-1 rounded-md border border-rose-200/80 bg-rose-100/60 pl-1.5 pr-1 py-0.5 text-[11px] font-medium text-rose-950 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-200"
                      >
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white",
                            u.avatarColor || "bg-rose-600"
                          )}
                        >
                          {u.avatarInitials}
                        </span>
                        <span className="max-w-[120px] truncate">{u.name}</span>
                        {!disabled && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation()
                              removeCollaborator(u.id)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                e.stopPropagation()
                                removeCollaborator(u.id)
                              }
                            }}
                            aria-label={`Remove ${u.name}`}
                            className="rounded-sm p-0.5 text-rose-700 hover:bg-rose-200 hover:text-rose-900 dark:text-rose-300 dark:hover:bg-rose-900 cursor-pointer"
                          >
                            <X className="size-2.5" />
                          </span>
                        )}
                      </span>
                    ))
                  )}
                </div>

                <ChevronDown className="size-4 shrink-0 text-muted-foreground/70 ml-2" />
              </button>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-72 p-2 z-[70]">
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute top-2 left-2.5 size-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search task collaborators..."
                  aria-label="Search task collaborators"
                  autoFocus
                  className="h-8 pl-8 text-xs"
                />
              </div>

              <div className="max-h-52 space-y-0.5 overflow-y-auto">
                {filteredCollaborators.length === 0 ? (
                  <p className="py-3 text-center text-xs text-muted-foreground">
                    No task collaborators found.
                  </p>
                ) : (
                  filteredCollaborators.map((u) => {
                    const isSelected = value.includes(u.id)
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleCollaborator(u.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500",
                          isSelected && "bg-rose-50 dark:bg-rose-950/40 font-medium"
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white",
                              u.avatarColor || "bg-rose-600"
                            )}
                          >
                            {u.avatarInitials}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">
                              {u.name}
                            </div>
                            <div className="truncate text-[10px] text-muted-foreground">
                              {u.role}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="size-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </PopoverContent>
          </Popover>

          {error && (
            <p className="text-[11px] font-medium text-destructive mt-1">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

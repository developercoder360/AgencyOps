"use client"

import * as React from "react"
import { Check, Flag, Plus, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { StaffUser } from "@/types"

interface RevisionFlaggedUserPickerProps {
  value: string[]
  onChange: (flaggedUserIds: string[]) => void
  users: StaffUser[]
  suggestedUserIds?: string[]
  disabled?: boolean
  className?: string
  ariaLabel?: string
}

export function RevisionFlaggedUserPicker({
  value = [],
  onChange,
  users,
  suggestedUserIds = [],
  disabled = false,
  className,
  ariaLabel = "Flag user",
}: RevisionFlaggedUserPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedUsers = React.useMemo(() => {
    return users.filter((u) => value.includes(u.id))
  }, [users, value])

  // Split into suggested (e.g. task assignees) vs other staff
  const { suggestedList, otherList } = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    const matchFilter = (u: StaffUser) => {
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      )
    }

    const suggested = users.filter(
      (u) => suggestedUserIds.includes(u.id) && matchFilter(u)
    )
    const other = users.filter(
      (u) => !suggestedUserIds.includes(u.id) && matchFilter(u)
    )

    return { suggestedList: suggested, otherList: other }
  }, [users, suggestedUserIds, search])

  function toggleUser(userId: string) {
    if (value.includes(userId)) {
      onChange(value.filter((id) => id !== userId))
    } else {
      onChange([...value, userId])
    }
  }

  function removeUser(userId: string, e: React.MouseEvent) {
    e.stopPropagation()
    onChange(value.filter((id) => id !== userId))
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Selected Chips */}
      <div className="flex min-h-8 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background p-1.5">
        <Flag className="size-3.5 shrink-0 text-destructive fill-destructive ml-1" />
        {selectedUsers.length === 0 ? (
          <span className="px-1 text-xs text-muted-foreground/70">
            No flagged staff
          </span>
        ) : (
          selectedUsers.map((u) => (
            <span
              key={u.id}
              className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 pl-1 pr-1.5 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:bg-destructive/15"
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white",
                  u.avatarColor || "bg-destructive"
                )}
              >
                {u.avatarInitials}
              </span>
              <span className="max-w-[120px] truncate">{u.name}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => removeUser(u.id, e)}
                  aria-label={`Remove flag from ${u.name}`}
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                variant="ghost"
                size="sm"
                className="h-6 gap-1 rounded-full px-2 text-[11px] font-normal text-muted-foreground hover:text-foreground"
                aria-label={ariaLabel}
              >
                <Plus className="size-3" />
                <span>Flag staff</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-72 p-2"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search staff..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 pl-8 text-xs"
                    autoFocus
                  />
                </div>

                <div className="max-h-56 space-y-2 overflow-y-auto pr-1 text-xs">
                  {suggestedList.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Task Assignees (Suggested)
                      </div>
                      <div className="space-y-0.5">
                        {suggestedList.map((u) => {
                          const isSelected = value.includes(u.id)
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => toggleUser(u.id)}
                              className={cn(
                                "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted",
                                isSelected && "bg-muted/70 font-medium"
                              )}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span
                                  className={cn(
                                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
                                    u.avatarColor || "bg-blue-600"
                                  )}
                                >
                                  {u.avatarInitials}
                                </span>
                                <div className="truncate">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate">{u.name}</span>
                                    {u.redFlagCount > 0 && (
                                      <span className="inline-flex items-center gap-0.5 text-[10px] text-destructive font-mono">
                                        <Flag className="size-2.5 fill-destructive" />
                                        {u.redFlagCount}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground truncate">
                                    {u.role}
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="size-3.5 shrink-0 text-primary" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {otherList.length > 0 && (
                    <div>
                      {suggestedList.length > 0 && (
                        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Other Staff
                        </div>
                      )}
                      <div className="space-y-0.5">
                        {otherList.map((u) => {
                          const isSelected = value.includes(u.id)
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => toggleUser(u.id)}
                              className={cn(
                                "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted",
                                isSelected && "bg-muted/70 font-medium"
                              )}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span
                                  className={cn(
                                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
                                    u.avatarColor || "bg-blue-600"
                                  )}
                                >
                                  {u.avatarInitials}
                                </span>
                                <div className="truncate">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate">{u.name}</span>
                                    {u.redFlagCount > 0 && (
                                      <span className="inline-flex items-center gap-0.5 text-[10px] text-destructive font-mono">
                                        <Flag className="size-2.5 fill-destructive" />
                                        {u.redFlagCount}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground truncate">
                                    {u.role}
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="size-3.5 shrink-0 text-primary" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {suggestedList.length === 0 && otherList.length === 0 && (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      No staff members found.
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  )
}

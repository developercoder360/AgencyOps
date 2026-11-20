"use client"

import * as React from "react"
import { Check, Plus, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { StaffUser } from "@/types"

interface RevisionAssigneePickerProps {
  value: string[]
  onChange: (assigneeIds: string[]) => void
  users: StaffUser[]
  disabled?: boolean
  className?: string
  ariaLabel?: string
}

export function RevisionAssigneePicker({
  value = [],
  onChange,
  users,
  disabled = false,
  className,
  ariaLabel = "Assignees",
}: RevisionAssigneePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedUsers = React.useMemo(() => {
    return users.filter((u) => value.includes(u.id))
  }, [users, value])

  const filteredUsers = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    )
  }, [users, search])

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
        {selectedUsers.length === 0 ? (
          <span className="px-1 text-xs text-muted-foreground/70">
            Unassigned
          </span>
        ) : (
          selectedUsers.map((u) => (
            <span
              key={u.id}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 pl-1 pr-1.5 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white",
                  u.avatarColor || "bg-blue-600"
                )}
              >
                {u.avatarInitials}
              </span>
              <span className="max-w-[120px] truncate">{u.name}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => removeUser(u.id, e)}
                  aria-label={`Remove assignee ${u.name}`}
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                size="xs"
                aria-label={ariaLabel}
                className="h-6 gap-1 rounded-full border border-dashed border-border px-2 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <Plus className="size-3" />
                <span>Assign</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-2 z-[70]">
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute top-2 left-2.5 size-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search staff…"
                  aria-label="Search staff"
                  className="h-7 pl-8 text-xs"
                />
              </div>

              <div className="max-h-48 space-y-0.5 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="py-3 text-center text-xs text-muted-foreground">
                    No staff matched.
                  </p>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelected = value.includes(u.id)
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleUser(u.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isSelected && "bg-muted/70 font-medium"
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white",
                              u.avatarColor || "bg-blue-600"
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
                        {isSelected ? (
                          <Check className="size-3.5 shrink-0 text-primary" />
                        ) : null}
                      </button>
                    )
                  })
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  )
}

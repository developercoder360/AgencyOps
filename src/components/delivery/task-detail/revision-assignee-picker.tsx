"use client"

import * as React from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
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
  ariaLabel = "Assignee",
}: RevisionAssigneePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  // Single assignee selection
  const selectedUserId = value[0] || null
  const selectedUser = React.useMemo(() => {
    if (!selectedUserId) return null
    return users.find((u) => u.id === selectedUserId) || null
  }, [users, selectedUserId])

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

  function selectUser(userId: string) {
    // Single selection: selecting replaces the previous collaborator
    onChange([userId])
    setOpen(false)
    setSearch("")
  }

  function clearAssignee(e: React.MouseEvent) {
    e.stopPropagation()
    onChange([])
  }

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label={ariaLabel}
            aria-expanded={open}
            className={cn(
              "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground shadow-2xs transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              !selectedUser && "text-muted-foreground"
            )}
          >
            {selectedUser ? (
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white",
                    selectedUser.avatarColor || "bg-blue-600"
                  )}
                >
                  {selectedUser.avatarInitials}
                </span>
                <span className="truncate font-medium text-foreground">
                  {selectedUser.name}
                </span>
                <span className="truncate text-[10px] text-muted-foreground hidden sm:inline">
                  ({selectedUser.role})
                </span>
              </div>
            ) : (
              <span>Select collaborator...</span>
            )}

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {selectedUser && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={clearAssignee}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      clearAssignee(e as unknown as React.MouseEvent)
                    }
                  }}
                  aria-label="Clear assignee"
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="size-3.5" />
                </span>
              )}
              <ChevronDown className="size-3.5 text-muted-foreground/70" />
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-64 p-2 z-[70]">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute top-2 left-2.5 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff…"
              aria-label="Search staff"
              autoFocus
              className="h-8 pl-8 text-xs"
            />
          </div>

          <div className="max-h-52 space-y-0.5 overflow-y-auto">
            {selectedUser && (
              <button
                type="button"
                onClick={() => {
                  onChange([])
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
                <span>Unassign (no assignee)</span>
              </button>
            )}

            {filteredUsers.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">
                No staff matched.
              </p>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = selectedUserId === u.id
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => selectUser(u.id)}
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
                    {isSelected && (
                      <Check className="size-3.5 shrink-0 text-primary" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

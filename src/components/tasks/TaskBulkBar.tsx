"use client"

import * as React from "react"
import { Flag, Trash2, UserPlus, X } from "lucide-react"
import { TASK_PRIORITIES, TASK_STATUSES } from "@/components/delivery/task-detail"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { StaffUser, TaskPriority, TaskStatus } from "@/types"

interface TaskBulkBarProps {
  selectedCount: number
  users: StaffUser[]
  canManageStatus: boolean
  canEdit: boolean
  canAssign: boolean
  canDelete: boolean
  onClearSelection: () => void
  onBulkStatus: (status: TaskStatus) => void
  onBulkPriority: (priority: TaskPriority) => void
  onBulkAssign: (userId: string) => void
  onBulkDelete: () => void
}

export function TaskBulkBar({
  selectedCount,
  users,
  canManageStatus,
  canEdit,
  canAssign,
  canDelete,
  onClearSelection,
  onBulkStatus,
  onBulkPriority,
  onBulkAssign,
  onBulkDelete,
}: TaskBulkBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      role="region"
      aria-label="Bulk task actions"
      className="sticky bottom-4 z-30 mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/95 px-3.5 py-2.5 shadow-lg backdrop-blur-md"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold tabular-nums text-primary-foreground">
          {selectedCount}
        </span>
        <span className="text-xs font-medium text-foreground">
          task{selectedCount === 1 ? "" : "s"} selected
        </span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onClearSelection}
          className="text-muted-foreground"
        >
          <X className="size-3" />
          Clear
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {/* Bulk Status */}
        {canManageStatus ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="xs">
                Set Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Move selected to</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {TASK_STATUSES.map((s) => (
                <DropdownMenuItem key={s} onClick={() => onBulkStatus(s)}>
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button type="button" variant="outline" size="xs" disabled>
                  Set Status
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Requires tasks.manage_status permission</TooltipContent>
          </Tooltip>
        )}

        {/* Bulk Priority */}
        {canEdit ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="xs">
                <Flag className="size-3" />
                Priority
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Set priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {TASK_PRIORITIES.map((p) => (
                <DropdownMenuItem key={p} onClick={() => onBulkPriority(p)}>
                  {p}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {/* Bulk Assign */}
        {canAssign ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="xs">
                <UserPlus className="size-3" />
                Assign
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-60 overflow-y-auto">
              <DropdownMenuLabel>Assign to member</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {users.map((u) => (
                <DropdownMenuItem key={u.id} onClick={() => onBulkAssign(u.id)}>
                  {u.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {/* Bulk Delete */}
        {canDelete ? (
          <Button
            type="button"
            variant="destructive"
            size="xs"
            onClick={onBulkDelete}
          >
            <Trash2 className="size-3" />
            Delete
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button type="button" variant="destructive" size="xs" disabled>
                  <Trash2 className="size-3" />
                  Delete
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Requires tasks.delete permission</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}

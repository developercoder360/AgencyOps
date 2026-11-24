"use client"

import * as React from "react"
import {
  Clock,
  Copy,
  Edit3,
  Flag,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react"
import { PRIORITY_META, TASK_STATUSES } from "@/components/delivery/task-detail"
import { AvatarGroup, StatusBadge } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { StaffUser, Task, TaskStatus } from "@/types"
import { cn } from "cn"

interface TaskBoardProps {
  tasks: Task[]
  users: StaffUser[]
  todayIso: string
  selectedIds: Set<string>
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canManageStatus: boolean
  onToggleSelect: (taskId: string, checked: boolean) => void
  onOpenTask: (taskId: string) => void
  onCreateInStatus: (status: TaskStatus) => void
  onEditTask: (task: Task) => void
  onDuplicateTask: (task: Task) => void
  onChangeStatus: (task: Task, status: TaskStatus) => void
  onDeleteTask: (task: Task) => void
}

export function TaskBoard({
  tasks,
  users,
  todayIso,
  selectedIds,
  canCreate,
  canEdit,
  canDelete,
  canManageStatus,
  onToggleSelect,
  onOpenTask,
  onCreateInStatus,
  onEditTask,
  onDuplicateTask,
  onChangeStatus,
  onDeleteTask,
}: TaskBoardProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {TASK_STATUSES.map((status) => {
        const colTasks = tasks.filter((t) => t.status === status)

        return (
          <div
            key={status}
            className="flex min-h-44 flex-col rounded-xl border border-border bg-muted/25 p-2.5"
          >
            <div className="mb-2.5 flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <StatusBadge status={status} />
                <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground ring-1 ring-border">
                  {colTasks.length}
                </span>
              </div>
              {canCreate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Add task to ${status}`}
                  onClick={() => onCreateInStatus(status)}
                >
                  <Plus className="size-3.5" />
                </Button>
              )}
            </div>

            <div className="flex-1 space-y-2">
              {colTasks.length === 0 ? (
                <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border/70 px-3 text-center text-[11px] text-muted-foreground">
                  No tasks in {status}
                </div>
              ) : (
                colTasks.map((task) => {
                  const assignees = users.filter((u) =>
                    (task.assigneeIds || []).includes(u.id)
                  )
                  const revs = task.revisions || []
                  const openRevs = revs.filter(
                    (r) => r.status !== "approved" && r.status !== "rejected"
                  ).length
                  const overdue =
                    task.status !== "Complete" && task.dueDate < todayIso
                  const pMeta = PRIORITY_META[task.priority]
                  const isSelected = selectedIds.has(task.id)

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "group rounded-lg border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-xs",
                        isSelected
                          ? "border-primary ring-1 ring-primary/30"
                          : "border-border"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(v) =>
                              onToggleSelect(task.id, v === true)
                            }
                            aria-label={`Select ${task.code}`}
                          />
                          <button
                            type="button"
                            onClick={() => onOpenTask(task.id)}
                            className="font-mono text-[11px] font-semibold text-primary hover:underline"
                          >
                            {task.code}
                          </button>
                          <span
                            className={cn(
                              "inline-flex items-center gap-0.5 text-[10px] font-medium",
                              pMeta.flagClass
                            )}
                          >
                            <Flag className="size-2.5" />
                            {task.priority}
                          </span>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              aria-label={`Actions for ${task.code}`}
                            >
                              <MoreHorizontal className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onOpenTask(task.id)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!canEdit}
                              onClick={() => onEditTask(task)}
                            >
                              <Edit3 className="size-3.5" />
                              Edit Task
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger disabled={!canManageStatus}>
                                Change Status
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {TASK_STATUSES.map((s) => (
                                  <DropdownMenuItem
                                    key={s}
                                    disabled={s === task.status}
                                    onClick={() => onChangeStatus(task, s)}
                                  >
                                    {s}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuItem
                              disabled={!canCreate}
                              onClick={() => onDuplicateTask(task)}
                            >
                              <Copy className="size-3.5" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              disabled={!canDelete}
                              onClick={() => onDeleteTask(task)}
                            >
                              <Trash2 className="size-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenTask(task.id)}
                        className="mt-1.5 block w-full text-left"
                      >
                        <div className="line-clamp-2 text-xs font-semibold text-foreground group-hover:text-primary">
                          {task.title}
                        </div>
                        <div className="mt-1 truncate text-[11px] text-muted-foreground">
                          {task.brandName} • {task.projectName}
                        </div>
                      </button>

                      {(task.redFlaggedUserIds || []).length > 0 && (
                        <div className="mt-2">
                          <Badge
                            variant="destructive"
                            className="h-4 px-1.5 text-[10px]"
                          >
                            <Flag className="mr-1 size-2.5" />
                            Red Flag
                          </Badge>
                        </div>
                      )}

                      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/60 pt-2">
                        <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-0.5 tabular-nums">
                            <RotateCcw className="size-3" />
                            {openRevs}/{revs.length}
                          </span>
                          <span className="inline-flex items-center gap-0.5 tabular-nums">
                            <MessageSquare className="size-3" />
                            {(task.comments || []).length}
                          </span>
                          <span className="inline-flex items-center gap-0.5 tabular-nums">
                            <Paperclip className="size-3" />
                            {(task.evidenceFiles || []).length}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-[11px] tabular-nums",
                              overdue
                                ? "font-semibold text-rose-600 dark:text-rose-400"
                                : "text-muted-foreground"
                            )}
                          >
                            <Clock className="size-3" />
                            {task.dueDate}
                          </span>
                          <AvatarGroup people={assignees} max={2} />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

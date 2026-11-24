"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronRight,
  Flag,
  RotateCcw,
  MessageSquare,
  Paperclip,
  Plus,
} from "lucide-react"
import { AvatarGroup, StatusBadge } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { resolveTaskTimeline } from "@/lib/tasks/timeline"
import type { StaffUser, Task, TaskStatus } from "@/types"
import { cn } from "cn"
import { PRIORITY_META, TASK_STATUSES } from "./task-detail"

interface TaskGroupedListProps {
  tasks: Task[]
  users: StaffUser[]
  todayIso: string
  canQuickAdd: boolean
  hasProjects: boolean
  onSelectTask: (taskId: string) => void
  onQuickAddTask: (status: TaskStatus, title: string) => void
}

export function TaskGroupedList({
  tasks,
  users,
  todayIso,
  canQuickAdd,
  hasProjects,
  onSelectTask,
  onQuickAddTask,
}: TaskGroupedListProps) {
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({})
  const [addingInStatus, setAddingInStatus] = React.useState<TaskStatus | null>(
    null
  )
  const [quickTitle, setQuickTitle] = React.useState("")

  function toggleGroup(status: TaskStatus) {
    setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }))
  }

  function handleQuickSubmit(e: React.FormEvent, status: TaskStatus) {
    e.preventDefault()
    const trimmed = quickTitle.trim()
    if (!trimmed) return
    onQuickAddTask(status, trimmed)
    setQuickTitle("")
    setAddingInStatus(null)
  }

  return (
    <div className="space-y-3">
      {TASK_STATUSES.map((status) => {
        const groupTasks = tasks.filter((t) => t.status === status)
        const isCollapsed = Boolean(collapsed[status])

        return (
          <div
            key={status}
            className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs"
          >
            {/* Collapsible Group Header */}
            <button
              type="button"
              onClick={() => toggleGroup(status)}
              aria-expanded={!isCollapsed}
              className="flex w-full items-center justify-between gap-3 bg-muted/35 px-3.5 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <div className="flex items-center gap-2">
                {isCollapsed ? (
                  <ChevronRight className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 text-muted-foreground" />
                )}
                <StatusBadge status={status} />
                <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground ring-1 ring-border">
                  {groupTasks.length}
                </span>
              </div>
              <span className="hidden text-[11px] font-medium text-muted-foreground sm:inline">
                {isCollapsed ? "Expand group" : "Start • End • Complete • Assignee"}
              </span>
            </button>

            {!isCollapsed ? (
              <div className="divide-y divide-border/70">
                {groupTasks.length === 0 ? (
                  <div className="px-4 py-4 text-xs text-muted-foreground">
                    No tasks in {status}.
                  </div>
                ) : (
                  groupTasks.map((task) => {
                    const assignees = users.filter((u) =>
                      task.assigneeIds.includes(u.id)
                    )
                    const revs = task.revisions || []
                    const openRevisions = revs.filter(
                      (r) => r.status !== "approved" && r.status !== "rejected"
                    ).length
                    const redrawCount = revs.filter((r) => r.type === "redraw").length
                    const overdue =
                      task.status !== "Complete" && task.dueDate < todayIso
                    const pMeta = PRIORITY_META[task.priority]
                    const tl = resolveTaskTimeline(task)

                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => onSelectTask(task.id)}
                        className="flex w-full flex-col gap-2 px-3.5 py-2.5 text-left transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          <Flag
                            className={cn("size-3.5 shrink-0", pMeta.flagClass)}
                            aria-label={`${task.priority} priority`}
                          />
                          <span className="shrink-0 font-mono text-[11px] font-semibold text-primary">
                            {task.code}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-xs font-medium text-foreground sm:text-sm">
                                {task.title}
                              </span>
                              {task.redFlaggedUserIds.length > 0 ? (
                                <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                                  <Flag className="size-2.5" />
                                  Red Flag
                                </span>
                              ) : null}
                            </div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              {task.brandName} • {task.projectName}
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-3 pl-6 sm:pl-0">
                          {/* Counts */}
                          <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                            <span
                              title={`${revs.length} revisions (${openRevisions} open)${redrawCount > 0 ? ` · ${redrawCount} Re-Draw` : ""}`}
                              className={cn(
                                "inline-flex items-center gap-0.5 tabular-nums",
                                openRevisions > 0
                                  ? "font-medium text-amber-600 dark:text-amber-400"
                                  : ""
                              )}
                            >
                              <RotateCcw className="size-3" />
                              <span>
                                {openRevisions > 0
                                  ? `${openRevisions} open / ${revs.length}`
                                  : `${revs.length}`}
                              </span>
                              {redrawCount > 0 ? (
                                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                  · {redrawCount} Re-Draw
                                </span>
                              ) : null}
                            </span>
                            <span
                              title="Comments"
                              className="inline-flex items-center gap-0.5 tabular-nums"
                            >
                              <MessageSquare className="size-3" />
                              {task.comments.length}
                            </span>
                            <span
                              title="Attachments"
                              className="inline-flex items-center gap-0.5 tabular-nums"
                            >
                              <Paperclip className="size-3" />
                              {task.evidenceFiles.length}
                            </span>
                          </div>

                          {/* Timeline: Start / End / Complete */}
                          <div className="min-w-44 space-y-0.5 text-[10px] tabular-nums">
                            <div className="text-muted-foreground">
                              <span className="font-medium text-foreground/70">Start:</span>{" "}
                              {tl.start}
                            </div>
                            <div
                              className={cn(
                                overdue
                                  ? "font-semibold text-rose-600 dark:text-rose-400"
                                  : "text-muted-foreground"
                              )}
                            >
                              <span className="font-medium">End:</span> {tl.end}
                            </div>
                            <div
                              className={cn(
                                task.completedAt
                                  ? "font-medium text-emerald-600 dark:text-emerald-400"
                                  : "text-muted-foreground/70"
                              )}
                            >
                              <span className="font-medium">Complete:</span> {tl.complete}
                            </div>
                          </div>

                          {/* Assignees */}
                          <div className="w-[68px] flex justify-end">
                            <AvatarGroup people={assignees} max={2} />
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}

                {/* Inline "+ Add task" quick-add row */}
                {canQuickAdd ? (
                  <div className="bg-muted/15 px-3.5 py-2">
                    {addingInStatus === status ? (
                      <form
                        onSubmit={(e) => handleQuickSubmit(e, status)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="size-3.5 shrink-0 text-primary" />
                        <Input
                          autoFocus
                          value={quickTitle}
                          onChange={(e) => setQuickTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              setAddingInStatus(null)
                              setQuickTitle("")
                            }
                          }}
                          placeholder={
                            hasProjects
                              ? `Task title in ${status}… (Enter to create)`
                              : "Create a project first before adding tasks"
                          }
                          disabled={!hasProjects}
                          aria-label={`Quick add task in ${status}`}
                          className="h-7 flex-1 text-xs"
                        />
                        <Button
                          type="submit"
                          size="xs"
                          disabled={!hasProjects || !quickTitle.trim()}
                        >
                          Add
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          onClick={() => {
                            setAddingInStatus(null)
                            setQuickTitle("")
                          }}
                        >
                          Cancel
                        </Button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingInStatus(status)
                          setQuickTitle("")
                        }}
                        className="inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Plus className="size-3.5" />
                        Add task
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

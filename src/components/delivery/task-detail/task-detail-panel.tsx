"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Flag,
  FolderInput,
  PauseCircle,
} from "lucide-react"
import { useAppState } from "@/components/providers/app-state-provider"
import { ConfirmDeleteDialog } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { getTaskPermissions, ROLE_PERSONA_SUMMARY } from "@/lib/permissions"
import { useStore } from "@/lib/store"
import type {
  AttachmentFile,
  Subtask,
  TaskPriority,
  TaskStatus,
  TaskTag,
} from "@/types"
import { cn } from "cn"
import { TaskActivitySidebar } from "./task-activity-sidebar"
import { TaskAttachments } from "./task-attachments"
import { TaskChecklist } from "./task-checklist"
import { TaskDescriptionEditor } from "./task-description-editor"
import { TaskHeader } from "./task-header"
import { TaskPropertiesGrid } from "./task-properties-grid"
import { TaskSubtasks } from "./task-subtasks"
import { TaskWorkflowBar } from "./task-workflow-bar"
import {
  formatHoursMinutes,
  getTodayIsoFromNow,
  useClientNow,
} from "./types"

export interface TaskDetailPanelProps {
  taskId: string | null
  onClose: () => void
  onSelectTask?: (taskId: string) => void
  orderedTaskIds?: string[]
}

export function TaskDetailPanel({
  taskId,
  onClose,
  onSelectTask,
  orderedTaskIds = [],
}: TaskDetailPanelProps) {
  const { role } = useAppState()
  const permissions = React.useMemo(() => getTaskPermissions(role), [role])
  const persona = ROLE_PERSONA_SUMMARY[role]

  const {
    isLoaded,
    tasks,
    projects,
    users,
    getTaskById,
    updateTask,
    deleteTask,
    duplicateTask,
    moveTaskToProject,
    addSubtask,
    updateSubtask,
    toggleSubtask,
    deleteSubtask,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    addTaskComment,
    editTaskComment,
    deleteTaskComment,
    toggleCommentResolved,
    addTaskEvidence,
    removeTaskEvidence,
    toggleTaskWatcher,
    recordQAReview,
    setTaskOnHold,
  } = useStore()

  const open = Boolean(taskId)
  const task = taskId ? getTaskById(taskId) : undefined
  const nowMs = useClientNow()
  const todayIso = getTodayIsoFromNow(nowMs)

  // Container UI states
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [mobileTab, setMobileTab] = React.useState<"details" | "activity">(
    "details"
  )
  const [editingTitle, setEditingTitle] = React.useState(false)
  const [titleDraft, setTitleDraft] = React.useState("")
  const [holdDialogOpen, setHoldDialogOpen] = React.useState(false)
  const [moveDialogOpen, setMoveDialogOpen] = React.useState(false)
  const [moveTargetProjectId, setMoveTargetProjectId] = React.useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  // Live timer state (keyed to task id)
  const [timerState, setTimerState] = React.useState<{
    runningForTaskId: string | null
    seconds: number
  }>({ runningForTaskId: null, seconds: 0 })

  const timerRunning =
    Boolean(task) && timerState.runningForTaskId === task?.id
  const timerSeconds = timerRunning ? timerState.seconds : 0

  React.useEffect(() => {
    if (!timerState.runningForTaskId) return
    const id = setInterval(() => {
      setTimerState((prev) =>
        prev.runningForTaskId
          ? { ...prev, seconds: prev.seconds + 1 }
          : prev
      )
    }, 1000)
    return () => clearInterval(id)
  }, [timerState.runningForTaskId])

  // Aggregate existing tags across all tasks for tag picker suggestions
  const allTags = React.useMemo<TaskTag[]>(() => {
    const map = new Map<string, TaskTag>()
    for (const t of tasks) {
      for (const tag of t.tags ?? []) {
        map.set(tag.label.toLowerCase(), tag)
      }
    }
    return Array.from(map.values())
  }, [tasks])

  // Navigation index in orderedTaskIds
  const currentIndex = taskId ? orderedTaskIds.indexOf(taskId) : -1
  const prevTaskId =
    onSelectTask && currentIndex > 0 ? orderedTaskIds[currentIndex - 1] : null
  const nextTaskId =
    onSelectTask &&
    currentIndex >= 0 &&
    currentIndex < orderedTaskIds.length - 1
      ? orderedTaskIds[currentIndex + 1]
      : null
  const hasPrev = Boolean(prevTaskId)
  const hasNext = Boolean(nextTaskId)

  function navigatePrev() {
    if (!prevTaskId || !onSelectTask) return
    setEditingTitle(false)
    onSelectTask(prevTaskId)
  }

  function navigateNext() {
    if (!nextTaskId || !onSelectTask) return
    setEditingTitle(false)
    onSelectTask(nextTaskId)
  }

  // Keyboard shortcut: Alt+J / Alt+ArrowDown (next), Alt+K / Alt+ArrowUp (prev)
  React.useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (!e.altKey) return
      const key = e.key.toLowerCase()
      if ((key === "j" || e.key === "ArrowDown") && nextTaskId && onSelectTask) {
        e.preventDefault()
        setEditingTitle(false)
        onSelectTask(nextTaskId)
      } else if (
        (key === "k" || e.key === "ArrowUp") &&
        prevTaskId &&
        onSelectTask
      ) {
        e.preventDefault()
        setEditingTitle(false)
        onSelectTask(prevTaskId)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, nextTaskId, prevTaskId, onSelectTask])

  const currentActorUser = React.useMemo(
    () =>
      users.find((u) => u.name === persona.name) ??
      users.find((u) => u.role === role) ??
      users[0],
    [users, persona.name, role]
  )
  const actorId = currentActorUser?.id ?? `role-${role}`
  const actorName = persona.name

  const watchers = task?.watchers ?? []
  const isWatching = watchers.includes(actorId)

  // Handlers
  function saveTitle() {
    if (!task) return
    const trimmed = titleDraft.trim()
    setEditingTitle(false)
    if (!trimmed || trimmed === task.title) return
    updateTask(
      task.id,
      { title: trimmed },
      {
        type: "system",
        actorId,
        actorName,
        action: "renamed task",
        field: "Title",
        fromValue: task.title,
        toValue: trimmed,
      }
    )
    toast.success("Saved")
  }

  function handleStatusChange(next: TaskStatus) {
    if (!task || next === task.status) return
    updateTask(
      task.id,
      {
        status: next,
        onHoldReason: next === "On Hold" ? task.onHoldReason : undefined,
      },
      {
        type: "system",
        actorId,
        actorName,
        action: "changed status",
        field: "Status",
        fromValue: task.status,
        toValue: next,
      }
    )
    toast.success("Saved")
  }

  function handleAssigneesChange(nextIds: string[]) {
    if (!task) return
    const addedIds = nextIds.filter((id) => !task.assigneeIds.includes(id))
    const removedIds = task.assigneeIds.filter((id) => !nextIds.includes(id))
    const names = (ids: string[]) =>
      ids
        .map((id) => users.find((u) => u.id === id)?.name ?? id)
        .join(", ")

    let action = "updated assignees"
    let detail: string | undefined
    if (addedIds.length > 0 && removedIds.length === 0) {
      action = "added assignee"
      detail = names(addedIds)
    } else if (removedIds.length > 0 && addedIds.length === 0) {
      action = "removed assignee"
      detail = names(removedIds)
    }

    updateTask(
      task.id,
      { assigneeIds: nextIds },
      {
        type: "system",
        actorId,
        actorName,
        action,
        field: "Assignees",
        detail,
      }
    )
    toast.success("Saved")
  }

  function handleDatesChange(startDate: string | undefined, dueDate: string) {
    if (!task) return
    const changedDue = dueDate !== task.dueDate
    const changedStart = startDate !== task.startDate
    if (!changedDue && !changedStart) return

    updateTask(
      task.id,
      { startDate, dueDate },
      {
        type: "system",
        actorId,
        actorName,
        action: changedDue ? "changed due date" : "changed start date",
        field: changedDue ? "Due Date" : "Start Date",
        fromValue: changedDue ? task.dueDate : task.startDate ?? task.createdAt,
        toValue: changedDue ? dueDate : startDate,
      }
    )
    toast.success("Saved")
  }

  function handlePriorityChange(priority: TaskPriority) {
    if (!task || priority === task.priority) return
    updateTask(
      task.id,
      { priority },
      {
        type: "system",
        actorId,
        actorName,
        action: "changed priority",
        field: "Priority",
        fromValue: task.priority,
        toValue: priority,
      }
    )
    toast.success("Saved")
  }

  function handleEstimateChange(estimatedHours: number) {
    if (!task || estimatedHours === task.estimatedHours) return
    updateTask(
      task.id,
      { estimatedHours },
      {
        type: "system",
        actorId,
        actorName,
        action: "updated time estimate",
        field: "Estimate",
        fromValue: `${task.estimatedHours}h`,
        toValue: `${estimatedHours}h`,
      }
    )
    toast.success("Saved")
  }

  function commitTimerSeconds(targetTaskId: string, elapsedSeconds: number) {
    const t = getTaskById(targetTaskId)
    if (!t || elapsedSeconds <= 0) return
    const existingExtra = t.trackedSeconds ?? 0
    const totalExtra = existingExtra + elapsedSeconds
    const addedHours = Math.floor(totalExtra / 3600)
    const remainderSec = totalExtra % 3600
    updateTask(
      t.id,
      {
        loggedHours: t.loggedHours + addedHours,
        trackedSeconds: remainderSec,
      },
      {
        type: "system",
        actorId,
        actorName,
        action: "logged tracked time",
        field: "Time Tracked",
        toValue: formatHoursMinutes(0, elapsedSeconds),
      }
    )
    toast.success("Saved")
  }

  function handleToggleTimer() {
    if (!task) return
    if (timerRunning) {
      const elapsed = timerState.seconds
      setTimerState({ runningForTaskId: null, seconds: 0 })
      if (elapsed > 0) {
        commitTimerSeconds(task.id, elapsed)
      }
    } else {
      if (timerState.runningForTaskId && timerState.seconds > 0) {
        commitTimerSeconds(timerState.runningForTaskId, timerState.seconds)
      }
      setTimerState({ runningForTaskId: task.id, seconds: 0 })
      toast.info(`Timer started for ${task.code}`)
    }
  }

  function handleLogManualTime(minutesToAdd: number) {
    if (!task || minutesToAdd <= 0) return
    commitTimerSeconds(task.id, minutesToAdd * 60)
  }

  function handleTagsChange(nextTags: TaskTag[]) {
    if (!task) return
    updateTask(
      task.id,
      { tags: nextTags },
      {
        type: "system",
        actorId,
        actorName,
        action: "updated tags",
        field: "Tags",
        toValue: nextTags.map((t) => t.label).join(", ") || "None",
      }
    )
    toast.success("Saved")
  }

  function handleDescriptionSave(nextDescription: string) {
    if (!task) return
    updateTask(
      task.id,
      { description: nextDescription },
      {
        type: "system",
        actorId,
        actorName,
        action: "updated description",
        field: "Description",
      }
    )
    toast.success("Saved")
  }

  function handleDuplicate() {
    if (!task) return
    const copy = duplicateTask(task.id, actorName)
    if (copy) {
      toast.success(`Duplicated as ${copy.code}`)
      onSelectTask?.(copy.id)
    }
  }

  function handleOpenMoveProject() {
    if (!task) return
    setMoveTargetProjectId(task.projectId)
    setMoveDialogOpen(true)
  }

  function handleConfirmMoveProject(e: React.FormEvent) {
    e.preventDefault()
    if (!task || !moveTargetProjectId || moveTargetProjectId === task.projectId) {
      setMoveDialogOpen(false)
      return
    }
    moveTaskToProject(task.id, moveTargetProjectId, actorName)
    setMoveDialogOpen(false)
    toast.success("Saved")
  }

  function handleConfirmDelete() {
    if (!task) return
    const code = task.code
    deleteTask(task.id)
    setDeleteDialogOpen(false)
    onClose()
    toast.success(`Deleted ${code}`)
  }

  function handleToggleWatch() {
    if (!task) return
    const nowWatching = toggleTaskWatcher(task.id, actorId, actorName)
    toast.success(
      nowWatching
        ? `Following ${task.code}`
        : `Unfollowed ${task.code}`
    )
  }

  function handleSubmitOnHold(reason: string) {
    if (!task) return
    setTaskOnHold(task.id, reason, actorName)
    toast.warning(`${task.code} placed On Hold`)
  }

  function handleResumeFromHold() {
    if (!task) return
    updateTask(
      task.id,
      { status: "Progress", onHoldReason: undefined },
      {
        type: "system",
        actorId,
        actorName,
        action: "resumed task from On Hold",
        field: "Status",
        fromValue: "On Hold",
        toValue: "Progress",
      }
    )
    toast.success(`${task.code} resumed in Progress`)
  }

  function handleSendToQa() {
    if (!task) return
    updateTask(
      task.id,
      { status: "QA Review", onHoldReason: undefined },
      {
        type: "system",
        actorId,
        actorName,
        action: "sent task to QA Review",
        field: "Status",
        fromValue: task.status,
        toValue: "QA Review",
      }
    )
    toast.success(`${task.code} sent to QA Review`)
  }

  function handleQaPass() {
    if (!task) return
    recordQAReview(task.id, {
      outcome: "Pass",
      reviewerName: actorName,
      evidenceNames: task.evidenceFiles.map((f) => f.name),
      redFlagUserIds: [],
    })
    toast.success(`${task.code} passed QA and moved to Complete`)
  }

  function handleSubmitQaFail(payload: {
    category: string
    reason: string
    evidenceName: string
    redFlagUserIds: string[]
  }) {
    if (!task) return
    recordQAReview(task.id, {
      outcome: "Fail",
      reviewerName: actorName,
      category: payload.category,
      reason: payload.reason,
      evidenceNames: [payload.evidenceName],
      redFlagUserIds: payload.redFlagUserIds,
    })
    toast.error(
      `${task.code} failed QA (${payload.category}) → moved to Re-Draw`
    )
  }

  const totalActivityCount = task
    ? task.comments.length + (task.activity?.length ?? 0)
    : 0

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingTitle(false)
            onClose()
          }
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className={cn(
            "flex flex-col gap-0 overflow-hidden p-0 transition-all duration-200",
            // Mobile: full-screen
            "inset-0 h-[100dvh] w-full max-w-none border-0",
            // Desktop: wide right panel OR expanded centered modal
            isExpanded
              ? "md:inset-auto md:top-1/2 md:left-1/2 md:h-[90vh] md:w-[92vw] md:max-w-[1140px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:border md:border-border md:shadow-2xl"
              : "md:inset-y-0 md:right-0 md:left-auto md:h-full md:w-[960px] md:max-w-[90vw] md:border-l md:border-border"
          )}
        >
          {/* Screen-reader accessible title & description for Radix Dialog semantics */}
          <SheetTitle className="sr-only">
            {task ? `${task.code}: ${task.title}` : "Task details"}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {task
              ? `Task details, subtasks, attachments, workflow actions, and activity for ${task.code}.`
              : "Loading task details."}
          </SheetDescription>

          {/* Loading State */}
          {!isLoaded ? (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <Skeleton className="h-5 w-60" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="grid flex-1 grid-cols-1 md:grid-cols-[1fr_340px]">
                <div className="space-y-5 p-5">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-36 w-full rounded-xl" />
                  <Skeleton className="h-28 w-full rounded-lg" />
                  <Skeleton className="h-32 w-full rounded-lg" />
                </div>
                <div className="hidden border-l border-border p-4 md:block">
                  <Skeleton className="h-6 w-32" />
                  <div className="mt-4 space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              </div>
            </div>
          ) : !task ? (
            /* Not Found State */
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ClipboardList className="size-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">
                  Task not found
                </h2>
                <p className="max-w-sm text-xs text-muted-foreground">
                  We couldn&apos;t find a task with ID{" "}
                  <span className="font-mono font-medium text-foreground">
                    {taskId}
                  </span>
                  . It may have been deleted or belong to another browser session.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Close panel
              </Button>
            </div>
          ) : (
            /* Loaded Task Detail View */
            <div className="flex h-full min-h-0 flex-col">
              <TaskHeader
                task={task}
                permissions={permissions}
                isWatching={isWatching}
                watcherCount={watchers.length}
                isExpanded={isExpanded}
                timerRunning={timerRunning}
                timerSeconds={timerSeconds}
                hasPrev={hasPrev}
                hasNext={hasNext}
                onPrev={navigatePrev}
                onNext={navigateNext}
                onToggleWatch={handleToggleWatch}
                onDuplicate={handleDuplicate}
                onOpenMoveProject={handleOpenMoveProject}
                onRequestDelete={() => setDeleteDialogOpen(true)}
                onToggleExpand={() => setIsExpanded((v) => !v)}
                onStopTimer={handleToggleTimer}
                onClose={onClose}
              />

              {/* Mobile Tabs (<768px): Details | Activity */}
              <div
                role="tablist"
                aria-label="Task view sections"
                className="flex shrink-0 border-b border-border bg-muted/30 md:hidden"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mobileTab === "details"}
                  onClick={() => setMobileTab("details")}
                  className={cn(
                    "flex-1 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors",
                    mobileTab === "details"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground"
                  )}
                >
                  Details
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mobileTab === "activity"}
                  onClick={() => setMobileTab("activity")}
                  className={cn(
                    "flex-1 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors",
                    mobileTab === "activity"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground"
                  )}
                >
                  Activity ({totalActivityCount})
                </button>
              </div>

              {/* Main 2-column Body */}
              <div className="flex min-h-0 flex-1 overflow-hidden">
                {/* LEFT COLUMN: Details + Sticky Workflow Bar */}
                <div
                  className={cn(
                    "min-h-0 min-w-0 flex-1 flex-col",
                    mobileTab === "details" ? "flex" : "hidden md:flex"
                  )}
                >
                  <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                    {/* On Hold Banner */}
                    {task.status === "On Hold" && task.onHoldReason ? (
                      <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200">
                        <PauseCircle className="mt-0.5 size-4 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-semibold">Task On Hold</div>
                          <p className="mt-0.5 leading-relaxed">
                            {task.onHoldReason}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {/* Red-Flagged Assignees Callout */}
                    {task.redFlaggedUserIds.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200">
                        <Flag className="size-3.5 shrink-0" />
                        <span className="font-semibold">QA Red-Flagged:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {task.redFlaggedUserIds.map((uid) => {
                            const u = users.find((user) => user.id === uid)
                            return (
                              <Badge
                                key={uid}
                                variant="destructive"
                                className="h-5 px-1.5 text-[10px]"
                              >
                                {u?.name ?? uid}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    ) : null}

                    {/* Title (inline click-to-edit) */}
                    <div>
                      {editingTitle ? (
                        <Input
                          autoFocus
                          value={titleDraft}
                          onChange={(e) => setTitleDraft(e.target.value)}
                          onBlur={saveTitle}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              saveTitle()
                            } else if (e.key === "Escape") {
                              e.stopPropagation()
                              setEditingTitle(false)
                            }
                          }}
                          aria-label="Edit task title"
                          className="h-auto py-1.5 text-lg font-semibold leading-snug sm:text-xl"
                        />
                      ) : permissions.canEditDetails ? (
                        <button
                          type="button"
                          onClick={() => {
                            setTitleDraft(task.title)
                            setEditingTitle(true)
                          }}
                          aria-label="Click to edit task title"
                          className="-mx-2 block w-[calc(100%+1rem)] rounded-lg px-2 py-1 text-left text-lg font-semibold leading-snug text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-xl"
                        >
                          {task.title}
                        </button>
                      ) : (
                        <h1 className="text-lg font-semibold leading-snug text-foreground sm:text-xl">
                          {task.title}
                        </h1>
                      )}
                    </div>

                    {/* Properties Grid */}
                    <TaskPropertiesGrid
                      task={task}
                      users={users}
                      allTags={allTags}
                      permissions={permissions}
                      todayIso={todayIso}
                      timerRunning={timerRunning}
                      timerSeconds={timerSeconds}
                      onStatusChange={handleStatusChange}
                      onRequestOnHold={() => setHoldDialogOpen(true)}
                      onAssigneesChange={handleAssigneesChange}
                      onDatesChange={handleDatesChange}
                      onPriorityChange={handlePriorityChange}
                      onEstimateChange={handleEstimateChange}
                      onToggleTimer={handleToggleTimer}
                      onLogManualTime={handleLogManualTime}
                      onTagsChange={handleTagsChange}
                      onNavigateClose={onClose}
                    />

                    {/* Description */}
                    <TaskDescriptionEditor
                      key={task.id}
                      value={task.description}
                      canEdit={permissions.canEditDetails}
                      onSave={handleDescriptionSave}
                    />

                    {/* Subtasks */}
                    <TaskSubtasks
                      subtasks={task.subtasks}
                      users={users}
                      defaultAssigneeId={
                        task.assigneeIds[0] ?? users[0]?.id ?? "usr-admin"
                      }
                      defaultDueDate={task.dueDate}
                      todayIso={todayIso}
                      canEdit={permissions.canEditDetails}
                      onAdd={(title, assigneeId, dueDate) => {
                        addSubtask(task.id, title, assigneeId, {
                          dueDate,
                          actorName,
                        })
                        toast.success("Saved")
                      }}
                      onToggle={(subtaskId, completed) => {
                        toggleSubtask(task.id, subtaskId, completed, actorName)
                        toast.success("Saved")
                      }}
                      onUpdate={(subtaskId, updates: Partial<Subtask>) => {
                        updateSubtask(task.id, subtaskId, updates, actorName)
                        toast.success("Saved")
                      }}
                      onDelete={(subtaskId) => {
                        deleteSubtask(task.id, subtaskId, actorName)
                        toast.success("Subtask removed")
                      }}
                    />

                    {/* Checklist */}
                    <TaskChecklist
                      items={task.checklist ?? []}
                      canEdit={permissions.canEditDetails}
                      onAdd={(title) => {
                        addChecklistItem(task.id, title, actorName)
                        toast.success("Saved")
                      }}
                      onToggle={(itemId, completed) => {
                        toggleChecklistItem(task.id, itemId, completed, actorName)
                        toast.success("Saved")
                      }}
                      onDelete={(itemId) => {
                        deleteChecklistItem(task.id, itemId)
                        toast.success("Checklist item removed")
                      }}
                    />

                    {/* Attachments / Evidence */}
                    <TaskAttachments
                      files={task.evidenceFiles}
                      canUpload={permissions.canUploadEvidence}
                      canDelete={permissions.canEditDetails}
                      onUploadFiles={(uploaded) => {
                        for (const f of uploaded) {
                          addTaskEvidence(
                            task.id,
                            {
                              name: f.name,
                              size: f.size,
                              type: f.type,
                              uploadedBy: actorName,
                              previewUrl: f.previewUrl,
                            },
                            actorName
                          )
                        }
                        toast.success(
                          uploaded.length === 1
                            ? `Attached ${uploaded[0].name}`
                            : `Attached ${uploaded.length} files`
                        )
                      }}
                      onRemoveFile={(fileId) => {
                        removeTaskEvidence(task.id, fileId, actorName)
                        toast.success("Attachment removed")
                      }}
                    />

                    {/* QA Review History */}
                    {task.qaHistory.length > 0 ? (
                      <section
                        aria-label="QA review history"
                        className="space-y-2.5"
                      >
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          QA Review History ({task.qaHistory.length})
                        </h3>
                        <div className="space-y-2">
                          {task.qaHistory.map((qa) => (
                            <div
                              key={qa.id}
                              className={cn(
                                "rounded-lg border p-3 text-xs",
                                qa.outcome === "Pass"
                                  ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                                  : "border-rose-200 bg-rose-50/50 dark:border-rose-500/30 dark:bg-rose-500/10"
                              )}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 font-medium">
                                <span className="flex items-center gap-1.5">
                                  {qa.outcome === "Pass" ? (
                                    <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <AlertTriangle className="size-3.5 text-rose-600 dark:text-rose-400" />
                                  )}
                                  QA {qa.outcome} by {qa.reviewerName}
                                </span>
                                <span className="font-mono text-[11px] text-muted-foreground">
                                  {qa.timestamp}
                                </span>
                              </div>
                              {qa.category ? (
                                <div className="mt-1 font-medium text-foreground">
                                  Category: {qa.category}
                                </div>
                              ) : null}
                              {qa.reason ? (
                                <p className="mt-1 leading-relaxed text-muted-foreground">
                                  {qa.reason}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </section>
                    ) : null}
                  </div>

                  {/* Sticky Workflow Actions Bar */}
                  <TaskWorkflowBar
                    task={task}
                    users={users}
                    permissions={permissions}
                    holdDialogOpen={holdDialogOpen}
                    onHoldDialogOpenChange={setHoldDialogOpen}
                    onSubmitOnHold={handleSubmitOnHold}
                    onResumeFromHold={handleResumeFromHold}
                    onSendToQa={handleSendToQa}
                    onQaPass={handleQaPass}
                    onSubmitQaFail={handleSubmitQaFail}
                  />
                </div>

                {/* RIGHT COLUMN: Activity & Comments (~340px fixed on desktop) */}
                <div
                  className={cn(
                    "min-h-0 flex-col border-border md:w-[340px] md:shrink-0 md:border-l",
                    mobileTab === "activity"
                      ? "flex w-full"
                      : "hidden md:flex"
                  )}
                >
                  <TaskActivitySidebar
                    task={task}
                    users={users}
                    currentActorName={actorName}
                    currentActorInitials={persona.initials}
                    currentRole={role}
                    permissions={permissions}
                    nowMs={nowMs}
                    onAddComment={({
                      content,
                      mentions,
                      attachments,
                      isQaRelated,
                    }: {
                      content: string
                      mentions: string[]
                      attachments: AttachmentFile[]
                      isQaRelated: boolean
                    }) => {
                      addTaskComment(task.id, content, actorId, {
                        authorName: actorName,
                        mentions,
                        attachments,
                        isQaRelated,
                      })
                      for (const att of attachments) {
                        addTaskEvidence(task.id, att, actorName)
                      }
                      toast.success("Comment posted")
                    }}
                    onEditComment={(commentId, content) => {
                      editTaskComment(task.id, commentId, content)
                      toast.success("Comment updated")
                    }}
                    onDeleteComment={(commentId) => {
                      deleteTaskComment(task.id, commentId)
                      toast.success("Comment deleted")
                    }}
                    onToggleResolved={(commentId) => {
                      toggleCommentResolved(task.id, commentId, actorName)
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Move to Project Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderInput className="size-4 text-primary" />
              Move {task?.code} to Another Project
            </DialogTitle>
            <DialogDescription>
              Reassign this deliverable task and update its brand context.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmMoveProject} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Destination Project</Label>
              <Select
                value={moveTargetProjectId}
                onValueChange={setMoveTargetProjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code} — {p.name} ({p.brandName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMoveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Move Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Delete Task "${task?.title}" (${task?.code})?`}
        description="Are you sure you want to delete this task deliverable? All subtasks, checklist items, QA history, and comments will be removed."
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}

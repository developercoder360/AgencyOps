"use client"

import * as React from "react"
import { toast } from "sonner"
import { ProgressBar } from "@/components/tremor"
import { Card } from "@/components/ui/card"
import {
  ArrowDownAZ,
  ArrowUpAZ,
  CheckSquare,
  Flag,
  Kanban,
  List,
  Lock,
  Plus,
  Search,
  Table2,
  X,
} from "lucide-react"
import { TaskGroupedList } from "@/components/delivery/task-grouped-list"
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  getTodayIsoFromNow,
  useClientNow,
} from "@/components/delivery/task-detail"
import { useAppState } from "@/components/providers/app-state-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { resolveClientProfile } from "@/lib/files/client-resolver"
import { useStore } from "@/lib/store"
import type {
  Task,
  TaskPriority,
  TaskScope,
  TaskSortDirection,
  TaskSortField,
  TaskStatus,
  TasksViewMode,
} from "@/types"
import { cn } from "cn"
import { TaskBoard } from "./TaskBoard"
import { TaskBulkBar } from "./TaskBulkBar"
import { TaskFormDialog } from "./TaskFormDialog"
import { TaskTable } from "./TaskTable"

export type TaskStatusFilter = TaskStatus | "all" | "overdue" | "flagged"

interface TasksTabProps {
  scope: TaskScope
  scopeId?: string
  onOpenTask: (taskId: string) => void
  initialStatusFilter?: TaskStatusFilter
  compact?: boolean
}

const PRIORITY_RANK: Record<TaskPriority, number> = {
  Urgent: 3,
  High: 2,
  Regular: 1,
}

const STATUS_RANK: Record<TaskStatus, number> = {
  Open: 1,
  Progress: 2,
  "QA Review": 3,
  "Re-Draw": 4,
  "On Hold": 5,
  Complete: 6,
}

function TasksTabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  )
}

export function TasksTab(props: TasksTabProps) {
  return (
    <TasksTabInner
      key={`${props.scope}:${props.scopeId ?? "all"}:${props.initialStatusFilter ?? "all"}`}
      {...props}
    />
  )
}

function TasksTabInner({
  scope,
  scopeId,
  onOpenTask,
  initialStatusFilter = "all",
  compact = false,
}: TasksTabProps) {
  const {
    isLoaded,
    tasks,
    projects,
    users,
    signups,
    leads,
    tasksViewMode,
    setTasksViewMode,
    createTask,
    updateTask,
    duplicateTask,
    deleteTasks,
    bulkUpdateTaskStatus,
    bulkUpdateTaskPriority,
    bulkAssignTasks,
  } = useStore()
  const { activeUser, activeUserId, hasTaskPermission } = useAppState()

  const canView = hasTaskPermission("tasks.view")
  const canCreate = hasTaskPermission("tasks.create")
  const canEdit = hasTaskPermission("tasks.edit")
  const canDelete = hasTaskPermission("tasks.delete")
  const canAssign = hasTaskPermission("tasks.assign")
  const canManageStatus = hasTaskPermission("tasks.manage_status")

  const nowMs = useClientNow()
  const todayIso = getTodayIsoFromNow(nowMs)

  // Filter & Sort State
  const [statusFilter, setStatusFilter] =
    React.useState<TaskStatusFilter>(initialStatusFilter)
  const [priorityFilter, setPriorityFilter] = React.useState<
    TaskPriority | "all"
  >("all")
  const [assigneeFilter, setAssigneeFilter] = React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortField, setSortField] = React.useState<TaskSortField>("dueDate")
  const [sortDir, setSortDir] = React.useState<TaskSortDirection>("asc")

  // Selection & Dialogs
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [formState, setFormState] = React.useState<{
    open: boolean
    mode: "create" | "edit"
    task?: Task | null
    defaultStatus?: TaskStatus
  }>({ open: false, mode: "create" })
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    ids: string[]
    label: string
  } | null>(null)

  const clientProfile = React.useMemo(() => {
    if (scope !== "client" || !scopeId) return null
    return resolveClientProfile(scopeId, { signups, leads, projects, tasks })
  }, [scope, scopeId, signups, leads, projects, tasks])

  const scopedTasks = React.useMemo(() => {
    if (scope === "project" && scopeId) {
      return tasks.filter((t) => t.projectId === scopeId)
    }
    if (scope === "client" && clientProfile) {
      return clientProfile.tasks
    }
    return tasks
  }, [scope, scopeId, tasks, clientProfile])

  const summary = React.useMemo(() => {
    const total = scopedTasks.length
    const completed = scopedTasks.filter((t) => t.status === "Complete").length
    const open = scopedTasks.filter((t) => t.status === "Open").length
    const inProgress = scopedTasks.filter(
      (t) => t.status === "Progress"
    ).length
    const qaReview = scopedTasks.filter((t) => t.status === "QA Review").length
    const overdue = scopedTasks.filter(
      (t) => t.status !== "Complete" && t.dueDate < todayIso
    ).length
    const flagged = scopedTasks.filter(
      (t) => (t.redFlaggedUserIds || []).length > 0
    ).length
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0
    return {
      total,
      completed,
      open,
      inProgress,
      qaReview,
      overdue,
      flagged,
      completionPct,
    }
  }, [scopedTasks, todayIso])

  const filteredTasks = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const list = scopedTasks.filter((t) => {
      if (statusFilter === "overdue") {
        if (t.status === "Complete" || t.dueDate >= todayIso) return false
      } else if (statusFilter === "flagged") {
        if ((t.redFlaggedUserIds || []).length === 0) return false
      } else if (statusFilter !== "all") {
        if (t.status !== statusFilter) return false
      }

      if (priorityFilter !== "all" && t.priority !== priorityFilter) {
        return false
      }
      if (
        assigneeFilter !== "all" &&
        !(t.assigneeIds || []).includes(assigneeFilter)
      ) {
        return false
      }
      if (q) {
        const hay =
          `${t.code} ${t.title} ${t.projectName} ${t.brandName}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    const sorted = [...list].sort((a, b) => {
      let cmp = 0
      if (sortField === "title") {
        cmp = a.title.localeCompare(b.title)
      } else if (sortField === "dueDate") {
        cmp = a.dueDate.localeCompare(b.dueDate)
      } else if (sortField === "createdAt") {
        cmp = a.createdAt.localeCompare(b.createdAt)
      } else if (sortField === "priority") {
        cmp = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
      } else if (sortField === "status") {
        cmp = STATUS_RANK[a.status] - STATUS_RANK[b.status]
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return sorted
  }, [
    scopedTasks,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    searchQuery,
    sortField,
    sortDir,
    todayIso,
  ])

  const hasActiveFilters =
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    assigneeFilter !== "all" ||
    searchQuery.trim().length > 0

  function clearFilters() {
    setStatusFilter("all")
    setPriorityFilter("all")
    setAssigneeFilter("all")
    setSearchQuery("")
  }

  function toggleSelect(taskId: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(taskId)
      else next.delete(taskId)
      return next
    })
  }

  function toggleSelectAll(list: Task[], checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const t of list) {
        if (checked) next.add(t.id)
        else next.delete(t.id)
      }
      return next
    })
  }

  function handleQuickAdd(status: TaskStatus, title: string) {
    if (!canCreate) {
      toast.error("You do not have tasks.create permission.")
      return
    }
    const targetProject =
      scope === "project" && scopeId
        ? projects.find((p) => p.id === scopeId)
        : scope === "client" && clientProfile && clientProfile.projects[0]
          ? clientProfile.projects[0]
          : projects[0]

    if (!targetProject) {
      toast.error("Create a project before adding tasks.")
      return
    }

    const code = `TSK-${String(tasks.length + 161).padStart(4, "0")}`
    const created = createTask({
      code,
      title,
      description: `Deliverable task for ${targetProject.name}.`,
      projectId: targetProject.id,
      projectName: targetProject.name,
      brandId: targetProject.brandId,
      brandName: targetProject.brandName,
      status: canManageStatus ? status : "Open",
      priority: "Regular",
      assigneeIds: [activeUserId || users[0]?.id || "usr-admin"],
      memberIds: [activeUserId || users[0]?.id || "usr-admin"],
      reviewerId: targetProject.managerId || users[0]?.id || "usr-admin",
      startDate: todayIso,
      dueDate: "2026-12-15",
      clientId: clientProfile?.signupId ?? null,
      leadId: clientProfile?.leadId ?? null,
    })
    toast.success(`Created ${created.code}`)
  }

  function handleChangeStatus(task: Task, status: TaskStatus) {
    if (!canManageStatus) {
      toast.error("You do not have tasks.manage_status permission.")
      return
    }
    const completedAt =
      status === "Complete" ? todayIso : undefined
    updateTask(
      task.id,
      { status, completedAt },
      {
        type: "system",
        actorId: activeUserId || "usr-admin",
        actorName: activeUser?.name ?? "Current User",
        action: "changed status",
        detail: `${task.status} → ${status}`,
      }
    )
    toast.success(`${task.code} moved to ${status}`)
  }

  function handleDuplicate(task: Task) {
    if (!canCreate) {
      toast.error("You do not have tasks.create permission.")
      return
    }
    const cloned = duplicateTask(task.id, activeUser?.name ?? "Current User")
    if (cloned) {
      toast.success(`Duplicated as ${cloned.code}`)
    }
  }

  function handleConfirmDelete() {
    if (!deleteConfirm || !canDelete) return
    deleteTasks(deleteConfirm.ids)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of deleteConfirm.ids) next.delete(id)
      return next
    })
    toast.success(`Deleted ${deleteConfirm.label}`)
    setDeleteConfirm(null)
  }

  if (!isLoaded) {
    return <TasksTabSkeleton />
  }

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Lock className="size-5" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-foreground">
          Task Access Restricted
        </h3>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          You currently do not have the{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            tasks.view
          </code>{" "}
          permission required to view tasks in this workspace.
        </p>
      </div>
    )
  }

  const createButton = canCreate ? (
    <Button
      type="button"
      size="sm"
      disabled={projects.length === 0}
      onClick={() =>
        setFormState({ open: true, mode: "create", defaultStatus: "Open" })
      }
    >
      <Plus className="size-3.5" />
      Create Task
    </Button>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Button type="button" size="sm" disabled>
            <Plus className="size-3.5" />
            Create Task
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>Permission required: tasks.create</TooltipContent>
    </Tooltip>
  )

  return (
    <div className="space-y-4">
      {/* Summary Strip (Tremor) */}
      <Card className="p-3.5 ring-1 ring-border shadow-2xs bg-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CheckSquare className="size-4" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-muted-foreground">
                  Task Summary
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold tabular-nums text-foreground">
                    {summary.total} task{summary.total === 1 ? "" : "s"}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    • {summary.completed} completed
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden h-7 w-px bg-border sm:block" />

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-blue-500" />
                <span className="font-semibold tabular-nums">{summary.open}</span>
                <span className="text-muted-foreground">Open</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-500" />
                <span className="font-semibold tabular-nums">
                  {summary.inProgress}
                </span>
                <span className="text-muted-foreground">In Progress</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-purple-500" />
                <span className="font-semibold tabular-nums">
                  {summary.qaReview}
                </span>
                <span className="text-muted-foreground">QA</span>
              </span>
              {summary.overdue > 0 && (
                <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <span className="size-2 rounded-full bg-rose-500" />
                  <span className="font-semibold tabular-nums">
                    {summary.overdue}
                  </span>
                  <span>Overdue</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:min-w-60">
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground whitespace-nowrap">
                <span>Completion rate</span>
                <span className="font-mono tabular-nums">
                  {summary.completionPct}%
                </span>
              </div>
              <ProgressBar value={summary.completionPct} color="emerald" />
            </div>
            {createButton}
          </div>
        </div>
      </Card>

      {/* Filter & View Bar */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Quick Status Pills */}
          <div
            role="group"
            aria-label="Filter by task status"
            className="inline-flex flex-wrap items-center rounded-lg border border-border bg-muted/60 p-0.5"
          >
            {(
              [
                { id: "all", label: "All", count: scopedTasks.length },
                { id: "Open", label: "Open", count: summary.open },
                {
                  id: "Progress",
                  label: "In Progress",
                  count: summary.inProgress,
                },
                { id: "QA Review", label: "QA", count: summary.qaReview },
                { id: "Complete", label: "Complete", count: summary.completed },
                { id: "overdue", label: "Overdue", count: summary.overdue },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setStatusFilter(opt.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  statusFilter === opt.id
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{opt.label}</span>
                <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] tabular-nums">
                  {opt.count}
                </span>
              </button>
            ))}
          </div>

          {/* Sort + View Mode */}
          <div className="flex items-center gap-1.5">
            <Select
              value={sortField}
              onValueChange={(v) => setSortField(v as TaskSortField)}
            >
              <SelectTrigger
                className="h-8 w-32 text-xs"
                aria-label="Sort tasks by"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="createdAt">Created</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={`Sort direction: ${sortDir === "asc" ? "ascending" : "descending"}`}
              onClick={() =>
                setSortDir((d) => (d === "asc" ? "desc" : "asc"))
              }
            >
              {sortDir === "asc" ? (
                <ArrowUpAZ className="size-3.5" />
              ) : (
                <ArrowDownAZ className="size-3.5" />
              )}
            </Button>

            <div
              role="group"
              aria-label="Task view mode"
              className="inline-flex items-center rounded-lg border border-border bg-muted/60 p-0.5"
            >
              {(
                [
                  { id: "board", label: "Board view", icon: Kanban },
                  { id: "list", label: "Grouped list view", icon: List },
                  { id: "table", label: "Table view", icon: Table2 },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-label={label}
                  aria-pressed={tasksViewMode === id}
                  onClick={() => setTasksViewMode(id as TasksViewMode)}
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-md transition-colors",
                    tasksViewMode === id
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search + Priority + Assignee + Red Flag */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by code, title, or project..."
              aria-label="Search tasks"
              className="h-8 pl-8 text-xs"
            />
          </div>

          <Select
            value={priorityFilter}
            onValueChange={(v) =>
              setPriorityFilter(v as TaskPriority | "all")
            }
          >
            <SelectTrigger
              className="h-8 w-32 text-xs"
              aria-label="Filter by priority"
            >
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!compact && (
            <Select
              value={assigneeFilter}
              onValueChange={setAssigneeFilter}
            >
              <SelectTrigger
                className="h-8 w-40 text-xs"
                aria-label="Filter by assignee"
              >
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {summary.flagged > 0 && (
            <Button
              type="button"
              variant={statusFilter === "flagged" ? "destructive" : "outline"}
              size="sm"
              className="h-8 text-xs"
              aria-pressed={statusFilter === "flagged"}
              onClick={() =>
                setStatusFilter((prev) =>
                  prev === "flagged" ? "all" : "flagged"
                )
              }
            >
              <Flag className="size-3.5" />
              Red Flag ({summary.flagged})
            </Button>
          )}

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={clearFilters}
            >
              <X className="size-3.5" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Empty States or Content */}
      {scopedTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CheckSquare className="size-5" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-foreground">
            No tasks in this workspace yet
          </h3>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            Create your first deliverable task to track milestones, QA reviews,
            and deadlines.
          </p>
          <div className="mt-4">{createButton}</div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            No tasks match your filters
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try clearing your search query, status, priority, or assignee filter.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 text-xs"
            onClick={clearFilters}
          >
            Clear filters
          </Button>
        </div>
      ) : tasksViewMode === "board" ? (
        <TaskBoard
          tasks={filteredTasks}
          users={users}
          todayIso={todayIso}
          selectedIds={selectedIds}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
          canManageStatus={canManageStatus}
          onToggleSelect={toggleSelect}
          onOpenTask={onOpenTask}
          onCreateInStatus={(st) =>
            setFormState({ open: true, mode: "create", defaultStatus: st })
          }
          onEditTask={(t) =>
            setFormState({ open: true, mode: "edit", task: t })
          }
          onDuplicateTask={handleDuplicate}
          onChangeStatus={handleChangeStatus}
          onDeleteTask={(t) =>
            setDeleteConfirm({ ids: [t.id], label: t.code })
          }
        />
      ) : tasksViewMode === "list" ? (
        <TaskGroupedList
          tasks={filteredTasks}
          users={users}
          todayIso={todayIso}
          canQuickAdd={canCreate}
          hasProjects={projects.length > 0}
          onSelectTask={onOpenTask}
          onQuickAddTask={handleQuickAdd}
        />
      ) : (
        <TaskTable
          tasks={filteredTasks}
          users={users}
          todayIso={todayIso}
          hideProjectColumn={scope === "project"}
          selectedIds={selectedIds}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
          canManageStatus={canManageStatus}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onOpenTask={onOpenTask}
          onEditTask={(t) =>
            setFormState({ open: true, mode: "edit", task: t })
          }
          onDuplicateTask={handleDuplicate}
          onChangeStatus={handleChangeStatus}
          onDeleteTask={(t) =>
            setDeleteConfirm({ ids: [t.id], label: t.code })
          }
        />
      )}

      {/* Bulk Bar */}
      <TaskBulkBar
        selectedCount={selectedIds.size}
        users={users}
        canManageStatus={canManageStatus}
        canEdit={canEdit}
        canAssign={canAssign}
        canDelete={canDelete}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkStatus={(st) => {
          const ids = Array.from(selectedIds)
          bulkUpdateTaskStatus(ids, st, activeUser?.name ?? "Current User")
          setSelectedIds(new Set())
          toast.success(`Moved ${ids.length} task(s) to ${st}`)
        }}
        onBulkPriority={(p) => {
          const ids = Array.from(selectedIds)
          bulkUpdateTaskPriority(ids, p)
          setSelectedIds(new Set())
          toast.success(`Updated priority to ${p} for ${ids.length} task(s)`)
        }}
        onBulkAssign={(userId) => {
          const ids = Array.from(selectedIds)
          bulkAssignTasks(ids, [userId])
          const target = users.find((u) => u.id === userId)
          setSelectedIds(new Set())
          toast.success(
            `Assigned ${ids.length} task(s) to ${target?.name ?? "member"}`
          )
        }}
        onBulkDelete={() => {
          const ids = Array.from(selectedIds)
          setDeleteConfirm({
            ids,
            label: `${ids.length} task${ids.length === 1 ? "" : "s"}`,
          })
        }}
      />

      {/* Create / Edit Modal */}
      <TaskFormDialog
        open={formState.open}
        onOpenChange={(open) => setFormState((prev) => ({ ...prev, open }))}
        mode={formState.mode}
        task={formState.task}
        scope={scope}
        scopeId={scopeId}
        defaultStatus={formState.defaultStatus}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={Boolean(deleteConfirm)}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteConfirm?.label} and any files
              attached to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

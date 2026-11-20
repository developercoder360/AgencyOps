"use client"

import * as React from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Clock,
  Flag,
  Kanban,
  List,
  MessageSquare,
  Paperclip,
  Plus,
  RotateCcw,
  Table2,
  Trash2,
} from "lucide-react"
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/data-table"
import {
  getTodayIsoFromNow,
  PRIORITY_META,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TaskDetailPanel,
  useClientNow,
  useTaskDeepLink,
} from "@/components/delivery/task-detail"
import { TaskGroupedList } from "@/components/delivery/task-grouped-list"
import { useAppState } from "@/components/providers/app-state-provider"
import {
  AvatarGroup,
  ConfirmDeleteDialog,
  PageHeader,
  StatusBadge,
} from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { getTaskPermissions } from "@/lib/permissions"
import { useStore } from "@/lib/store"
import type { Task, TaskStatus } from "@/types"
import { cn } from "cn"

type TasksViewMode = "board" | "list" | "table"

const VIEW_STORAGE_KEY = "agencyops:tasks:view"
const VALID_VIEWS = new Set<TasksViewMode>(["board", "list", "table"])

function subscribeView(cb: () => void) {
  window.addEventListener("storage", cb)
  window.addEventListener("agencyops-tasks-view-change", cb)
  return () => {
    window.removeEventListener("storage", cb)
    window.removeEventListener("agencyops-tasks-view-change", cb)
  }
}

function getClientViewSnapshot(): TasksViewMode {
  try {
    const raw = window.localStorage.getItem(VIEW_STORAGE_KEY) as TasksViewMode | null
    if (raw && VALID_VIEWS.has(raw)) return raw
  } catch {
    // ignore storage errors
  }
  return "board"
}

function getServerViewSnapshot(): TasksViewMode {
  return "board"
}

const createTaskSchema = z.object({
  title: z.string().min(3, "Task title required"),
  projectId: z.string().min(1, "Select a project"),
  priority: z.enum(["Regular", "High", "Urgent"]),
  assigneeId: z.string().min(1, "Assign a team member"),
  dueDate: z.string().min(8),
  estimatedHours: z.number().min(1).max(200),
  description: z.string().optional(),
})

function TasksPageContent() {
  const { role } = useAppState()
  const permissions = React.useMemo(() => getTaskPermissions(role), [role])

  const { tasks, projects, brands, users, createTask, deleteTask } = useStore()
  const { activeTaskId, openTask, closeTask } = useTaskDeepLink()

  const viewMode = React.useSyncExternalStore(
    subscribeView,
    getClientViewSnapshot,
    getServerViewSnapshot
  )

  const setViewMode = React.useCallback((next: TasksViewMode) => {
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next)
      window.dispatchEvent(new Event("agencyops-tasks-view-change"))
    } catch {
      // ignore storage errors
    }
  }, [])

  const [brandFilter, setBrandFilter] = React.useState("all")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Task | null>(null)

  const nowMs = useClientNow()
  const todayIso = getTodayIsoFromNow(nowMs)

  const promptDelete = React.useCallback((task: Task) => {
    setDeleteTarget(task)
  }, [])

  function handleConfirmDelete() {
    if (!deleteTarget) return
    deleteTask(deleteTarget.id)
    toast.success(`Removed task ${deleteTarget.code}`)
    if (activeTaskId === deleteTarget.id) {
      closeTask()
    }
    setDeleteTarget(null)
  }

  const createForm = useForm<z.infer<typeof createTaskSchema>>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      projectId: projects[0]?.id ?? "",
      priority: "High",
      assigneeId: users[0]?.id ?? "usr-admin",
      dueDate: "2026-11-20",
      estimatedHours: 8,
      description: "",
    },
  })

  const filteredTasks = React.useMemo(
    () =>
      brandFilter === "all"
        ? tasks
        : tasks.filter((t) => t.brandId === brandFilter),
    [tasks, brandFilter]
  )

  // Ordered IDs for Alt+J/K navigation matching the active view grouping
  const orderedTaskIds = React.useMemo(() => {
    if (viewMode === "table") {
      return tasks.map((t) => t.id)
    }
    const ordered: string[] = []
    for (const status of TASK_STATUSES) {
      for (const t of filteredTasks) {
        if (t.status === status) ordered.push(t.id)
      }
    }
    return ordered
  }, [viewMode, tasks, filteredTasks])

  function onCreateTask(values: z.infer<typeof createTaskSchema>) {
    const project =
      projects.find((p) => p.id === values.projectId) ?? projects[0]
    if (!project) {
      toast.error("Please create a project first.")
      return
    }

    const code = `TSK-${String(tasks.length + 161).padStart(4, "0")}`
    const created = createTask({
      code,
      title: values.title,
      description:
        values.description || `Deliverable for ${project.name}.`,
      projectId: project.id,
      projectName: project.name,
      brandId: project.brandId,
      brandName: project.brandName,
      status: "Open",
      priority: values.priority,
      assigneeIds: [values.assigneeId],
      reviewerId: "usr-admin",
      dueDate: values.dueDate,
      estimatedHours: values.estimatedHours,
      loggedHours: 0,
      revisions: [],
      comments: [],
      evidenceFiles: [],
      qaHistory: [],
      redFlaggedUserIds: [],
    })
    toast.success(`Created task ${created.code}`)
    createForm.reset()
    setCreateOpen(false)
    openTask(created.id)
  }

  function handleQuickAddTask(status: TaskStatus, title: string) {
    const preferredProject =
      (brandFilter !== "all"
        ? projects.find((p) => p.brandId === brandFilter)
        : undefined) ?? projects[0]
    if (!preferredProject) {
      toast.error("Create a project first before quick-adding tasks.")
      return
    }
    const defaultAssigneeId =
      users.find((u) => u.role === "Designer/Developer")?.id ??
      users[0]?.id ??
      "usr-admin"
    const dueDate = new Date(Date.now() + 5 * 86400000)
      .toISOString()
      .slice(0, 10)
    const code = `TSK-${String(tasks.length + 161).padStart(4, "0")}`
    const created = createTask({
      code,
      title,
      description: "",
      projectId: preferredProject.id,
      projectName: preferredProject.name,
      brandId: preferredProject.brandId,
      brandName: preferredProject.brandName,
      status,
      priority: "Regular",
      assigneeIds: [defaultAssigneeId],
      reviewerId: "usr-admin",
      dueDate,
      estimatedHours: 4,
      loggedHours: 0,
    })
    toast.success(`Created ${created.code} in ${status}`)
  }

  const columns = React.useMemo<ColumnDef<Task>[]>(
    () => [
      {
        accessorKey: "code",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Code" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-primary">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Task" />
        ),
        cell: ({ row }) => (
          <div className="max-w-[260px]">
            <div className="truncate font-medium">{row.original.title}</div>
            <div className="truncate text-xs text-muted-foreground">
              {row.original.projectName}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "brandName",
        header: "Brand",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal">
            {row.original.brandName}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
            <Flag
              className={cn(
                "size-3.5",
                PRIORITY_META[row.original.priority].flagClass
              )}
            />
            {row.original.priority}
          </span>
        ),
      },
      {
        id: "assignees",
        header: "Assignees",
        cell: ({ row }) => {
          const people = users.filter((u) =>
            row.original.assigneeIds.includes(u.id)
          )
          return (
            <div className="flex items-center gap-2">
              <AvatarGroup people={people} max={2} />
              {row.original.redFlaggedUserIds.length > 0 ? (
                <Flag
                  className="size-3.5 text-rose-600 dark:text-rose-400"
                  aria-label="Has QA red flag"
                />
              ) : null}
            </div>
          )
        },
      },
      {
        id: "revisions",
        accessorFn: (row) => {
          const revs = row.revisions || []
          const openRevs = revs.filter(
            (r) => r.status !== "approved" && r.status !== "rejected"
          ).length
          if (openRevs > 0) return "has_open"
          if (revs.length > 0) return "all_approved"
          return "none"
        },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Revisions" />
        ),
        sortingFn: (rowA, rowB) => {
          const aCount = rowA.original.revisions?.length || 0
          const bCount = rowB.original.revisions?.length || 0
          return aCount - bCount
        },
        filterFn: (row, _columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true
          const revs = row.original.revisions || []
          const openRevs = revs.filter(
            (r) => r.status !== "approved" && r.status !== "rejected"
          ).length
          let statusKey = "none"
          if (openRevs > 0) statusKey = "has_open"
          else if (revs.length > 0) statusKey = "all_approved"
          return filterValue.includes(statusKey)
        },
        cell: ({ row }) => {
          const revs = row.original.revisions || []
          const openRevs = revs.filter(
            (r) => r.status !== "approved" && r.status !== "rejected"
          ).length
          if (revs.length === 0) {
            return <span className="text-xs text-muted-foreground">—</span>
          }
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs tabular-nums",
                openRevs > 0
                  ? "font-medium text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
              )}
            >
              <RotateCcw className="size-3 shrink-0" />
              {openRevs > 0
                ? `${openRevs} open / ${revs.length}`
                : `${revs.length}`}
            </span>
          )
        },
      },
      {
        accessorKey: "dueDate",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Due Date" />
        ),
        cell: ({ row }) => {
          const overdue =
            row.original.status !== "Complete" &&
            row.original.dueDate < todayIso
          return (
            <span
              className={cn(
                "text-xs tabular-nums",
                overdue
                  ? "font-semibold text-rose-600 dark:text-rose-400"
                  : "text-muted-foreground"
              )}
            >
              {row.original.dueDate}
            </span>
          )
        },
      },
      {
        id: "actions",
        header: "",
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => openTask(row.original.id)}
            >
              Details
            </Button>
            {permissions.canDeleteOrMove ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => promptDelete(row.original)}
                className="text-destructive hover:bg-destructive/10"
                aria-label={`Delete ${row.original.code}`}
                title="Delete task"
              >
                <Trash2 className="size-3.5" />
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [users, promptDelete, todayIso, openTask, permissions.canDeleteOrMove]
  )

  const facetedFilters = React.useMemo<FacetedFilterConfig[]>(
    () => [
      {
        columnId: "status",
        title: "Status",
        options: TASK_STATUSES.map((s) => ({ label: s, value: s })),
      },
      {
        columnId: "priority",
        title: "Priority",
        options: TASK_PRIORITIES.map((p) => ({ label: p, value: p })),
      },
      {
        columnId: "revisions",
        title: "Revisions",
        options: [
          { label: "Has open revisions", value: "has_open" },
          { label: "All revisions approved", value: "all_approved" },
          { label: "No revisions", value: "none" },
        ],
      },
      {
        columnId: "brandName",
        title: "Brand",
        options: brands.map((b) => ({ label: b.name, value: b.name })),
      },
    ],
    [brands]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks & QA Board"
        description="Track deliverable tasks, revisions, On Hold blockers, and QA Pass/Fail reviews with red-flag tracking."
        badge={<Badge variant="secondary">{tasks.length} tasks</Badge>}
        actions={
          <>
            {viewMode !== "table" ? (
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger
                  aria-label="Filter tasks by brand"
                  className="h-8 w-[160px] text-xs"
                >
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {/* View Switcher: Board / List / Table */}
            <div
              role="group"
              aria-label="Task view mode"
              className="flex items-center rounded-lg border border-border bg-background p-0.5"
            >
              <Button
                type="button"
                size="xs"
                variant={viewMode === "board" ? "default" : "ghost"}
                onClick={() => setViewMode("board")}
                aria-pressed={viewMode === "board"}
                className="gap-1"
              >
                <Kanban className="size-3.5" />
                Board
              </Button>
              <Button
                type="button"
                size="xs"
                variant={viewMode === "list" ? "default" : "ghost"}
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                className="gap-1"
              >
                <List className="size-3.5" />
                List
              </Button>
              <Button
                type="button"
                size="xs"
                variant={viewMode === "table" ? "default" : "ghost"}
                onClick={() => setViewMode("table")}
                aria-pressed={viewMode === "table"}
                className="gap-1"
              >
                <Table2 className="size-3.5" />
                Table
              </Button>
            </div>

            {permissions.canCreateTask ? (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  createForm.reset({
                    title: "",
                    projectId: projects[0]?.id ?? "",
                    priority: "High",
                    assigneeId: users[0]?.id ?? "usr-admin",
                    dueDate: "2026-11-20",
                    estimatedHours: 8,
                    description: "",
                  })
                  setCreateOpen(true)
                }}
                className="gap-1.5"
              >
                <Plus className="size-4" />
                New Task
              </Button>
            ) : null}
          </>
        }
      />

      {viewMode === "board" ? (
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[1520px] grid-cols-6 gap-3.5">
            {TASK_STATUSES.map((colStatus) => {
              const colTasks = filteredTasks.filter(
                (t) => t.status === colStatus
              )
              return (
                <div
                  key={colStatus}
                  className="flex flex-col rounded-xl border border-border bg-muted/40 p-2.5"
                >
                  <div className="mb-2.5 flex items-center justify-between gap-2 px-1">
                    <StatusBadge status={colStatus} />
                    <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground ring-1 ring-border">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="pr-1">
                    <div className="space-y-2">
                      {colTasks.map((task) => {
                        const assignees = users.filter((u) =>
                          task.assigneeIds.includes(u.id)
                        )
                        const revs = task.revisions || []
                        const openRevisions = revs.filter(
                          (r) =>
                            r.status !== "approved" && r.status !== "rejected"
                        ).length
                        const overdue =
                          task.status !== "Complete" && task.dueDate < todayIso
                        const pMeta = PRIORITY_META[task.priority]

                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => openTask(task.id)}
                            className="w-full space-y-2 rounded-lg border border-border bg-card p-2.5 text-left shadow-2xs transition-all hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="font-mono text-[11px] font-semibold text-primary">
                                {task.code}
                              </span>
                              <span
                                title={`${task.priority} priority`}
                                className={cn(
                                  "inline-flex items-center gap-1 text-[10px] font-medium",
                                  pMeta.flagClass
                                )}
                              >
                                <Flag className="size-3" />
                                <span>{task.priority}</span>
                              </span>
                            </div>

                            <div className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">
                              {task.title}
                            </div>

                            <div className="flex items-center justify-between gap-1.5">
                              <span className="truncate text-[11px] text-muted-foreground">
                                {task.brandName}
                              </span>
                              {task.redFlaggedUserIds.length > 0 ? (
                                <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                                  <Flag className="size-2.5" />
                                  Flag
                                </span>
                              ) : null}
                            </div>

                            <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2">
                              <AvatarGroup people={assignees} max={2} />
                              <div className="flex shrink-0 items-center gap-2 text-[11px] whitespace-nowrap text-muted-foreground">
                                <span
                                  title={`${revs.length} revisions (${openRevisions} open)`}
                                  className={cn(
                                    "inline-flex items-center gap-0.5 tabular-nums",
                                    openRevisions > 0
                                      ? "font-medium text-amber-600 dark:text-amber-400"
                                      : ""
                                  )}
                                >
                                  <RotateCcw className="size-3 shrink-0" />
                                  <span>{revs.length}</span>
                                  {openRevisions > 0 ? (
                                    <span
                                      className="size-1.5 rounded-full bg-amber-500 shrink-0"
                                      title={`${openRevisions} open revisions`}
                                    />
                                  ) : null}
                                </span>
                                <span
                                  title="Comments"
                                  className="inline-flex items-center gap-0.5 tabular-nums"
                                >
                                  <MessageSquare className="size-3 shrink-0" />
                                  {task.comments.length}
                                </span>
                                <span
                                  title="Attachments"
                                  className="inline-flex items-center gap-0.5 tabular-nums"
                                >
                                  <Paperclip className="size-3 shrink-0" />
                                  {task.evidenceFiles.length}
                                </span>
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-0.5 tabular-nums",
                                    overdue &&
                                      "font-semibold text-rose-600 dark:text-rose-400"
                                  )}
                                >
                                  <Clock className="size-3 shrink-0" />
                                  {task.dueDate.slice(5)}
                                </span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : viewMode === "list" ? (
        <TaskGroupedList
          tasks={filteredTasks}
          users={users}
          todayIso={todayIso}
          canQuickAdd={permissions.canCreateTask}
          hasProjects={projects.length > 0}
          onSelectTask={openTask}
          onQuickAddTask={handleQuickAddTask}
        />
      ) : (
        <DataTable
          columns={columns}
          data={tasks}
          searchPlaceholder="Search tasks..."
          facetedFilters={facetedFilters}
          dateField="dueDate"
          exportModule="Tasks"
          onRowClick={(task) => openTask(task.id)}
        />
      )}

      {/* Shared ClickUp-Style Task Detail Panel */}
      <TaskDetailPanel
        taskId={activeTaskId}
        onClose={closeTask}
        onSelectTask={openTask}
        orderedTaskIds={orderedTaskIds}
      />

      {/* Create Task Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle>Create Deliverable Task</SheetTitle>
            <SheetDescription>
              Assign a scoped task to an engineering or design specialist.
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={createForm.handleSubmit(onCreateTask)}
            className="space-y-4 p-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="tsk-title">Task Title</Label>
              <Input
                id="tsk-title"
                placeholder="Implement mobile navigation"
                {...createForm.register("title")}
              />
              {createForm.formState.errors.title ? (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.title.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Project</Label>
              {projects.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground">
                  <Link href="/projects" className="text-primary underline">
                    Create a project first
                  </Link>
                </div>
              ) : (
                <Controller
                  control={createForm.control}
                  name="projectId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.code} — {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {createForm.formState.errors.projectId ? (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.projectId.message}
                </p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Controller
                  control={createForm.control}
                  name="priority"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Assignee</Label>
                <Controller
                  control={createForm.control}
                  name="assigneeId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tsk-due">Due Date</Label>
                <Input
                  id="tsk-due"
                  type="date"
                  {...createForm.register("dueDate")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tsk-hrs">Est. Hours</Label>
                <Input
                  id="tsk-hrs"
                  type="number"
                  {...createForm.register("estimatedHours", {
                    valueAsNumber: true,
                  })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tsk-desc">Description</Label>
              <Textarea
                id="tsk-desc"
                rows={3}
                {...createForm.register("description")}
              />
            </div>
            <SheetFooter className="px-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={projects.length === 0}>
                Create Task
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete Task "${deleteTarget?.title}" (${deleteTarget?.code})?`}
        description="Are you sure you want to delete this task deliverable? All revisions, QA history, and comments will be removed."
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

export default function TasksPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-[540px] w-full rounded-xl" />
        </div>
      }
    >
      <TasksPageContent />
    </React.Suspense>
  )
}

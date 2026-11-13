"use client"

import * as React from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck2,
  Flag,
  Kanban,
  ListTodo,
  MessageSquare,
  PauseCircle,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  Table2,
  Trash2,
  Upload,
} from "lucide-react"
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/data-table"
import {
  AvatarGroup,
  ConfirmDeleteDialog,
  PageHeader,
  StatusBadge,
} from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/lib/store"
import type { Task, TaskPriority, TaskStatus } from "@/types"
import { cn } from "cn"

const KANBAN_COLUMNS: TaskStatus[] = [
  "Open",
  "Progress",
  "QA Review",
  "On Hold",
  "Re-Draw",
  "Complete",
]

const PRIORITIES: TaskPriority[] = ["Regular", "High", "Urgent"]

const QA_FAIL_CATEGORIES = [
  "Responsive / Layout",
  "Brand & Copy",
  "Accessibility / Contrast",
  "Functional Bug",
  "Missing Asset",
]

const onHoldSchema = z.object({
  reason: z.string().min(5, "Provide a brief reason for putting this task on hold"),
})

const qaFailSchema = z.object({
  category: z.string().min(1, "Select a QA category"),
  reason: z.string().min(6, "Describe what failed QA verification"),
  evidenceName: z.string().min(2, "Provide an evidence screenshot/file name"),
})

const createTaskSchema = z.object({
  title: z.string().min(3, "Task title required"),
  projectId: z.string().min(1, "Select a project"),
  priority: z.enum(["Regular", "High", "Urgent"]),
  assigneeId: z.string().min(1, "Assign a team member"),
  dueDate: z.string().min(8),
  estimatedHours: z.number().min(1).max(200),
  description: z.string().optional(),
})

export default function TasksPage() {
  const {
    tasks,
    projects,
    brands,
    users,
    createTask,
    updateTask: storeUpdateTask,
    deleteTask,
    toggleSubtask: storeToggleSubtask,
    addTaskComment: storeAddTaskComment,
    recordQAReview,
    setTaskOnHold,
  } = useStore()

  const [viewMode, setViewMode] = React.useState<"kanban" | "table">("kanban")
  const [brandFilter, setBrandFilter] = React.useState("all")
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [commentText, setCommentText] = React.useState("")
  const [holdDialogOpen, setHoldDialogOpen] = React.useState(false)
  const [qaFailDialogOpen, setQaFailDialogOpen] = React.useState(false)
  const [redFlagUsers, setRedFlagUsers] = React.useState<string[]>([])
  const [createOpen, setCreateOpen] = React.useState(false)

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = React.useState<Task | null>(null)

  const promptDelete = React.useCallback((task: Task) => {
    setDeleteTarget(task)
  }, [])

  function handleConfirmDelete() {
    if (!deleteTarget) return
    deleteTask(deleteTarget.id)
    toast.success(`Removed task ${deleteTarget.code}`)
    if (selectedTask?.id === deleteTarget.id) {
      setSelectedTask(null)
    }
    setDeleteTarget(null)
  }

  const holdForm = useForm<z.infer<typeof onHoldSchema>>({
    resolver: zodResolver(onHoldSchema),
    defaultValues: { reason: "" },
  })

  const qaFailForm = useForm<z.infer<typeof qaFailSchema>>({
    resolver: zodResolver(qaFailSchema),
    defaultValues: {
      category: QA_FAIL_CATEGORIES[0],
      reason: "",
      evidenceName: "qa-failure-screenshot.png",
    },
  })

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

  const kanbanTasks = React.useMemo(
    () =>
      brandFilter === "all"
        ? tasks
        : tasks.filter((t) => t.brandId === brandFilter),
    [tasks, brandFilter]
  )

  function updateTask(updated: Task) {
    storeUpdateTask(updated.id, updated)
    setSelectedTask(updated)
  }

  function handleToggleSubtask(task: Task, subtaskId: string) {
    const target = task.subtasks.find((st) => st.id === subtaskId)
    const nextCompleted = !target?.completed
    storeToggleSubtask(task.id, subtaskId, nextCompleted)
    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: nextCompleted } : st
    )
    setSelectedTask({ ...task, subtasks: updatedSubtasks })
  }

  function handleAddTaskComment(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTask || !commentText.trim()) return
    storeAddTaskComment(selectedTask.id, commentText.trim(), "usr-admin")
    const newComment = {
      id: `tc-${crypto.randomUUID().slice(0, 8)}`,
      authorId: "usr-admin",
      authorName: users.find((u) => u.id === "usr-admin")?.name ?? "Administrator",
      content: commentText.trim(),
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    }
    setSelectedTask({
      ...selectedTask,
      comments: [...selectedTask.comments, newComment],
    })
    setCommentText("")
    toast.success("Comment added to task")
  }

  function handleUploadEvidence(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selectedTask) return
    const file = e.target.files?.[0]
    if (!file) return
    const today = new Date().toISOString().slice(0, 10)
    const newFile = {
      id: `ev-${crypto.randomUUID().slice(0, 8)}`,
      name: file.name,
      size: `${Math.max(90, Math.round(file.size / 1024))} KB`,
      type: file.type || "image/png",
      uploadedBy: "Current User",
      uploadedAt: today,
    }
    const updated: Task = {
      ...selectedTask,
      evidenceFiles: [...selectedTask.evidenceFiles, newFile],
    }
    updateTask(updated)
    toast.success(`Attached evidence: ${file.name}`)
  }

  function onHoldSubmit(values: z.infer<typeof onHoldSchema>) {
    if (!selectedTask) return
    setTaskOnHold(selectedTask.id, values.reason)
    const updated: Task = {
      ...selectedTask,
      status: "On Hold",
      onHoldReason: values.reason,
    }
    setSelectedTask(updated)
    holdForm.reset()
    setHoldDialogOpen(false)
    toast.warning(`${selectedTask.code} placed On Hold`)
  }

  function handleQaPass(task: Task) {
    const today = new Date().toISOString().replace("T", " ").slice(0, 16)
    recordQAReview(task.id, {
      outcome: "Pass",
      reviewerName: "Current Reviewer",
      evidenceNames: task.evidenceFiles.map((f) => f.name),
      redFlagUserIds: [],
    })
    const updated: Task = {
      ...task,
      status: "Complete",
      qaHistory: [
        ...task.qaHistory,
        {
          id: `qa-pass-${crypto.randomUUID().slice(0, 8)}`,
          outcome: "Pass",
          reviewerName: "Current Reviewer",
          evidenceNames: task.evidenceFiles.map((f) => f.name),
          redFlagUserIds: [],
          timestamp: today,
        },
      ],
    }
    setSelectedTask(updated)
    toast.success(`${task.code} passed QA and moved to Complete`)
  }

  function openQaFailDialog(task: Task) {
    setRedFlagUsers([...task.assigneeIds])
    qaFailForm.reset({
      category: QA_FAIL_CATEGORIES[0],
      reason: "",
      evidenceName: `${task.code.toLowerCase()}-qa-issue.png`,
    })
    setQaFailDialogOpen(true)
  }

  function onQaFailSubmit(values: z.infer<typeof qaFailSchema>) {
    if (!selectedTask) return
    const today = new Date().toISOString().replace("T", " ").slice(0, 16)
    recordQAReview(selectedTask.id, {
      outcome: "Fail",
      reviewerName: "Current Reviewer",
      category: values.category,
      reason: values.reason,
      evidenceNames: [values.evidenceName],
      redFlagUserIds: redFlagUsers,
    })
    const updated: Task = {
      ...selectedTask,
      status: "Re-Draw",
      redFlaggedUserIds: Array.from(
        new Set([...selectedTask.redFlaggedUserIds, ...redFlagUsers])
      ),
      evidenceFiles: [
        ...selectedTask.evidenceFiles,
        {
          id: `ev-fail-${crypto.randomUUID().slice(0, 8)}`,
          name: values.evidenceName,
          size: "640 KB",
          type: "image/png",
          uploadedBy: "Reviewer",
          uploadedAt: today.slice(0, 10),
        },
      ],
      qaHistory: [
        ...selectedTask.qaHistory,
        {
          id: `qa-fail-${crypto.randomUUID().slice(0, 8)}`,
          outcome: "Fail",
          reviewerName: "Current Reviewer",
          category: values.category,
          reason: values.reason,
          evidenceNames: [values.evidenceName],
          redFlagUserIds: redFlagUsers,
          timestamp: today,
        },
      ],
    }
    setSelectedTask(updated)
    setQaFailDialogOpen(false)
    toast.error(
      `${selectedTask.code} failed QA (${values.category}) → moved to Re-Draw`
    )
  }

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
      subtasks: [
        {
          id: `st-${crypto.randomUUID().slice(0, 8)}`,
          title: "Review specifications & brief",
          completed: false,
          assigneeId: values.assigneeId,
        },
      ],
      comments: [],
      evidenceFiles: [],
      qaHistory: [],
      redFlaggedUserIds: [],
    })
    toast.success(`Created task ${created.code}`)
    createForm.reset()
    setCreateOpen(false)
  }

  const todayIso = new Date().toISOString().slice(0, 10)

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
          <StatusBadge status={row.original.priority} showDot={false} />
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
              onClick={() => setSelectedTask(row.original)}
            >
              Details
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => promptDelete(row.original)}
              className="text-destructive hover:bg-destructive/10"
              title="Delete task"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [users, promptDelete, todayIso]
  )

  const facetedFilters = React.useMemo<FacetedFilterConfig[]>(
    () => [
      {
        columnId: "status",
        title: "Status",
        options: KANBAN_COLUMNS.map((s) => ({ label: s, value: s })),
      },
      {
        columnId: "priority",
        title: "Priority",
        options: PRIORITIES.map((p) => ({ label: p, value: p })),
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
        description="Track deliverable tasks, subtasks, On Hold blockers, and QA Pass/Fail reviews with red-flag tracking."
        badge={<Badge variant="secondary">{tasks.length} tasks</Badge>}
        actions={
          <>
            {viewMode === "kanban" ? (
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="h-8 w-[170px] text-xs">
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
            <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
              <Button
                type="button"
                size="xs"
                variant={viewMode === "kanban" ? "default" : "ghost"}
                onClick={() => setViewMode("kanban")}
                className="gap-1"
              >
                <Kanban className="size-3.5" />
                Kanban
              </Button>
              <Button
                type="button"
                size="xs"
                variant={viewMode === "table" ? "default" : "ghost"}
                onClick={() => setViewMode("table")}
                className="gap-1"
              >
                <Table2 className="size-3.5" />
                Table
              </Button>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              New Task
            </Button>
          </>
        }
      />

      {viewMode === "kanban" ? (
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[1520px] grid-cols-6 gap-3.5">
            {KANBAN_COLUMNS.map((colStatus) => {
              const colTasks = kanbanTasks.filter(
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

                  <div className="max-h-[580px] overflow-y-auto pr-1">
                    <div className="space-y-2.5">
                      {colTasks.map((task) => {
                        const assignees = users.filter((u) =>
                          task.assigneeIds.includes(u.id)
                        )
                        const doneSubtasks = task.subtasks.filter(
                          (s) => s.completed
                        ).length
                        const overdue =
                          task.status !== "Complete" &&
                          task.dueDate < todayIso

                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => setSelectedTask(task)}
                            className="w-full space-y-2.5 rounded-lg border border-border bg-card p-3 text-left shadow-2xs transition-all hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="font-mono text-[11px] font-semibold text-primary">
                                {task.code}
                              </span>
                              <StatusBadge
                                status={task.priority}
                                showDot={false}
                              />
                            </div>
                            <div className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">
                              {task.title}
                            </div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              {task.brandName}
                            </div>

                            {task.redFlaggedUserIds.length > 0 ? (
                              <div className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                                <Flag className="size-3" />
                                Red-Flagged
                              </div>
                            ) : null}

                            <div className="flex items-center justify-between gap-2 pt-1">
                              <AvatarGroup people={assignees} max={2} />
                              <div className="flex shrink-0 items-center gap-2 text-[11px] whitespace-nowrap text-muted-foreground">
                                <span className="inline-flex items-center gap-0.5">
                                  <ListTodo className="size-3 shrink-0" />
                                  {doneSubtasks}/{task.subtasks.length}
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
      ) : (
        <DataTable
          columns={columns}
          data={tasks}
          searchPlaceholder="Search tasks..."
          facetedFilters={facetedFilters}
          dateField="dueDate"
          exportModule="Tasks"
          onRowClick={setSelectedTask}
        />
      )}

      {/* Task Detail Sheet */}
      <Sheet
        open={Boolean(selectedTask)}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      >
        <SheetContent side="right" className="overflow-y-auto sm:max-w-xl">
          {selectedTask ? (
            <>
              <SheetHeader className="border-b border-border pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {selectedTask.code}
                  </Badge>
                  <StatusBadge status={selectedTask.status} />
                  <StatusBadge status={selectedTask.priority} showDot={false} />
                </div>
                <SheetTitle className="mt-1 text-lg">
                  {selectedTask.title}
                </SheetTitle>
                <SheetDescription>
                  {selectedTask.projectName} • {selectedTask.brandName} • Due{" "}
                  {selectedTask.dueDate}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 p-4">
                {/* On Hold Banner */}
                {selectedTask.status === "On Hold" &&
                selectedTask.onHoldReason ? (
                  <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200">
                    <PauseCircle className="mt-0.5 size-4 shrink-0" />
                    <div>
                      <div className="font-semibold">Task On Hold</div>
                      <p className="mt-0.5">{selectedTask.onHoldReason}</p>
                    </div>
                  </div>
                ) : null}

                {/* Quick Status & Priority controls */}
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/20 p-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Status
                    </Label>
                    <Select
                      value={selectedTask.status}
                      onValueChange={(v) => {
                        const next = v as TaskStatus
                        updateTask({ ...selectedTask, status: next })
                        toast.success(`${selectedTask.code} moved to ${next}`)
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KANBAN_COLUMNS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Priority
                    </Label>
                    <Select
                      value={selectedTask.priority}
                      onValueChange={(v) => {
                        const next = v as TaskPriority
                        updateTask({ ...selectedTask, priority: next })
                        toast.success(`Priority set to ${next}`)
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Assignees & Red Flags */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Assignees & QA Reviewer
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {users
                      .filter((u) => selectedTask.assigneeIds.includes(u.id))
                      .map((u) => {
                        const flagged =
                          selectedTask.redFlaggedUserIds.includes(u.id)
                        return (
                          <div
                            key={u.id}
                            className={cn(
                              "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs",
                              flagged
                               ? "border-rose-300 bg-rose-50/70 dark:border-rose-500/40 dark:bg-rose-500/15"
                                : "border-border"
                            )}
                          >
                            <span
                              className={`flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${u.avatarColor}`}
                            >
                              {u.avatarInitials}
                            </span>
                            <span className="font-medium">{u.name}</span>
                            {flagged ? (
                              <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                                <Flag className="mr-0.5 size-2.5" />
                                Red Flag
                              </Badge>
                            ) : null}
                          </div>
                        )
                      })}
                  </div>
                </div>

                {/* Subtasks Checklist */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Subtasks (
                    {selectedTask.subtasks.filter((s) => s.completed).length}/
                    {selectedTask.subtasks.length})
                  </div>
                  <div className="space-y-2 rounded-lg border border-border p-3">
                    {selectedTask.subtasks.length === 0 ? (
                      <div className="text-xs text-muted-foreground">No subtasks yet.</div>
                    ) : (
                      selectedTask.subtasks.map((st) => (
                        <label
                          key={st.id}
                          className="flex cursor-pointer items-center gap-2.5 text-sm"
                        >
                          <Checkbox
                            checked={st.completed}
                            onCheckedChange={() =>
                              handleToggleSubtask(selectedTask, st.id)
                            }
                          />
                          <span
                            className={cn(
                              st.completed && "text-muted-foreground line-through"
                            )}
                          >
                            {st.title}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Evidence Files */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Evidence Files ({selectedTask.evidenceFiles.length})
                    </span>
                    <label className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-primary hover:underline">
                      <Upload className="size-3.5" />
                      Attach Evidence
                      <input
                        type="file"
                        className="sr-only"
                        onChange={handleUploadEvidence}
                      />
                    </label>
                  </div>
                  <div className="space-y-1.5">
                    {selectedTask.evidenceFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between rounded-lg border border-border p-2.5 text-xs"
                      >
                        <span className="flex items-center gap-2 truncate font-medium">
                          <FileCheck2 className="size-4 shrink-0 text-primary" />
                          <span className="truncate">{file.name}</span>
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {file.size}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* QA History */}
                {selectedTask.qaHistory.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      QA Review History
                    </div>
                    <div className="space-y-2">
                      {selectedTask.qaHistory.map((qa) => (
                        <div
                          key={qa.id}
                          className={cn(
                            "rounded-lg border p-3 text-xs",
                            qa.outcome === "Pass"
                              ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                              : "border-rose-200 bg-rose-50/50 dark:border-rose-500/30 dark:bg-rose-500/10"
                          )}
                        >
                          <div className="flex items-center justify-between font-medium">
                            <span className="flex items-center gap-1.5">
                              {qa.outcome === "Pass" ? (
                                <CheckCircle2 className="size-3.5 text-emerald-600" />
                              ) : (
                                <AlertTriangle className="size-3.5 text-rose-600" />
                              )}
                              QA {qa.outcome} by {qa.reviewerName}
                            </span>
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {qa.timestamp}
                            </span>
                          </div>
                          {qa.category ? (
                            <div className="mt-1 font-medium">
                              Category: {qa.category}
                            </div>
                          ) : null}
                          {qa.reason ? (
                            <p className="mt-1 text-muted-foreground">
                              {qa.reason}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <Separator />

                {/* Comments */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <MessageSquare className="size-3.5" />
                    Comments ({selectedTask.comments.length})
                  </div>
                  <div className="space-y-2">
                    {selectedTask.comments.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-lg border border-border bg-muted/20 p-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{c.authorName}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {c.createdAt}
                          </span>
                        </div>
                        <p className="mt-1 text-muted-foreground">
                          {c.content}
                        </p>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleAddTaskComment} className="flex gap-2">
                    <Input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add task comment..."
                      className="h-8 text-xs"
                    />
                    <Button type="submit" size="sm" className="gap-1">
                      <Send className="size-3.5" />
                      Post
                    </Button>
                  </form>
                </div>
              </div>

              {/* Action bar: On Hold + QA Pass / Fail + Delete */}
              <SheetFooter className="border-t border-border sm:flex-row sm:justify-between">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => promptDelete(selectedTask)}
                  >
                    <Trash2 className="mr-1.5 size-4" />
                    Delete
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      holdForm.reset({ reason: selectedTask.onHoldReason ?? "" })
                      setHoldDialogOpen(true)
                    }}
                    className="gap-1.5"
                  >
                    <PauseCircle className="size-4 text-amber-600" />
                    Put On Hold
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => openQaFailDialog(selectedTask)}
                    className="gap-1.5"
                  >
                    <ShieldAlert className="size-4" />
                    QA Fail
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleQaPass(selectedTask)}
                    className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <ShieldCheck className="size-4" />
                    QA Pass
                  </Button>
                </div>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* On Hold Dialog */}
      <Dialog open={holdDialogOpen} onOpenChange={setHoldDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PauseCircle className="size-4 text-amber-600" />
              Place Task On Hold
            </DialogTitle>
            <DialogDescription>
              Specify the blocker dependency for {selectedTask?.code}.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={holdForm.handleSubmit(onHoldSubmit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="hold-reason">Blocker Reason</Label>
              <Textarea
                id="hold-reason"
                rows={3}
                placeholder="e.g., Waiting on client copy sign-off and brand imagery..."
                {...holdForm.register("reason")}
              />
              {holdForm.formState.errors.reason ? (
                <p className="text-xs text-destructive">
                  {holdForm.formState.errors.reason.message}
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setHoldDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Confirm On Hold</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* QA Fail Dialog */}
      <Dialog open={qaFailDialogOpen} onOpenChange={setQaFailDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-4" />
              QA Fail & Red-Flag Review ({selectedTask?.code})
            </DialogTitle>
            <DialogDescription>
              Document the failure category, reason, evidence, and any team
              members receiving a QA red flag. Task moves to Re-Draw.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={qaFailForm.handleSubmit(onQaFailSubmit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Failure Category</Label>
              <Controller
                control={qaFailForm.control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QA_FAIL_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qa-fail-reason">Failure Details</Label>
              <Textarea
                id="qa-fail-reason"
                rows={3}
                placeholder="Describe exact viewport, visual, or functional issues..."
                {...qaFailForm.register("reason")}
              />
              {qaFailForm.formState.errors.reason ? (
                <p className="text-xs text-destructive">
                  {qaFailForm.formState.errors.reason.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qa-fail-evidence">Evidence File / Screenshot</Label>
              <Input
                id="qa-fail-evidence"
                {...qaFailForm.register("evidenceName")}
              />
              {qaFailForm.formState.errors.evidenceName ? (
                <p className="text-xs text-destructive">
                  {qaFailForm.formState.errors.evidenceName.message}
                </p>
              ) : null}
            </div>

            {selectedTask ? (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Red-Flag Assignees
                </Label>
                <div className="space-y-1.5 rounded-lg border border-border p-3">
                  {users
                    .filter((u) => selectedTask.assigneeIds.includes(u.id))
                    .map((u) => {
                      const checked = redFlagUsers.includes(u.id)
                      return (
                        <label
                          key={u.id}
                          className="flex cursor-pointer items-center justify-between text-sm"
                        >
                          <span className="flex items-center gap-2">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() =>
                                setRedFlagUsers((prev) =>
                                  prev.includes(u.id)
                                    ? prev.filter((id) => id !== u.id)
                                    : [...prev, u.id]
                                )
                              }
                            />
                            <span>{u.name}</span>
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {u.role}
                          </Badge>
                        </label>
                      )
                    })}
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setQaFailDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive">
                Submit QA Fail → Re-Draw
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
              <Input id="tsk-title" placeholder="Implement mobile navigation" {...createForm.register("title")} />
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
                        {PRIORITIES.map((p) => (
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
        description="Are you sure you want to delete this task deliverable? All subtasks, QA history, and comments will be removed."
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

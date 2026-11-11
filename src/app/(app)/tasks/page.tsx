"use client"

import * as React from "react"
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
  Upload,
} from "lucide-react"
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/data-table"
import {
  AvatarGroup,
  PageHeader,
  StatusBadge,
} from "@/components/shared"
import { getAvatarToneClass } from "@/lib/theme"
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
import { MOCK_BRANDS } from "@/mocks/brands"
import { MOCK_PROJECTS } from "@/mocks/projects"
import { REFERENCE_DATE_ISO } from "@/mocks/seed"
import { MOCK_TASKS } from "@/mocks/tasks"
import { MOCK_USERS } from "@/mocks/users"
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
  projectId: z.string().min(1),
  priority: z.enum(["Regular", "High", "Urgent"]),
  assigneeId: z.string().min(1),
  dueDate: z.string().min(8),
  estimatedHours: z.number().min(1).max(200),
  description: z.string().optional(),
})

export default function TasksPage() {
  const [tasks, setTasks] = React.useState<Task[]>(MOCK_TASKS)
  const [viewMode, setViewMode] = React.useState<"kanban" | "table">("kanban")
  const [brandFilter, setBrandFilter] = React.useState("all")
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [commentText, setCommentText] = React.useState("")
  const [holdDialogOpen, setHoldDialogOpen] = React.useState(false)
  const [qaFailDialogOpen, setQaFailDialogOpen] = React.useState(false)
  const [redFlagUsers, setRedFlagUsers] = React.useState<string[]>([])
  const [createOpen, setCreateOpen] = React.useState(false)

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
      projectId: MOCK_PROJECTS[0].id,
      priority: "High",
      assigneeId:
        MOCK_USERS.find((u) => u.role === "Designer/Developer")?.id ?? "usr-4",
      dueDate: "2026-11-18",
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
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    setSelectedTask(updated)
  }

  function toggleSubtask(task: Task, subtaskId: string) {
    const updated: Task = {
      ...task,
      subtasks: task.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      ),
    }
    updateTask(updated)
  }

  function addTaskComment(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTask || !commentText.trim()) return
    const updated: Task = {
      ...selectedTask,
      comments: [
        ...selectedTask.comments,
        {
          id: `tc-new-${Date.now()}`,
          authorId: "usr-1",
          authorName: "Marcus Vance",
          content: commentText.trim(),
          createdAt: "2026-11-11 18:40",
        },
      ],
    }
    updateTask(updated)
    setCommentText("")
    toast.success("Comment added to task")
  }

  function handleUploadEvidence(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selectedTask) return
    const file = e.target.files?.[0]
    if (!file) return
    const updated: Task = {
      ...selectedTask,
      evidenceFiles: [
        ...selectedTask.evidenceFiles,
        {
          id: `ev-new-${Date.now()}`,
          name: file.name,
          size: `${Math.max(90, Math.round(file.size / 1024))} KB`,
          type: file.type || "image/png",
          uploadedBy: "Marcus Vance",
          uploadedAt: REFERENCE_DATE_ISO,
        },
      ],
    }
    updateTask(updated)
    toast.success(`Attached evidence: ${file.name}`)
  }

  function onHoldSubmit(values: z.infer<typeof onHoldSchema>) {
    if (!selectedTask) return
    const updated: Task = {
      ...selectedTask,
      status: "On Hold",
      onHoldReason: values.reason,
    }
    updateTask(updated)
    holdForm.reset()
    setHoldDialogOpen(false)
    toast.warning(`${selectedTask.code} placed On Hold`)
  }

  function handleQaPass(task: Task) {
    const updated: Task = {
      ...task,
      status: "Complete",
      qaHistory: [
        ...task.qaHistory,
        {
          id: `qa-pass-${Date.now()}`,
          outcome: "Pass",
          reviewerName: "Tariq Al-Mansoor",
          evidenceNames: task.evidenceFiles.map((f) => f.name),
          redFlagUserIds: [],
          timestamp: "2026-11-11 18:45",
        },
      ],
    }
    updateTask(updated)
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
    const updated: Task = {
      ...selectedTask,
      status: "Re-Draw",
      redFlaggedUserIds: Array.from(
        new Set([...selectedTask.redFlaggedUserIds, ...redFlagUsers])
      ),
      evidenceFiles: [
        ...selectedTask.evidenceFiles,
        {
          id: `ev-fail-${selectedTask.evidenceFiles.length + 1}`,
          name: values.evidenceName,
          size: "640 KB",
          type: "image/png",
          uploadedBy: "Tariq Al-Mansoor",
          uploadedAt: REFERENCE_DATE_ISO,
        },
      ],
      qaHistory: [
        ...selectedTask.qaHistory,
        {
          id: `qa-fail-${selectedTask.qaHistory.length + 1}`,
          outcome: "Fail",
          reviewerName: "Tariq Al-Mansoor",
          category: values.category,
          reason: values.reason,
          evidenceNames: [values.evidenceName],
          redFlagUserIds: redFlagUsers,
          timestamp: "2026-11-11 18:50",
        },
      ],
    }
    updateTask(updated)
    setQaFailDialogOpen(false)
    toast.error(
      `${selectedTask.code} failed QA (${values.category}) → moved to Re-Draw`
    )
  }

  function onCreateTask(values: z.infer<typeof createTaskSchema>) {
    const project =
      MOCK_PROJECTS.find((p) => p.id === values.projectId) ?? MOCK_PROJECTS[0]
    const code = `TSK-${160 + tasks.length}`
    const created: Task = {
      id: `tsk-new-${tasks.length + 1}`,
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
      reviewerId: "usr-5",
      dueDate: values.dueDate,
      estimatedHours: values.estimatedHours,
      loggedHours: 0,
      subtasks: [
        {
          id: "st-new-1",
          title: "Review specifications & Figma tokens",
          completed: false,
          assigneeId: values.assigneeId,
        },
      ],
      comments: [],
      evidenceFiles: [],
      qaHistory: [],
      redFlaggedUserIds: [],
      createdAt: REFERENCE_DATE_ISO,
    }
    setTasks((prev) => [created, ...prev])
    toast.success(`Created task ${code}`)
    createForm.reset()
    setCreateOpen(false)
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
          <StatusBadge status={row.original.priority} showDot={false} />
        ),
      },
      {
        id: "assignees",
        header: "Assignees",
        cell: ({ row }) => {
          const people = MOCK_USERS.filter((u) =>
            row.original.assigneeIds.includes(u.id)
          )
          return (
            <div className="flex items-center gap-2">
              <AvatarGroup people={people} max={2} />
              {row.original.redFlaggedUserIds.length > 0 ? (
                <Flag
                  className="size-3.5 text-(--tone-rose-text)"
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
            row.original.dueDate < REFERENCE_DATE_ISO
          return (
            <span
              className={cn(
                "text-xs tabular-nums",
                overdue
                  ? "font-semibold text-(--tone-rose-text)"
                  : "text-muted-foreground"
              )}
            >
              {row.original.dueDate}
            </span>
          )
        },
      },
    ],
    []
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
        options: MOCK_BRANDS.map((b) => ({ label: b.name, value: b.name })),
      },
    ],
    []
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
                  {MOCK_BRANDS.map((b) => (
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
                  className="flex flex-col rounded-(--radius-surface) border border-border bg-(--kanban-col-bg) p-2.5"
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
                        const assignees = MOCK_USERS.filter((u) =>
                          task.assigneeIds.includes(u.id)
                        )
                        const doneSubtasks = task.subtasks.filter(
                          (s) => s.completed
                        ).length
                        const overdue =
                          task.status !== "Complete" &&
                          task.dueDate < REFERENCE_DATE_ISO

                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => setSelectedTask(task)}
                            className="w-full space-y-2.5 rounded-(--radius-control) border border-border bg-card p-3 text-left shadow-(--shadow-kanban-card) transition-[border-color,box-shadow] duration-150 hover:border-primary/40 hover:shadow-(--shadow-kanban-card-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [[data-theme=studio]_&]:rounded-xl [[data-theme=studio]_&]:p-3.5"
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
                              <div className="inline-flex items-center gap-1 rounded-(--radius-badge) border border-(--tone-rose-border) bg-(--tone-rose-bg) px-1.5 py-0.5 text-[10px] font-medium text-(--tone-rose-fg)">
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
                                      "font-semibold text-(--tone-rose-text)"
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
                  <div className="flex items-start gap-2.5 rounded-lg border border-(--tone-amber-border) bg-(--tone-amber-bg) p-3 text-xs text-(--tone-amber-fg)">
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
                    {MOCK_USERS.filter((u) =>
                      selectedTask.assigneeIds.includes(u.id)
                    ).map((u) => {
                      const flagged =
                        selectedTask.redFlaggedUserIds.includes(u.id)
                      return (
                        <div
                          key={u.id}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs",
                            flagged
                              ? "border-(--tone-rose-border) bg-(--tone-rose-bg) text-(--tone-rose-fg)"
                              : "border-border"
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-6 items-center justify-center rounded-full text-[10px] font-bold",
                              getAvatarToneClass(u.avatarColor)
                            )}
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
                    {selectedTask.subtasks.map((st) => (
                      <label
                        key={st.id}
                        className="flex cursor-pointer items-center gap-2.5 text-sm"
                      >
                        <Checkbox
                          checked={st.completed}
                          onCheckedChange={() =>
                            toggleSubtask(selectedTask, st.id)
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
                    ))}
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
                              ? "border-(--tone-emerald-border) bg-(--tone-emerald-bg)"
                              : "border-(--tone-rose-border) bg-(--tone-rose-bg)"
                          )}
                        >
                          <div className="flex items-center justify-between font-medium">
                            <span className="flex items-center gap-1.5">
                              {qa.outcome === "Pass" ? (
                                <CheckCircle2 className="size-3.5 text-(--tone-emerald-text)" />
                              ) : (
                                <AlertTriangle className="size-3.5 text-(--tone-rose-text)" />
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
                  <form onSubmit={addTaskComment} className="flex gap-2">
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

              {/* Action bar: On Hold + QA Pass / Fail */}
              <SheetFooter className="border-t border-border sm:flex-row sm:justify-between">
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
                  <PauseCircle className="size-4 text-(--tone-amber-text)" />
                  Put On Hold
                </Button>
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
                    className="gap-1.5 bg-(--tone-emerald-solid) text-(--tone-emerald-solid-fg) hover:bg-(--tone-emerald-solid-hover)"
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
              <PauseCircle className="size-4 text-(--tone-amber-text)" />
              Place Task On Hold
            </DialogTitle>
            <DialogDescription>
              Specify the client or internal dependency blocking{" "}
              {selectedTask?.code}.
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

      {/* QA Fail Dialog (Reason, Category, Evidence, Red-Flag Users) */}
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
                  {MOCK_USERS.filter((u) =>
                    selectedTask.assigneeIds.includes(u.id)
                  ).map((u) => {
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
              <Input id="tsk-title" {...createForm.register("title")} />
              {createForm.formState.errors.title ? (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.title.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Controller
                control={createForm.control}
                name="projectId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_PROJECTS.slice(0, 15).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.code} — {p.clientCompany}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_USERS.filter(
                          (u) => u.role === "Designer/Developer"
                        ).map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
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
            <SheetFooter className="px-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Task</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}

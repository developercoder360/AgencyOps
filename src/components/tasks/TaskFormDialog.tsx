"use client"

import * as React from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  Calendar as CalendarIcon,
  Check,
  ChevronsUpDown,
  Flag,
  Paperclip,
  Search,
  Upload,
  X,
} from "lucide-react"
import {
  PRIORITY_META,
  TASK_PRIORITIES,
  TASK_STATUSES,
  getTodayIsoFromNow,
  useClientNow,
} from "@/components/delivery/task-detail"
import { useAppState } from "@/components/providers/app-state-provider"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { resolveClientProfile } from "@/lib/files/client-resolver"
import { formatFileSize } from "@/lib/files/format"
import {
  ACCEPTED_FILE_INPUT,
  processUploadedFile,
  resolveMimeType,
  validateUploadFile,
} from "@/lib/files/validators"
import { useStore } from "@/lib/store"
import type {
  FileItem,
  Task,
  TaskPriority,
  TaskScope,
  TaskStatus,
} from "@/types"
import { cn } from "cn"

const MAX_VISIBLE_OPTIONS = 5

function parseIsoDate(iso?: string): Date | undefined {
  if (!iso) return undefined
  const parts = iso.split("-").map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return undefined
  const [y, m, d] = parts
  return new Date(y, m - 1, d)
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function DatePickerField({
  id,
  label,
  value,
  onChange,
  placeholder = "Pick a date",
  allowClear = false,
}: {
  id: string
  label: string
  value: string
  onChange: (nextIso: string) => void
  placeholder?: string
  allowClear?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const selectedDate = React.useMemo(() => parseIsoDate(value), [value])

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {allowClear && value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[10px] text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start px-2.5 text-left text-xs font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-1.5 size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {selectedDate ? format(selectedDate, "MMM d, yyyy") : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2">
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate ?? new Date()}
            onSelect={(date) => {
              if (date) {
                onChange(toIsoDate(date))
                setOpen(false)
              }
            }}
          />
          <div className="mt-1 flex items-center justify-between border-t border-border pt-1.5">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="text-[11px]"
              onClick={() => {
                onChange(toIsoDate(new Date()))
                setOpen(false)
              }}
            >
              Today
            </Button>
            {allowClear && value && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="text-[11px] text-muted-foreground"
                onClick={() => {
                  onChange("")
                  setOpen(false)
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

interface QueuedTaskFile {
  id: string
  file: File
  name: string
  error?: string
}

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  task?: Task | null
  scope: TaskScope
  scopeId?: string
  defaultStatus?: TaskStatus
}

export function TaskFormDialog(props: TaskFormDialogProps) {
  const key =
    props.mode === "edit"
      ? `edit:${props.task?.id ?? "none"}:${props.open}`
      : `create:${props.scope}:${props.scopeId ?? "all"}:${props.defaultStatus ?? "Open"}:${props.open}`

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <TaskFormDialogInner key={key} {...props} />
      </DialogContent>
    </Dialog>
  )
}

function TaskFormDialogInner({
  onOpenChange,
  mode,
  task,
  scope,
  scopeId,
  defaultStatus = "Open",
}: TaskFormDialogProps) {
  const {
    projects,
    users,
    signups,
    leads,
    tasks,
    files,
    createTask,
    updateTask,
    addFiles,
  } = useStore()
  const { activeUserId, activeUser, hasTaskPermission, hasPermission } =
    useAppState()

  const canAssign = hasTaskPermission("tasks.assign")
  const canManageStatus = hasTaskPermission("tasks.manage_status")
  const canUploadFiles = hasPermission("files.upload")

  const nowMs = useClientNow()
  const todayIso = getTodayIsoFromNow(nowMs)

  const clientProfile = React.useMemo(() => {
    if (scope !== "client" || !scopeId) return null
    return resolveClientProfile(scopeId, { signups, leads, projects, tasks })
  }, [scope, scopeId, signups, leads, projects, tasks])

  const availableProjects = React.useMemo(() => {
    if (
      scope === "client" &&
      clientProfile &&
      clientProfile.projects.length > 0
    ) {
      return clientProfile.projects
    }
    return projects
  }, [scope, clientProfile, projects])

  const defaultProjectId = React.useMemo(() => {
    if (mode === "edit" && task) return task.projectId
    if (scope === "project" && scopeId) return scopeId
    return availableProjects[0]?.id ?? projects[0]?.id ?? ""
  }, [mode, task, scope, scopeId, availableProjects, projects])

  const [title, setTitle] = React.useState(
    mode === "edit" && task ? task.title : ""
  )
  const [projectId, setProjectId] = React.useState(defaultProjectId)
  const [projectPopoverOpen, setProjectPopoverOpen] = React.useState(false)
  const [projectSearch, setProjectSearch] = React.useState("")

  const [status, setStatus] = React.useState<TaskStatus>(
    mode === "edit" && task ? task.status : defaultStatus
  )
  const [priority, setPriority] = React.useState<TaskPriority>(
    mode === "edit" && task ? task.priority : "High"
  )
  const [assigneeIds, setAssigneeIds] = React.useState<string[]>(() => {
    if (mode === "edit" && task) return [...(task.assigneeIds ?? [])]
    return activeUserId ? [activeUserId] : users[0] ? [users[0].id] : []
  })
  const [assigneeSearch, setAssigneeSearch] = React.useState("")

  const [startDate, setStartDate] = React.useState(
    mode === "edit" && task ? task.startDate || todayIso : todayIso
  )
  const [dueDate, setDueDate] = React.useState(
    mode === "edit" && task ? task.dueDate : "2026-12-15"
  )
  const [completedAt, setCompletedAt] = React.useState(
    mode === "edit" && task ? task.completedAt || "" : ""
  )
  const [description, setDescription] = React.useState(
    mode === "edit" && task ? task.description : ""
  )

  const [queuedFiles, setQueuedFiles] = React.useState<QueuedTaskFile[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const selectedProject = React.useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId]
  )

  const matchingProjects = React.useMemo(() => {
    const q = projectSearch.trim().toLowerCase()
    if (!q) return availableProjects
    return availableProjects.filter((p) =>
      `${p.code} ${p.name} ${p.brandName}`.toLowerCase().includes(q)
    )
  }, [availableProjects, projectSearch])

  const visibleProjects = React.useMemo(
    () => matchingProjects.slice(0, MAX_VISIBLE_OPTIONS),
    [matchingProjects]
  )

  const matchingUsers = React.useMemo(() => {
    const q = assigneeSearch.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) =>
      `${u.name} ${u.email} ${u.department}`.toLowerCase().includes(q)
    )
  }, [users, assigneeSearch])

  const visibleUsers = React.useMemo(
    () => matchingUsers.slice(0, MAX_VISIBLE_OPTIONS),
    [matchingUsers]
  )

  const selectedAssignees = React.useMemo(
    () => users.filter((u) => assigneeIds.includes(u.id)),
    [users, assigneeIds]
  )

  const existingTaskFileCount = React.useMemo(() => {
    if (mode !== "edit" || !task) return 0
    return files.filter(
      (f) => (f.scope === "task" && f.scopeId === task.id) || f.taskId === task.id
    ).length
  }, [mode, task, files])

  function toggleAssignee(userId: string) {
    if (!canAssign) return
    setAssigneeIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  function enqueueBrowserFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList)
    if (incoming.length === 0) return
    const next: QueuedTaskFile[] = incoming.map((file) => {
      const validation = validateUploadFile(file)
      return {
        id: `q-${crypto.randomUUID().slice(0, 8)}`,
        file,
        name: file.name,
        error: validation.valid ? undefined : validation.error,
      }
    })
    setQueuedFiles((prev) => [...prev, ...next])
  }

  function removeQueuedFile(id: string) {
    setQueuedFiles((prev) => prev.filter((item) => item.id !== id))
  }

  async function persistAttachedFiles(
    targetTaskId: string,
    chosenProjectId: string,
    clientId?: string | null
  ) {
    const validItems = queuedFiles.filter((q) => !q.error)
    if (validItems.length === 0) return 0

    const uploadedAt = new Date().toISOString()
    const createdItems: FileItem[] = []

    for (const item of validItems) {
      const processed = await processUploadedFile(item.file)
      createdItems.push({
        id: `file-${crypto.randomUUID().slice(0, 8)}`,
        name: item.name.trim() || item.file.name,
        originalName: item.file.name,
        mimeType: resolveMimeType(item.file),
        size: item.file.size,
        scope: "task",
        scopeId: targetTaskId,
        taskId: targetTaskId,
        projectId: chosenProjectId,
        clientId: clientId ?? undefined,
        clientVisible: false,
        url: processed.url,
        thumbnailUrl: processed.thumbnailUrl,
        width: processed.width,
        height: processed.height,
        uploadedBy: activeUserId || "usr-admin",
        uploadedAt,
      })
    }

    addFiles(createdItems)
    return createdItems.length
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    const trimmedTitle = title.trim()
    if (trimmedTitle.length < 3) {
      setError("Task title must be at least 3 characters.")
      return
    }
    const chosenProject = projects.find((p) => p.id === projectId)
    if (!chosenProject) {
      setError("Please select a project.")
      return
    }
    if (!dueDate) {
      setError("Please select a due date.")
      return
    }

    setSubmitting(true)
    try {
      const finalAssignees =
        assigneeIds.length > 0
          ? assigneeIds
          : [activeUserId || users[0]?.id || "usr-admin"]

      if (mode === "edit" && task) {
        const nextStatus = canManageStatus ? status : task.status
        const resolvedCompletedAt = completedAt.trim()
          ? completedAt.trim()
          : nextStatus === "Complete" && task.status !== "Complete"
            ? todayIso
            : undefined

        updateTask(
          task.id,
          {
            title: trimmedTitle,
            projectId: chosenProject.id,
            projectName: chosenProject.name,
            brandId: chosenProject.brandId,
            brandName: chosenProject.brandName,
            status: nextStatus,
            priority,
            assigneeIds: canAssign ? finalAssignees : task.assigneeIds,
            startDate,
            dueDate,
            completedAt: resolvedCompletedAt,
            description: description.trim(),
          },
          {
            type: "system",
            actorId: activeUserId || "usr-admin",
            actorName: activeUser?.name ?? "Current User",
            action: "updated task details",
            detail: trimmedTitle,
          }
        )
        const uploadedCount = await persistAttachedFiles(
          task.id,
          chosenProject.id,
          task.clientId
        )
        toast.success(
          uploadedCount > 0
            ? `Updated ${task.code} & uploaded ${uploadedCount} file(s)`
            : `Updated task ${task.code}`
        )
        onOpenChange(false)
        return
      }

      const nextNumber = tasks.length + 161
      const code = `TSK-${String(nextNumber).padStart(4, "0")}`
      const clientMatch =
        scope === "client" && clientProfile
          ? clientProfile.signupId ?? null
          : null
      const leadMatch =
        scope === "client" && clientProfile
          ? clientProfile.leadId ?? null
          : null

      const nextStatus = canManageStatus ? status : "Open"
      const created = createTask({
        code,
        title: trimmedTitle,
        description:
          description.trim() ||
          `Deliverable task for ${chosenProject.name}.`,
        projectId: chosenProject.id,
        projectName: chosenProject.name,
        brandId: chosenProject.brandId,
        brandName: chosenProject.brandName,
        status: nextStatus,
        priority,
        assigneeIds: finalAssignees,
        memberIds: finalAssignees,
        reviewerId: chosenProject.managerId || users[0]?.id || "usr-admin",
        startDate,
        dueDate,
        completedAt: nextStatus === "Complete" ? todayIso : undefined,
        clientId: clientMatch,
        leadId: leadMatch,
      })

      const uploadedCount = await persistAttachedFiles(
        created.id,
        chosenProject.id,
        clientMatch
      )
      toast.success(
        uploadedCount > 0
          ? `Created ${created.code} & uploaded ${uploadedCount} file(s)`
          : `Created task ${created.code}`
      )
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  const projectLocked = scope === "project" && mode === "create"
  const validQueuedCount = queuedFiles.filter((q) => !q.error).length

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>
          {mode === "edit" && task ? `Edit ${task.code}` : "Create Task"}
        </DialogTitle>
        <DialogDescription>
          {mode === "edit"
            ? "Update task metadata, schedule, completion date, priority, and files."
            : "Add a deliverable task linked to a project, team members, and optional files."}
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="task-form-title">Task Title</Label>
          <Input
            id="task-form-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (error) setError(null)
            }}
            placeholder="e.g. Finalize responsive pricing grid and QA states"
            autoFocus
          />
        </div>

        {/* Searchable Project (max 5) & Priority */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="task-form-project">Project</Label>
            <Popover
              open={projectPopoverOpen}
              onOpenChange={setProjectPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  id="task-form-project"
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={projectPopoverOpen}
                  disabled={projectLocked}
                  className="w-full justify-between px-3 font-normal"
                >
                  <span className="truncate">
                    {selectedProject
                      ? `${selectedProject.code} — ${selectedProject.name}`
                      : "Select project"}
                  </span>
                  <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80 p-2">
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      placeholder="Search projects..."
                      aria-label="Search projects"
                      className="h-8 pl-8 text-xs"
                    />
                  </div>
                  <div className="space-y-0.5">
                    {visibleProjects.length === 0 ? (
                      <div className="py-4 text-center text-xs text-muted-foreground">
                        No matching projects.
                      </div>
                    ) : (
                      visibleProjects.map((p) => {
                        const isSelected = p.id === projectId
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setProjectId(p.id)
                              setProjectPopoverOpen(false)
                            }}
                            className={cn(
                              "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted",
                              isSelected && "bg-primary/10 font-medium text-primary"
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate">
                                <span className="font-mono font-semibold">
                                  {p.code}
                                </span>{" "}
                                — {p.name}
                              </div>
                              <div className="truncate text-[10px] text-muted-foreground">
                                {p.brandName}
                              </div>
                            </div>
                            {isSelected && <Check className="size-3.5 shrink-0" />}
                          </button>
                        )
                      })
                    )}
                  </div>
                  {matchingProjects.length > MAX_VISIBLE_OPTIONS && (
                    <div className="border-t border-border px-1 pt-1.5 text-[10px] text-muted-foreground">
                      Showing {MAX_VISIBLE_OPTIONS} of {matchingProjects.length}{" "}
                      projects — type to filter
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-form-priority">Priority</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as TaskPriority)}
            >
              <SelectTrigger id="task-form-priority" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    <span className="inline-flex items-center gap-1.5">
                      <Flag
                        className={cn("size-3", PRIORITY_META[p].flagClass)}
                      />
                      {p}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status & Dates (with Complete Date in Edit mode) */}
        <div
          className={cn(
            "grid grid-cols-1 gap-3",
            mode === "edit" ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"
          )}
        >
          <div className="space-y-1.5">
            <Label htmlFor="task-form-status">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => {
                const next = v as TaskStatus
                setStatus(next)
                if (next === "Complete" && !completedAt) {
                  setCompletedAt(todayIso)
                }
              }}
              disabled={!canManageStatus}
            >
              <SelectTrigger id="task-form-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DatePickerField
            id="task-form-start"
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
          />

          <DatePickerField
            id="task-form-due"
            label="Due Date"
            value={dueDate}
            onChange={setDueDate}
          />

          {mode === "edit" && (
            <DatePickerField
              id="task-form-completed"
              label="Complete Date"
              value={completedAt}
              onChange={setCompletedAt}
              placeholder="Not completed"
              allowClear
            />
          )}
        </div>

        {/* Searchable Assignees (max 5) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="task-form-assignee-search">Assignees</Label>
            {!canAssign ? (
              <span className="text-[11px] text-muted-foreground">
                Requires tasks.assign
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">
                Showing up to {MAX_VISIBLE_OPTIONS} of {matchingUsers.length}
              </span>
            )}
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-2.5">
            {selectedAssignees.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedAssignees.map((u) => (
                  <span
                    key={u.id}
                    className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                  >
                    <span
                      className={cn(
                        "inline-flex size-4 items-center justify-center rounded-full text-[9px] font-semibold text-white",
                        u.avatarColor
                      )}
                    >
                      {u.avatarInitials}
                    </span>
                    <span>{u.name}</span>
                    {canAssign && (
                      <button
                        type="button"
                        onClick={() => toggleAssignee(u.id)}
                        aria-label={`Remove ${u.name}`}
                        className="ml-0.5 rounded hover:bg-primary/20"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="task-form-assignee-search"
                value={assigneeSearch}
                onChange={(e) => setAssigneeSearch(e.target.value)}
                disabled={!canAssign}
                placeholder="Search assignees by name or email..."
                className="h-8 bg-background pl-8 text-xs"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {visibleUsers.length === 0 ? (
                <span className="px-1 py-1 text-xs text-muted-foreground">
                  No matching team members.
                </span>
              ) : (
                visibleUsers.map((u) => {
                  const selected = assigneeIds.includes(u.id)
                  return (
                    <button
                      key={u.id}
                      type="button"
                      disabled={!canAssign}
                      onClick={() => toggleAssignee(u.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors",
                        selected
                          ? "border-primary/40 bg-primary/10 font-medium text-primary"
                          : "border-border bg-background text-muted-foreground hover:text-foreground",
                        !canAssign && "cursor-not-allowed opacity-60"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex size-4 items-center justify-center rounded-full text-[9px] font-semibold text-white",
                          u.avatarColor
                        )}
                      >
                        {u.avatarInitials}
                      </span>
                      <span>{u.name}</span>
                      {selected && <Check className="size-3" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="task-form-desc">Description</Label>
          <Textarea
            id="task-form-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Outline acceptance criteria, deliverable assets, or QA notes..."
          />
        </div>

        {/* File Upload */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="inline-flex items-center gap-1.5">
              <Paperclip className="size-3.5" />
              Attach Files
              {existingTaskFileCount > 0 && (
                <span className="text-[11px] font-normal text-muted-foreground">
                  ({existingTaskFileCount} already attached)
                </span>
              )}
            </Label>
            {!canUploadFiles && (
              <span className="text-[11px] text-muted-foreground">
                Requires files.upload
              </span>
            )}
          </div>

          <div
            role="button"
            tabIndex={canUploadFiles ? 0 : -1}
            onClick={() => canUploadFiles && fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (canUploadFiles && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault()
                fileInputRef.current?.click()
              }
            }}
            onDragOver={(e) => {
              e.preventDefault()
              if (canUploadFiles) setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              if (canUploadFiles && e.dataTransfer.files.length > 0) {
                enqueueBrowserFiles(e.dataTransfer.files)
              }
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-3 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/20 hover:bg-muted/40",
              !canUploadFiles && "cursor-not-allowed opacity-60"
            )}
          >
            <Upload className="size-4 text-muted-foreground" />
            <p className="mt-1 text-xs font-medium text-foreground">
              Drop files here or click to browse
            </p>
            <p className="text-[10px] text-muted-foreground">
              Images, PDF, Office docs, ZIP, TXT, CSV, FIG (max 25 MB each)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILE_INPUT}
              disabled={!canUploadFiles}
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  enqueueBrowserFiles(e.target.files)
                }
                e.target.value = ""
              }}
            />
          </div>

          {queuedFiles.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {queuedFiles.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs",
                    item.error
                      ? "border-destructive/40 bg-destructive/5 text-destructive"
                      : "border-border bg-background"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{item.name}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatFileSize(item.file.size)}
                      </span>
                    </div>
                    {item.error && (
                      <div className="text-[10px] text-destructive">
                        {item.error}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => removeQueuedFile(item.id)}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Saving..."
            : mode === "edit"
              ? "Save Changes"
              : validQueuedCount > 0
                ? `Create Task & Upload (${validQueuedCount})`
                : "Create Task"}
        </Button>
      </DialogFooter>
    </form>
  )
}
